import { Decimal } from "decimal.js";
import { round2, inr } from "./money";
import { inclusiveDays } from "./segment";
import type { BillingPeriod, ISODate, MilestoneEvidence, MilestoneLine, TraceStep } from "./types";

export interface MilestoneCharge {
  code: string;
  name: string;
  obligationId: string;
  amount: Decimal;
  status: "BILLABLE" | "HELD" | "NOT_SATISFIED";
  evidence: MilestoneEvidence | null;
  satisfiedOn: ISODate | null;
  becomesBillableOn: ISODate | null;
  holdReason?: string;
  trace: TraceStep;
}

function addDays(iso: ISODate, n: number): ISODate {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * PURE FUNCTION.
 *
 * The distinction this function exists to enforce (FR-4.4):
 *
 *   Confirmed in the CRM  ==  delivery evidence
 *   Billable              ==  evidence + acceptance window elapsed
 *
 * Conflating the two is how milestone billing goes wrong in both directions:
 * billing work the customer can still reject, or never billing it at all.
 */
export function rateMilestones(
  line: MilestoneLine,
  evidence: MilestoneEvidence[],
  period: BillingPeriod,
  asOf: ISODate
): MilestoneCharge[] {
  const total = new Decimal(line.totalValue);

  return line.milestones.map((m) => {
    const value = round2(total.mul(new Decimal(m.percentage).div(100)));
    const ev = evidence.find((e) => e.milestoneCode === m.code) ?? null;
    const satisfiedOn = ev?.status === "Done" && ev.resolutionDate ? ev.resolutionDate.slice(0, 10) : null;

    // Not delivered yet — nothing to consider.
    if (!satisfiedOn) {
      return {
        code: m.code, name: m.name, obligationId: m.obligationId, amount: value,
        status: "NOT_SATISFIED" as const, evidence: ev, satisfiedOn: null, becomesBillableOn: null,
        trace: {
          id: `ms-${m.code}`,
          label: `${m.code} · ${m.name}`,
          detail: ev ? `${ev.key} is ${ev.status} — obligation not yet satisfied` : "No delivery evidence",
          amount: value.toFixed(2),
          sourceRef: line.clause,
        },
      };
    }

    const billableFrom = addDays(satisfiedOn, line.acceptanceWindowDays);
    const windowElapsed = asOf >= billableFrom;
    const alreadyBilled = billableFrom < period.start; // cleared in an earlier period

    if (alreadyBilled) {
      return {
        code: m.code, name: m.name, obligationId: m.obligationId, amount: value,
        status: "NOT_SATISFIED" as const, evidence: ev, satisfiedOn, becomesBillableOn: billableFrom,
        trace: {
          id: `ms-${m.code}`,
          label: `${m.code} · ${m.name}`,
          detail: `Acceptance window cleared ${billableFrom}, before this billing period — invoiced previously`,
          amount: value.toFixed(2),
          sourceRef: line.clause,
        },
      };
    }

    const daysRemaining = inclusiveDays(period.end, billableFrom) - 1;

    return {
      code: m.code,
      name: m.name,
      obligationId: m.obligationId,
      amount: value,
      status: windowElapsed ? ("BILLABLE" as const) : ("HELD" as const),
      evidence: ev,
      satisfiedOn,
      becomesBillableOn: billableFrom,
      holdReason: windowElapsed
        ? undefined
        : `Sign-off confirmed ${satisfiedOn}, logged as ${ev!.key}. Contract clause ${line.clause} requires a ${line.acceptanceWindowDays}-day acceptance window, which expires ${billableFrom} — ${daysRemaining} days after this billing period closes.`,
      trace: {
        id: `ms-${m.code}`,
        label: `${m.code} · ${m.name}`,
        detail: windowElapsed
          ? `Satisfied ${satisfiedOn}; acceptance window expired ${billableFrom} — billable`
          : `Satisfied ${satisfiedOn}; acceptance window expires ${billableFrom} — held`,
        formula: `${inr(total, false)} × ${m.percentage}%`,
        amount: value.toFixed(2),
        sourceRef: line.clause,
        children: [
          {
            id: `ms-${m.code}-ev`,
            label: "Delivery evidence",
            detail: `${ev!.key} — ${ev!.summary} · logged by ${ev!.signedOffBy}`,
            sourceRef: ev!.url,
          },
          {
            id: `ms-${m.code}-win`,
            label: "Acceptance window",
            detail: `${line.acceptanceWindowDays} days from ${satisfiedOn} → expires ${billableFrom}`,
          },
          {
            id: `ms-${m.code}-val`,
            label: "Milestone value",
            detail: `${m.percentage}% of ${inr(total)}`,
            amount: value.toFixed(2),
          },
        ],
      },
    };
  });
}
