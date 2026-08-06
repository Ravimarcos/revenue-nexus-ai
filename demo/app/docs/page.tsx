import Link from "next/link";
import { Card, Chip, Eyebrow, PageHeader } from "@/components/ui";

const REPO = "https://github.com/Ravimarcos/revenue-nexus-ai";

const SECTIONS = [
  {
    title: "Product blueprint",
    note: "Canonical product direction. The demo is a slice of this, not a replacement for it.",
    docs: [
      ["01 · Product Vision", "Vision, problem, why enterprise systems fail, positioning, personas, three horizons", "docs/01-vision.md"],
      ["02 · PRD", "Business, functional and non-functional requirements with Gherkin acceptance criteria", "docs/02-prd.md"],
      ["03 · Current State Journey", "Nine stages, five blind spots, where the time goes today", "docs/03-current-state-journey.md"],
      ["04 · Future State Journey", "The same journey rebuilt, and where AI is deliberately excluded", "docs/04-future-state-journey.md"],
    ],
  },
  {
    title: "Scope",
    note: "Governs implementation. Where it disagrees with the blueprint, this wins.",
    docs: [
      ["Founder Demo Scope Freeze", "One vertical slice, five screens, in/mock/roadmap table, build sequence", "docs/FOUNDER-DEMO-SCOPE.md"],
    ],
  },
  {
    title: "Engineering",
    note: "The arithmetic and the discipline around it.",
    docs: [
      ["Proration spike", "60 lines of throwaway Python that found five rewrite-class findings on day one", "spikes/proration_spike.py"],
      ["Spike output", "The verdict, verbatim", "spikes/spike-output.txt"],
      ["Pricing engine", "Pure functions — segmentation, subscription, tiered usage, milestone, tax", "demo/lib/engine"],
      ["Golden tests", "35 assertions verifying the TypeScript engine against the Python spike", "demo/tests/engine.spec.ts"],
      ["Rules catalog", "Six rules as versioned data, constrained DSL", "demo/lib/rules/catalog.ts"],
      ["Connector interfaces", "Production-shaped, fixture-backed", "demo/lib/connectors/types.ts"],
    ],
  },
  {
    title: "Learning track",
    note: "Written to teach the concepts, not just apply them.",
    docs: [
      ["M01 · System of Record vs System of Reference", "Enterprise data authority, why MDM failed, sync patterns, where AI must not go", "mentor/M01-system-of-record-vs-reference.md"],
    ],
  },
  {
    title: "Archive",
    note: "Superseded working documents, kept deliberately. The record of what changed our minds.",
    docs: [
      ["Market reality research", "Competitive and regulatory research with sources", "docs/archive/market-reality-research.md"],
      ["Product charter v1", "The original narrow leakage wedge", "docs/archive/product-charter-v1.md"],
      ["Platform direction v2", "The pivot to an RevOps platform", "docs/archive/platform-direction-v2.md"],
      ["Domain model working draft", "Ubiquitous language, aggregates, invariants, India model", "docs/archive/domain-model-working-draft.md"],
    ],
  },
];

export default function DocsPage() {
  return (
    <>
      <PageHeader
        step="Documentation"
        title="Behind the demo"
        lede="Fifteen design documents, one throwaway spike that found a rewrite-class flaw on day one, and a decision log with the reasoning behind every choice."
        right={
          <a href={REPO} target="_blank" rel="noreferrer" className="btn-ghost shrink-0">
            GitHub ↗
          </a>
        }
      />

      <main className="max-w-content mx-auto px-5 py-8 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <Eyebrow>{s.title}</Eyebrow>
            <p className="text-[13px] text-ink-2 mb-3">{s.note}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {s.docs.map(([title, desc, path]) => (
                <a
                  key={path}
                  href={`${REPO}/blob/main/${path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="card p-4 hover:border-ink-3 transition-colors"
                >
                  <div className="font-medium text-[14px]">{title}</div>
                  <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">{desc}</div>
                  <div className="text-[11.5px] font-mono text-ink-3 mt-2">{path}</div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <Card className="!bg-surface">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[15px] font-semibold">Decision log</div>
              <p className="text-[13px] text-ink-2 mt-1 max-w-2xl leading-relaxed">
                Twenty-five decisions, each recorded with its reasoning. Reversing one means arguing
                with the reason, not the decision.
              </p>
            </div>
            <Link href="/" className="btn-ghost">← Back to overview</Link>
          </div>
        </Card>
      </main>
    </>
  );
}
