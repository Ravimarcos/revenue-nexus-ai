# Platform Direction (v2)
**Revenue Nexus AI** — Enterprise Revenue Operations Platform
Date: 6 August 2026 · Status: Current direction
Supersedes: scope sections of `02-product-charter.md` §2–§4 and `03-domain-model.md` §3

---

## 1. What changed, and why

**v1 direction:** a narrow revenue-leakage detector sitting in the seam between CRM and billing.

**v2 direction:** an Enterprise Revenue Operations Platform that connects contract, pricing, delivery, usage, and billing into one intelligence layer. **Leakage detection becomes one capability, not the product.**

**Why the change is right:** the learning and portfolio objectives are better served by the broader scope. The genuinely hard, genuinely educational engineering in this domain is the **pricing and rating engine** — it is where Zuora, Chargebee, and SAP spend most of their engineering effort, and it is the part that cannot be faked. A detection layer would have taught integration patterns. A pricing engine teaches domain modelling, rules design, temporal correctness, and explainability, all at once.

**What survives from v1 unchanged:** every architectural principle. Postgres as the transactional store, the graph scoped to traversal and lineage, performance obligations as the central entity, guardrails in code rather than prompts, precision over recall, India-anchored compliance mechanics.

---

## 2. The positioning correction

The brief asked for a **"Single Source of Truth."** We are deliberately not using that phrase, and the reasoning is important enough that it has its own teaching module (`mentor/M01`).

Short version: to be a *source of truth* you must be authoritative. To be authoritative, other systems must write to you or you must write to them. Neither is achievable for a new platform entering an enterprise. Products that promised this — the entire Master Data Management category — mostly underdelivered for precisely this structural reason.

**What we say instead:**

> Revenue Nexus is the **system of record for how revenue is calculated**, and the **system of reference for everything revenue touches**.

This is a stronger claim than "single source of truth" because it is actually true, and because it tells engineering exactly which data we may enforce invariants on.

### The authority model

