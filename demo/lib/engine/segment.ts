import { Decimal } from "decimal.js";
import type { BillingPeriod, Contract, ISODate, RatingSegment } from "./types";

/** Whole days between two ISO dates, inclusive of both. */
export function inclusiveDays(start: ISODate, end: ISODate): number {
  const a = Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10));
  const b = Date.UTC(+end.slice(0, 4), +end.slice(5, 7) - 1, +end.slice(8, 10));
  return Math.round((b - a) / 86_400_000) + 1;
}

export function maxDate(a: ISODate, b: ISODate): ISODate {
  return a > b ? a : b;
}
export function minDate(a: ISODate, b: ISODate): ISODate {
  return a < b ? a : b;
}

export function buildPeriod(start: ISODate, end: ISODate, label: string): BillingPeriod {
  return { start, end, days: inclusiveDays(start, end), label };
}

/**
 * SPIKE FINDING F1 — the central decision of this engine.
 *
 * A billing period cannot be rated as one unit when a contract amendment
 * takes effect mid-cycle. The period is decomposed at every amendment
 * boundary and each segment is rated independently.
 *
 * Rating the July 2026 period as a single unit produces an error of
 * ₹1,16,477.44 (13.5%) on this contract — two errors in opposite directions
 * partially masking each other.
 */
export function segmentPeriod(contract: Contract, period: BillingPeriod): RatingSegment[] {
  const segments: RatingSegment[] = [];

  for (const version of contract.versions) {
    const start = maxDate(version.validFrom, period.start);
    const end = minDate(version.validTo ?? period.end, period.end);
    if (start > end) continue; // version does not overlap this period

    const days = inclusiveDays(start, end);
    segments.push({
      versionId: version.versionId,
      label: version.label,
      start,
      end,
      days,
      fraction: new Decimal(days).div(period.days),
    });
  }

  const covered = segments.reduce((n, s) => n + s.days, 0);
  if (covered !== period.days) {
    throw new Error(
      `Segment coverage ${covered}d != period ${period.days}d. ` +
        `Contract versions must tile the billing period exactly with no gaps or overlaps.`
    );
  }

  return segments.sort((a, b) => a.start.localeCompare(b.start));
}
