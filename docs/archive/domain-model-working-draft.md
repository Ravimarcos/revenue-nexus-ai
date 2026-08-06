# Domain Model
**Revenue Nexus AI** — Bounded contexts, ubiquitous language, aggregates
Date: 6 August 2026 · Status: Current, **except §3** (bounded contexts)
Depends on: `02-product-charter.md`, `04-platform-direction.md`

> **⚠️ §3 (bounded contexts) is superseded** by `04-platform-direction.md` §6, which adds Product Catalog, Pricing Engine, and Rules Engine as system-of-record contexts. Everything else in this document — ubiquitous language, aggregates, invariants, the India-specific model, and the graph scoping argument — remains current and applies unchanged to the v2 direction.

---

## 1. The core modelling insight

Almost every failed revenue platform makes the same mistake: it treats **Invoice** as the central entity. Invoices are outputs. Modelling around them means you can only ever answer *"what did we bill?"* — never *"what should we have billed?"*

The centre of this domain is the **Performance Obligation**: a distinct promise to transfer a good or service to a customer. It is the unit Ind AS 115 recognises revenue against, and — conveniently — it is also the unit that leakage happens to.

```
        PROMISED                    SATISFIED                   BILLED                COLLECTED
    PerformanceObligation  ──►  SatisfactionEvent  ──►  InvoiceLine  ──►  PaymentAllocation
            │                          │                     │                   │
      from Contract              from Delivery          from Billing        from Bank
                                    /Usage

    LEAKAGE = a break in this chain.  Every detector is a different break.
```

State this as the thesis and the entire architecture follows from it.

---

## 2. Ubiquitous language

Terms are defined once. Where an Indian-specific meaning differs from the global default, that is called out — these are the definitions most likely to be got wrong.

| Term | Definition | Trap |
|---|---|---|
| **Customer** | The commercial relationship. A brand or group. | ≠ the entity you invoice |
| **Billing Entity** | A specific legal entity with **one GSTIN in one state**. | One Customer routinely has 5–15 Billing Entities across states. Modelling Customer→Invoice directly is a bug. |
| **Contract** | A legally binding agreement, versioned. | Amendments create versions, never mutate |
| **Performance Obligation (PO)** | A distinct promise within a contract. The unit of revenue recognition. | ≠ contract line item. One line may contain several POs, or several lines one PO |
| **Satisfaction Event** | Evidence a PO was fulfilled — at a point in time or over time | The evidence usually lives outside finance (Jira, prod logs) |
| **Billable Event** | A satisfaction event that a contract term converts into a right to invoice | Satisfaction ≠ billable. Contract terms decide |
| **Invoice** | An issued demand for payment. **Immutable once issued.** | Corrections happen via Credit Note, never by editing |
| **IRN** | Invoice Reference Number from the GST Invoice Registration Portal | Without a valid IRN, the invoice is legally invalid and the buyer loses Input Tax Credit |
| **TDS** | Tax deducted at source by the *customer* before paying | Payment < invoice is **normal**, not a shortfall. Modelling this wrong creates permanent phantom AR |
| **Recognised Revenue** | Revenue earned per Ind AS 115 as POs are satisfied | Has almost nothing to do with invoice dates |
| **Deferred Revenue** | Consideration received or receivable for unsatisfied POs | A liability, not revenue |
| **Leakage Finding** | A detected, evidenced break in the promised→collected chain | Must carry evidence and confidence, never a bare assertion |

**Note on `Purchase Order`:** deliberately absent. POs in the AP sense (buying) belong to the Zaggle/Zoyer problem domain. This platform is the sell side. Reusing the abbreviation for both Purchase Order and Performance Obligation would be a real source of confusion — in this codebase **PO always means Performance Obligation.**

---

## 3. Bounded contexts

