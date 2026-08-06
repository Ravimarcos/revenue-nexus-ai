# Revenue Nexus AI

**An Enterprise Revenue Operations Platform.**

> System of record for **how revenue is calculated**. System of reference for **everything revenue touches**.

Connects contract, pricing, delivery, usage, and billing into one intelligence layer — so that *"why is this invoice this amount?"* has an instant, evidenced answer instead of a three-day investigation across four systems.

**Phase:** Demo built · S1–S7 complete · ready to deploy
**Last updated:** 6 August 2026

---

## ⚡ Start here

| | |
|---|---|
| [**`demo/`**](demo/README.md) | **The working application.** `npm test && npm run dev`. Five screens, real arithmetic, 35 golden tests passing. |
| [Founder Demo — Scope Freeze](docs/FOUNDER-DEMO-SCOPE.md) | Governs implementation. One vertical slice, five screens, a 10-minute story. |
| [Product Vision](docs/01-vision.md) · [PRD](docs/02-prd.md) | The broader product direction. The demo is a slice of this, not a replacement for it. |

The distinction matters: the blueprint describes **the product**; the scope freeze describes **the demonstration**. Keeping both, clearly separated, shows a founder you scoped down deliberately rather than because you couldn't do more.

### Build status

```
  ✓  35/35 golden tests — TypeScript engine matches the Python spike to the paisa
  ✓  Production build clean — 6 routes, 5 statically prerendered, 96 kB first load
  ✓  All routes 200, every canonical figure renders from computation, none hardcoded
  ✓  No database, no required env vars, nothing that can expire

     Recommended  ₹8,60,562.56
     Held         ₹12,00,000.00   UAT milestone · billable 13 Aug 2026
     Error avoided ₹1,16,477.44   13.5% — what naive whole-period rating gets wrong
```

**To go live:** `cd demo && vercel --prod`

---

## Blueprint

Fifteen documents, produced in four batches. Batch 1 complete.

### Batch 1 — Product definition ✅

| # | Document | Settles |
|---|---|---|
| 01 | [Product Vision](docs/01-vision.md) | Vision, mission, problem, pain points, why enterprise systems fail, positioning, personas, goals, metrics, non-goals, three horizons |
| 02 | [PRD](docs/02-prd.md) | Business / functional / non-functional requirements, assumptions, constraints, user stories with Gherkin acceptance criteria, MVP and future scope |
| 03 | [Current State Journey](docs/03-current-state-journey.md) | How revenue ops works today — nine stages, five blind spots, where the time goes |
| 04 | [Future State Journey](docs/04-future-state-journey.md) | The same journey rebuilt, and exactly where AI is used vs deliberately excluded |

### Batch 2 — Architecture & model ⬜

05 Product Architecture · 06 Domain Model · 07 Knowledge Graph Design

### Batch 3 — The core engines ⬜

08 Product Catalog · 09 Pricing Engine · 10 Rules Engine · 11 AI Design

### Batch 4 — Build-facing design ⬜

12 Database Design · 13 API Design · 14 UI/UX · 15 Deployment Architecture

---

## Visuals

| Visual | Covers |
|---|---|
| [Current vs Future Journey](visuals/journey-current-vs-future.html) | Side-by-side nine-stage comparison, before/after metrics, the AI boundary |

Working diagrams are Mermaid inside the documents (render natively on GitHub). Hero visuals are standalone HTML for sharing.

---

## Mentor learning track

| # | Module | Concepts |
|---|---|---|
| [M01](mentor/M01-system-of-record-vs-reference.md) | **System of Record vs System of Reference** | Enterprise data authority · why MDM failed · CDC & sync patterns · entity resolution · where AI must not go |
| M02 | Pricing Engine *(next)* | Rating as a pure function · segmentation · tiered composition · proration · Stripe/Zuora/Chargebee models |
| M03 | Rules Engine | Constrained DSL vs expression languages · decision trees · explainability |
| M04 | Event-Driven Architecture | Why an event bus · Kafka concepts · eventual consistency |
| M05 | Knowledge Graphs | Property graphs · Cypher · projection from events · when NOT to use a graph |
| M06 | AI Agents & LangGraph | Orchestration · tool use · guardrails in code · evals |
| M07 | Modular Monolith → Services | Bounded contexts in-process · extraction seams · when to split |
| M08 | Enterprise Integration | Connectors · webhooks vs polling · idempotency · OAuth |