```
╔═══════════════════════════════════════════════════════════════╗
║  SYSTEM OF RECORD — we are authoritative, we enforce invariants ║
╠═══════════════════════════════════════════════════════════════╣
║  Product Catalog        no system owns this coherently today   ║
║  Pricing Strategies     scattered across PDFs and spreadsheets ║
║  Business Rules         currently lives in people's heads      ║
║  Billing Decisions      our output, with full lineage          ║
║  Entity Resolution Map  which "Orient Electric" is which       ║
╚═══════════════════════════════════════════════════════════════╝
                              ▲  reads from
╔═══════════════════════════════════════════════════════════════╗
║  SYSTEM OF REFERENCE — we mirror, we never enforce, never write ║
╠═══════════════════════════════════════════════════════════════╣
║  Customers   ← CRM        Contracts ← CLM / signed PDFs        ║
║  Delivery    ← Jira       Usage     ← production telemetry     ║
║  Invoices    ← billing    Payments  ← ERP / bank               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Confirmed decision (D-16):** we own pricing authoritatively and *recommend* billing. The billing system executes. We never issue an invoice in v1.

Why this is the right fork: it lets us own the hardest and most valuable logic in the domain without inheriting payment processing, dunning, AR ledgers, or GST filing liability — and without asking a customer to migrate anything to install us.

---

## 3. The problem, restated for v2

> A SaaS company sells subscriptions, one-time products, usage-based APIs, wallets, and implementation projects — often all to the same customer, on the same contract, with customer-specific discounts and amendments layered on top. Every one of those eventually has to become an accurate invoice.
>
> Sales sees the contract. Delivery sees milestones. Engineering sees usage. Finance sees invoices. Leadership sees a revenue number nobody can decompose.
>
> **Nobody can answer "why is this invoice this amount?" without a three-day investigation across four systems.**

That last sentence is the product. Everything we build serves the ability to answer it instantly, with evidence.

---

## 4. Module map

Nine modules. The original brief listed sixteen; several were features masquerading as modules.

| # | Module | Type | v1? | Notes |
|---|---|---|---|---|
| M1 | **Product Catalog** | Core | ✅ | Admin-defined products, no hardcoding |
| M2 | **Pricing Engine** | **Core** | ✅ | The heart. Configurable strategies. |
| M3 | **Rules Engine** | **Core** | ✅ | Constrained domain DSL, always explainable |
| M4 | **Contract & Obligation** | Core | ✅ | Terms, amendments, performance obligations |
| M5 | **Usage & Delivery** | Core | ✅ | Metering, milestones, satisfaction evidence |
| M6 | **Billing Decision** | Core | ✅ | Recommendation + invoice preview, with lineage |
| M7 | **AI Explanation** | **Core** | ✅ | Why this amount, why blocked, what changed |
| M8 | **Knowledge Graph** | Supporting | ✅ | Lineage, entity resolution, causal traversal |
| M9 | **Revenue Intelligence** | Supporting | ⬜ v2 | Leakage detection, renewals, forecasting |

Notice that leakage detection is now M9, deferred. The five detectors from v1 (L1–L5) are retained as a v2 capability and remain valid — see `02-product-charter.md` §2.

Also deferred, deliberately: Notification Center, Document Management, Administration, Audit Trail, Analytics. These are cross-cutting concerns, not modules, and treating them as modules is how architecture diagrams get bloated. Audit lineage in particular is a *property of the design*, not a component.

---

## 5. The MVP journey — one contract, end to end

The MVP demonstrates a single realistic enterprise contract containing **three pricing models simultaneously**, because that composition is the actual enterprise reality and it is what proves the engine is real.

### The scenario

**Customer:** Orient Electric Ltd (carried over from the Zaggle work — a manufacturer, ₹400 crore revenue, multi-state)
**Contract:** CON-2026-114, 24 months, signed 1 April 2026

| Line | Product | Pricing model | Terms |
|---|---|---|---|
| 1 | Nexus Core Platform | **Subscription**, per user | ₹1,200/user/month, 500 users committed, billed monthly in advance |
| 2 | Nexus API Gateway | **Usage-based**, tiered | 0–1M calls ₹0.08 · 1–5M ₹0.06 · 5M+ ₹0.04. 2M calls included, overage billed monthly in arrears |
| 3 | Implementation | **Milestone billing** | ₹40,00,000 across 4 milestones: Kickoff 20% · Design sign-off 20% · UAT 30% · Go-live 30% |

Plus one **amendment** in month 4 (user count 500 → 750, 8% volume discount applied) — because amendments are where every real billing system breaks, and demonstrating correct amendment handling is worth more than any other single feature.

### The journey

```
   Customer          Orient Electric Ltd, 3 GSTINs, Karnataka primary
       ▼
   Contract          CON-2026-114 · 3 lines · 1 amendment · Net 45
       ▼
   Pricing           Subscription + Tiered Usage + Milestone, composed
       ▼
   Usage/Delivery    2.4M API calls · UAT signed off in Jira 14 Jul
       ▼
   Rules Engine      6 rules fire · 1 blocks · decision tree captured
       ▼
   Billing Decision  ₹10,05,360 recommended · 1 line held
       ▼
   Invoice Preview   line-by-line, GST-correct, IRN-ready
       ▼
   AI Explanation    "why this amount" answered from the decision tree
       ▼
   Knowledge Graph   lineage: rupee → rule → clause → evidence
```

### The July 2026 billing run, worked

This must reconcile exactly. A worked example that doesn't add up in a document about explainability is worse than no example at all.

| Line | Calculation | Amount |
|---|---:|---:|
| Subscription — 750 users × ₹1,200 × 0.92 *(8% volume discount, Amendment A1)* | | **₹8,28,000** |
| API usage — 2.4M calls, 2M included → 400K overage × ₹0.06 *(tier 2)* | | **₹24,000** |
| Implementation milestone — UAT 30% | | **HELD** |
| **Taxable subtotal** | | **₹8,52,000** |
| CGST @ 9% *(place of supply Karnataka = supplier state)* | | ₹76,680 |
| SGST @ 9% | | ₹76,680 |
| **Recommended invoice total** | | **₹10,05,360** |

**Held, not billed:** ₹12,00,000 (UAT milestone, 30% of ₹40,00,000) — blocked by `RULE-MILESTONE-007`, acceptance window not yet elapsed.

Note the shape of this: **the held amount is larger than the billed amount.** That is deliberate and realistic — it makes question 2 below the most commercially interesting one on the screen, and it demonstrates that a blocking rule with a good reason is a feature, not a failure.

**The demo question set** — these are what the whole system exists to answer:

1. *"Why is this invoice ₹10,05,360?"* → decomposition down to individual rule firings
2. *"Why was the implementation milestone not billed?"* → the blocking rule, and the evidence it was waiting on
3. *"What changed after the amendment?"* → before/after with the repricing lineage
4. *"Which contract clause triggered this line?"* → graph traversal back to the source clause

Question 3 is the hardest and the most impressive. Amendment impact analysis is where commercial products are weakest.

---

## 6. Revised bounded contexts

This supersedes `03-domain-model.md` §3. Three contexts are added; the rest carry over unchanged.

```
┌────────────────────────────────────────────────────────────────────┐
│  INGESTION (generic) — CRM · Jira · billing · usage · contracts    │
└────────────────────────────────────────────────────────────────────┘
              ▼                                    ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│ CUSTOMER & ENTITY        │        │ CONTRACT & OBLIGATION ★      │
