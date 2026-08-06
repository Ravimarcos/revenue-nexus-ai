# Market Reality Assessment
**Revenue Nexus AI — Phase 1 Discovery**
Date: 6 August 2026 · Status: Draft for challenge

> This document exists to kill the idea if it deserves to be killed. It is written adversarially on purpose. If the wedge survives this document, it is worth building.

---

## 1. The uncomfortable starting position

The original brief proposed competing with Salesforce (CRM), NetSuite/Tally (ERP), Zuora/Chargebee (billing), and Clari (revenue intelligence) simultaneously. That is four fights, all of which we lose, against companies with more data, more integrations, and more auditor trust.

So the first job of discovery is not "how do we build it." It is **"what is the one thing nobody currently owns?"**

The research produced a genuinely encouraging answer.

---

## 2. The market has split into two halves — and nobody owns the seam

### The pre-signature half — "Revenue Orchestration"

Gartner published its **first-ever Magic Quadrant for Revenue Action Orchestration in December 2025**, formally recognising the convergence of sales engagement, conversation intelligence, and revenue intelligence into one category. Clari was named a Leader.

Clari has consolidated aggressively: Wingman (conversation intelligence, 2022), Groove (sales engagement, 2023), and a **merger with Salesloft that closed in December 2025**, producing a combined entity at roughly **$450M ARR**.

**What this half owns:** pipeline, forecast, deal inspection, seller activity. Everything up to the moment the contract is signed.

**Where it stops:** the signature. Clari can tell you a deal will close. It cannot tell you whether the thing you sold was ever delivered, metered, or invoiced.

### The post-invoice half — "Subscription Billing"

Chargebee, Zuora, Maxio, Recurly, Paddle, Stripe Billing, and — in India — Zoho Billing. Mature, well-funded, deeply integrated with payment rails.

**What this half owns:** once an invoice exists, these platforms are excellent. Recurring schedules, proration, dunning, payment retry, revenue schedules.

**Where it stops:** they assume the billable event is already known and correctly represented in the system. Their model starts at *"here is a subscription."*

### The seam

```
  CONTRACT SIGNED  ─────────── ??? ─────────── INVOICE EXISTS
       ▲                                              ▲
   Clari's                                       Chargebee's
   territory ends here                        territory starts here
```

Everything in the middle — *was it provisioned, was the milestone met, was usage metered, did the amendment reach billing, did anyone notice the contract auto-renewed* — is currently handled by a finance analyst with a spreadsheet and a recurring calendar reminder.

**That seam is the product.** Not another billing engine. A detection layer that reads across the systems either side of the seam and says: *this rupee was earned and never invoiced, and here is the chain of evidence.*

---

## 3. Is the problem real, or is "revenue leakage" just consulting language?

Partly the latter — the phrase is heavily used in EY/Deloitte marketing and should make us suspicious. But the underlying number is consistently reported: **billing errors and leakage typically cost 1–5% of total revenue.** The commonly cited framing is a $10M ARR company losing up to $500,000 annually.

The named causes are consistent across sources and are notably *not* billing-engine problems:

| Reported cause | Whose product should have caught it? | Reality |
|---|---|---|
| Unbilled usage | Usage metering | Usage never reached billing |
| Missed renewals | CRM or billing | Neither owns the renewal calendar |
| Incorrect discounts | Contract → billing handoff | Contract PDF says one thing, billing config says another |
| Unrecovered failed payments | Billing | Actually handled well by incumbents |
| Contract terms never entered into billing | Nobody | **This is the seam** |

Four of five root causes live in the seam, not in the billing engine. That is the strongest signal in this research.

**Honest caveat:** the 1–5% figure comes from vendors selling leakage solutions. Treat it as directional, not as a citable benchmark. Before any commercial claim, this needs primary validation — five CFO interviews, not a blog post.

---

## 4. Why India specifically, and why now

Anchoring in the Indian market is not flag-waving. It produces three hard, dated, automatable constraints that global incumbents handle badly. Hard deadlines are the best possible foundation for a detection product, because *correct* and *incorrect* are unambiguous.

### 4.1 GST e-invoicing — a live 30-day clock

- E-invoicing is mandatory for GST-registered businesses with aggregate annual turnover **above ₹5 crore**, a threshold in force since **1 August 2023 and still ₹5 crore as of 2026**.
- The threshold is **sticky**: if turnover crossed ₹5 crore even once since FY 2017–18, the obligation persists even if turnover later falls.
- For businesses with AATO of **₹10 crore and above, there is a hard 30-day window** to report an invoice to the Invoice Registration Portal from its issue date.
- **An invoice without a valid IRN and QR code is legally invalid** — meaning the *buyer cannot claim Input Tax Credit*.

Read that last point commercially. A missed IRN is not a filing inconvenience. It means your customer silently loses their tax credit, discovers it at reconciliation, and either disputes the invoice or quietly downgrades your vendor relationship. **This is revenue leakage with a 30-day countdown attached to it**, and it is trivially detectable by a system watching the clock.

### 4.2 TDS — the leakage source no global platform models properly

In Indian B2B, the **customer deducts tax at source before paying**. Invoice ₹10,00,000 → payment received ₹9,00,000 → the missing ₹1,00,000 is a TDS credit, not a shortfall.

Global billing platforms model this poorly or not at all. The consequences are exactly the leakage patterns finance teams complain about:

- Invoices sit permanently in "partially paid," polluting AR ageing and forecasts
- Collections teams chase customers for money that was never owed
- **TDS credits are never reconciled against Form 26AS and are simply never claimed** — real, permanent cash loss

This is specific, unglamorous, verifiable, and unsexy enough that nobody has built for it. That combination is exactly what a wedge looks like.