Each module: plain-language explanation → analogy → how it appears in our product → the technical concept → how real companies implement it → PM lens → engineering lens → AI lens → a 2–3 minute interview answer → learning notes.

---

## Spikes

Disposable code written **during** design to validate a model before it reaches the diagrams.

| Spike | Question | Verdict |
|---|---|---|
| [`proration_spike.py`](spikes/proration_spike.py) | Can a billing period with a mid-cycle amendment be rated as one unit? | **No.** Five findings, all now hard requirements. |

**Findings that became requirements:**

| ID | Finding | Requirement |
|---|---|---|
| F1 | A billing period must be decomposed into rating segments at each amendment boundary. Rating period ≠ billing period. | FR-3.1 |
| F2 | Usage allowances must be prorated per segment | FR-3.4 |
| F3 | Usage must be ingested at daily granularity minimum — monthly aggregates cannot be rated across a mid-cycle amendment | FR-4.1 |
| F4 | "Tiered pricing" is ambiguous: bands may measure total volume or overage volume, differing 33% on identical contract text | FR-1.3 |
| F5 | Advance billing + mid-cycle amendment requires credit note + rebill, because issued invoices are immutable | FR-6.5 |

Naive whole-period rating produced **₹9,77,040** against a correct **₹8,60,562.56** — a **₹1,16,477 error (13.5%)** on one contract for one month. Finding this on day one cost sixty lines of throwaway Python. Finding it in Phase 6 would have invalidated the connector architecture.

---

## The product in one table

| | |
|---|---|
| **We own (system of record)** | Product Catalog · Pricing Strategies · Business Rules · Billing Decisions · Entity Resolution |
| **We mirror (system of reference)** | Customers · Contracts · Delivery · Usage · Invoices · Payments |
| **We never build** | CRM · billing engine · payment processing · general ledger · forecasting |
| **v1 write access** | None. We compute the billing decision; the billing system executes it. |

### Modules

| # | Module | v1 |
|---|---|---|
| M1 | Product Catalog | ✅ |
| M2 | **Pricing Engine** | ✅ |
| M3 | **Rules Engine** | ✅ |
| M4 | Contract & Obligation | ✅ |
| M5 | Usage & Delivery | ✅ |
| M6 | Billing Decision | ✅ |
| M7 | AI Explanation | ✅ |
| M8 | Knowledge Graph | ✅ |
| M9 | Revenue Intelligence (incl. leakage detection) | ⬜ Horizon 2 |

---

## The MVP scenario

**Orient Electric Ltd · CON-2026-114 · July 2026** — one contract composing three pricing models, with a mid-cycle amendment.

| Line | Model | Terms |
|---|---|---|
| 1 | Subscription, per user | ₹1,200/user/month · 500 users → **750 from 16 Jul** (8% discount) |
| 2 | Usage, tiered | 0–1M ₹0.08 · 1–5M ₹0.06 · 5M+ ₹0.04 · allowance 2M → **3M from 16 Jul** |
| 3 | Milestone | ₹40,00,000 over 4 milestones · UAT = 30% |

**The July decision** *(every figure from the spike)*:

```
  Subscription — 2 rating segments        ₹7,17,677.42
  API usage — 2 rating segments             ₹11,612.88
  Taxable subtotal                        ₹7,29,290.30
  CGST 9% + SGST 9%                       ₹1,31,272.26
  ──────────────────────────────────────────────────────
  RECOMMENDED                             ₹8,60,562.56
  HELD  UAT milestone, billable 13 Aug   ₹12,00,000.00
```

**The four questions the system exists to answer:**

1. Why is this invoice ₹8,60,562.56?
2. Why was the ₹12,00,000 milestone not billed?
3. What changed after the amendment?
4. Which contract clause triggered this line?

---

## Decision log

