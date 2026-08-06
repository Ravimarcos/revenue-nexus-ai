import { getDecision } from "@/lib/decision";
import explanations from "@/fixtures/explanations.json";
import { inr } from "@/lib/engine/money";
import { Card, Chip, PageHeader, StepNav, NextLink, Eyebrow } from "@/components/ui";
import { Notice } from "@/components/Notice";
import { AskLive } from "@/components/AskLive";

export default function ExplainPage() {
  const { decision } = getDecision();
  const answers = explanations.answers;

  return (
    <>
      <PageHeader
        step="Screen 4 of 5"
        title="Explain the decision"
        lede="Three questions a finance controller actually asks. Every figure in these answers came from the pricing engine — the language model composed the sentences around them and computed nothing."
        right={
          <div className="text-right shrink-0">
            <Eyebrow>Explaining</Eyebrow>
            <div className="text-[22px] font-semibold tnum">{inr(decision.total)}</div>
          </div>
        }
      />

      <main className="max-w-content mx-auto px-5 py-7 space-y-5">
        <Notice>
          <p>
            Three questions a finance controller actually asks, answered from the calculation trace.
            Expand each one — every claim links back to the clause or record it came from.
          </p>
          <p>
            <b className="text-ink font-semibold">The part worth pausing on:</b> the AI did not
            calculate any of these numbers. The pricing engine is a pure function — no database
            reads, no clock, no I/O — so the same inputs produce the same output forever. The model
            reads that completed trace and turns it into sentences. An LLM computing a billable
            amount would be unreproducible and indefensible to an auditor.
          </p>
        </Notice>

        {answers.map((a, i) => (
          <Card key={a.id} className="!p-0 overflow-hidden">
            <details open={i === 0}>
              <summary className="px-5 py-4 hover:bg-surface transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="chev text-ink-3 text-[11px] mt-1.5 inline-block">▸</span>
                    <div>
                      <h2 className="text-[16.5px] font-semibold">{a.question}</h2>
                      <p className="text-[13.5px] text-ink-2 mt-1 leading-relaxed">{a.summary}</p>
                    </div>
                  </div>
                </div>
              </summary>

              <div className="px-5 pb-5 pl-[42px]">
                <div className="space-y-3 max-w-3xl">
                  {a.body.map((para, j) => (
                    <p
                      key={j}
                      className="text-[14px] text-ink-2 leading-[1.65]"
                      dangerouslySetInnerHTML={{ __html: mdBold(para) }}
                    />
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-line">
                  <div className="eyebrow mb-2">Sources</div>
                  <div className="flex flex-wrap gap-2">
                    {a.sources.map((s) => (
                      <Chip key={s.label} tone="blue">
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          </Card>
        ))}

        <AskLive />

        {/* The discipline — the point a CTO should notice */}
        <Card className="!bg-blue-bg !border-blue/20">
          <Eyebrow>Where AI is used, and where it is excluded</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-6 mt-3">
            <div>
              <div className="text-[13.5px] font-semibold mb-2">AI does this</div>
              <ul className="text-[13px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Turns the calculation trace into readable language</li>
                <li>Explains why the milestone is held, from the rule and its evidence</li>
                <li>Summarises what the amendment changed and its rupee impact</li>
                <li>Would propose contract term extraction and entity matches</li>
              </ul>
            </div>
            <div>
              <div className="text-[13.5px] font-semibold mb-2">AI is not allowed to</div>
              <ul className="text-[13px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Compute any monetary amount — must be reproducible for an auditor</li>
                <li>Decide to block billing — must be versioned and replayable</li>
                <li>Resolve authority conflicts — that is a written policy, not judgement</li>
                <li>Confirm an extracted obligation — a human confirms anything touching money</li>
              </ul>
            </div>
          </div>
          <p className="text-[13px] text-ink-2 mt-4 leading-relaxed">
            <b className="font-medium">The principle:</b> AI proposes, deterministic code disposes,
            and anything touching money is deterministic. The pricing engine is a pure function — no
            database reads, no clock, no I/O — so the same inputs produce the same output forever.
            That property is what makes the number defensible under questioning, and it is why the
            explanation is a <i>rendering</i> of the trace rather than a reconstruction of it.
          </p>
        </Card>

        <div className="flex justify-end pb-4">
          <NextLink href="/demo/lineage">Show the lineage</NextLink>
        </div>
      </main>

      <StepNav current={4} />
    </>
  );
}

function mdBold(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, '<b class="font-semibold text-ink">$1</b>')
    .replace(/`(.+?)`/g, '<code class="font-mono text-[12.5px] bg-surface px-1 py-0.5 rounded border border-line">$1</code>');
}
