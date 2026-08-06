# Archive — superseded working documents

These are the Phase 1 working documents. They are **kept, not deleted**, because the reasoning that produced an earlier answer is still worth having. Being able to say *"we started here, and this is exactly what changed our minds"* is worth more in a founder or interview conversation than a blueprint that pretends the first answer was the only one.

**None of these are canonical.** Where they disagree with the numbered blueprint in `docs/`, the blueprint wins.

| Document | What it was | Where its content went |
|---|---|---|
| [`market-reality-research.md`](market-reality-research.md) | Competitive and regulatory research: the Clari/Salesloft consolidation, the seam between orchestration and billing, GST e-invoicing thresholds, Ind AS 115, Indian mid-market pricing gap | **Still valid as research.** Feeds `01-vision.md` §Positioning and §Why enterprise systems fail. Sources cited there. |
| [`product-charter-v1.md`](product-charter-v1.md) | The v1 narrow revenue-leakage wedge: five detectors, one persona, precision-over-recall | Persona, success metrics, and risk register → `01-vision.md`. The five leakage detectors survive as module **M9** (v2 capability). |
| [`platform-direction-v2.md`](platform-direction-v2.md) | The v2 pivot to an Enterprise RevOps Platform: authority model, module map, MVP journey | Fully absorbed into `01-vision.md` and `02-prd.md`. The system-of-record / system-of-reference argument is taught properly in `mentor/M01`. |
| [`domain-model-working-draft.md`](domain-model-working-draft.md) | Ubiquitous language, aggregates, invariants, India-specific model (GST/TDS/Ind AS 115), graph scoping argument | Will be superseded by blueprint **doc 06 — Domain Model** in batch 2. Until then this remains the best reference for invariants and the India model. |

## Decision archaeology

The two direction changes worth remembering:

1. **v1 → v2 (6 Aug 2026):** narrow leakage detector → Enterprise RevOps Platform. Reason: the pricing/rating engine is where the genuine enterprise complexity lives, and it serves the learning objective far better than an integration-heavy detection layer.

2. **"Single Source of Truth" → split authority model (6 Aug 2026):** rejected SSOT positioning as structurally unachievable for a new entrant — the failure mode of the entire Master Data Management category. Replaced with *system of record for how revenue is calculated, system of reference for everything revenue touches.*
