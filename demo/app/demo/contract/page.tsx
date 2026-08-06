import { getDecision } from "@/lib/decision";
import { loadCustomer, loadUsageMeta } from "@/lib/data";
import { SYNC_TIMES } from "@/lib/connectors/fixtures";
import { inr, fmtInt } from "@/lib/engine/money";
import { Card, Chip, Authority, PageHeader, StepNav, NextLink, Eyebrow } from "@/components/ui";
import { Notice } from "@/components/Notice";
import type { MilestoneLine, SubscriptionLine, UsageLine } from "@/lib/engine/types";

export default function ContractPage() {
  const { contract } = getDecision();
  const customer = loadCustomer();
  const usageMeta = loadUsageMeta();

  const v0 = contract.versions[0];
  const a1 = contract.versions[1];
  const sub0 = v0.lines.find((l) => l.lineNo === 1) as SubscriptionLine;
  const sub1 = a1.lines.find((l) => l.lineNo === 1) as SubscriptionLine;
  const usg0 = v0.lines.find((l) => l.lineNo === 2) as UsageLine;
  const usg1 = a1.lines.find((l) => l.lineNo === 2) as UsageLine;
  const ms = v0.lines.find((l) => l.lineNo === 3) as MilestoneLine;

  return (
    <>
      <PageHeader
        step="Screen 2 of 5"
        title="Client and contract"
        lede="One client, one contract, five pricing mechanisms — subscription, tiered usage, milestone, one-time and auto-renewal — plus a mid-cycle amendment. That composition is the reality across a multi-product portfolio, and it is what makes correct billing hard."
      />

      <main className="max-w-content mx-auto px-5 py-7 space-y-6">
        <Notice>
          <p>
            One contract carries <b className="text-ink font-semibold">five different pricing
            mechanisms at once</b> — a per-employee subscription, tiered transaction pricing, a
            milestone-billed implementation, a one-time onboarding charge, and an auto-renewal
            clause. That combination is normal across a multi-product portfolio, and it is what
            makes billing hard.
          </p>
          <p>
            Then note the amendment at the bottom: it takes effect{" "}
            <b className="text-ink font-semibold">on 16 July, mid-billing-period</b>, and expressly
            does not apply retrospectively. Most billing systems get that wrong. The next screen
            shows what it costs.
          </p>
        </Notice>

        {/* Client */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <Eyebrow>Client</Eyebrow>
              <h2 className="text-[19px] font-semibold">{customer.company.name}</h2>
              <div className="text-[13px] text-ink-2 mt-0.5">
                {customer.company.industry} · {fmtInt(customer.company.employees)} employees ·{" "}
                {customer.company.hqCity}
              </div>
            </div>
            <div className="text-right">
              <Authority owned={false} source="HubSpot" />
              <div className="text-[11.5px] text-ink-3 mt-1.5">as of {SYNC_TIMES.crm.slice(0, 16).replace("T", " ")}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {customer.billingEntities.map((b) => (
              <div key={b.id} className="border border-line rounded-lg p-3.5 bg-surface">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-medium">{b.state}</span>
                  {b.primary && <Chip tone="blue">billed</Chip>}
                </div>
                <div className="font-mono text-[12px] text-ink-2">{b.gstin}</div>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed">
            One client, three GSTINs. The invoicing party is a <b className="font-medium">BillingEntity</b>{" "}
            at GSTIN level, not the client — place of supply drives the tax structure, and
            modelling this the other way round is a rewrite later.
          </p>
        </Card>

        {/* Contract lines */}
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between flex-wrap gap-3">
            <div>
              <Eyebrow>Contract {contract.contractId}</Eyebrow>
              <div className="text-[13px] text-ink-2">
                Executed 28 Mar 2026 · 24 months · Net {contract.paymentTermsDays} · Place of supply{" "}
                {contract.placeOfSupply.state}
              </div>
            </div>
            <Chip tone="neutral">5 pricing mechanisms</Chip>
          </div>

          <div className="divide-y divide-[--line]">
            <LineRow
              n={1}
              name={sub0.productName}
              model="Subscription · per employee"
              clause="3.1"
              base={`${sub0.units} ${sub0.unitLabel}s × ${inr(sub0.ratePerUnitPerMonth)}/month, no discount`}
              amended={`${sub1.units} ${sub1.unitLabel}s × ${inr(sub1.ratePerUnitPerMonth)}/month, less 8%`}
            />
            <LineRow
              n={2}
              name={usg0.productName}
              model="Usage · tiered"
              clause="3.4"
              base={`${fmtInt(usg0.includedUnitsPerMonth)} transactions included · ₹0.08 / ₹0.06 / ₹0.04 bands`}
              amended={`${fmtInt(usg1.includedUnitsPerMonth)} transactions included · same bands`}
              note={`Tier interpretation: ${usg0.tierInterpretation.replace("_", " ").toLowerCase()} — explicit in clause 3.4, never inferred`}
            />
            <LineRow
              n={3}
              name={ms.productName}
              model="Milestone"
              clause="4.2"
              base={`${inr(ms.totalValue)} across 4 milestones · ${ms.acceptanceWindowDays}-day acceptance window`}
            />
          </div>
        </Card>

        {/* Other pricing mechanisms on this contract */}
        {contract.additionalTerms && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-start justify-between gap-3 mb-2">
                <Eyebrow>One-time charge</Eyebrow>
                <Chip tone="neutral">already invoiced</Chip>
              </div>
              {contract.additionalTerms.oneTimeCharges.map((c) => (
                <div key={c.code}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium">{c.name}</span>
                    <span className="text-[15px] tnum font-semibold">{inr(c.amount)}</span>
                  </div>
                  <div className="text-[12.5px] text-ink-2 mt-1">
                    § {c.clause} · invoiced {c.invoicedIn}
                  </div>
                  <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed">{c.note}</p>
                </div>
              ))}
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-3 mb-2">
                <Eyebrow>Renewal</Eyebrow>
                <Chip tone="blue">auto-renew</Chip>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] font-medium">
                  Renews {contract.additionalTerms.renewalPolicy.renewsOn}
                </span>
                <span className="text-[13px] text-ink-2">
                  +{contract.additionalTerms.renewalPolicy.termMonths} months
                </span>
              </div>
              <div className="text-[12.5px] text-ink-2 mt-1">
                {contract.additionalTerms.renewalPolicy.noticeDays}-day notice period
              </div>
              <p className="text-[12.5px] text-ink-3 mt-2 leading-relaxed">
                {contract.additionalTerms.renewalPolicy.note}
              </p>
            </Card>
          </div>
        )}

        {/* Amendment */}
        <Card className="!bg-accent-bg !border-accent/25">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div>
              <Eyebrow>Amendment A1</Eyebrow>
              <div className="text-[13px] text-ink-2">
                Executed 14 Jul 2026 · <b className="font-medium">effective 16 July 2026</b> ·
                does not operate retrospectively
              </div>
            </div>
            <Chip tone="accent">mid-cycle</Chip>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {a1.changes!.map((c) => (
              <div key={c.field} className="bg-white border border-line rounded-lg p-3.5">
                <div className="text-[11.5px] text-ink-3 mb-1.5">
                  Line {c.line} · {c.field}
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[14px] tnum text-ink-3 line-through">{fmtVal(c.from)}</span>
                  <span className="text-ink-3 text-[12px]">→</span>
                  <span className="text-[15px] tnum font-semibold text-accent">{fmtVal(c.to)}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-ink-2 mt-4 leading-relaxed max-w-3xl">
            Because A1 §4 states the amendment does not operate retrospectively, the July billing
            period cannot be rated under either set of terms alone. It has to be decomposed at the
            16 July boundary. Getting this wrong costs {inr("116477.44")} on this one contract for
            this one month.
          </p>
        </Card>

        {/* Evidence sources */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-start justify-between mb-3">
              <Eyebrow>Usage evidence</Eyebrow>
              <Authority owned={false} source="Product telemetry" />
            </div>
            <div className="text-[15px] font-semibold tnum">
              {fmtInt(usageMeta.totalCalls)} transactions
            </div>
            <div className="text-[13px] text-ink-2 mt-0.5">
              31 daily records · granularity {usageMeta.granularity}
            </div>
            <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed">
              Daily granularity is a hard requirement, not a preference. A monthly aggregate cannot
              be rated across a mid-cycle amendment — the information about which side of the
              boundary each transaction fell on is destroyed at aggregation.
            </p>
          </Card>

          <Card>
            <div className="flex items-start justify-between mb-3">
              <Eyebrow>Delivery evidence</Eyebrow>
              <Authority owned={false} source="CRM activity" />
            </div>
            <div className="text-[15px] font-semibold">ACT-9337 · UAT sign-off</div>
            <div className="text-[13px] text-ink-2 mt-0.5">
              Confirmed 14 Jul 2026 · logged by the key account manager
            </div>
            <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed">
              A confirmed activity is delivery evidence, not billing eligibility. The
              contract&rsquo;s 30-day acceptance window decides that — which is why {inr("1200000")}{" "}
              is held rather than billed.
            </p>
          </Card>
        </div>

        <div className="flex justify-end pb-4">
          <NextLink href="/demo/billing">Compute the July billing decision</NextLink>
        </div>
      </main>

      <StepNav current={2} />
    </>
  );
}

function fmtVal(v: string) {
  if (v === "0") return "none";
  if (v === "0.08") return "8%";
  const n = Number(v);
  return Number.isFinite(n) && n >= 1000 ? fmtInt(n) : v;
}

function LineRow({
  n, name, model, clause, base, amended, note,
}: {
  n: number; name: string; model: string; clause: string;
  base: string; amended?: string; note?: string;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-5 h-5 rounded bg-surface border border-line grid place-items-center text-[11px] font-semibold">
              {n}
            </span>
            <span className="font-medium">{name}</span>
            <Chip tone="neutral">{model}</Chip>
            <span className="text-[11.5px] text-blue">§ {clause}</span>
          </div>
          <div className="text-[13px] text-ink-2 mt-2 ml-7">{base}</div>
          {amended && (
            <div className="text-[13px] text-accent mt-1 ml-7">
              <span className="text-ink-3">from 16 Jul →</span> {amended}
            </div>
          )}
          {note && <div className="text-[12px] text-ink-3 mt-1.5 ml-7">{note}</div>}
        </div>
      </div>
    </div>
  );
}
