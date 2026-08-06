# Revenue Nexus AI — Founder Demo

One contract. Three pricing models. A mid-cycle amendment priced correctly to the paisa, one milestone held with a reason, and every number traceable to the clause that authorised it.

**Recommended ₹8,60,562.56 · Held ₹12,00,000.00 · Error avoided ₹1,16,477.44**

---

## Run it

```bash
npm install
npm test     # 35 golden assertions — the gate
npm run dev  # http://localhost:3000
```

`npm test` must pass before anything else matters. It verifies the TypeScript pricing engine against an independent Python implementation (`../spikes/proration_spike.py`) to two decimal places.

## Deploy

```bash
npm i -g vercel
vercel --prod
```

No environment variables required. No database. Nothing to provision.

**Optional:** set `ANTHROPIC_API_KEY` in Vercel to enable live explanation generation. Without it the app serves pre-computed, human-reviewed answers — the demo works identically either way, which is deliberate.

---

## Why there is no database

This link has to work when someone opens it weeks after it was shared, cold, on a phone, with no warning. Every external runtime dependency is a way for that to fail silently:

| Risk | Decision |
|---|---|
| Free-tier Postgres sleeps after inactivity | Fixtures are committed JSON |
| API key expires or rate-limits | Explanations pre-computed; live generation is an enhancement |
| Cold start on an unfamiliar platform | Static prerendering — nothing to wake up |
| Two deploys drifting apart | Portal and demo are one application |

A demo that fails while someone important is looking at it is worse than no demo. Durability is a feature here.

---

## Architecture

```
app/
  page.tsx                 Screen 1 · executive portal + overview
  demo/contract/           Screen 2 · customer, contract, amendment
  demo/billing/            Screen 3 · the hero — recommendation + trace
  demo/explain/            Screen 4 · three questions answered
  demo/lineage/            Screen 5 · rupee → rule → clause → evidence
  docs/                    documentation index
  api/explain/             live AI (optional, guarded, degrades gracefully)

lib/
  engine/                  PURE FUNCTIONS — no I/O, no clock, no database
    segment.ts             period → rating segments at amendment boundaries
    subscription.ts        per-unit, prorated by segment
    usage.ts               tiered, with prorated allowance
    milestone.ts           percentage of value, acceptance window
    tax.ts                 GST — heads rounded separately
    compose.ts             orchestration + naive comparison
  rules/catalog.ts         6 rules as versioned data, constrained DSL
  rules/evaluate.ts        → decision tree with firing trace
  lineage/build.ts         trace → graph nodes and edges
  connectors/              production-shaped interfaces, fixture-backed

fixtures/                  the only data source. committed, cannot rot.
tests/engine.spec.ts       the gate
```

### The one architectural decision that matters

**Rating is a pure function.** No database reads, no clock access, no I/O anywhere beneath `computeBillingDecision()`. Same inputs produce the same output forever.

That property buys three things at once: the engine is exhaustively testable, any historical period can be replayed against the rule and catalog versions then in force, and — critically — the explanation is a *rendering* of the calculation trace rather than a reconstruction of it. Most billing systems entangle rating with persistence and are consequently untestable and unexplainable.

### Where AI is used, and where it is excluded

| AI does | AI must not |
|---|---|
| Render the calculation trace into language | Compute any monetary amount |
| Explain the held milestone from rule + evidence | Decide to block billing |
| Summarise amendment impact | Resolve authority conflicts |
| Propose contract extraction and entity matches | Confirm anything touching money |

The system prompt in `app/api/explain/route.ts` forbids arithmetic explicitly: every figure the model emits must already exist in the trace it was handed.

> **The principle:** AI proposes, deterministic code disposes, and anything touching money is deterministic.

---

## What the spike found

Sixty lines of throwaway Python, written *during* design rather than after, found five rewrite-class issues on day one:

| | Finding | Became |
|---|---|---|
| F1 | A billing period must be decomposed into rating segments at amendment boundaries. Rating period ≠ billing period. | `lib/engine/segment.ts` |
| F2 | Usage *allowances* must be prorated per segment, not just charges | `lib/engine/usage.ts` |
| F3 | Usage must be ingested at daily granularity — a monthly aggregate cannot be rated across a mid-cycle amendment | `connectors/types.ts` — granularity is part of the interface |
| F4 | "Tiered pricing" is ambiguous: bands may measure total or overage volume, differing 33% on identical contract text | `tierInterpretation` is a required field, never inferred |
| F5 | Advance billing + mid-cycle amendment needs a credit note and rebill, because issued invoices are immutable | documented; Horizon 2 |

Naive whole-period rating produces ₹9,77,040 against a correct ₹8,60,562.56 — two errors in opposite directions partially masking each other, which is why the mistake survives in production systems.

---

## Scope

This is a founder demonstration, not a product. See [`../docs/FOUNDER-DEMO-SCOPE.md`](../docs/FOUNDER-DEMO-SCOPE.md) for the full in-scope / mocked / roadmap table.

**Real:** pricing engine, rules engine, decision trace, GST, invoice preview, lineage, five screens, golden tests.
**Mocked:** all connectors (typed interfaces over committed fixtures), contract extraction, Postgres, event bus.
**Roadmap:** leakage detection, revenue recognition, write-back, multi-currency, multi-tenancy, real integrations.

All data is synthetic. **Vantara Electricals is a fictional company.**
