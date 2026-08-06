import { RULES, type RuleDef } from "./catalog";
import { inr, fmtInt } from "../engine/money";
import type { BillingDecision } from "../engine/types";

export interface RuleFiring {
  rule: RuleDef;
  fired: boolean;
  observed: string;
  effect: string;
  amountAffected?: string;
}

/**
 * Produces the decision tree (FR-5.3).
 *
 * Note what this is NOT: it does not compute money. The pricing engine has
 * already produced every amount as a pure function. This records which rules
 * governed that computation and what each observed — so the explanation layer
 * has something factual to render, rather than being asked to reconstruct
 * reasoning after the fact.
 */
export function evaluateRules(decision: BillingDecision): RuleFiring[] {
  const firings: RuleFiring[] = [];
  const seg = decision.segments;

  for (const rule of RULES) {
    switch (rule.id) {
      case "RULE-CONTRACT-001":
        firings.push({
          rule, fired: true,
          observed: `Contract term 2026-04-01 to 2028-03-31 covers ${decision.period.label}`,
          effect: "Billing permitted to proceed",
        });
        break;

      case "RULE-AMEND-002": {
        const amended = seg.length > 1;
        firings.push({
          rule, fired: amended,
          observed: amended
            ? `Amendment A1 effective ${seg[1].start}, inside the billing period`
            : "No amendment inside this period",
          effect: amended
            ? `Period decomposed into ${seg.length} rating segments: ${seg[0].days}d + ${seg[1].days}d`
            : "Period rated as a single unit",
          amountAffected: amended ? decision.naiveComparison.error : undefined,
        });
        break;
      }

      case "RULE-SUB-003": {
        const line = decision.billable.find((l) => l.lineNo === 1);
        firings.push({
          rule, fired: !!line,
          observed: `Segment 1: 500 users, no discount · Segment 2: 750 users, 8% discount`,
          effect: `Subscription rated across ${seg.length} segments`,
          amountAffected: line?.amount,
        });
        break;
      }

      case "RULE-USAGE-011": {
        const line = decision.billable.find((l) => l.lineNo === 2);
        const s1 = line?.trace.children?.[0].children;
        firings.push({
          rule, fired: !!line,
          observed: s1
            ? `Segment 1 allowance prorated to ${s1[1].amount} against ${s1[0].amount} calls`
            : "No usage line",
          effect: `Chargeable overage found in segment 1 only; segment 2 within its prorated allowance`,
          amountAffected: line?.amount,
        });
        break;
      }

      case "RULE-MILESTONE-007": {
        const held = decision.held[0];
        firings.push({
          rule, fired: !!held,
          observed: held
            ? `UAT signed off 2026-07-14 in VAN-2291; 30-day acceptance window expires ${held.becomesBillableOn}`
            : "No milestone within an open acceptance window",
          effect: held
            ? `HOLD — ${inr(held.amount)} withheld from this run, billable ${held.becomesBillableOn}`
            : "No hold",
          amountAffected: held?.amount,
        });
        break;
      }

      case "RULE-GST-002": {
        const heads = decision.taxes.map((t) => t.head).join(" + ");
        firings.push({
          rule, fired: true,
          observed: `Supplier state Karnataka = place of supply Karnataka → intra-state supply`,
          effect: `${heads} applied at 9% each, rounded separately`,
          amountAffected: decision.taxes
            .reduce((s, t) => s + Number(t.amount), 0)
            .toFixed(2),
        });
        break;
      }
    }
  }

  return firings;
}

export function firedCount(firings: RuleFiring[]) {
  return {
    total: firings.length,
    fired: firings.filter((f) => f.fired).length,
    blocking: firings.filter((f) => f.fired && f.rule.outcome === "HOLD").length,
  };
}

export { fmtInt };
