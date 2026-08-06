# Product Charter
**Revenue Nexus AI**
Date: 6 August 2026 · Status: **PARTIALLY SUPERSEDED** by `04-platform-direction.md`
Depends on: `01-market-reality.md`

> ### ⚠️ Read this first
>
> **Sections 1–5 are superseded.** The product direction changed on 6 Aug 2026 from a narrow revenue-leakage detector to an Enterprise Revenue Operations Platform. See [`04-platform-direction.md`](04-platform-direction.md) for current scope, positioning, and MVP.
>
> **What is still current:** §6 (success metrics — precision over recall still governs), §8 (risk register, mostly still applies), and the five leakage patterns in §2, which survive as capability **M9** in v2.
>
> This document is kept rather than deleted on purpose. The reasoning that produced the v1 wedge is still sound reasoning; it was the *scope* that changed, not the analysis. Deleting superseded decisions destroys the record of *why* you know what you know — and in an interview, being able to say "we started here, and here is exactly what made us change" is worth more than a document that pretends the first answer was the only answer.

---

## 1. What this is, in one paragraph

Revenue Nexus AI is a **read-only detection layer** that sits between the systems where revenue is *promised* (CRM, signed contracts) and the systems where revenue is *collected* (billing, ERP, banking). It continuously reconciles what was contractually earned against what was actually invoiced and collected, and surfaces every gap with a traversable chain of evidence. It is anchored in Indian revenue mechanics — GST e-invoicing deadlines, TDS reconciliation, and Ind AS 115 performance obligations — because those produce hard, dated, unambiguous correctness criteria.

It does not replace any system of record. That is the point.

---

## 2. The problem, stated precisely

Not *"data is scattered across systems."* Everyone knows that, and it has been the pitch for every failed data-unification platform for twenty years. Scattered data is a condition, not a problem.

**The actual problem:**

> Between a contract being signed and cash arriving, revenue passes through six systems and four teams. Every handoff is a place where a rupee can silently fall out. Nothing in the stack is responsible for noticing.

Sales closes the deal and moves on. Delivery tracks milestones in Jira for their own purposes, not for billing. Finance invoices what it was told about. Collections chases what was invoiced. **Nobody's job description includes "detect the thing that should have happened and didn't."** Absence of an event is nobody's alert.

That is the structural gap. A detection layer is a legitimate answer to it because *detecting absence requires a view across all six systems at once*, which no single system of record can have.

### The five leakage patterns we target

| # | Pattern | Why nothing catches it today |
|---|---|---|
| L1 | **Delivered but never billed** — milestone completed in Jira, no invoice raised | Jira and billing have no shared concept of a billable event |
| L2 | **Metered but never rated** — usage recorded in production, never reached billing | Usage pipeline and billing config drift silently |
| L3 | **Amended but never repriced** — contract amendment signed, billing config unchanged | Amendment lives in a PDF; billing config lives in a UI |
| L4 | **Invoiced but IRN-lapsed** — invoice issued, IRN not filed within the 30-day window | Compliance clock is tracked manually, if at all |
| L5 | **Paid short but actually TDS** — payment less than invoice, treated as a shortfall forever | Global billing tools do not model Indian TDS |

These five are the entire v1 scope. Not sixteen modules. Five detectors.

---

## 3. Non-goals (equally important)

We will **not** build:

- A CRM, or anything that replaces one
- A billing engine, subscription manager, or payment processor
- A general ledger or accounting system
- Sales forecasting or pipeline management
- A generic "chat with your data" copilot
- A dashboard product whose primary value is visualisation
- Write access to any system of record — **in v1 we detect and explain; we do not act**

**Why read-only in v1:** write authority requires trust we have not earned, permissions we cannot get in a pilot, and a rollback story we have not designed. Read-only also makes us installable in days rather than quarters, which is the entire go-to-market advantage. Write actions ("raise this invoice," "file this IRN") are a deliberate Phase 2 decision, gated on detection precision being demonstrably high.

---

## 4. Who this is for

We are resisting the seven-persona list from the original brief. Seven personas means no persona.

### Primary — the only one that matters for v1

**Finance Controller / Revenue Manager** at an Indian B2B company, ₹50–500 crore revenue, 200–2,000 employees.

- Owns the monthly billing run and the close
- Personally accountable when revenue is missed or a compliance deadline lapses
- Currently runs reconciliation in Excel, monthly, manually, and knows it is incomplete
- Has budget authority or direct access to it
- **Job to be done:** *"Before I close the month, show me everything that should have been billed and wasn't — and prove it, so I can act on it without re-checking three systems myself."*

The proof requirement is essential. A controller cannot act on "the AI thinks something is wrong." They need the contract clause, the delivery record, and the billing gap, side by side, with source links.

### Secondary — informs design, does not drive v1

- **CFO** — consumes the aggregate number; buys the product; does not use it daily
- **Delivery / Project Manager** — the source of L1 truth; may need a lightweight confirmation loop
- **Auditor** — an unusual but powerful advocate; the evidence chain is built for them as much as for the controller

