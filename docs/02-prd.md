# 02 · Product Requirements Document
**Revenue Nexus AI** — MVP (Horizon 1: Explain)
Version 1.0 · 6 August 2026 · **Canonical**

Depends on: `01-vision.md` · Validated by: `spikes/proration_spike.py`

---

## 1. Business requirements

| ID | Requirement | Traces to goal |
|---|---|---|
| BR-1 | Compute the billing decision for a contract period from contract terms, delivery evidence, and metered usage — without manual configuration | G3 |
| BR-2 | Every computed amount must be explainable down to the individual rule that produced it | G1 |
| BR-3 | Support subscription, usage-based, and milestone pricing composed on a single contract | G1, G3 |
| BR-4 | Reprice correctly when a contract is amended mid-cycle | G4 |
| BR-5 | Administrators configure new products and pricing without engineering involvement | G3 |
| BR-6 | Produce a GST-correct invoice preview for the Indian market | G5 |
| BR-7 | Install with read-only credentials only | G6 |
| BR-8 | Hold billing when a rule blocks it, and state why in business language | G1, G2 |

---

## 2. Functional requirements

### 2.1 Product Catalog (M1)

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Define a Product with: name, code, pricing strategy, billing frequency, usage metric (if any), invoice trigger, renewal policy | Must |
| FR-1.2 | Support pricing strategies: `SUBSCRIPTION_PER_UNIT`, `USAGE_TIERED`, `MILESTONE`, `ONE_TIME`, `HYBRID` | Must |
| FR-1.3 | **Tier interpretation must be an explicit, required field** — `TOTAL_VOLUME` or `OVERAGE_VOLUME`. The system must never infer it. | Must |
| FR-1.4 | Catalog entries are versioned with validity windows; existing contracts continue on the version they were priced under | Must |
| FR-1.5 | Wallet and per-API strategies configurable | Should |
| FR-1.6 | No product may be defined in code. Catalog is data. | Must |

> **FR-1.3 comes directly from the spike.** Segment 1's overage of 193,548 calls prices at ₹11,612.88 under total-volume banding and ₹15,483.84 under overage-volume banding — a 33% divergence on *identical contract text*. Ordinary contract language does not distinguish these. If the catalog allows the field to be blank, we will silently pick one and be wrong for some customers forever.

### 2.2 Contract & Obligation (M4)

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | A Contract holds versioned terms with validity windows; amendments create versions and never mutate in place | Must |
| FR-2.2 | Decompose contract lines into performance obligations with satisfaction method (`POINT_IN_TIME` / `OVER_TIME`) | Must |
| FR-2.3 | Capture payment terms, place of supply, and billing entity (GSTIN-level) per line | Must |
| FR-2.4 | AI-extracted obligations enter as `PROPOSED` and cannot affect any monetary output until human-confirmed | Must |
| FR-2.5 | Amendment records effective date, changed fields, and before/after values | Must |

### 2.3 Pricing Engine (M2)

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | **Decompose every billing period into rating segments at each amendment boundary; rate each segment independently** | Must |
| FR-3.2 | Rating is a pure function — no I/O, no database access, no clock reads. Same inputs always produce the same output. | Must |
| FR-3.3 | Prorate subscription charges by segment day-fraction | Must |
| FR-3.4 | **Prorate usage allowances by segment day-fraction** | Must |
| FR-3.5 | Apply tiered pricing per the explicit interpretation from FR-1.3 | Must |
| FR-3.6 | Compose multiple strategies on one contract and produce one decision | Must |
| FR-3.7 | Emit a complete calculation trace with every amount | Must |
| FR-3.8 | Use decimal arithmetic throughout; never floating point for money | Must |
| FR-3.9 | Rounding policy pinned and documented: half-up, at line level, 2 decimal places | Must |

> **FR-3.1 and FR-3.4 are the spike's central findings.** Rating the July period as a single unit produced ₹9,77,040 against a correct ₹8,60,562.56 — a ₹1,16,477 error, 13.5%. Subscription was overstated 15.4% by applying the amended rate to days it did not cover; usage was understated because the amendment's larger 3M allowance was applied to the whole month. **Rating period ≠ billing period.** Retrofitting segmentation later is a rewrite, not a patch.

