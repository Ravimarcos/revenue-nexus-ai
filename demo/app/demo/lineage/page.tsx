import { getDecision } from "@/lib/decision";
import { Card, Chip, PageHeader, StepNav, Eyebrow } from "@/components/ui";
import { GraphCanvas } from "@/components/GraphCanvas";
import { Notice } from "@/components/Notice";
import Link from "next/link";

export default function LineagePage() {
  const { lineage, decision } = getDecision();

  const owned = lineage.nodes.filter((n) => n.authority === "OWNED").length;
  const mirrored = lineage.nodes.length - owned;

  return (
    <>
      <PageHeader
        step="Screen 5 of 5"
        title="Lineage"
        lede="Every rupee traces back to the rule that computed it, the clause that authorised it, and the evidence that triggered it — a traversal of the entity model. This is the one place a graph earns its cost."
        right={
          <div className="flex gap-2 shrink-0">
            <Chip tone="accent">{owned} owned</Chip>
            <Chip tone="neutral">{mirrored} mirrored</Chip>
          </div>
        }
      />

      <main className="max-w-content mx-auto px-5 py-7 space-y-6">
        <Notice>
          <p>
            The highlighted path traces the held ₹12,00,000 backwards — from the decision, to the
            rule that blocked it, to the activity the key account manager logged, to the product,
            the contract, and finally the client it belongs to.
          </p>
          <p>
            <b className="text-ink font-semibold">Why this needs a graph:</b> &ldquo;how much did we
            bill&rdquo; is a SQL aggregation. &ldquo;Why, and through what chain of evidence&rdquo;
            is a variable-length path traversal — and that is the question an auditor actually asks.
            Accent-coloured nodes are facts the portal owns; grey ones are mirrored from source
            systems.
          </p>
        </Notice>

        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <Eyebrow>Audit path</Eyebrow>
            <div className="text-[13px] text-ink-2">
              Highlighted: the held ₹12,00,000 traced back to the client it belongs to
            </div>
          </div>
          <div className="p-5 overflow-x-auto bg-surface/40">
            <GraphCanvas graph={lineage} />
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <Eyebrow>Why a graph here</Eyebrow>
            <p className="text-[13.5px] text-ink-2 leading-relaxed mt-2">
              &ldquo;How much did we bill this month?&rdquo; is a SQL aggregation. &ldquo;Why, and
              through what chain of evidence?&rdquo; is a variable-length path traversal — and it is
              what an auditor actually asks for.
            </p>
            <p className="text-[13.5px] text-ink-2 leading-relaxed mt-3">
              So the graph is scoped to exactly three jobs: audit lineage, causal traversal, and
              entity resolution across source systems. Everything else — totals, trends, contract
              expiry lists — stays in SQL, because those are aggregations wearing a costume.
            </p>
          </Card>

          <Card>
            <Eyebrow>What the graph is not</Eyebrow>
            <p className="text-[13.5px] text-ink-2 leading-relaxed mt-2">
              It is <b className="font-medium">not the system of record</b>. Postgres holds the
              transactional truth; this is a read model projected from the decision trace and is
              allowed to be eventually consistent, because nothing financial depends on it.
            </p>
            <p className="text-[13.5px] text-ink-2 leading-relaxed mt-3">
              Money needs ACID transactions, an immutable audit trail, and constraints an auditor
              can inspect. A figure shown to a user never comes from here.
            </p>
          </Card>
        </div>

        <Card>
          <Eyebrow>Nodes</Eyebrow>
          <div className="mt-3 divide-y divide-[--line]">
            {lineage.nodes.map((n) => (
              <div key={n.id} className="py-2.5 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono text-ink-3 uppercase tracking-wide">
                      {n.kind}
                    </span>
                    <span className="text-[13.5px] font-medium">{n.label}</span>
                    {lineage.auditPath.includes(n.id) && <Chip tone="accent">audit path</Chip>}
                  </div>
                  {n.sublabel && <div className="text-[12.5px] text-ink-2 mt-0.5">{n.sublabel}</div>}
                  {n.detail && <div className="text-[12px] text-ink-3 mt-0.5">{n.detail}</div>}
                </div>
                <div className="text-right shrink-0">
                  {n.amount && <div className="text-[13px] tnum font-medium">{n.amount}</div>}
                  <div className="text-[11px] text-ink-3 mt-0.5">
                    {n.authority === "OWNED" ? "system of record" : `mirrored · ${n.source ?? ""}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="!bg-surface">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[15px] font-semibold">That&rsquo;s the walkthrough.</div>
              <p className="text-[13.5px] text-ink-2 mt-1 max-w-2xl leading-relaxed">
                One client, one contract, five pricing mechanisms, a mid-cycle amendment priced
                correctly to the paisa, one milestone held with a reason, and every number traceable
                back to the system it came from.
              </p>
            </div>
            <Link href="/" className="btn-ghost">
              ← Back to overview
            </Link>
          </div>
        </Card>
      </main>

      <StepNav current={5} />
    </>
  );
}
