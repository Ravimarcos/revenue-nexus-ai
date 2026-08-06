import Decimal from "decimal.js";

// Money is never a float. 20 significant digits, half-up rounding.
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type ISODate = string;

/* ────────────────────────────────────────────────────────────────────────────
   Contract terms — versioned, never mutated.
   An amendment produces a new version with a validity window (INV-C1).
   ──────────────────────────────────────────────────────────────────────────── */

export type Strategy = "SUBSCRIPTION_PER_UNIT" | "USAGE_TIERED" | "MILESTONE";

export interface Tier {
  upTo: number | null; // null = unbounded
  ratePerUnit: string;
}

export interface SubscriptionLine {
  lineNo: number;
  strategy: "SUBSCRIPTION_PER_UNIT";
  productCode: string;
  productName: string;
  clause: string;
  units: number;
  unitLabel: string;
  ratePerUnitPerMonth: string;
  discountRate: string;
  billingFrequency: string;
}

export interface UsageLine {
  lineNo: number;
  strategy: "USAGE_TIERED";
  productCode: string;
  productName: string;
  clause: string;
  usageMetric: string;
  includedUnitsPerMonth: number;
  /** FR-1.3 — must be explicit. The engine never infers this. */
  tierInterpretation: "TOTAL_VOLUME" | "OVERAGE_VOLUME";
  tiers: Tier[];
  billingFrequency: string;
}

export interface MilestoneDef {
  code: string;
  name: string;
  percentage: string;
  obligationId: string;
}

export interface MilestoneLine {
  lineNo: number;
  strategy: "MILESTONE";
  productCode: string;
  productName: string;
  clause: string;
  totalValue: string;
  acceptanceWindowDays: number;
  milestones: MilestoneDef[];
  billingFrequency: string;
}

export type ContractLine = SubscriptionLine | UsageLine | MilestoneLine;

export interface ContractVersion {
  versionId: string;
  label: string;
  validFrom: ISODate;
  validTo: ISODate | null;
  amendmentOf?: string;
  changes?: { line: number; field: string; from: string; to: string }[];
  source: { document: string; executedOn: ISODate };
  lines: ContractLine[];
}

/**
 * Terms that exist on the contract but do not affect the current billing
 * period. Displayed so every pricing mechanism is visible; the engine never
 * reads them, so they cannot move a number.
 */
export interface AdditionalTerms {
  renewalPolicy: {
    type: "AUTO_RENEW" | "MANUAL_RENEW" | "NONE";
    noticeDays: number;
    renewsOn: ISODate;
    termMonths: number;
    note: string;
  };
  oneTimeCharges: {
    code: string;
    name: string;
    strategy: "ONE_TIME";
    amount: string;
    clause: string;
    status: "INVOICED" | "PENDING";
    invoicedIn: string;
    note: string;
  }[];
}

export interface Contract {
  contractId: string;
  customerName: string;
  billingEntityId: string;
  placeOfSupply: { state: string; stateCode: string };
  supplierState: string;
  paymentTermsDays: number;
  versions: ContractVersion[];
  additionalTerms?: AdditionalTerms;
  tax: {
    regime: string;
    intraState: { head: string; rate: string }[];
    interState: { head: string; rate: string }[];
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   Rating segments — the central finding of the proration spike (F1).
   A billing period is decomposed at every amendment boundary and each
   segment is rated independently. Rating period != billing period.
   ──────────────────────────────────────────────────────────────────────────── */

export interface RatingSegment {
  versionId: string;
  label: string;
  start: ISODate;
  end: ISODate;
  days: number;
  /** segment days / period days, as an exact Decimal */
  fraction: Decimal;
}

export interface BillingPeriod {
  start: ISODate;
  end: ISODate;
  days: number;
  label: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   Trace — every amount carries one. An amount without a trace is a defect,
   not a result (INV-PR2 / NFR-2).
   ──────────────────────────────────────────────────────────────────────────── */

export interface TraceStep {
  id: string;
  label: string;
  detail: string;
  formula?: string;
  amount?: string;
  sourceRef?: string;
  children?: TraceStep[];
}

export interface RatedLine {
  lineNo: number;
  productCode: string;
  productName: string;
  strategy: Strategy;
  clause: string;
  amount: string;
  status: "BILLABLE" | "HELD";
  holdReason?: string;
  holdRuleId?: string;
  becomesBillableOn?: ISODate;
  trace: TraceStep;
}

export interface TaxLine {
  head: string;
  rate: string;
  amount: string;
}

export interface BillingDecision {
  contractId: string;
  customerName: string;
  period: BillingPeriod;
  segments: RatingSegment[];
  billable: RatedLine[];
  held: RatedLine[];
  taxableSubtotal: string;
  taxes: TaxLine[];
  total: string;
  heldTotal: string;
  /** what a naive whole-period rating would have produced — for comparison */
  naiveComparison: { total: string; error: string; errorPct: string };
}

export interface UsageDay {
  date: ISODate;
  weekday: string;
  calls: number;
}

/**
 * Delivery evidence, as logged in the CRM activity timeline.
 *
 * Deliberately NOT modelled on a project-tracker ticket. The key account
 * manager already works in the CRM; asking them to maintain a second system
 * that nobody else opens is how delivery evidence goes stale. A confirmed
 * activity is evidence — the contract's acceptance window decides whether it
 * is billable.
 */
export interface MilestoneEvidence {
  key: string;
  summary: string;
  status: string;
  resolutionDate: ISODate | null;
  milestoneCode: string;
  obligationId: string;
  signedOffBy: string | null;
  url: string;
}

export { Decimal };
