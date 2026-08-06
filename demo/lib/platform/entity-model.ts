/**
 * THE ENTITY MODEL.
 *
 * Every entity that has to exist for "the contract and the invoice agree" to
 * be a checkable statement — where each one lives, who is authoritative for
 * it, and how it connects to the others.
 *
 * Structured as data rather than drawn by hand so the diagram, the reference
 * tables and any future spreadsheet export all read from one definition and
 * cannot drift apart.
 */

export type Domain =
  | "COMMERCIAL"   // who we sold to, and what was agreed
  | "CATALOG"      // what we sell and how it is priced
  | "DELIVERY"     // what we promised and whether it happened
  | "CONSUMPTION"  // what was actually used
  | "FINANCIAL"    // what was charged and collected
  | "GOVERNANCE";  // who decided, and the record of it

export type Authority = "OWNED" | "MIRRORED" | "DERIVED";

export interface EntityDef {
  id: string;
  name: string;
  domain: Domain;
  authority: Authority;
  /** one line — what this thing is, in business language */
  definition: string;
  source: string;
  keyAttributes: string[];
  /** why it exists as its own entity rather than a field on another */
  whyDistinct?: string;
}

export interface RelationshipDef {
  from: string;
  to: string;
  type: string;
  cardinality: "1:1" | "1:N" | "N:1" | "N:N";
  note: string;
}

export const DOMAINS: { id: Domain; label: string; blurb: string }[] = [
  { id: "COMMERCIAL", label: "Commercial", blurb: "who we sold to and what was agreed" },
  { id: "CATALOG", label: "Catalog", blurb: "what we sell and how it prices" },
  { id: "DELIVERY", label: "Delivery", blurb: "what we promised and whether it happened" },
  { id: "CONSUMPTION", label: "Consumption", blurb: "what was actually used" },
  { id: "FINANCIAL", label: "Financial", blurb: "what was charged and collected" },
  { id: "GOVERNANCE", label: "Governance", blurb: "who decided, and the record" },
];

