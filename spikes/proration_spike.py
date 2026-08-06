"""
SPIKE — Mid-cycle amendment proration
=====================================
DISPOSABLE. This is not production code and must not be imported by anything.

Purpose
-------
Before we draw the pricing engine into six architecture diagrams, prove the
model can actually compute the hardest case in the MVP contract:

    Contract CON-2026-114, July 2026 billing period.
    Amendment A1 takes effect MID-CYCLE on 16 July, changing simultaneously:
      - licensed users        500  ->  750
      - volume discount       none ->  8%
      - included API calls    2M   ->  3M / month

Question the spike must answer:
    Can we rate this correctly by treating the billing period as one unit,
    or does the period have to be decomposed?

Run:  python3 proration_spike.py
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

D = Decimal


def inr(x: Decimal) -> str:
    """Indian digit grouping: 8,65,130.32 not 865,130.32"""
    q = x.quantize(D("0.01"), rounding=ROUND_HALF_UP)
    whole, _, frac = f"{q:.2f}".partition(".")
    neg, whole = (whole[0] == "-"), whole.lstrip("-")
    if len(whole) > 3:
        head, tail = whole[:-3], whole[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:]); head = head[:-2]
        if head:
            parts.insert(0, head)
        whole = ",".join(parts + [tail])
    return f"{'-' if neg else ''}₹{whole}.{frac}"


# ── Contract terms, versioned with validity windows ──────────────────────────
# NOTE: terms are VERSIONED, not mutated. This is invariant INV-C1 from the
# domain model, and it is what makes segmentation possible at all.

@dataclass(frozen=True)
class Terms:
    label: str
    valid_from: date
    valid_to: date | None
    users: int
    rate_per_user_month: Decimal
    discount: Decimal              # fractional, e.g. 0.08
    included_calls_month: int
    # tier bands: (upper_bound_exclusive_or_None, price_per_call)
    tiers: tuple

BASE = Terms(
    label="Base terms",
    valid_from=date(2026, 4, 1), valid_to=date(2026, 7, 15),
    users=500, rate_per_user_month=D("1200"), discount=D("0"),
    included_calls_month=2_000_000,
    tiers=((1_000_000, D("0.08")), (5_000_000, D("0.06")), (None, D("0.04"))),
)

A1 = Terms(
    label="Amendment A1",
    valid_from=date(2026, 7, 16), valid_to=None,
    users=750, rate_per_user_month=D("1200"), discount=D("0.08"),
    included_calls_month=3_000_000,
    tiers=((1_000_000, D("0.08")), (5_000_000, D("0.06")), (None, D("0.04"))),
)

PERIOD_START, PERIOD_END = date(2026, 7, 1), date(2026, 7, 31)
PERIOD_DAYS = (PERIOD_END - PERIOD_START).days + 1
TOTAL_JULY_CALLS = 2_400_000


# ── Segmentation: the finding this spike exists to produce ───────────────────

@dataclass(frozen=True)
class Segment:
    terms: Terms
    start: date
    end: date
    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1
    @property
    def fraction(self) -> Decimal:
        return D(self.days) / D(PERIOD_DAYS)


def segment_period(versions: list[Terms]) -> list[Segment]:
    """Split the billing period at every amendment boundary."""
    segs = []
    for t in versions:
        s = max(t.valid_from, PERIOD_START)
        e = min(t.valid_to or PERIOD_END, PERIOD_END)
        if s <= e:
            segs.append(Segment(t, s, e))
    return segs


# ── Rating: PURE FUNCTIONS. No I/O, no clock, no database. (INV-PR1) ─────────

def rate_subscription(seg: Segment) -> Decimal:
    t = seg.terms
    full = D(t.users) * t.rate_per_user_month * (D(1) - t.discount)
    return (full * seg.fraction).quantize(D("0.01"), rounding=ROUND_HALF_UP)


def price_tiered(volume: int, tiers, mode: str) -> Decimal:
    """
    mode='overage_volume'  -> tier bands measured against the overage alone
    mode='total_volume'    -> tier band chosen by total consumed volume
    The contract text "tiered pricing" does not distinguish these. It must.
    """
    if volume <= 0:
        return D("0")
    if mode == "overage_volume":
        remaining, prev, cost = volume, 0, D("0")
        for upper, price in tiers:
            band = (upper - prev) if upper else remaining
            take = min(remaining, band)
            cost += D(take) * price
            remaining -= take
            prev = upper or prev
            if remaining <= 0:
                break
        return cost
    raise ValueError(mode)


def rate_usage(seg: Segment, calls_in_segment: int, mode: str) -> tuple[Decimal, int, int]:
    t = seg.terms
    allowance = int((D(t.included_calls_month) * seg.fraction)
                    .quantize(D("1"), rounding=ROUND_HALF_UP))
    overage = max(0, calls_in_segment - allowance)
    if mode == "total_volume":
        # band selected by cumulative consumption, then applied to overage
        band_price = next(p for u, p in t.tiers if u is None or calls_in_segment <= u)
        return (D(overage) * band_price).quantize(D("0.01")), allowance, overage
    return price_tiered(overage, t.tiers, "overage_volume").quantize(D("0.01")), allowance, overage


# ── Scenarios ────────────────────────────────────────────────────────────────

def run():
    segs = segment_period([BASE, A1])
    daily = D(TOTAL_JULY_CALLS) / D(PERIOD_DAYS)

    print("=" * 74)
    print("SPIKE — CON-2026-114 · July 2026 · Amendment A1 effective 16 Jul")
    print("=" * 74)

    print(f"\nBilling period {PERIOD_START} .. {PERIOD_END}  ({PERIOD_DAYS} days)")
    print(f"Total API calls in period: {TOTAL_JULY_CALLS:,}\n")

    print("SEGMENTS")
    print("-" * 74)
    for s in segs:
        print(f"  {s.terms.label:<14} {s.start} .. {s.end}  "
              f"{s.days:>2}d  ({s.fraction:.6f} of period)  "
              f"{s.terms.users} users, {int(s.terms.discount*100)}% disc")

    # ---- Subscription -------------------------------------------------------
    print("\nSUBSCRIPTION — segmented")
    print("-" * 74)
    sub_total = D("0")
    for s in segs:
        amt = rate_subscription(s)
        sub_total += amt
        full = D(s.terms.users) * s.terms.rate_per_user_month * (D(1) - s.terms.discount)
        print(f"  {s.terms.label:<14} {inr(full):>14} × {s.days}/{PERIOD_DAYS}  = {inr(amt):>14}")
    print(f"  {'SEGMENTED TOTAL':<14} {'':>14}   {'':>6}   {inr(sub_total):>14}")

    naive = (D(A1.users) * A1.rate_per_user_month * (D(1) - A1.discount)).quantize(D("0.01"))
    print(f"\n  Naive (new terms applied to whole period):  {inr(naive)}")
    print(f"  Overstatement if we do NOT segment:        {inr(naive - sub_total)}"
          f"   ({(naive-sub_total)/sub_total*100:.1f}%)")

    # ---- Usage --------------------------------------------------------------
    print("\nUSAGE — segmented, assuming uniform daily distribution")
    print("-" * 74)
    usage_total = D("0")
    for s in segs:
        calls = int((daily * D(s.days)).quantize(D("1"), rounding=ROUND_HALF_UP))
        amt, allowance, overage = rate_usage(s, calls, "total_volume")
        usage_total += amt
        print(f"  {s.terms.label:<14} calls {calls:>10,}  allowance {allowance:>10,}  "
              f"overage {overage:>9,}  = {inr(amt):>12}")
    print(f"  {'SEGMENTED TOTAL':<14} {'':>52} {inr(usage_total):>12}")

    naive_calls, naive_allow = TOTAL_JULY_CALLS, A1.included_calls_month
    naive_usage = D(max(0, naive_calls - naive_allow)) * D("0.06")
    print(f"\n  Naive (A1 allowance 3M over whole period): overage 0 → {inr(naive_usage)}")
    print(f"  Understatement if we do NOT segment:       {inr(usage_total - naive_usage)}")

    # ---- Tier ambiguity -----------------------------------------------------
    print("\nTIER INTERPRETATION AMBIGUITY")
    print("-" * 74)
    s0 = segs[0]
    c0 = int((daily * D(s0.days)).quantize(D("1")))
    a_total, _, ov = rate_usage(s0, c0, "total_volume")
    a_over, _, _ = rate_usage(s0, c0, "overage_volume")
    print(f"  Segment 1 overage: {ov:,} calls")
    print(f"    (A) tier band chosen by TOTAL volume   ({c0:,} calls → ₹0.08 band) = {inr(a_total)}")
    print(f"    (B) tier band chosen by OVERAGE volume ({ov:,} calls → ₹0.08 band) = {inr(a_over)}")
    print(f"    divergence on identical contract text  = {inr(abs(a_total - a_over))}")

    # ---- Invoice ------------------------------------------------------------
    print("\nJULY 2026 INVOICE — segmented rating (correct)")
    print("=" * 74)
    subtotal = sub_total + usage_total
    cgst = (subtotal * D("0.09")).quantize(D("0.01"), rounding=ROUND_HALF_UP)
    sgst = (subtotal * D("0.09")).quantize(D("0.01"), rounding=ROUND_HALF_UP)
    total = subtotal + cgst + sgst
    held = D("4000000") * D("0.30")
    rows = [("Subscription (2 segments)", sub_total),
            ("API usage (2 segments)", usage_total),
            ("Taxable subtotal", subtotal),
            ("CGST @ 9%", cgst), ("SGST @ 9%", sgst),
            ("INVOICE TOTAL", total)]
    for label, amt in rows:
        print(f"  {label:<34} {inr(amt):>16}")
    print(f"  {'Implementation milestone':<34} {'HELD':>16}")
    print(f"  {'  (UAT 30% of ₹40,00,000)':<34} {inr(held):>16}")

    naive_total = (naive + naive_usage) * D("1.18")
    print(f"\n  Naive whole-period rating would invoice:  {inr(naive_total)}")
    print(f"  Error:                                    {inr(naive_total - total)}")

    print("\n" + "=" * 74)
    print("VERDICT")
    print("=" * 74)
    print("""
  The billing period CANNOT be rated as one unit.

  F1  A billing period must be decomposed into RATING SEGMENTS at every
      amendment boundary, each rated independently as a pure function.
      "Rating period" != "billing period". Retrofitting this is a rewrite.

  F2  Prorating a usage ALLOWANCE is not optional and not obvious. Naive
      whole-period rating understated usage here because A1's larger 3M
      allowance was wrongly applied to days it did not cover.

  F3  Usage must be ingested at event or daily-bucket granularity. A monthly
      aggregate ("2.4M calls in July") CANNOT be correctly rated across a
      mid-cycle amendment. This is a hard ingestion requirement, not a
      nice-to-have — and it constrains every usage connector we build.

  F4  "Tiered pricing" is ambiguous in ordinary contract language. Bands may
      be measured against total volume or against overage volume. The two
      differ materially on identical contract text. The catalog must force
      an explicit choice; it must never be inferred.

  F5  Subscription billed in advance + mid-cycle amendment means the July
      invoice was already issued on 1 July under base terms. Economically
      the answer above is right, but mechanically it requires a CREDIT NOTE
      plus a rebill, because issued invoices are immutable (INV-I1).
""")


if __name__ == "__main__":
    run()
