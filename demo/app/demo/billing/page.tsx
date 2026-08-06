import { getDecision } from "@/lib/decision";
import { inr, fmtInt } from "@/lib/engine/money";
import { Trace } from "@/components/Trace";
import { Card, Chip, PageHeader, StepNav, NextLink, Eyebrow } from "@/components/ui";
import { Notice } from "@/components/Notice";

export default function BillingPage() {
  const { decision, firings, counts } = getDecision();
  const held = decision.held[0];

  return (
    <>
      <PageHeader
        step="Screen 3 of 5 · The hero"
        title="Billing recommendation"
        lede={`${decision.customerName} · ${decision.contractId} · ${decision.period.label}. Derived from contract terms, daily usage and delivery evidence — not configured by hand.`}
        right={
          <div className="text-right shrink-0">
            <Eyebrow>Recommended</Eyebrow>
            <div className="text-[34px] font-semibold tnum tracking-[-0.02em] leading-none">
              {inr(decision.total)}
            </div>
            <div className="text-[12.5px] text-accent mt-1.5">
              {inr(decision.heldTotal)} held · billable {held?.becomesBillableOn}
            </div>
          </div>
        }
      />

      <main className="max-w-content mx-auto px-5 py-7 space-y-6">
        <Notice>
          <p>
            <b className="text-ink font-semibold">Three things on this screen.</b>
          </p>
          <p>
            <b className="text-ink font-semibold">One —</b> the July period is split into two rating
            segments at the amendment boundary and each is rated separately. Rating it as a single
            month produces ₹9,77,040 instead of ₹8,60,562.56. That is a ₹1,16,477 error, and it is
            two mistakes in opposite directions partially hiding each other, which is why nobody
            catches it by eye.
          </p>
          <p>
            <b className="text-ink font-semibold">Two —</b> ₹12,00,000 is held, not billed. The
            milestone was confirmed, but the contract gives the client a 30-day acceptance window
            that has not expired. The held amount is larger than the billed amount. A blocking rule
            with a good reason is a feature.
          </p>
          <p>
            <b className="text-ink font-semibold">Three —</b> click any line to expand it. Every
            rupee shows the calculation that produced it and the clause that authorised it. Nothing
            here is hardcoded; it is all computed from the contract and the daily usage records.
          </p>
        </Notice>

        {/* Segments — the central finding, stated first */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <Eyebrow>Rating segments</Eyebrow>
              <p className="text-[13.5px] text-ink-2 max-w-2xl leading-relaxed">
                Amendment A1 takes effect mid-period and does not operate retrospectively, so the
                billing period is decomposed at the boundary and each segment is rated independently.
                This is the difference between a correct invoice and a wrong one.
              </p>
            </div>
            <Chip tone="accent">RULE-AMEND-002</Chip>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {decision.segments.map((s, i) => (
              <div key={s.versionId} className="border border-line rounded-lg p-4 bg-surface">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[14px]">Segment {i + 1}</span>
                  <span className="text-[12px] text-ink-3 tnum">
                    {s.days}/{decision.period.days} days
                  </span>
                </div>
                <div className="text-[13px] text-ink-2">{s.label}</div>
                <div className="text-[12.5px] text-ink-3 tnum mt-1">
                  {s.start} → {s.end}
                </div>
                <div className="text-[12px] text-ink-3 mt-2 font-mono">
                  fraction {s.fraction.toDecimalPlaces(6).toString()}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Billable lines with full trace */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <Eyebrow>Billable lines</Eyebrow>
              <div className="text-[13px] text-ink-2">
                Every amount expands to the calculation that produced it
              </div>
            </div>
            <Chip tone="good">{decision.billable.length} lines</Chip>
          </div>

          <div className="divide-y divide-[--line]">
            {decision.billable.map((line) => (
              <details key={line.lineNo} className="group">
                <summary className="px-5 py-4 hover:bg-surface transition-colors">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="chev text-ink-3 text-[11px] inline-block">▸</span>
                        <span className="font-medium">{line.productName}</span>
                        <Chip tone="neutral">{line.strategy.replace(/_/g, " ").toLowerCase()}</Chip>
                      </div>
                      <div className="text-[12.5px] text-ink-2 ml-5 mt-1">{line.trace.detail}</div>
                      <div className="text-[11.5px] text-blue ml-5 mt-0.5">§ {line.clause}</div>
                    </div>
                    <div className="text-[17px] font-semibold tnum whitespace-nowrap">
                      {inr(line.amount)}
                    </div>
                  </div>
                </summary>
                <div className="px-5 pb-5 pt-1 bg-surface/60">
                  {line.trace.children?.map((c) => <Trace key={c.id} step={c} depth={1} />)}
                </div>
              </details>
            ))}
          </div>

          {/* Held line — visually distinct, deliberately prominent */}
          {held && (
            <div className="border-t-2 border-accent/25 bg-accent-bg/50">
              <details>
                <summary className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="chev text-accent text-[11px] inline-block">▸</span>
                        <span className="font-medium">{held.productName}</span>
                        <Chip tone="accent">Held · {held.holdRuleId}</Chip>
                      </div>
                      <div className="text-[13px] text-ink-2 ml-5 mt-1.5 max-w-2xl leading-relaxed">
                        {held.holdReason}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <div className="text-[17px] font-semibold tnum text-accent line-through decoration-accent/40">
                        {inr(held.amount)}
                      </div>
                      <div className="text-[11.5px] text-accent mt-0.5">
                        billable {held.becomesBillableOn}
                      </div>
                    </div>
                  </div>
                </summary>
                <div className="px-5 pb-5 pt-1">
                  <Trace step={held.trace} depth={1} />
                </div>
              </details>
            </div>
          )}

          {/* Totals */}
          <div className="px-5 py-4 border-t border-line bg-white">
            <div className="ml-auto max-w-sm space-y-1.5">
              <Row label="Taxable subtotal" value={inr(decision.taxableSubtotal)} />
              {decision.taxes.map((t) => (
                <Row
                  key={t.head}
                  label={`${t.head} @ ${(Number(t.rate) * 100).toFixed(0)}%`}
                  value={inr(t.amount)}
                  muted
                />
              ))}
              <div className="pt-2 mt-2 border-t border-line flex items-baseline justify-between">
                <span className="font-semibold">Recommended</span>
                <span className="text-[20px] font-semibold tnum">{inr(decision.total)}</span>
              </div>
              <div className="flex items-baseline justify-between text-accent">
                <span className="text-[13px]">Held this period</span>
                <span className="text-[13px] tnum">{inr(decision.heldTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* The demonstration */}
        <Card className="!bg-accent-bg !border-accent/25">
          <Eyebrow>What segmentation avoided</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-5 mt-3">
            <div>
              <div className="text-[12px] text-ink-3 mb-1">Naive whole-period rating</div>
              <div className="text-[22px] font-semibold tnum text-ink-3 line-through decoration-ink-3/40">
                {inr(decision.naiveComparison.total)}
              </div>
            </div>
            <div>
              <div className="text-[12px] text-ink-3 mb-1">Correct segmented rating</div>
              <div className="text-[22px] font-semibold tnum">{inr(decision.total)}</div>
            </div>
            <div>
              <div className="text-[12px] text-ink-3 mb-1">Error avoided</div>
              <div className="text-[22px] font-semibold tnum text-accent">
                {inr(decision.naiveComparison.error)}
              </div>
              <div className="text-[12px] text-accent">
                {decision.naiveComparison.errorPct}% of the correct amount
              </div>
            </div>
          </div>
          <p className="text-[13px] text-ink-2 mt-4 leading-relaxed max-w-3xl">
            Two errors in opposite directions, partially masking each other. Applying the amended
            terms to the whole month overstates subscription by 15.4%, while applying the amended
            3,000,000-call allowance to all 31 days makes the usage overage disappear entirely. A
            reviewer scanning the invoice sees a plausible number. This is why the error survives in
            production systems.
          </p>
        </Card>

        {/* Rules */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <Eyebrow>Rule evaluation</Eyebrow>
              <div className="text-[13px] text-ink-2">
                {counts.fired} of {counts.total} rules fired · {counts.blocking} blocking
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {firings.map((f) => (
              <div
                key={f.rule.id}
                className={`border rounded-lg p-3.5 ${
                  f.rule.outcome === "HOLD" && f.fired
                    ? "border-accent/30 bg-accent-bg/40"
                    : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[12px] text-ink-2">{f.rule.id}</span>
                      <span className="text-[13.5px] font-medium">{f.rule.name}</span>
                      {f.rule.outcome === "HOLD" && f.fired && <Chip tone="accent">blocks</Chip>}
                    </div>
                    <div className="text-[12.5px] font-mono text-ink-3 mt-1.5">
                      {f.rule.statement}
                    </div>
                    <div className="text-[12.5px] text-ink-2 mt-1.5">
                      <b className="font-medium">Observed:</b> {f.observed}
                    </div>
                    <div className="text-[12.5px] text-ink-2">
                      <b className="font-medium">Effect:</b> {f.effect}
                    </div>
                  </div>
                  {f.amountAffected && (
                    <div className="text-[13px] tnum text-ink-2 whitespace-nowrap">
                      {inr(f.amountAffected)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end pb-4">
          <NextLink href="/demo/explain">Explain this decision</NextLink>
        </div>
      </main>

      <StepNav current={3} />
    </>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${muted ? "text-ink-2" : ""}`}>
      <span className="text-[13px]">{label}</span>
      <span className="text-[13.5px] tnum">{value}</span>
    </div>
  );
}
