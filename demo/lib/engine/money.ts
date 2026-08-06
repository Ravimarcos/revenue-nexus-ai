import { Decimal } from "decimal.js";

/**
 * Rounding policy, pinned once (FR-3.9):
 *   half-up, 2 decimal places, applied at line level.
 *
 * GST heads are rounded SEPARATELY (CGST and SGST each), not by rounding
 * a combined 18%. They are distinct heads on the GST return and each is
 * reported independently. This produces a one-paisa difference from the
 * naive combined calculation — trivial until it appears on a reconciliation
 * report ten thousand invoices later.
 */
export function round2(d: Decimal): Decimal {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/** Indian digit grouping: ₹8,60,562.56 — not ₹860,562.56 */
export function inr(value: Decimal | string, withSymbol = true): string {
  const d = typeof value === "string" ? new Decimal(value) : value;
  const fixed = d.toFixed(2);
  const neg = fixed.startsWith("-");
  const [whole, frac] = (neg ? fixed.slice(1) : fixed).split(".");

  let grouped = whole;
  if (whole.length > 3) {
    const tail = whole.slice(-3);
    let head = whole.slice(0, -3);
    const parts: string[] = [];
    while (head.length > 2) {
      parts.unshift(head.slice(-2));
      head = head.slice(0, -2);
    }
    if (head) parts.unshift(head);
    grouped = parts.join(",") + "," + tail;
  }

  return `${neg ? "-" : ""}${withSymbol ? "₹" : ""}${grouped}.${frac}`;
}

/** Compact form for headline figures: ₹8.61L, ₹1.2Cr */
export function inrCompact(value: Decimal | string): string {
  const d = typeof value === "string" ? new Decimal(value) : value;
  const abs = d.abs();
  if (abs.gte(10_000_000)) return `₹${d.div(10_000_000).toFixed(2)} Cr`;
  if (abs.gte(100_000)) return `₹${d.div(100_000).toFixed(2)} L`;
  return inr(d);
}

export function pct(d: Decimal | string): string {
  const v = typeof d === "string" ? new Decimal(d) : d;
  return `${v.mul(100).toDecimalPlaces(2).toString()}%`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString("en-IN");
}

export { Decimal };