export const ENTITIES: EntityDef[] = [
  /* ── COMMERCIAL ─────────────────────────────────────────────────────── */
  {
    id: "client", name: "Client", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "The organisation we have a commercial relationship with.",
    source: "CRM",
    keyAttributes: ["clientId", "legalName", "industry", "ownerKam", "lifecycleStage"],
    whyDistinct: "The relationship, not the invoicing party. One client routinely has several invoicing entities.",
  },
  {
    id: "billing-entity", name: "BillingEntity", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "A specific legal entity with one GSTIN in one state. This is who an invoice is actually raised to.",
    source: "CRM / master data",
    keyAttributes: ["entityId", "gstin", "state", "stateCode", "registeredAddress", "isPrimary"],
    whyDistinct: "Place of supply drives the tax structure. Modelling Client→Invoice directly is a rewrite later.",
  },
  {
    id: "contact", name: "Contact", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "A named person at the client — signatory, finance contact, approver.",
    source: "CRM",
    keyAttributes: ["contactId", "name", "role", "email", "isSignatory"],
  },
  {
    id: "contract", name: "Contract", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "The executed agreement. Versioned — never edited in place.",
    source: "Contract repository",
    keyAttributes: ["contractId", "executedOn", "termStart", "termEnd", "paymentTermsDays", "currency"],
  },
  {
    id: "clause", name: "Clause", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "A numbered provision within the contract. The unit an explanation cites.",
    source: "Contract document",
    keyAttributes: ["clauseRef", "text", "extractedTerms", "extractionConfidence"],
    whyDistinct: "Without clause-level granularity you cannot answer 'which clause authorised this charge'.",
  },
  {
    id: "amendment", name: "Amendment", domain: "COMMERCIAL", authority: "MIRRORED",
    definition: "A signed change to the contract, effective from a stated date, not retrospective.",
    source: "Contract repository",
    keyAttributes: ["amendmentId", "executedOn", "effectiveFrom", "changedFields", "supersedes"],
    whyDistinct: "Creates a rating segment boundary. This is the single most error-prone object in the model.",
  },
  {
    id: "renewal", name: "Renewal", domain: "COMMERCIAL", authority: "DERIVED",
    definition: "The upcoming term extension, and the notice window before it.",
    source: "Derived from contract terms",
    keyAttributes: ["renewsOn", "noticeDays", "noticeWindowOpens", "autoRenew", "reviewStatus"],
    whyDistinct: "An auto-renewal that passes unreviewed re-prices nothing — that is silent margin loss.",
  },

  /* ── CATALOG ────────────────────────────────────────────────────────── */
  {
    id: "product", name: "Product", domain: "CATALOG", authority: "OWNED",
    definition: "Something we sell. Defined by an administrator, never in code.",
    source: "Product Catalog",
    keyAttributes: ["productCode", "name", "archetype", "usageMetric", "obligationTemplate", "version"],
  },
  {
    id: "pricing-plan", name: "PricingPlan", domain: "CATALOG", authority: "OWNED",
    definition: "How a product prices: subscription, tiered usage, milestone, one-time or hybrid.",
    source: "Product Catalog",
    keyAttributes: ["planId", "strategy", "billingFrequency", "tierInterpretation", "validFrom", "validTo"],
    whyDistinct: "Versioned separately from the product so existing contracts are never silently repriced.",
  },
  {
    id: "rate-card", name: "RateCard", domain: "CATALOG", authority: "OWNED",
    definition: "The actual numbers — unit rates, tier bands, discounts, included allowances.",
    source: "Product Catalog",
    keyAttributes: ["rate", "tierBands", "includedUnits", "discountRate", "currency"],
  },
  {
    id: "rule", name: "Rule", domain: "CATALOG", authority: "OWNED",
    definition: "A versioned business rule in a constrained DSL that permits, transforms or blocks billing.",
    source: "Rules Engine",
    keyAttributes: ["ruleId", "version", "statement", "outcome", "reads", "rationale"],
  },

  /* ── DELIVERY ───────────────────────────────────────────────────────── */
  {
    id: "obligation", name: "Obligation", domain: "DELIVERY", authority: "OWNED",
    definition: "A distinct promise within the contract. The unit revenue is recognised against.",
    source: "Instantiated from product template at contract execution",
    keyAttributes: ["obligationId", "description", "satisfactionMethod", "allocatedPrice", "state"],
    whyDistinct: "The centre of the model. Invoices are outputs; obligations are where things go wrong.",
  },
  {
    id: "entitlement", name: "Entitlement", domain: "DELIVERY", authority: "OWNED",
    definition: "What the client is allowed — seats, included volume, feature access — and for what period.",
    source: "Derived from contract + catalog",
    keyAttributes: ["entitlementId", "metric", "includedUnits", "validFrom", "validTo"],
    whyDistinct: "Prorates independently of the charge. Getting this wrong is how usage overage silently disappears.",
  },
  {
    id: "activity", name: "Activity", domain: "DELIVERY", authority: "MIRRORED",
    definition: "A logged interaction or event against the account — sign-off recorded, go-live confirmed, meeting noted.",
    source: "CRM activity timeline",
    keyAttributes: ["activityId", "type", "occurredAt", "loggedBy", "linkedObligation", "note"],
    whyDistinct: "The key account manager already works here. Delivery evidence should come from where the work is recorded, not a separate tool nobody opens.",
  },
  {
    id: "satisfaction", name: "SatisfactionEvent", domain: "DELIVERY", authority: "DERIVED",
    definition: "Confirmation that an obligation was fulfilled, with a timestamp and a link to its evidence.",
    source: "Delivery Evidence service",
    keyAttributes: ["obligationId", "satisfiedAt", "evidenceRef", "actor", "sourceSystem"],
    whyDistinct: "Deliberately separate from the activity. Evidence is not the same as billing eligibility — the acceptance window decides that.",
  },

  /* ── CONSUMPTION ────────────────────────────────────────────────────── */
  {
    id: "usage", name: "UsageRecord", domain: "CONSUMPTION", authority: "MIRRORED",
    definition: "Metered consumption for one metric, bucketed daily at minimum.",
    source: "Product telemetry",
    keyAttributes: ["metric", "date", "quantity", "idempotencyKey", "sourceSystem"],
    whyDistinct: "Daily granularity is mandatory — a monthly total cannot be rated across a mid-cycle amendment.",
  },
  {
    id: "segment", name: "RatingSegment", domain: "CONSUMPTION", authority: "DERIVED",
    definition: "A slice of a billing period governed by one contract version.",
    source: "Pricing Engine",
    keyAttributes: ["versionId", "start", "end", "days", "fraction"],
    whyDistinct: "Rating period is not billing period. This entity exists because that distinction is worth ₹1,16,477 on one contract.",
  },

  /* ── FINANCIAL ──────────────────────────────────────────────────────── */
  {
    id: "decision", name: "BillingDecision", domain: "FINANCIAL", authority: "OWNED",
    definition: "The recommendation for one contract and period: what to bill, what to hold, and why.",
    source: "Billing Decision service",
    keyAttributes: ["decisionId", "period", "billableLines", "heldLines", "trace", "state"],
  },
  {
    id: "invoice", name: "Invoice", domain: "FINANCIAL", authority: "MIRRORED",
    definition: "An issued demand for payment. Immutable once issued.",
    source: "Billing system",
    keyAttributes: ["invoiceId", "issuedOn", "dueOn", "taxableValue", "taxLines", "total", "irnStatus"],
  },
  {
    id: "credit-note", name: "CreditNote", domain: "FINANCIAL", authority: "MIRRORED",
    definition: "The only lawful way to correct an issued invoice.",
    source: "Billing system",
    keyAttributes: ["creditNoteId", "againstInvoice", "amount", "reason"],
    whyDistinct: "A mid-cycle amendment on advance billing requires credit-plus-rebill. Systems that edit issued invoices fail audit.",
  },
  {
    id: "payment", name: "Payment", domain: "FINANCIAL", authority: "MIRRORED",
    definition: "Money received against one or more invoices.",
    source: "ERP / bank feed",
    keyAttributes: ["paymentId", "receivedOn", "amount", "allocations", "bankRef"],
  },
  {
    id: "tds", name: "TDSCredit", domain: "FINANCIAL", authority: "MIRRORED",
    definition: "Tax the client deducted before paying, which we must reconcile and claim.",
    source: "ERP / Form 26AS",
    keyAttributes: ["amount", "section", "state", "certificateRef", "verifiedAgainst26AS"],
    whyDistinct: "Payment less than invoice is normal here. Modelling it as a shortfall creates permanent phantom receivables.",
  },

  /* ── GOVERNANCE ─────────────────────────────────────────────────────── */
  {
    id: "approval", name: "Approval", domain: "GOVERNANCE", authority: "OWNED",
    definition: "A human accepting or rejecting a recommendation, with a structured reason.",
    source: "Portal",
    keyAttributes: ["decisionId", "actor", "action", "reasonCode", "comment", "at"],
    whyDistinct: "Rejections are the only labelled accuracy signal the system will ever receive.",
  },
  {
    id: "audit", name: "AuditRecord", domain: "GOVERNANCE", authority: "OWNED",
    definition: "An immutable record of every input, version and decision used to produce a figure.",
    source: "Portal",
    keyAttributes: ["at", "actor", "entity", "before", "after", "ruleVersions", "catalogVersion"],
  },
];