### 4.3 Ind AS 115 — real revenue recognition, not invoice counting

**Ind AS 115 (Revenue from Contracts with Customers) has been effective for accounting periods beginning on or after 1 April 2018**, replacing Ind AS 11 and Ind AS 18. It requires identifying performance obligations, allocating transaction price, and recognising revenue as obligations are satisfied.

The implication that matters: **revenue ≠ invoice.** A platform that only tracks invoices cannot answer the question a CFO actually has. Building the performance-obligation model properly is both the hardest and the most credible part of this project.

### 4.4 The pricing gap in the Indian mid-market

Chargebee lists from roughly **$249/month**; Zoho Billing from roughly **$20/month**. That is an order-of-magnitude gap with very little between the two on capability for a company doing ₹50–500 crore in revenue with genuinely complex contracts.

This mirrors a pattern already documented in the reference material in this repo: *too complex for Tally, too small for SAP.* The pattern held for accounts payable. The research suggests it holds for revenue too.

---

## 5. Where we are honestly NOT differentiated

Writing this section is the point of the document.

| Capability | Verdict |
|---|---|
| Subscription billing engine | **Do not build.** Chargebee and Zoho have won. Integrate. |
| Payment processing and dunning | **Do not build.** Solved, regulated, capital-intensive. |
| CRM | **Do not build.** Obviously. |
| Forecasting and pipeline | **Do not build.** Clari + Salesloft at $450M ARR is not a fight. |
| General-purpose analytics dashboards | **Do not build.** Commodity. Every vendor has one. |
| "AI copilot that answers questions about your data" | **Weak.** Every incumbent shipped this in 2024–25. Not a differentiator in 2026. |
| Contract PDF extraction | **Weak alone.** Table stakes; commoditised by frontier models. Valuable only as *input* to detection. |
| **Cross-system leakage detection with an evidence chain** | **This is the wedge.** |
| **Indian compliance-clock enforcement (IRN 30-day, TDS reconciliation)** | **Genuinely unoccupied.** |
| **Ind AS 115 obligation modelling for mid-market** | **Hard, credible, defensible.** |

---

## 6. The three questions that could still kill this

Discovery is not finished until these are answered with evidence, not reasoning.

1. **Is the seam a product or a feature?** Chargebee could ship "unbilled usage alerts" in a quarter. The defence has to be the *evidence chain* and the *Indian compliance depth* — a shallow alert is easy to copy; a traversable audit path from a rupee back to the contract clause that earned it is not. **This defence is currently an assertion. It needs testing.**

2. **Will a CFO trust a system that only reads?** A detection layer with no write authority may be dismissed as "another dashboard telling me things are wrong." The counter is that read-only is exactly what makes it *installable* — no migration, no rip-and-replace. Needs validation.

3. **Is the Indian mid-market willing to pay for prevention?** Indian mid-market buyers are famously price-sensitive and prefer to pay for cost *reduction* over risk *avoidance*. The IRN angle helps here because a lost ITC is a concrete rupee number a customer will complain about — but this is an assumption, not a finding.

---

## 7. Conclusion

The original brief's product does not survive contact with the market. The narrowed version does.

**Kill:** the unified CRM/ERP/billing/analytics platform.
**Keep:** the detection layer that lives in the seam between signature and invoice, anchored in Indian compliance mechanics that global incumbents model badly.

Positioning line to test:

> *Your ERP will tell you what you invoiced. It will never tell you what you should have invoiced and didn't. We watch the gap.*

---

## Sources

- [Revenue Leakage in SaaS: Causes, Examples, and How to Prevent It — LedgerUp](https://www.ledgerup.ai/resources/revenue-leakage-saas)
- [Revenue Leakage in SaaS: You're Losing 1-5% of Revenue — LedgerUp](https://www.ledgerup.ai/revenue-leakage)
- [What is Revenue Leakage? How it Happens & Prevention — Vayu](https://www.withvayu.com/knowledge-center/revenue-leakage)
- [Revenue Orchestration Platform — Clari](https://www.clari.com/products/revenue-orchestration-platform/)
- [Best Revenue Intelligence Platforms in 2026: Clari, Gong, Tellius + 7 More Compared — Tellius](https://www.tellius.com/resources/blog/best-revenue-intelligence-platforms-in-2026-clari-gong-tellius-7-more-compared)
- [Clari Review 2026: Features, Pricing and Honest Verdict — LeadHaste](https://leadhaste.com/blog/clari-review-2026)
- [E-Invoicing Rules in India: 2026 Guidelines Explained — Tally Solutions](https://tallysolutions.com/accounting/e-invoicing-rules-in-india/)
- [₹5 Crore E-Invoice Turnover Rule in 2026: GST Limit Explained — GimBooks](https://www.gimbooks.com/blog/5-crore-e-invoice-turnover-rule-2026/)
- [E-Invoice Under GST: Limit & Applicability 2026 Guide — Skydo](https://www.skydo.com/blog/e-invoicing-under-gst)
- [Ind AS 115 applicable from 1 April 2018 — KPMG](https://kpmg.com/ky/en/home/insights_new/2018/04/ifrsnotes-ind-as-115-revenue-contracts-customers.html)
- [Ind AS 115 — Revenue From Contracts With Customers — ClearTax](https://cleartax.in/s/ind-as-115-revenue-from-contracts-with-customers)
- [Chargebee vs Zoho Billing comparison — SoftwareSuggest](https://www.softwaresuggest.com/compare/chargebee-vs-zoho-billing)
- [Best billing automation software for B2B SaaS in 2026 — LedgerUp](https://www.ledgerup.ai/resources/best-b2b-saas-billing-automation-platforms-for-2026-a-complete-guide)