│ (reference)              │◄──────►│ (core)                       │
└──────────────────────────┘        └──────────────────────────────┘
              ▼                                    ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│ PRODUCT CATALOG ★ NEW    │───────►│ PRICING ENGINE ★ NEW         │
│ (SYSTEM OF RECORD)       │        │ (SYSTEM OF RECORD)           │
│ Product, PricingStrategy │        │ RateCard, strategies,        │
│ BillingFrequency,        │        │ composition, proration       │
│ UsageMetric, Triggers    │        │ Pure functions, no I/O       │
└──────────────────────────┘        └──────────────────────────────┘
                                                   ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│ USAGE & DELIVERY ★       │───────►│ RULES ENGINE ★ NEW           │
│ (core)                   │        │ (SYSTEM OF RECORD)           │
│ UsageRecord, Milestone   │        │ Constrained DSL, decision    │
│ SatisfactionEvent        │        │ tree, full firing trace      │
└──────────────────────────┘        └──────────────────────────────┘
                                                   ▼
┌──────────────────────────┐        ┌──────────────────────────────┐
│ KNOWLEDGE GRAPH          │◄───────│ BILLING DECISION ★           │
│ (derived read model)     │        │ (SYSTEM OF RECORD)           │
│ lineage · resolution     │        │ Recommendation, preview,     │
│ causal traversal         │        │ hold reasons, lineage        │
└──────────────────────────┘        └──────────────────────────────┘
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │ BILLING MIRROR (reference)   │
                                    │ read-only · never writes     │
                                    └──────────────────────────────┘
```

### Two invariants that make the Pricing Engine testable

- **INV-PR1** — Rating is a **pure function**: `(contract terms, catalog version, usage, calendar) → amount`. No database reads, no clock access, no I/O. Same inputs always produce the same output, forever.
- **INV-PR2** — Every computed amount carries a **complete rule firing trace**. An amount without a trace is a defect, not a result.

INV-PR1 is the single most important engineering decision in the platform. A pure rating function can be exhaustively unit-tested, replayed against historical periods, and — critically — *explained*, because the explanation is just a rendering of the trace. Most billing systems entangle rating with persistence and are consequently untestable and unexplainable. We will not.

---

## 7. Deliverables

Per updated direction, the final result must be shareable with a founder:

| Deliverable | Status |
|---|---|
| Live deployed application | ⬜ Phase 5 |
| GitHub repository | ⬜ Phase 3 |
| Product documentation | 🔄 In progress |
| Architecture diagrams | ⬜ Phase 2 |
| Mentor learning track | 🔄 In progress |

---

## 8. Decision record

| ID | Decision | Rationale |
|---|---|---|
| D-16 | System of record for pricing; recommends billing, never issues | Owns the hardest logic without inheriting payments, dunning, or GST filing liability |
| D-17 | Reject "Single Source of Truth" positioning | Structurally unachievable for a new entrant; the MDM category's failure mode |
| D-18 | Rules Engine is a constrained domain DSL, not a general expression language | Explainability is the product; a Turing-complete rule language destroys it |
| D-19 | MVP contract composes subscription + tiered usage + milestone | Composition is the enterprise reality and the only honest proof the engine works |
| D-20 | Amendment handling is in MVP scope, not deferred | It is where every real billing system breaks; strongest differentiation per unit of effort |
| D-21 | Rating is a pure function (INV-PR1) | Makes the engine testable, replayable, and explainable |
| D-22 | Leakage detection deferred to M9 / v2 | Reframed as one capability of the platform, per updated direction |
| D-23 | Notifications, documents, admin, audit are cross-cutting concerns, not modules | Prevents architecture-diagram bloat; audit lineage is a property of the design |
