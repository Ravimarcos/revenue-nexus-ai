import { Decimal } from "decimal.js";
import { round2, inr } from "./money";
import type { RatingSegment, SubscriptionLine, TraceStep } from "./types";

export interface SegmentCharge {
  segment: RatingSegment;
  amount: Decimal;
  trace: TraceStep;
}

/**
 * PURE FUNCTION (FR-3.2 / INV-PR1).
 * No I/O, no database, no clock. Same inputs always produce the same output.
 *
 * This is what makes the engine testable, replayable against historical
 * periods, and explainable — the explanation is just a rendering of the trace.
 */
export function rateSubscriptionSegment(
  line: SubscriptionLine,
  segment: RatingSegment,
  periodDays: number
): SegmentCharge {
  const units = new Decimal(line.units);
  const rate = new Decimal(line.ratePerUnitPerMonth);
  const discount = new Decimal(line.discountRate);

  const gross = units.mul(rate);
  const afterDiscount = gross.mul(new Decimal(1).minus(discount));
  const prorated = round2(afterDiscount.mul(segment.fraction));

  const discountLabel = discount.isZero()
    ? "no discount"
    : `less ${discount.mul(100).toDecimalPlaces(2)}% volume discount`;

  return {
    segment,
    amount: prorated,
    trace: {
      id: `sub-${segment.versionId}`,
      label: `${segment.label} · ${segment.start} to ${segment.end}`,
      detail: `${line.units} ${line.unitLabel}s at ${inr(rate)}/month, ${discountLabel}, prorated over ${segment.days} of ${periodDays} days`,
      formula: `${line.units} × ${inr(rate, false)} × ${new Decimal(1).minus(discount)} × ${segment.days}/${periodDays}`,
      amount: prorated.toFixed(2),
      sourceRef: line.clause,
      children: [
        {
          id: `sub-${segment.versionId}-gross`,
          label: "Gross monthly charge",
          detail: `${line.units} × ${inr(rate)}`,
          amount: gross.toFixed(2),
        },
        {
          id: `sub-${segment.versionId}-disc`,
          label: discount.isZero() ? "Discount (none)" : "After volume discount",
          detail: discount.isZero() ? "No discount under these terms" : `${inr(gross)} less ${discount.mul(100)}%`,
          amount: afterDiscount.toFixed(2),
        },
        {
          id: `sub-${segment.versionId}-prorate`,
          label: "Prorated to segment",
          detail: `${segment.days} of ${periodDays} days = ${segment.fraction.toDecimalPlaces(6)}`,
          amount: prorated.toFixed(2),
        },
      ],
    },
  };
}
