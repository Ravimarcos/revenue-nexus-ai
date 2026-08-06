/**
 * CONNECTOR INTERFACES — production-shaped, fixture-backed.
 *
 * These exist to show the extension seam, not because the demo needs them.
 * In production each would wrap a real API with OAuth, incremental sync,
 * idempotent ingestion, and a reconciliation loop. Here there is exactly one
 * implementation (fixtures.ts) and it reads committed JSON.
 *
 * The shape is the point. Note what every method returns: data plus a
 * `syncedAt`. Mirrored data is always stale by some amount, and we disclose
 * that rather than hiding it (NFR-8). A system of reference that pretends to
 * be live is how you lose credibility the first time you disagree with the
 * source.
 */
import type { Contract, MilestoneEvidence, UsageDay } from "../engine/types";

export interface Mirrored<T> {
  data: T;
  syncedAt: string;
  source: string;
  /** We never enforce our invariants on mirrored data — we flag and move on. */
  anomalies?: string[];
}

export interface CrmConnector {
  readonly system: string;
  fetchCustomer(customerId: string): Promise<Mirrored<CustomerRecord>>;
}

export interface CustomerRecord {
  id: string;
  name: string;
  billingEntities: { id: string; gstin: string; state: string; primary: boolean }[];
}

export interface ContractConnector {
  readonly system: string;
  fetchContract(contractId: string): Promise<Mirrored<Contract>>;
}

export interface ActivityConnector {
  readonly system: string;
  /**
   * Delivery evidence from wherever the account is actually managed —
   * typically the CRM activity timeline. NOT billing eligibility; the
   * contract's acceptance window decides that.
   */
  fetchMilestoneEvidence(accountId: string): Promise<Mirrored<MilestoneEvidence[]>>;
}

export interface UsageConnector {
  readonly system: string;
  /**
   * Daily granularity minimum (FR-4.1). A connector that can only supply
   * monthly aggregates cannot support mid-cycle amendment rating and must
   * be rejected at integration time, not discovered at billing time.
   */
  readonly granularity: "EVENT" | "DAILY";
  fetchUsage(metric: string, from: string, to: string): Promise<Mirrored<UsageDay[]>>;
}

export interface ConnectorRegistry {
  crm: CrmConnector;
  contracts: ContractConnector;
  activities: ActivityConnector;
  usage: UsageConnector;
}