### Explicitly out of scope for v1

Sales, Customer Success, Leadership dashboards, Operations. Every one of them is a reason to build a feature that dilutes the wedge.

---

## 5. The demo that has to work

Portfolio-first means there is one scene this entire project exists to produce. Everything that does not serve it is deferred.

> A controller opens Revenue Nexus during month-end close.
>
> **₹47,00,000 in detected leakage across 12 findings.**
>
> She clicks the largest one — ₹18,00,000.
>
> The system shows: *Contract CON-2026-114 with Orient Electric, Clause 4.2, "Phase 2 UAT sign-off triggers 30% milestone billing." Jira epic ORI-2291 marked Done on 14 July 2026. No invoice raised. 23 days elapsed. Payment terms Net 45 — this is now overdue before it was ever issued.*
>
> Below it, the evidence path — contract clause → performance obligation → delivery event → the invoice that does not exist — each node linking to its source system.
>
> She asks: **"Why wasn't this billed?"**
>
> The answer is not generated prose. It is a **traversal of the actual chain**, rendered in language: the obligation was satisfied, the trigger fired, the billing rule exists, and the handoff from delivery to finance has no automated path — this customer's milestone billing has always been raised manually, and the person who usually raises it was on leave.

That last clause matters. The difference between a demo and a product is whether the system can explain *why the gap exists*, not merely that it does. Explaining causation requires the graph. Detecting the gap only requires SQL. **This is precisely where the knowledge graph earns its place** — and, notably, nowhere else in v1.

---

## 6. Success metrics

### Product metrics (if this ever ships)

| Metric | Target | Rationale |
|---|---|---|
| Detection **precision** | > 90% | The killer failure mode is crying wolf. A controller who dismisses three false positives never opens it again. |
| Detection recall | > 60% | Deliberately secondary. Missing a finding is survivable; a false accusation about money is not. |
| Time to first finding after connect | < 24 hours | The install-in-days advantage is void if value takes a quarter. |
| Findings acted on / findings shown | > 50% | The honest measure of whether we found real money. |

**Precision over recall is the defining product decision.** It shapes the AI architecture, the confidence thresholds, and the human review loop. State it early, defend it throughout.

### Project metrics (the actual near-term goal)

- One vertical slice — L1 detection — working end to end on realistic synthetic data
- An eval suite with golden cases and adversarial cases, following the pattern already established in `zaggle-ai-suite/evals/`
- Guardrails enforced **in code, not in prompts** — the single strongest idea carried over from the Zaggle work
- A documented list of what we got wrong and why, which is worth more in an interview than a clean success story

---

## 7. MVP hypothesis

> If a finance controller at an Indian B2B company connects their CRM, project tracker, and billing system, then within 24 hours we can surface at least ₹10 lakh of genuine, previously-unknown revenue leakage with evidence they can act on the same day — **and they will act on it without asking us to prove it twice.**

Falsifiable. Testable with synthetic data first, then design partners. If we cannot make this true on data we constructed ourselves, it will never be true on real data.

---

## 8. What we are betting on, stated as risks

| Bet | If wrong |
|---|---|
| The seam is a product, not a feature Chargebee ships next quarter | We become a feature. Defence is the evidence chain + Indian compliance depth. |
| Read-only detection is enough to sell | We are dismissed as a dashboard. Mitigation: the IRN clock is a genuine action-forcing deadline. |
| Precision > 90% is achievable on messy real data | The whole product fails. This is the biggest technical risk and must be attacked first. |
| Indian mid-market pays for prevention | Revenue thesis fails. IRN/ITC loss is the most concrete rupee argument we have. |
| The graph is necessary for causation, not just relationships | We over-engineered. Mitigation: build the SQL detection first, add the graph only for explanation. |

---

## 9. Open questions for the next session

1. Which of the five detectors is the vertical slice? **My recommendation: L1 (delivered-not-billed)** — most visually compelling, easiest to construct honest synthetic data for, and it exercises the full contract → obligation → delivery → invoice chain that the architecture depends on.
2. Do we model a single fictional client company end to end (the Zaggle approach — Orient Electric worked well as a hub entity), or generic multi-tenant data? *Single company, deeply modelled, is more convincing.*
3. What is the minimum honest source-system simulation? Real HubSpot/Jira sandboxes, or well-structured mocks with production-shaped connector code?

---

## Decision record for this document

| ID | Decision | Rationale |
|---|---|---|
| D-01 | Narrow from 16 modules to 5 leakage detectors | A category list is not a product |
| D-02 | Read-only in v1; no writes to systems of record | Installable in days; trust not yet earned |
| D-03 | One primary persona (Finance Controller), not seven | Seven personas means none |
| D-04 | Precision prioritised over recall | False positives about money destroy trust irrecoverably |
| D-05 | India-anchored (GST/TDS/Ind AS 115) | Hard dated rules give unambiguous correctness criteria |
| D-06 | Graph used for causal explanation only, not as system of record | Money needs ACID; explanation needs traversal |
