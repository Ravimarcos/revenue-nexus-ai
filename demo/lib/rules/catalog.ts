/**
 * RULES AS DATA — a constrained domain DSL (D-18, FR-5.1).
 *
 * Deliberately NOT a general expression language. Rules reference a fixed
 * vocabulary of billing concepts, cannot loop or recurse, and always compile
 * to an inspectable decision tree.
 *
 * The reason is the product: explainability. Salesforce shipped Workflow
 * Rules, then Process Builder, then Flow — three generations, two
 * deprecations — because each got the generality level wrong. A
 * Turing-complete rule language means nobody can answer "why did this
 * invoice come out at this number", which is the only question we exist
 * to answer.
 */

export type RuleOutcome = "ALLOW" | "HOLD" | "TRANSFORM" | "INFORM";

export interface RuleDef {
  id: string;
  version: string;
  name: string;
  /** The rule as a business user would read it. */
  statement: string;
  /** The vocabulary term this rule reads. Constrained set — not arbitrary fields. */
  reads: string[];
  outcome: RuleOutcome;
  /** Why this rule exists, for the explanation layer. */
  rationale: string;
  sourceRef?: string;
}

export const RULES: RuleDef[] = [
  {
    id: "RULE-CONTRACT-001",
    version: "1.0",
    name: "Contract must be active",
    statement: "IF contract term covers the billing period THEN billing may proceed",
    reads: ["contract.termStart", "contract.termEnd", "period"],
    outcome: "ALLOW",
    rationale: "Billing against an expired or not-yet-started contract is unenforceable.",
    sourceRef: "Clause 1",
  },
  {
    id: "RULE-AMEND-002",
    version: "1.0",
    name: "Mid-period amendment segments the billing period",
    statement:
      "IF an amendment takes effect inside the billing period THEN decompose the period at the boundary and rate each segment independently",
    reads: ["contract.versions", "period"],
    outcome: "TRANSFORM",
    rationale:
      "Amendment A1 §4 states the amendment does not operate retrospectively. Rating the period as one unit under either set of terms produces a materially wrong result — ₹1,16,477 on this contract.",
    sourceRef: "Amendment A1 §4",
  },
  {
    id: "RULE-SUB-003",
    version: "1.0",
    name: "Subscription bills monthly in advance, prorated by segment",
    statement:
      "IF product strategy = SUBSCRIPTION_PER_UNIT THEN charge units × rate × (1 − discount) × segment day-fraction",
    reads: ["line.units", "line.ratePerUnitPerMonth", "line.discountRate", "segment.fraction"],
    outcome: "ALLOW",
    rationale: "Per-unit subscription charges accrue daily and are prorated when terms change mid-period.",
    sourceRef: "Clause 3.1",
  },
  {
    id: "RULE-USAGE-011",
    version: "1.0",
    name: "Usage allowance is prorated per segment",
    statement:
      "IF product strategy = USAGE_TIERED THEN prorate the included allowance by segment day-fraction before computing overage",
    reads: ["line.includedUnitsPerMonth", "segment.fraction", "usage.daily"],
    outcome: "TRANSFORM",
    rationale:
      "Applying the amended 3,000,000 allowance to the whole month understates usage to zero. The larger entitlement was only purchased for 16 days.",
    sourceRef: "Clause 3.4 as amended",
  },
  {
    id: "RULE-MILESTONE-007",
    version: "1.0",
    name: "Milestone requires acceptance window to elapse",
    statement:
      "IF milestone satisfied AND acceptance window has NOT elapsed THEN HOLD billing until window expires",
    reads: ["milestone.satisfiedOn", "line.acceptanceWindowDays", "asOf"],
    outcome: "HOLD",
    rationale:
      "Clause 4.2 gives the customer 30 days to raise objections. Billing inside that window risks a dispute and a credit note.",
    sourceRef: "Clause 4.2",
  },
  {
    id: "RULE-GST-002",
    version: "1.0",
    name: "Place of supply determines tax heads",
    statement:
      "IF place of supply = supplier state THEN apply CGST + SGST, each rounded separately; ELSE apply IGST",
    reads: ["contract.supplierState", "contract.placeOfSupply"],
    outcome: "TRANSFORM",
    rationale:
      "CGST and SGST are distinct heads on the GST return and each is reported independently. Rounding a combined 18% is wrong on the return.",
    sourceRef: "Clause 2.2",
  },
];

export function ruleById(id: string): RuleDef | undefined {
  return RULES.find((r) => r.id === id);
}
