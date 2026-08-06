import type { BillingDecision } from "../engine/types";
import type { RuleFiring } from "../rules/evaluate";
import { inr } from "../engine/money";

/**
 * Lineage graph — the ONE place a graph earns its cost (D-09).
 *
 * "How much did we bill" is a SQL aggregation. "Why, and through what chain
 * of evidence" is a path traversal — and it is what an auditor actually asks
 * for. Postgres stays the transactional store; this is a derived read model
 * projected from the decision trace. Nothing financial depends on it.
 *
 * Deliberately compact: ~18 nodes, enough to trace one rupee end to end.
 * A demo graph with 400 nodes proves nothing except that you can render 400
 * nodes.
 */

export type NodeKind =
  | "customer" | "contract" | "amendment" | "product"
  | "rule" | "evidence" | "segment" | "decision";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
  detail?: string;
  amount?: string;
  /** which system this fact came from — SoR vs SoReference */
  authority: "OWNED" | "MIRRORED";
  source?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface LineageGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** the highlighted path for the demo: rupee → rule → clause → evidence */
  auditPath: string[];
}

export function buildLineage(decision: BillingDecision, firings: RuleFiring[]): LineageGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const held = decision.held[0];

  const push = (n: GraphNode) => { nodes.push(n); return n.id; };
  const link = (from: string, to: string, label: string) => edges.push({ from, to, label });

  /* ── Mirrored facts (system of reference) ─────────────────────────────── */
  push({ id: "customer", kind: "customer", label: "Vantara Electricals Ltd",
    sublabel: "Client · 3 billing entities", detail: "Billed to GSTIN 29AAFCV2841M1ZK",
    authority: "MIRRORED", source: "CRM" });

  push({ id: "contract", kind: "contract", label: "CON-2026-114",
    sublabel: "24 months · Net 45", detail: "Executed 28 Mar 2026", authority: "MIRRORED",
    source: "Signed contract PDF" });

  push({ id: "amendment", kind: "amendment", label: "Amendment A1",
    sublabel: "Effective 16 Jul 2026", detail: "500→750 employees · 8% discount · allowance 2M→3M",
    authority: "MIRRORED", source: "CON-2026-114-A1.pdf" });

  link("customer", "contract", "party to");
  link("contract", "amendment", "amended by");

  /* ── Rating segments (derived) ────────────────────────────────────────── */
  decision.segments.forEach((s, i) => {
    push({ id: `seg-${s.versionId}`, kind: "segment", label: `Segment ${i + 1}`,
      sublabel: `${s.start} → ${s.end}`, detail: `${s.days} of ${decision.period.days} days`,
      authority: "OWNED" });
    link(i === 0 ? "contract" : "amendment", `seg-${s.versionId}`, "governs");
  });

  /* ── Products (owned catalog) ─────────────────────────────────────────── */
  push({ id: "prod-core", kind: "product", label: "Benefits Wallet",
    sublabel: "Subscription, per employee", detail: "Clause 3.1", authority: "OWNED",
    source: "Product Catalog" });
  push({ id: "prod-api", kind: "product", label: "Channel Rewards",
    sublabel: "Tiered usage", detail: "Clause 3.4", authority: "OWNED", source: "Product Catalog" });
  push({ id: "prod-impl", kind: "product", label: "Spend Automation",
    sublabel: "Milestone billing", detail: "Clause 4.2", authority: "OWNED", source: "Product Catalog" });

  link("contract", "prod-core", "includes");
  link("contract", "prod-api", "includes");
  link("contract", "prod-impl", "includes");

  /* ── Rules that fired (owned) ─────────────────────────────────────────── */
  const fired = firings.filter((f) => f.fired);
  for (const f of fired) {
    push({ id: f.rule.id, kind: "rule", label: f.rule.id,
      sublabel: f.rule.name, detail: f.rule.statement,
      amount: f.amountAffected ? inr(f.amountAffected) : undefined,
      authority: "OWNED", source: `Rules Engine v${f.rule.version}` });
  }
  link("prod-core", "RULE-SUB-003", "priced by");
  link("prod-api", "RULE-USAGE-011", "priced by");
  link("prod-impl", "RULE-MILESTONE-007", "gated by");
  link("amendment", "RULE-AMEND-002", "triggers");
  link("seg-V0", "RULE-SUB-003", "rated in");
  link("seg-A1", "RULE-SUB-003", "rated in");

  /* ── Evidence (mirrored) ──────────────────────────────────────────────── */
  push({ id: "ev-usage", kind: "evidence", label: "Daily usage records",
    sublabel: "24,00,000 transactions · 31 days", detail: "Daily granularity — required for segmented rating",
    authority: "MIRRORED", source: "Channel Rewards telemetry" });
  push({ id: "ev-activity", kind: "evidence", label: "ACT-9337",
    sublabel: "UAT sign-off confirmed · 14 Jul 2026", detail: "Logged by the key account manager",
    authority: "MIRRORED", source: "CRM activity" });

  link("ev-usage", "RULE-USAGE-011", "evaluated by");
  link("ev-activity", "RULE-MILESTONE-007", "evaluated by");

  /* ── Decisions (owned output) ─────────────────────────────────────────── */
  push({ id: "decision", kind: "decision", label: "Billing recommendation",
    sublabel: decision.period.label, amount: inr(decision.total),
    detail: `${decision.billable.length} lines billable`, authority: "OWNED" });

  push({ id: "hold", kind: "decision", label: "Held line",
    sublabel: `Billable ${held?.becomesBillableOn ?? "—"}`, amount: inr(decision.heldTotal),
    detail: "UAT milestone — acceptance window open", authority: "OWNED" });

  link("RULE-SUB-003", "decision", "contributes");
  link("RULE-USAGE-011", "decision", "contributes");
  link("RULE-GST-002", "decision", "applies tax");
  link("RULE-MILESTONE-007", "hold", "produces");

  return {
    nodes,
    edges,
    // The demo's highlighted traversal: held rupee back to the clause that gated it
    auditPath: ["hold", "RULE-MILESTONE-007", "ev-activity", "prod-impl", "contract", "customer"],
  };
}