### 2.4 Usage & Delivery (M5)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | **Ingest usage at event or daily-bucket granularity. Monthly aggregates must be rejected at the connector boundary.** | Must |
| FR-4.2 | Usage ingestion is idempotent on a natural key from the source system | Must |
| FR-4.3 | Capture milestone satisfaction evidence with source link and timestamp | Must |
| FR-4.4 | Distinguish "marked done in Jira" from "contractually satisfied" — acceptance windows and sign-off are modelled separately | Must |
| FR-4.5 | Late-arriving usage flows to the next open period; never restates a closed period | Must |

> **FR-4.1 is a hard constraint discovered by the spike, not a preference.** A monthly aggregate — "2.4M calls in July" — *cannot* be correctly rated across a mid-cycle amendment, because there is no way to know how many calls fell either side of the boundary. Every usage connector we ever build must satisfy this. Discovering it in Phase 6 would have invalidated the connector architecture.

### 2.5 Rules Engine (M3)

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Rules authored in a constrained domain DSL over a fixed vocabulary of billing concepts | Must |
| FR-5.2 | The DSL is not Turing-complete: no loops, no recursion, no arbitrary function calls | Must |
| FR-5.3 | Every evaluation produces a decision tree recording each rule, its inputs, and whether it fired | Must |
| FR-5.4 | Rules can block billing with a required, human-readable reason | Must |
| FR-5.5 | Rules are versioned; a past decision is reproducible against the rule version in force at the time | Must |
| FR-5.6 | Rule conflicts detected at author time, not at runtime | Should |

### 2.6 Billing Decision & Invoice Preview (M6)

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Produce a recommendation: billable lines, held lines with reasons, totals | Must |
| FR-6.2 | Invoice preview with GST decomposition — CGST/SGST for intra-state, IGST for inter-state, by place of supply | Must |
| FR-6.3 | **Never issue an invoice or write to any external system in v1** | Must |
| FR-6.4 | Human approves or rejects a recommendation; rejection captures a structured reason | Must |
| FR-6.5 | Mid-cycle amendment on an advance-billed subscription produces a credit-note-plus-rebill recommendation, not a mutated invoice | Must |

> **FR-6.5 is spike finding F5.** July was billed in advance on 1 July under base terms. The amendment on 16 July does not entitle us to edit that invoice — issued invoices are immutable. The economically correct answer requires a credit note and a rebill. Products that "just update the invoice" fail audit.

### 2.7 AI Explanation (M7)

| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Answer "why is this amount X?" by rendering the calculation trace in business language | Must |
| FR-7.2 | Answer "why was this held?" from the blocking rule and its unmet condition | Must |
| FR-7.3 | Answer "what changed after the amendment?" with a before/after decomposition | Must |
| FR-7.4 | Every explanation cites its source records; unsourced claims are not permitted | Must |
| FR-7.5 | **The AI never computes a monetary amount.** It renders numbers the pricing engine produced. | Must |
| FR-7.6 | Contract extraction proposes obligations with confidence; a human confirms before any pricing effect | Must |

### 2.8 Knowledge Graph (M8)

| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Project domain events into a graph read model | Must |
| FR-8.2 | Traverse lineage: amount → rule → obligation → contract clause → evidence | Must |
| FR-8.3 | Entity resolution across source systems, AI-proposed and human-confirmed | Should |
| FR-8.4 | The graph is never the source of a monetary figure shown to a user | Must |

---

## 3. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | **Correctness** | Monetary calculations use decimal arithmetic. Rating is deterministic and reproducible for any historical period against the rule and catalog versions then in force. |
| NFR-2 | **Explainability** | Every amount carries a complete trace. An amount without a trace fails validation and is not displayed. |
| NFR-3 | Performance | Billing decision for a single contract period < 2s p95. Full run for 500 contracts < 5 min. |
| NFR-4 | Scale (MVP) | 500 contracts, 50M usage events/month, 20 concurrent users. Deliberately modest — this is not a scale problem at MVP. |
| NFR-5 | **Auditability** | Every decision immutably logged with inputs, versions, trace, and actor. Retained 7 years (Indian statutory). |
| NFR-6 | Security | Read-only external credentials. Encryption in transit and at rest. Field-level encryption for commercial terms. PII masked before reaching any LLM. |
| NFR-7 | Availability | 99.5% MVP. Billing is periodic, not real-time — this is deliberately not a high-availability problem. |
| NFR-8 | Data freshness | Every mirrored figure displays an "as of" timestamp. Staleness is disclosed, never hidden. |
| NFR-9 | Compliance | GST-correct tax computation. Tax rates and section codes are versioned reference data with validity windows, never constants. |
| NFR-10 | Testability | Pricing engine covered by golden fixtures including every worked example in this blueprint. |

