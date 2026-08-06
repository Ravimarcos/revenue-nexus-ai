/**
 * DELIVERY EVIDENCE — why "which delivery tool do we integrate with?" is the wrong question.
 *
 * The instinct that prompted this file: with 4,000+ clients across SaaS,
 * fintech and card products, how would a delivery-tracking tool possibly
 * know when something became billable?
 *
 * It wouldn't. And building the platform around one would be a serious
 * architectural mistake, for four reasons:
 *
 *   1. Most clients have no project. Self-serve and standard clients activate
 *      without an implementation engagement. There is nothing to close.
 *   2. Different products emit completely different "delivered" signals.
 *      A card product's signal is "cards issued and KYC cleared". A wallet
 *      product's is "employees enrolled". Neither lives in a delivery tool.
 *   3. A separate delivery tool has no concept of a contractual obligation,
 *      and nobody outside delivery ever opens it. Evidence logged somewhere
 *      the account team does not work goes stale immediately.
 *   4. Hand-linking tickets to contract milestones is fine at 50 contracts and
 *      impossible at 4,000. It rots the first time someone renames a ticket.
 *
 * Where a milestone genuinely needs a human confirmation, the right place is
 * the CRM activity timeline — because the key account manager is already
 * there every day, and the confirmation sits next to the relationship it
 * belongs to.
 *
 * The right abstraction is therefore NOT a connector to one delivery tool. It
 * is a single DeliveryEvidence interface that any system can satisfy, with a
 * small set of adapters behind it. The CRM activity adapter serves the minority
 * of contracts needing a human confirmation, rather than being a load-bearing
 * dependency for all of them.
 */

export type Archetype =
  | "SUBSCRIPTION_SELF_SERVE"
  | "SUBSCRIPTION_ENTERPRISE"
  | "CARD_ISSUANCE"
  | "TRANSACTION_USAGE"
  | "IMPLEMENTATION"
  | "ONE_TIME";

export interface DeliverySource {
  archetype: Archetype;
  label: string;
  /** rough share of a 4,000-client book — illustrative, to show where volume sits */
  shareOfClients: string;
  billingTrigger: string;
  signalSource: string;
  /** the event the source emits into the platform */
  event: string;
  /** does this archetype need a human to confirm delivery? */
  needsProjectTool: boolean;
  note: string;
}

export const DELIVERY_SOURCES: DeliverySource[] = [
  {
    archetype: "SUBSCRIPTION_SELF_SERVE",
    label: "Subscription — self-serve",
    shareOfClients: "~60%",
    billingTrigger: "Activation date, then seat count each period",
    signalSource: "Product provisioning service",
    event: "SubscriptionActivated · SeatCountChanged",
    needsProjectTool: false,
    note: "No project, no milestone, no human delivery step. The product itself knows when it went live and how many seats are enrolled.",
  },
  {
    archetype: "SUBSCRIPTION_ENTERPRISE",
    label: "Subscription — enterprise",
    shareOfClients: "~15%",
    billingTrigger: "Go-live confirmation, then committed or actual seats",
    signalSource: "Provisioning service + onboarding workflow",
    event: "GoLiveConfirmed · SeatCountChanged",
    needsProjectTool: false,
    note: "Onboarding is a workflow with an owner, not necessarily a tracked project. Go-live is a state change in the product, which is more reliable than a ticket status.",
  },
  {
    archetype: "CARD_ISSUANCE",
    label: "Card issuance / fintech",
    shareOfClients: "~12%",
    billingTrigger: "Cards issued, KYC cleared, first load completed",
    signalSource: "Card management platform",
    event: "CardsIssued · KycCleared · FirstLoadCompleted",
    needsProjectTool: false,
    note: "Delivery is a regulated lifecycle event with a hard timestamp. Any manual log would only ever be a lagging, hand-typed copy of it.",
  },
  {
    archetype: "TRANSACTION_USAGE",
    label: "Transaction / usage",
    shareOfClients: "~8%",
    billingTrigger: "Volume thresholds and tier boundaries crossed",
    signalSource: "Telemetry pipeline",
    event: "UsageRecorded (daily buckets)",
    needsProjectTool: false,
    note: "Must arrive at daily granularity minimum — a monthly aggregate cannot be rated across a mid-cycle amendment.",
  },
  {
    archetype: "IMPLEMENTATION",
    label: "Implementation project",
    shareOfClients: "~4%",
    billingTrigger: "Milestone sign-off, then acceptance window elapses",
    signalSource: "CRM activity logged by the key account manager",
    event: "ObligationSatisfied",
    needsProjectTool: true,
    note: "The only archetype needing a human confirmation step. The key account manager logs it in the CRM activity timeline — no separate project tool. This is the path demonstrated in this build.",
  },
  {
    archetype: "ONE_TIME",
    label: "One-time charge",
    shareOfClients: "~1%",
    billingTrigger: "Contract execution or activation",
    signalSource: "Contract service",
    event: "ContractExecuted",
    needsProjectTool: false,
    note: "Nothing to deliver beyond the contract itself.",
  },
];

/** Roughly what share of contracts need a human delivery confirmation at all. */
export const PROJECT_TOOL_COVERAGE = {
  needsIt: "~4%",
  doesNotNeedIt: "~96%",
  conclusion:
    "Human-confirmed delivery serves a small minority of contracts. Designing the platform around it would put the rarest path on the critical path.",
};

/**
 * The interface every source satisfies. Adding a new product line means
 * writing one adapter — it does not mean touching the pricing engine, the
 * rules engine, or the billing decision.
 */
export const DELIVERY_CONTRACT = {
  event: "ObligationSatisfied",
  fields: [
    ["contractId", "which agreement"],
    ["obligationId", "which promise within it"],
    ["satisfiedAt", "when, with a real timestamp"],
    ["evidenceRef", "a link back to the source record"],
    ["actor", "who or what confirmed it"],
    ["sourceSystem", "which adapter emitted it"],
  ],
  note:
    "Contract-agnostic and product-agnostic. The rules engine decides what the event means for billing — the source never does.",
};

/**
 * Milestone templates — the other half of the scale answer.
 *
 * At 4,000 clients you cannot hand-link obligations. A product in the catalog
 * carries a standard obligation template; signing a contract instantiates it.
 * Bespoke enterprise contracts can override, but the default costs nobody
 * any effort.
 */
export const TEMPLATE_APPROACH = [
  "Product in the catalog carries a standard obligation template",
  "Executing a contract instantiates those obligations automatically",
  "Adapters emit ObligationSatisfied against the instantiated ids",
  "Bespoke contracts override the template; standard ones never need touching",
];
