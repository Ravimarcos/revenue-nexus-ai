import { Decimal } from "decimal.js";
import { round2, inr, fmtInt } from "./money";
import type { RatingSegment, TraceStep, UsageDay, UsageLine } from "./types";

export interface UsageSegmentCharge {
  segment: RatingSegment;
  callsInSegment: number;
  allowance: number;
  overage: number;
  ratePerUnit: Decimal;
  amount: Decimal;
  trace: TraceStep;
}

/**
 * SPIKE FINDING F3 — usage MUST be available at daily granularity.
 *
 * A monthly aggregate ("2.4M calls in July") cannot be rated across a
 * mid-cycle amendment: the information about which side of the boundary
 * each call fell on was destroyed at aggregation. This function therefore
 * takes daily records, never a total.
 */
export function callsInSegment(days: UsageDay[], segment: RatingSegment): number {
  return days
    .filter((d) => d.date >= segment.start && d.date <= segment.end)
    .reduce((sum, d) => sum + d.calls, 0);
}

/**
 * SPIKE FINDING F4 — "tiered pricing" is ambiguous in ordinary contract
 * language. Bands may be measured against total consumed volume or against
 * the overage alone. On this contract the two differ by 33% on identical
 * text. The interpretation is therefore an explicit required field and is
 * NEVER inferred (FR-1.3).
 */
function priceOverage(
  overage: number,
  totalVolume: number,
  line: UsageLine
): { amount: Decimal; rate: Decimal; bandLabel: string } {
  if (overage <= 0) {
    return { amount: new Decimal(0), rate: new Decimal(0), bandLabel: "—" };
  }

  if (line.tierInterpretation === "TOTAL_VOLUME") {
    // Band selected by total consumption, then applied to the overage.
    const tier = line.tiers.find((t) => t.upTo === null || totalVolume <= t.upTo)!;
    const rate = new Decimal(tier.ratePerUnit);
    const upper = tier.upTo === null ? "above" : `up to ${fmtInt(tier.upTo)}`;
    return {
      amount: round2(rate.mul(overage)),
      rate,
      bandLabel: `${fmtInt(totalVolume)} total calls falls in the "${upper}" band → ${inr(rate)}/call`,
    };
  }

  // OVERAGE_VOLUME — bands walked against the overage alone.
  let remaining = overage;
  let prev = 0;
  let cost = new Decimal(0);
  let firstRate = new Decimal(0);
  for (const t of line.tiers) {
    const band = t.upTo === null ? remaining : t.upTo - prev;
    const take = Math.min(remaining, band);
    if (take > 0) {
      const r = new Decimal(t.ratePerUnit);
      if (firstRate.isZero()) firstRate = r;
      cost = cost.plus(r.mul(take));
      remaining -= take;
    }
    prev = t.upTo ?? prev;
    if (remaining <= 0) break;
  }
  return {
    amount: round2(cost),
    rate: firstRate,
    bandLabel: `${fmtInt(overage)} overage calls walked through tier bands`,
  };
}

/** PURE FUNCTION. */
export function rateUsageSegment(
  line: UsageLine,
  segment: RatingSegment,
  days: UsageDay[],
  periodDays: number
): UsageSegmentCharge {
  const calls = callsInSegment(days, segment);

  // SPIKE FINDING F2 — the ALLOWANCE is prorated too, not just the charge.
  // Applying the amended 3M allowance to the whole month understates usage.
  const allowance = new Decimal(line.includedUnitsPerMonth)
    .mul(segment.fraction)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();

  const overage = Math.max(0, calls - allowance);
  const { amount, rate, bandLabel } = priceOverage(overage, calls, line);

  return {
    segment,
    callsInSegment: calls,
    allowance,
    overage,
    ratePerUnit: rate,
    amount,
    trace: {
      id: `usg-${segment.versionId}`,
      label: `${segment.label} · ${segment.start} to ${segment.end}`,
      detail:
        overage > 0
          ? `${fmtInt(calls)} calls against a prorated allowance of ${fmtInt(allowance)} → ${fmtInt(overage)} chargeable`
          : `${fmtInt(calls)} calls against a prorated allowance of ${fmtInt(allowance)} → within allowance, nothing to charge`,
      formula: overage > 0 ? `${fmtInt(overage)} × ${inr(rate, false)}` : "—",
      amount: amount.toFixed(2),
      sourceRef: line.clause,
      children: [
        {
          id: `usg-${segment.versionId}-calls`,
          label: "Metered calls in segment",
          detail: `Summed from daily records ${segment.start} to ${segment.end}`,
          amount: fmtInt(calls),
        },
        {
          id: `usg-${segment.versionId}-allow`,
          label: "Prorated allowance",
          detail: `${fmtInt(line.includedUnitsPerMonth)}/month × ${segment.days}/${periodDays} days`,
          amount: fmtInt(allowance),
        },
        {
          id: `usg-${segment.versionId}-over`,
          label: "Chargeable overage",
          detail: overage > 0 ? bandLabel : "Consumption within the prorated allowance",
          amount: fmtInt(overage),
        },
      ],
    },
  };
}