> **NFR-9 is not theoretical.** The Income-tax Act 2025 replaced TDS sections 194C/194J/194Q with sections 392–394 effective 1 April 2026; returns filed with legacy codes are rejected. A system with `SECTION_194J = 0.10` hardcoded has been wrong since April.

---

## 4. Assumptions

| ID | Assumption | Risk if wrong |
|---|---|---|
| A-1 | Source systems expose read APIs adequate for our needs | Integration effort increases materially |
| A-2 | Usage systems can provide event or daily granularity (FR-4.1) | **Severe** — monthly-only usage makes correct mid-cycle amendment rating impossible |
| A-3 | Contracts are available as machine-readable PDFs | Extraction quality degrades; more manual entry |
| A-4 | A controller will confirm AI-proposed obligations rather than expecting full automation | Adoption friction; more human loop than planned |
| A-5 | Indian GST rules as researched are current | Compliance error; mitigated by NFR-9 versioning |
| A-6 | One customer = one primary billing entity for MVP | Multi-GSTIN allocation deferred, not solved |

**A-2 is the assumption to validate first.** It is the only one that can invalidate a core requirement rather than merely increase effort.

---

## 5. Constraints

| ID | Constraint |
|---|---|
| C-1 | No write access to any external system in v1 |
| C-2 | INR only; no multi-currency |
| C-3 | Single tenant |
| C-4 | Modular monolith plus at most 3 separate services |
| C-5 | Postgres is the transactional store; Neo4j is a derived read model only |
| C-6 | Revenue recognition (Ind AS 115) modelled but not posted to a GL |
| C-7 | Built by one person alongside other work — scope must survive that |

---

## 6. User stories and acceptance criteria

### Epic 1 — Configure a product

**US-1.1** · *As an administrator, I want to define a new product with its pricing strategy so that new offerings do not require engineering.*

```gherkin
Given I am an administrator
When I create a product with strategy USAGE_TIERED
Then I must specify a usage metric, tier bands, and a tier interpretation
And the system must reject the definition if tier interpretation is unspecified
And the product must be available for contract lines without a code deploy
```

**US-1.2** · *As an administrator, I want catalog changes versioned so that existing contracts are not silently repriced.*

```gherkin
Given a product priced at ₹1,200/user/month with active contracts
When I create a new version at ₹1,400
Then existing contracts continue rating against the version in force at their signing
And a new contract signed today rates against the new version
And both versions remain queryable for audit
```

### Epic 2 — Price a contract period

**US-2.1** · *As a finance controller, I want the system to compute the billing decision so that I stop assembling it by hand.*

```gherkin
Given contract CON-2026-114 with subscription, tiered usage, and milestone lines
And July 2026 usage of 2,400,000 API calls at daily granularity
When I request the billing decision for July 2026
Then I receive billable lines with amounts, held lines with reasons, and GST decomposition
And every amount carries a complete calculation trace
```

**US-2.2** · *As a finance controller, I want mid-cycle amendments priced correctly so that I can trust the number.*

```gherkin
Given contract CON-2026-114 with base terms of 500 users and no discount
And amendment A1 effective 16 July 2026 with 750 users and 8% discount
When the July 2026 billing decision is computed
Then the period is decomposed into two rating segments at the 16 July boundary
And subscription is ₹7,17,677.42, not ₹8,28,000
And the usage allowance is prorated per segment, producing ₹11,612.88
And the taxable subtotal is ₹7,29,290.30
And the invoice total is ₹8,60,562.56
```

> These figures are not illustrative. They are the output of `spikes/proration_spike.py` and become the engine's first golden test fixture.

**US-2.3** · *As a finance controller, I want billing held when it should not proceed, with the reason stated.*

```gherkin
Given the UAT milestone was marked Done in Jira on 14 July 2026
And the contract specifies a 30-day acceptance window
When the July billing decision is computed
Then the ₹12,00,000 milestone line is HELD
And the reason states the acceptance window has not elapsed
And the date it becomes billable is shown
```

