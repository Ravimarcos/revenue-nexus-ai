/**
 * Service catalog — what each module owns, and what data it needs from where.
 *
 * A note on the word "microservices": these are bounded contexts, enforced
 * in-process in this build. The seams are real and documented, so any of them
 * can be extracted when there is an organisational or scaling reason. Building
 * them as fifteen deployed services on day one would be theatre.
 */

export type Authority = "OWNED" | "MIRRORED" | "DERIVED";

export interface ServiceDef {
  id: string;
  name: string;
  authority: Authority;
  owns: string;
  /** what it consumes, from where, how often */
  consumes: { what: string; from: string; cadence: string }[];
  emits: string[];
  extractFirst?: boolean;
  note: string;
}

export const SERVICES: ServiceDef[] = [
  {
    id: "catalog",
    name: "Product Catalog",
    authority: "OWNED",
    owns: "Products, pricing strategies, tier definitions, obligation templates, versioning",
    consumes: [{ what: "Product definitions", from: "Admin UI", cadence: "on change" }],
    emits: ["ProductVersionPublished"],
    note: "No product is ever defined in code. Adding a pricing model is a data change, not a deploy.",
  },
  {
    id: "customer",
    name: "Client & Entity",
    authority: "MIRRORED",
    owns: "Entity resolution map — which records across systems are the same organisation",
    consumes: [
      { what: "Client, contacts, opportunity", from: "CRM", cadence: "webhook + nightly reconcile" },
      { what: "Legal entity, GSTIN, state", from: "CRM / master data", cadence: "nightly" },
    ],
    emits: ["ClientMirrored", "EntityResolutionProposed"],
    note: "One client commonly has several GSTINs across states. The invoicing party is the BillingEntity, not the Client.",
  },
  {
    id: "contract",
    name: "Contract & Obligation",
    authority: "MIRRORED",
    owns: "Obligation instances, amendment versions, validity windows",
    consumes: [
      { what: "Executed contract documents", from: "Contract repository / CLM", cadence: "on execution" },
      { what: "Extracted terms", from: "AI extraction, human-confirmed", cadence: "on ingest" },
      { what: "Obligation templates", from: "Product Catalog", cadence: "on instantiation" },
    ],
    emits: ["ContractExecuted", "ContractAmended", "ObligationProposed", "ObligationConfirmed"],
    note: "Amendments create versions with validity windows. Nothing is ever mutated in place.",
  },
  {
    id: "delivery",
    name: "Delivery Evidence",
    authority: "MIRRORED",
    owns: "Satisfaction events and their provenance",
    consumes: [
      { what: "Activation / go-live", from: "Product provisioning", cadence: "event" },
      { what: "Cards issued, KYC cleared", from: "Card platform", cadence: "event" },
      { what: "Milestone confirmation", from: "CRM activity timeline", cadence: "event" },
    ],
    emits: ["ObligationSatisfied", "SatisfactionReversed"],
    extractFirst: true,
    note: "One interface, several adapters. ~96% of contracts need no human delivery step at all — see the integration section.",
  },
  {
    id: "usage",
    name: "Usage Metering",
    authority: "MIRRORED",
    owns: "Daily usage buckets, idempotent ingestion state",
    consumes: [
      { what: "Transaction and event volumes", from: "Telemetry pipeline", cadence: "hourly, bucketed daily" },
    ],
    emits: ["UsageRecorded", "UsageThresholdCrossed"],
    extractFirst: true,
    note: "Daily granularity is enforced at the boundary. A connector that can only supply monthly totals is rejected at integration time, not discovered at billing time.",
  },
  {
    id: "pricing",
    name: "Pricing Engine",
    authority: "OWNED",
    owns: "Rating — segmentation, proration, tier evaluation, composition, tax",
    consumes: [
      { what: "Contract terms and versions", from: "Contract service", cadence: "per run" },
      { what: "Daily usage", from: "Usage service", cadence: "per run" },
      { what: "Catalog version", from: "Product Catalog", cadence: "per run" },
    ],
    emits: ["PriceComputed"],
    note: "A pure function. No I/O, no clock, no database beneath it — which is what makes it testable, replayable and explainable.",
  },
  {
    id: "rules",
    name: "Rules Engine",
    authority: "OWNED",
    owns: "Business rules as versioned data, decision trees, hold reasons",
    consumes: [
      { what: "Computed amounts and their traces", from: "Pricing Engine", cadence: "per run" },
      { what: "Satisfaction events", from: "Delivery Evidence", cadence: "per run" },
    ],
    emits: ["RuleFired", "BillingHeld"],
    note: "A constrained domain DSL, not a general expression language. Explainability is the product; Turing-complete rules destroy it.",
  },
  {
    id: "decision",
    name: "Billing Decision",
    authority: "OWNED",
    owns: "Recommendations, held lines, invoice previews, approval state",
    consumes: [
      { what: "Rated lines and rule firings", from: "Pricing + Rules", cadence: "per run" },
      { what: "Existing invoices", from: "Billing system mirror", cadence: "daily" },
    ],
    emits: ["RecommendationIssued", "RecommendationApproved", "RecommendationRejected"],
    note: "We compute the decision. The billing system executes it. We never issue an invoice.",
  },
  {
    id: "billing-mirror",
    name: "Billing & Payments Mirror",
    authority: "MIRRORED",
    owns: "Nothing — read-only reflection",
    consumes: [
      { what: "Issued invoices, credit notes", from: "Billing system", cadence: "daily" },
      { what: "Receipts, TDS deductions", from: "ERP / bank feed", cadence: "daily" },
    ],
    emits: ["InvoiceObserved", "PaymentReceived", "TDSCreditRecorded"],
    note: "Mirrored data is never rejected for violating our invariants. It is recorded, flagged, and left to its owner to fix.",
  },
  {
    id: "ai",
    name: "AI Explanation",
    authority: "DERIVED",
    owns: "Nothing authoritative",
    consumes: [
      { what: "Calculation trace and decision tree", from: "Pricing + Rules", cadence: "on request" },
    ],
    emits: ["ExplanationGenerated"],
    extractFirst: true,
    note: "Renders a completed computation into language. Forbidden from arithmetic — every figure it states must already exist in the trace.",
  },
  {
    id: "graph",
    name: "Lineage Graph",
    authority: "DERIVED",
    owns: "Nothing — a read model projected from events",
    consumes: [{ what: "All domain events", from: "Event bus", cadence: "streaming" }],
    emits: [],
    note: "Allowed to be eventually consistent because nothing financial depends on it. A figure shown to a user never comes from here.",
  },
];

export const EXTRACTION_NOTE =
  "Marked services are the first candidates for extraction into separate deployments — they have the most distinct scaling profiles and the cleanest interfaces. Everything else stays in-process until there is a reason.";
