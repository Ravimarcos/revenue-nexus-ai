import { Decimal } from "decimal.js";
import { round2 } from "./money";
import { segmentPeriod } from "./segment";
import { rateSubscriptionSegment } from "./subscription";
import { rateUsageSegment } from "./usage";
import { rateMilestones } from "./milestone";
import { computeTax, sumTax } from "./tax";
import type {
  BillingDecision, BillingPeriod, Contract, ISODate, MilestoneEvidence,
  MilestoneLine, RatedLine, SubscriptionLine, TraceStep, UsageDay, UsageLine,
} from "./types";

export interface EngineInput {
  contract: Contract;
  period: BillingPeriod;
  usageDays: UsageDay[];
  milestoneEvidence: MilestoneEvidence[];
  asOf: ISODate;
}

function lineOf<T>(contract: Contract, versionId: string, lineNo: number): T {
  const v = contract.versions.find((x) => x.versionId === versionId)!;
  return v.lines.find((l) => l.lineNo === lineNo) as T;
}

/**
 * The whole engine, composed. PURE — no I/O anywhere beneath this call.
 *
 * Give it the same inputs in three years and it produces the same numbers.
 * That property is what makes the output auditable, and it is why the
 * AI layer is only ever allowed to *render* this result, never produce it.
 */
export function computeBillingDecision(input: EngineInput): BillingDecision {
  const { contract, period, usageDays, milestoneEvidence, asOf } = input;
  const segments = segmentPeriod(contract, period);

  const billable: RatedLine[] = [];
  const held: RatedLine[] = [];

  /* ── Line 1 · Subscription, rated per segment ─────────────────────────── */
  const subChildren: TraceStep[] = [];
  let subTotal = new Decimal(0);
  for (const seg of segments) {
    const line = lineOf<SubscriptionLine>(contract, seg.versionId, 1);
    const charge = rateSubscriptionSegment(line, seg, period.days);
    subTotal = subTotal.plus(charge.amount);
    subChildren.push(charge.trace);
  }
  const subLine = lineOf<SubscriptionLine>(contract, segments[0].versionId, 1);
  billable.push({
    lineNo: 1,
    productCode: subLine.productCode,
    productName: subLine.productName,
    strategy: "SUBSCRIPTION_PER_UNIT",
    clause: subLine.clause,
    amount: subTotal.toFixed(2),
    status: "BILLABLE",
    trace: {
      id: "line-1",
      label: `${subLine.productName} — subscription`,
      detail: `Rated across ${segments.length} segments because amendment A1 takes effect mid-period`,
      amount: subTotal.toFixed(2),
      sourceRef: subLine.clause,
      children: subChildren,
    },
  });

  /* ── Line 2 · Tiered usage, rated per segment ─────────────────────────── */
  const usgChildren: TraceStep[] = [];
  let usgTotal = new Decimal(0);
  for (const seg of segments) {
    const line = lineOf<UsageLine>(contract, seg.versionId, 2);
    const charge = rateUsageSegment(line, seg, usageDays, period.days);
    usgTotal = usgTotal.plus(charge.amount);
    usgChildren.push(charge.trace);
  }
  const usgLine = lineOf<UsageLine>(contract, segments[0].versionId, 2);
  billable.push({
    lineNo: 2,
    productCode: usgLine.productCode,
    productName: usgLine.productName,
    strategy: "USAGE_TIERED",
    clause: usgLine.clause,
    amount: usgTotal.toFixed(2),
    status: "BILLABLE",
    trace: {
      id: "line-2",
      label: `${usgLine.productName} — metered usage`,
      detail: `Allowance prorated per segment; the amended 3,000,000 entitlement applies only to 16–31 July`,
      amount: usgTotal.toFixed(2),
      sourceRef: usgLine.clause,
      children: usgChildren,
    },
  });

  /* ── Line 3 · Milestones ──────────────────────────────────────────────── */
  const msLine = lineOf<MilestoneLine>(contract, segments[segments.length - 1].versionId, 3);
  const milestones = rateMilestones(msLine, milestoneEvidence, period, asOf);

  for (const m of milestones) {
    if (m.status === "BILLABLE") {
      billable.push({
        lineNo: 3, productCode: msLine.productCode,
        productName: `${msLine.productName} — ${m.name}`,
        strategy: "MILESTONE", clause: msLine.clause,
        amount: m.amount.toFixed(2), status: "BILLABLE", trace: m.trace,
      });
    } else if (m.status === "HELD") {
      held.push({
        lineNo: 3, productCode: msLine.productCode,
        productName: `${msLine.productName} — ${m.name}`,
        strategy: "MILESTONE", clause: msLine.clause,
        amount: m.amount.toFixed(2), status: "HELD",
        holdReason: m.holdReason, holdRuleId: "RULE-MILESTONE-007",
        becomesBillableOn: m.becomesBillableOn ?? undefined,
        trace: m.trace,
      });
    }
  }

  /* ── Totals and tax ───────────────────────────────────────────────────── */
  const taxableSubtotal = round2(
    billable.reduce((s, l) => s.plus(new Decimal(l.amount)), new Decimal(0))
  );
  const taxes = computeTax(contract, taxableSubtotal);
  const total = round2(taxableSubtotal.plus(sumTax(taxes)));
  const heldTotal = round2(held.reduce((s, l) => s.plus(new Decimal(l.amount)), new Decimal(0)));

  return {
    contractId: contract.contractId,
    customerName: contract.customerName,
    period,
    segments,
    billable,
    held,
    taxableSubtotal: taxableSubtotal.toFixed(2),
    taxes,
    total: total.toFixed(2),
    heldTotal: heldTotal.toFixed(2),
    naiveComparison: computeNaive(input, total),
  };
}

/**
 * What a system that does NOT segment would have produced.
 *
 * This is not a decorative comparison — it is the demonstration. Naive
 * rating applies the amended terms to the entire period, overstating
 * subscription by 15.4% while understating usage to zero. Two errors in
 * opposite directions, partially masking each other, which is exactly why
 * nobody catches this by eye.
 */
function computeNaive(input: EngineInput, correctTotal: Decimal) {
  const { contract, period, usageDays } = input;
  const latest = contract.versions[contract.versions.length - 1];

  const sub = latest.lines.find((l) => l.lineNo === 1) as SubscriptionLine;
  const usg = latest.lines.find((l) => l.lineNo === 2) as UsageLine;

  const naiveSub = round2(
    new Decimal(sub.units)
      .mul(new Decimal(sub.ratePerUnitPerMonth))
      .mul(new Decimal(1).minus(new Decimal(sub.discountRate)))
  );

  const totalCalls = usageDays
    .filter((d) => d.date >= period.start && d.date <= period.end)
    .reduce((s, d) => s + d.calls, 0);
  const naiveOverage = Math.max(0, totalCalls - usg.includedUnitsPerMonth);
  const band = usg.tiers.find((t) => t.upTo === null || totalCalls <= t.upTo)!;
  const naiveUsg = round2(new Decimal(band.ratePerUnit).mul(naiveOverage));

  const naiveSubtotal = naiveSub.plus(naiveUsg);
  const naiveTaxes = computeTax(contract, naiveSubtotal);
  const naiveTotal = round2(naiveSubtotal.plus(sumTax(naiveTaxes)));
  const error = naiveTotal.minus(correctTotal);

  return {
    total: naiveTotal.toFixed(2),
    error: error.toFixed(2),
    errorPct: error.div(correctTotal).mul(100).toDecimalPlaces(1).toFixed(1),
  };
}