### Epic 3 — Understand the decision

**US-3.1** · *As a finance controller, I want to ask why an amount is what it is and get an answer I can verify.*

```gherkin
Given a billing decision of ₹8,60,562.56
When I ask "why is this amount?"
Then I receive a decomposition by line, segment, and rule
And each element links to its source record
And no figure in the answer was produced by a language model
```

**US-3.2** · *As a finance controller, I want to see what an amendment changed.*

```gherkin
Given amendment A1 effective 16 July 2026
When I ask "what changed after the amendment?"
Then I see before and after terms, the segment boundary it created,
     and the rupee impact attributed to each changed field
```

**US-3.3** · *As an auditor, I want to trace any amount back to the contract clause that earned it.*

```gherkin
Given any line on a billing decision
When I request its lineage
Then I receive the path: amount → rule version → obligation → contract clause → evidence
And every node links to an immutable source record
```

### Epic 4 — Approve

**US-4.1** · *As a finance controller, I want to approve or reject a recommendation with my reason captured.*

```gherkin
Given a billing decision awaiting review
When I reject a line
Then I must supply a structured reason
And the rejection is logged against the rule that produced the line
And the reason is available as training signal for accuracy measurement
```

---

## 7. MVP scope

**In:**

- Product Catalog with 5 pricing strategies (subscription, tiered usage, milestone, one-time, hybrid)
- Contract with versioned terms and one amendment
- Pricing Engine with segmentation, proration, tier evaluation, composition
- Rules Engine with constrained DSL and decision tree
- Usage ingestion at daily granularity; milestone evidence with acceptance windows
- Billing decision with held lines, GST-correct invoice preview
- AI explanation for the four demo questions
- Knowledge graph lineage traversal
- One fully modelled customer: Orient Electric Ltd, contract CON-2026-114
- Web UI: dashboard, contract, billing review, explanation, graph
- Live deployment and public repository

**Out of scope for MVP:**

| Item | Why deferred |
|---|---|
| Multi-currency | INR-only is sufficient to prove the model |
| Multi-tenancy | Single tenant; not an architecture question at this stage |
| Write-back to any system | Trust must be earned first |
| Payment processing, dunning | Not our domain |
| GL posting | Ind AS 115 modelled, not posted |
| Leakage detection (M9) | Horizon 2 |
| Renewals, forecasting | Horizon 2 |
| Wallet pricing | Configurable in catalog, not demonstrated end to end |
| Variable consideration, contract modification accounting | Genuinely hard; Horizon 3 |
| Real Salesforce/Jira/Tally connections | Production-shaped connectors over realistic mocks |

---

## 8. Future scope

**Horizon 2 — Detect:** the five leakage detectors (delivered-not-billed, metered-not-rated, amended-not-repriced, IRN lapsed, TDS unreconciled), renewal risk, Ind AS 115 revenue schedules, multi-entity GSTIN allocation.

**Horizon 3 — Act:** earned write-back (raise invoice, file IRN, post journal entry), multi-currency and multi-region, autonomous billing for high-confidence contract classes with human exception handling, ASC 606 alongside Ind AS 115.

---

## 9. Open questions

| # | Question | Blocks | Owner |
|---|---|---|---|
| Q-1 | Can target usage systems actually provide daily granularity? (assumption A-2) | Connector architecture | Discovery |
| Q-2 | How is "contractually satisfied" distinguished from "Jira Done" in real contracts? | FR-4.4, rules design | Domain research |
| Q-3 | Where does extraction confidence live — obligation, extraction record, or both? | Review queue design | Doc 06 |
| Q-4 | Does the rules DSL need temporal operators in v1, or is segment-relative evaluation enough? | Doc 10 | Doc 10 |
| Q-5 | Rounding: line-level confirmed, but what about GST rounding on multi-line invoices? | FR-3.9, FR-6.2 | Doc 09 |

> **Q-5 already has a live instance.** Rounding CGST and SGST separately (₹65,636.13 each → ₹1,31,272.26) differs by one paisa from rounding the combined 18% (₹1,31,272.25). We use the separate-heads figure because CGST and SGST are distinct tax heads on the GST return and each is reported independently. This must be pinned in doc 09 and covered by a test — a one-paisa divergence is trivial until it appears on a reconciliation report ten thousand invoices later.