| ID | Decision | Rationale |
|---|---|---|
| D-00a | Modular monolith + 2–3 separate services | 15 services built solo shows reading about microservices, not running them |
| D-00b | No fixed document list; docs written when a phase needs them | Volume is not depth |
| D-00c | Portfolio → learning → commercial, in priority order | Drives one deep vertical slice over broad shallow coverage |
| D-03 | One primary persona: Finance Controller | Seven personas means none |
| D-04 | Accuracy prioritised over coverage | A system usually right about money must be checked anyway, so has no value |
| D-05 | India-anchored (GST / TDS / Ind AS 115) | Hard dated rules give unambiguous correctness criteria |
| D-07 | Performance Obligation is the central entity, not Invoice | Invoices are outputs; obligations are where the logic lives |
| D-08 | Postgres is system of record; graph is a derived read model | Nothing financial may depend on eventual consistency |
| D-09 | Graph scoped to entity resolution, causal traversal, audit lineage | Everything else is a SQL query wearing a costume |
| D-10 | Billing is a read-only mirror, not an engine | Keeps us out of a fight with Chargebee we would lose |
| D-11 | BillingEntity (GSTIN-level) is the invoicing party, not Customer | Indian multi-state reality; retrofitting later is a rewrite |
| D-12 | TDS is a first-class settlement component | Prevents phantom AR |
| D-13 | AI-extracted obligations are PROPOSED until human-confirmed | Extraction confidence never substitutes for human confirmation on money |
| D-14 | "PO" always means Performance Obligation | Purchase Order is the sell-side's false friend |
| D-15 | Tax rates and section codes are versioned reference data | Income-tax Act 2025 superseded 194J/194C/194Q from 1 Apr 2026 |
| D-16 | System of record for pricing; recommends billing, never issues | Owns the hardest logic without inheriting payments, dunning, or filing liability |
| D-17 | Reject "Single Source of Truth" positioning | Structurally unachievable for a new entrant; MDM's failure mode |
| D-18 | Rules Engine is a constrained domain DSL | Explainability is the product; Turing-complete rules destroy it |
| D-19 | MVP contract composes subscription + tiered usage + milestone | Composition is the enterprise reality |
| D-20 | Amendment handling is in MVP scope | Where every real billing system breaks |
| D-21 | Rating is a pure function (INV-PR1) | Makes the engine testable, replayable, explainable |
| D-22 | Leakage detection deferred to Horizon 2 | One capability, not the product |
| D-23 | Notifications, documents, admin, audit are cross-cutting concerns | Prevents diagram bloat; audit lineage is a property of the design |
| D-24 | Amendment A1 made **mid-cycle** (16 Jul) rather than at period boundary | The boundary case is trivial; the mid-cycle case is where the engine proves itself |
| D-25 | Spike written during design, not after | Found a rewrite-class flaw on day one for sixty lines of throwaway code |

---

## Build sequence (post-approval)

Seven stages, front-loaded on correctness. Full detail in the [scope freeze](docs/FOUNDER-DEMO-SCOPE.md) §6.

| # | Stage | Gate |
|---|---|---|
| S1 | Fixtures & contract document | Data reads as real, not placeholder |
| S2 | **Pricing engine port + golden tests** | **Matches spike to the paisa** |
| S3 | Rules engine + decision tree | UAT milestone holds with correct clearing date |
| S4 | Recommendation assembly + lineage | Every node traces to a source |
| S5 | Screens 2 & 3 (contract, billing hero) | Hero tells the story without narration |
| S6 | Screens 4 & 5 + AI explanations | Three questions answered from the trace |
| S7 | Portal, docs index, deploy | Link works cold on a phone |

S2 is the largest stage and nobody sees it. That is correct — if the arithmetic is wrong, everything downstream is decoration.

## Final deliverables

| Deliverable | Status |
|---|---|
| Live deployed application (one URL) | ⬜ Pending approval |
| GitHub repository | ⬜ |
| Product documentation | 🔄 4/15 blueprint + scope freeze |
| Architecture diagrams | 🔄 1 hero + Mermaid throughout |
| Mentor learning track | 🔄 M01 complete |

---

## Repository layout

```
docs/              the 15 blueprint documents (canonical)
docs/archive/      superseded working docs, with forwarding pointers
mentor/            the learning track
spikes/            disposable validation code
visuals/           standalone HTML hero diagrams
```

[`docs/archive/`](docs/archive/README.md) keeps the superseded v1 documents rather than deleting them. The reasoning that produced an earlier answer is still worth having — and *"we started here, and this is what changed our minds"* is a better story than a blueprint pretending the first answer was the only one.

---

## Principles carried over from `zaggle-ai-suite`

1. **Guardrails in code, not prompts.** `AUTO_APPROVE_LIMIT` as a Python `if` cannot be talked around. A sentence in a system prompt can.
2. **Evals as a first-class artifact.** Golden cases and rubric dimensions, not vibes.
3. **Synthetic data that breaks specific rules deliberately.** Each of the eight Zoyer invoice scenarios existed to violate one rule.

Done differently: the Zaggle work positioned the knowledge graph as the moat. Here the graph is scoped narrowly and the *reasoning for the narrowing is written down* (D-08, D-09) so it can be argued with.
