/**
 * Fixture loading.
 *
 * These functions are the ONLY place the engine's inputs come from.
 * In production they would sit behind the connector interfaces in
 * lib/connectors/types.ts; here they read committed JSON, because a demo
 * link that must work months from now cannot depend on a hosted database
 * that sleeps or a credential that expires.
 */
import customerJson from "../fixtures/customer.hubspot.json";
import contractJson from "../fixtures/contract.CON-2026-114.json";
import activityJson from "../fixtures/crm.activities.json";
import usageJson from "../fixtures/usage.daily.2026-07.json";
import type { Contract, MilestoneEvidence, UsageDay } from "./engine/types";

export function loadContract(): Contract {
  return contractJson as unknown as Contract;
}

export function loadUsage(): UsageDay[] {
  return usageJson.days as UsageDay[];
}

export function loadMilestones(): MilestoneEvidence[] {
  // CRM activities mapped onto the delivery-evidence shape. Any adapter that
  // can emit (obligationId, satisfiedAt, evidenceRef, actor) satisfies this.
  return (activityJson.activities as any[]).map((a) => ({
    key: a.activityId,
    summary: a.summary,
    status: a.status === "CONFIRMED" ? "Done" : a.status,
    resolutionDate: a.occurredAt,
    milestoneCode: a.milestoneCode,
    obligationId: a.obligationId,
    signedOffBy: a.loggedBy,
    url: a.url,
  })) as MilestoneEvidence[];
}

export function loadCustomer() {
  return customerJson;
}

export function loadUsageMeta() {
  return {
    source: usageJson._source,
    metric: usageJson._metric,
    granularity: usageJson._granularity,
    note: usageJson._note,
    totalCalls: usageJson._totalCalls,
  };
}