Nine contexts. Three are core (where we compete), the rest are supporting or generic (integrate, don't innovate).

```
┌──────────────────────────────────────────────────────────────────────┐
│                        INGESTION (generic)                           │
│      HubSpot · Jira · Tally/ERP · Contract PDFs · Usage · Bank       │
└──────────────────────────────────────────────────────────────────────┘
                ▼                                    ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│  CUSTOMER & ENTITY       │          │  CONTRACT & OBLIGATION ★     │
│  (supporting)            │◄────────►│  (CORE)                      │
│  Customer, BillingEntity │          │  Contract, PO, PricingTerm   │
│  GSTIN, entity resolution│          │  Amendment, PaymentTerm      │
└──────────────────────────┘          └──────────────────────────────┘
                                                     ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│  DELIVERY & USAGE ★      │─────────►│  RATING (supporting)         │
│  (CORE)                  │          │  RateCard, rating as a       │
│  SatisfactionEvent       │          │  pure function               │
│  UsageRecord, Milestone  │          └──────────────────────────────┘
└──────────────────────────┘                         ▼
                                      ┌──────────────────────────────┐
┌──────────────────────────┐          │  BILLING MIRROR (supporting) │
│  REVENUE RECOGNITION     │◄─────────│  Invoice, InvoiceLine,       │
│  (supporting, v2)        │          │  CreditNote, IRNStatus       │
│  Ind AS 115 schedules    │          │  READ-ONLY mirror            │
└──────────────────────────┘          └──────────────────────────────┘
                                                     ▼
┌──────────────────────────┐          ┌──────────────────────────────┐
│  LEAKAGE INTELLIGENCE ★  │◄─────────│  COLLECTIONS (supporting)    │
│  (CORE — the product)    │          │  Payment, Allocation,        │
│  Detector, Finding,      │          │  TDSCredit, Form26AS recon   │
│  EvidenceChain           │          └──────────────────────────────┘
└──────────────────────────┘
```

★ = core domain. Note that **Billing is a read-only mirror**, not an engine. That single decision is what keeps us out of a fight with Chargebee.

### Context responsibilities

| Context | Type | Owns | Explicitly does not |
|---|---|---|---|
| Ingestion | Generic | Connector protocol, sync state, idempotency, conflict logging | Interpret business meaning |
| Customer & Entity | Supporting | Customer/BillingEntity hierarchy, GSTIN registry, **entity resolution** | Contract terms |
| Contract & Obligation | **Core** | Contract versions, PO decomposition, billing triggers, amendments | Decide if a PO is satisfied |
| Delivery & Usage | **Core** | Satisfaction evidence from Jira/prod/manual, usage aggregation | Price anything |
| Rating | Supporting | (obligation + usage + terms) → amount, as a pure function | Persist money |
| Billing Mirror | Supporting | Read-only reflection of the external billing system; IRN clock | Issue invoices |
| Collections | Supporting | Payments, allocation, TDS credits, Form 26AS reconciliation | Dun customers |
| Revenue Recognition | Supporting (v2) | Ind AS 115 five-step, deferred revenue schedules | Post to a GL |
| **Leakage Intelligence** | **Core** | Detectors, findings, confidence, evidence chains, explanation | Own any primary data |

---

## 4. Aggregates and invariants

Invariants are listed because **each one becomes a code-level guardrail, not a prompt instruction.** This is the strongest pattern carried over from the Zaggle work, where `AUTO_APPROVE_LIMIT` was a Python `if` rather than a sentence in a system prompt.

### Contract (aggregate root)
Contains: ContractVersion, PerformanceObligation, PricingTerm, PaymentTerm, BillingTrigger

- **INV-C1** — A Contract is immutable once `EXECUTED`. Amendments create a new version with a validity window. Never mutate in place.
- **INV-C2** — The sum of PO allocated transaction prices must equal the contract transaction price, within rounding tolerance. *(Ind AS 115 allocation requirement — enforce it or revenue recognition is meaningless.)*
- **INV-C3** — Every PO must have exactly one satisfaction method: `POINT_IN_TIME` or `OVER_TIME`.
- **INV-C4** — A PO extracted by AI from a PDF enters state `PROPOSED` and **cannot** drive a leakage finding until a human confirms it to `CONFIRMED`. *Extraction confidence never substitutes for human confirmation on money.*

### PerformanceObligation (entity within Contract)
- **INV-P1** — Satisfaction is monotonic within a version. A satisfied PO cannot become unsatisfied; a reversal is an explicit `SatisfactionReversed` event with a reason.
- **INV-P2** — `satisfied_quantity` may never exceed `promised_quantity` without an approved amendment.

### Invoice (aggregate root — mirror only)
- **INV-I1** — Immutable once `ISSUED`. Corrections only via CreditNote.
- **INV-I2** — Every line must trace to at least one PO. **An invoice line with no obligation lineage is itself a finding** (over-billing — leakage in the customer's favour, and a dispute waiting to happen).
- **INV-I3** — If the issuing entity is IRN-liable, an invoice without a valid IRN within 30 days of issue is `COMPLIANCE_BREACHED`. The clock starts at issue date, not at detection.

### Payment (aggregate root)
- **INV-Y1** — `allocated + tds_credit + write_off + unallocated == amount_received`. Always. This single equation is what stops phantom AR.
- **INV-Y2** — A TDS credit is `UNVERIFIED` until matched against Form 26AS. Unverified credits over 90 days old are a finding.
- **INV-Y3** — Payment allocation is idempotent on the bank reference. Bank feeds redeliver constantly.

### BillingRun (process, not an entity we own)
- **INV-B1** — Idempotent on `(billing_entity, period, run_key)`. Replay must never double-bill. *Even as a read-only observer we model this, because detecting a double-billing run is itself a finding.*
- **INV-B2** — Usage events arriving after a period is `CLOSED` never restate that period. They flow to the next open period with a lineage pointer. *Restating closed periods is how billing systems lose auditor trust permanently.*

---

## 5. The India-specific model (where global tools break)

### 5.1 GSTIN and the entity hierarchy

```
Customer "Orient Electric"
   ├── BillingEntity: Orient Electric Ltd — Karnataka  — GSTIN 29AAACO...
   ├── BillingEntity: Orient Electric Ltd — Maharashtra — GSTIN 27AAACO...
   └── BillingEntity: Orient Electric Ltd — Haryana     — GSTIN 06AAACO...
```

Consequences that must be in the model from day one, not retrofitted:

- **Place of supply determines tax structure.** Supplier state == recipient state → CGST + SGST. Different states → IGST. This is not a formatting difference; it is different tax heads, different ledgers, different returns.
- A contract may be signed by the group but billed to several entities. `Contract → BillingEntity` is many-to-many.
- Entity resolution is genuinely hard: HubSpot says "Orient Electric", Jira says "OEL", the contract PDF says "Orient Electric Limited", Tally says "ORIENT ELEC LTD - BLR". **This is one of the few problems in this system that is legitimately a graph problem** (see §6).

### 5.2 TDS — modelled properly

```
Invoice total                    ₹10,00,000
Customer deducts TDS                 1,00,000   (10%, professional services)
Payment received                   ₹9,00,000

WRONG (global default):  status = PARTIALLY_PAID, outstanding ₹1,00,000  ← phantom AR forever
RIGHT:                   status = FULLY_SETTLED
                         allocated       ₹9,00,000
                         tds_credit      ₹1,00,000  (state: UNVERIFIED)
```

The TDS credit then has its own lifecycle: `UNVERIFIED → MATCHED_26AS → CLAIMED`. **Credits stuck in UNVERIFIED are real, permanent cash loss** and constitute leakage detector L5.

#### ⚠️ Live regulatory transition — model this as a version, not a constant

The **Income-tax Act, 2025 replaced the old TDS section numbering effective 1 April 2026.** Sections 392, 393 and 394 supersede the familiar 194C / 194J / 194I / 194Q codes, which are now sub-provisions within a table-driven regime under Section 393. **TDS returns filed with legacy section codes for Q1 FY 2026-27 onward are rejected by CPC.**

Rates to model (FY 2026-27):

| Nature of payment | Rate | Threshold |
|---|---|---|
| Professional services (formerly 194J) | 10% | ₹50,000 |
| Technical services, incl. call centre (formerly 194J) | 2% | ₹50,000 |
| Contractor — individual / HUF (formerly 194C) | 1% | — |
| Contractor — others (formerly 194C) | 2% | — |
| Purchase of goods (formerly 194Q) | 0.1% | ₹50,00,000, buyer turnover > ₹10 crore |

Two design consequences:

1. **TDS section codes must be a versioned reference table with validity windows, never hardcoded constants.** A system built on `SECTION_194J = 0.10` is already wrong as of four months ago.
2. **This transition is itself a detection opportunity.** Any client still mapping to legacy codes has returns being rejected right now. That is a live, dated, verifiable finding — and a good illustration of why the India anchor produces real product surface rather than local colour.

This was caught during verification of an earlier draft of this document, which cited the superseded section numbers as current. Worth recording: the failure mode was reasoning from familiar knowledge instead of checking a date-sensitive fact. The same failure mode in production code is a compliance incident.

### 5.3 Ind AS 115 five-step, mapped to our aggregates

| Ind AS 115 step | Our model |
|---|---|
| 1. Identify the contract | `Contract` aggregate, state `EXECUTED` |
| 2. Identify performance obligations | `PerformanceObligation` entities — *the AI extraction problem* |
| 3. Determine transaction price | `Contract.transaction_price`, incl. variable consideration |
| 4. Allocate price to obligations | `PO.allocated_price` — governed by **INV-C2** |
| 5. Recognise revenue as obligations are satisfied | `SatisfactionEvent` → `RevenueScheduleEntry` |

Step 2 is where the AI genuinely earns its keep, and where it is genuinely dangerous. Hence **INV-C4**: extracted obligations are `PROPOSED` until a human confirms them.

---

## 6. Where the graph belongs — and where it does not

The original brief proposed the knowledge graph as "the heart of the platform." Working the domain model through, the honest answer is narrower and, I think, more defensible.

### Postgres is the system of record. Non-negotiable.

Money requires ACID transactions, an immutable audit trail, point-in-time reconstruction, and constraint enforcement the auditor can inspect. Neo4j is not where invoices, payments, or revenue schedules live. **The graph is a derived read model, projected from domain events, and it is allowed to be eventually consistent because nothing financial depends on it.**

### Three places the graph genuinely earns its cost

**1. Entity resolution across sources.** Same real-world organisation appearing as "Orient Electric" / "OEL" / "Orient Electric Limited" / "ORIENT ELEC LTD - BLR" across four systems, with three GSTINs and overlapping contacts. Resolution via shared attributes, transitive linkage, and confidence-weighted merging is a connected-components problem. SQL does this badly; graphs do it natively.

**2. Causal chain traversal — "why wasn't this billed?"** This is the demo question, and it is a genuine variable-length path problem:

```cypher
MATCH path = (c:Contract)-[:CONTAINS]->(po:PerformanceObligation)
                         -[:SATISFIED_BY]->(s:SatisfactionEvent)
WHERE NOT (po)-[:BILLED_VIA]->(:InvoiceLine)
  AND s.occurred_at < date() - duration('P7D')
RETURN path, po, s
```

Detecting the gap is a SQL anti-join. **Explaining it — walking the chain, finding where it breaks, and finding structurally similar breaks elsewhere — is a traversal.** That distinction is the honest justification for the graph, and it should be stated exactly that way.

**3. Audit lineage.** *"Show me the path from this recognised rupee back to the contract clause that earned it."* Contract → clause → PO → satisfaction evidence → invoice line → payment allocation → revenue schedule entry. That is a lineage path query, and it is the single most credible thing this system can show an auditor.

### Where the graph does NOT belong

| Question | Right tool | Why |
|---|---|---|
| "Which contracts expire next month?" | SQL | A `WHERE` clause with a date range. Routing it through a graph adds latency and a consistency risk for nothing. |
| "Total unbilled revenue this quarter" | SQL | Aggregation. Graphs are bad at aggregation. |
| "MRR / ARR trend" | SQL + materialised view | Time series. |
| Any financial total shown to a user | SQL | Must be transactionally consistent. Eventually-consistent money is a bug. |

**Rule of thumb for this project:** if the question is *"what"* or *"how much"*, use SQL. If the question is *"why"* or *"how are these connected"*, use the graph.

---

## 7. Domain events

Events are the integration mechanism between contexts and the projection source for the graph. Everything is past tense; events are facts, not commands.

```
ContractExecuted            → project Contract + PO nodes
ContractAmended             → new version, re-derive affected POs
ObligationProposed          → AI extraction; NOT yet actionable
ObligationConfirmed         → human confirmed; now actionable
ObligationSatisfied         → the trigger for most leakage detection
SatisfactionReversed        → explicit correction with reason
UsageRecorded               → idempotent on source key
UsageAggregated             → period rollup
InvoiceObserved             → mirror event from external billing system
IRNFiled / IRNLapsed        → compliance clock
PaymentReceived             → bank feed
TDSCreditRecorded           → the Indian-specific branch
TDSCreditVerified           → matched to Form 26AS
LeakageDetected             → a finding, with confidence + evidence
LeakageResolved / Dismissed → the feedback loop that trains precision
```

`LeakageDismissed` is the most valuable event in the system. It is the only labelled negative we will ever get, and precision — the metric the charter says everything depends on — cannot be improved without it. Design the dismissal flow to capture *why*, not just *that*.

---

## 8. Deliberate simplifications for v1

Stated openly, because unstated simplifications become undiscovered bugs.

| Simplification | Deferred to |
|---|---|
| INR only, no multi-currency | v2 |
| Ind AS 115 modelled but no GL posting | v2 |
| Variable consideration and constraint estimates omitted | v2 |
| Contract modification accounting (prospective vs cumulative catch-up) omitted | v2 — genuinely hard |
| Single-tenant data model | v2 |
| Five detectors only (L1–L5) | — |

---

## 9. Open questions

1. **Should Rating exist in v1 at all?** If we only detect *"this was not billed"* rather than *"this should have been billed at ₹X"*, we can defer the entire rating context. But a finding without an amount is far less compelling in the demo. **Leaning toward: minimal rating for fixed-fee milestone obligations only** — which is sufficient for L1, and defers all usage-based rating complexity.

2. **How do we get honest satisfaction evidence from Jira?** Jira "Done" ≠ contractually satisfied. Real customers have UAT sign-off, acceptance windows, and defect thresholds. Modelling this naively is how we produce false positives and destroy the precision target. This may deserve its own design note.

3. **Where does contract extraction confidence live?** On the PO, on the extraction record, or both? Affects how the review queue is built and how INV-C4 is enforced.

---

## Decision record for this document

| ID | Decision | Rationale |
|---|---|---|
| D-07 | Performance Obligation is the central entity, not Invoice | Invoices are outputs; obligations are where leakage occurs |
| D-08 | Postgres is the system of record; graph is a derived read model | Money needs ACID; nothing financial may depend on eventual consistency |
| D-09 | Graph scoped to entity resolution, causal traversal, audit lineage | Everything else is a SQL query wearing a costume |
| D-10 | Billing is a read-only mirror, not an engine | Keeps us out of a fight with Chargebee we would lose |
| D-11 | BillingEntity (GSTIN-level), not Customer, is the invoicing party | Indian multi-state reality; retrofitting this later is a rewrite |
| D-12 | TDS modelled as a first-class settlement component | Prevents phantom AR; enables detector L5 |
| D-13 | AI-extracted obligations are PROPOSED until human-confirmed | Extraction confidence must never substitute for human confirmation on money |
| D-14 | "PO" always means Performance Obligation in this codebase | Purchase Order is the sell-side's false friend |
| D-15 | Tax rates and section codes are versioned reference data with validity windows | Income-tax Act 2025 superseded 194J/194C/194Q from 1 Apr 2026. Hardcoded rates are already wrong. |

---

## Sources for regulatory claims

- [Ind AS 115 applicable from 1 April 2018 — KPMG](https://kpmg.com/ky/en/home/insights_new/2018/04/ifrsnotes-ind-as-115-revenue-contracts-customers.html)
- [E-Invoicing Rules in India: 2026 Guidelines Explained — Tally Solutions](https://tallysolutions.com/accounting/e-invoicing-rules-in-india/)
- [₹5 Crore E-Invoice Turnover Rule in 2026 — GimBooks](https://www.gimbooks.com/blog/5-crore-e-invoice-turnover-rule-2026/)
- [194J TDS with New Updates in FY 2026-27 — CAclubindia](https://www.caclubindia.com/articles/194j-tds-with-new-updates-in-fy-202627-55177.asp)
- [TDS Rate Chart FY 2026-27: New Section Numbers, Rates and Thresholds — Tax Garden](https://taxgarden.in/blog/tds-rate-chart-2026-to-2027)
- [TDS on Professional Fees: 10% Rate & ₹50,000 Threshold — Tax Garden](https://taxgarden.in/blog/tds-on-professional-technical-fees-section-194j-393-guide-india)