export const RELATIONSHIPS: RelationshipDef[] = [
  { from: "client", to: "billing-entity", type: "HAS_ENTITY", cardinality: "1:N", note: "One client, several GSTINs across states." },
  { from: "client", to: "contact", type: "EMPLOYS", cardinality: "1:N", note: "Signatory, finance contact, approver." },
  { from: "client", to: "contract", type: "PARTY_TO", cardinality: "1:N", note: "A client may hold several contracts." },
  { from: "contract", to: "billing-entity", type: "BILLED_TO", cardinality: "N:N", note: "One contract may bill several entities." },
  { from: "contract", to: "clause", type: "CONTAINS", cardinality: "1:N", note: "Clauses are what explanations cite." },
  { from: "contract", to: "amendment", type: "AMENDED_BY", cardinality: "1:N", note: "Each creates a new version with a validity window." },
  { from: "amendment", to: "clause", type: "SUPERSEDES", cardinality: "N:N", note: "Never retrospective." },
  { from: "contract", to: "renewal", type: "RENEWS_AS", cardinality: "1:1", note: "Notice window derived from the term." },
  { from: "contract", to: "product", type: "INCLUDES", cardinality: "N:N", note: "The line items." },
  { from: "product", to: "pricing-plan", type: "PRICED_BY", cardinality: "1:N", note: "Versioned independently of the product." },
  { from: "pricing-plan", to: "rate-card", type: "HAS_RATES", cardinality: "1:1", note: "The actual numbers." },
  { from: "clause", to: "obligation", type: "DEFINES", cardinality: "1:N", note: "AI proposes this link; a human confirms it." },
  { from: "product", to: "obligation", type: "TEMPLATES", cardinality: "1:N", note: "Instantiated at execution — never hand-linked." },
  { from: "contract", to: "entitlement", type: "GRANTS", cardinality: "1:N", note: "Seats and included volume, with validity." },
  { from: "activity", to: "satisfaction", type: "EVIDENCES", cardinality: "1:1", note: "The KAM logs it where they already work." },
  { from: "obligation", to: "satisfaction", type: "SATISFIED_BY", cardinality: "1:N", note: "Evidence, not eligibility." },
  { from: "entitlement", to: "usage", type: "LIMITS", cardinality: "1:N", note: "Prorated per segment, not per month." },
  { from: "product", to: "usage", type: "METERED_AS", cardinality: "1:N", note: "Daily buckets minimum." },
  { from: "amendment", to: "segment", type: "CREATES_BOUNDARY", cardinality: "1:N", note: "The single most consequential edge in the model." },
  { from: "rule", to: "obligation", type: "EVALUATES", cardinality: "N:N", note: "Deterministic, versioned, replayable." },
  { from: "rule", to: "decision", type: "PRODUCES", cardinality: "N:1", note: "Each firing is recorded in the trace." },
  { from: "segment", to: "decision", type: "RATED_INTO", cardinality: "N:1", note: "Each segment rated independently." },
  { from: "usage", to: "decision", type: "RATED_INTO", cardinality: "N:1", note: "Against the prorated entitlement." },
  { from: "decision", to: "invoice", type: "RECOMMENDS", cardinality: "1:1", note: "We recommend; the billing system issues." },
  { from: "invoice", to: "billing-entity", type: "ISSUED_TO", cardinality: "N:1", note: "GSTIN determines the tax heads." },
  { from: "invoice", to: "credit-note", type: "CORRECTED_BY", cardinality: "1:N", note: "The only lawful correction path." },
  { from: "invoice", to: "payment", type: "SETTLED_BY", cardinality: "N:N", note: "Partial and grouped payments are normal." },
  { from: "payment", to: "tds", type: "CARRIES", cardinality: "1:N", note: "Short payment is expected, not an exception." },
  { from: "decision", to: "approval", type: "APPROVED_BY", cardinality: "1:N", note: "Rejections carry a structured reason." },
  { from: "decision", to: "audit", type: "RECORDED_IN", cardinality: "1:N", note: "Reproducible against the versions then in force." },
];

export const MODEL_STATS = {
  entities: ENTITIES.length,
  relationships: RELATIONSHIPS.length,
  owned: ENTITIES.filter((e) => e.authority === "OWNED").length,
  mirrored: ENTITIES.filter((e) => e.authority === "MIRRORED").length,
  derived: ENTITIES.filter((e) => e.authority === "DERIVED").length,
};

export function entitiesByDomain(d: Domain) {
  return ENTITIES.filter((e) => e.domain === d);
}
