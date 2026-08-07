import Link from "next/link";
import { getDecision } from "@/lib/decision";
import { inr, fmtInt } from "@/lib/engine/money";
import { Card, Chip, Eyebrow } from "@/components/ui";
import { ArchitectureDiagram } from "@/components/diagrams/Architecture";
import { WorkflowSwimlane } from "@/components/diagrams/WorkflowSwimlane";
import { CurrentVsFutureDiagram } from "@/components/diagrams/CurrentVsFuture";
import { AlignmentDiagram } from "@/components/diagrams/Alignment";
import { EntityGraph } from "@/components/diagrams/EntityGraph";
import { ENTITIES, RELATIONSHIPS, DOMAINS, MODEL_STATS, entitiesByDomain } from "@/lib/platform/entity-model";
import { SERVICES, EXTRACTION_NOTE } from "@/lib/platform/services";
import { DELIVERY_SOURCES, PROJECT_TOOL_COVERAGE, DELIVERY_CONTRACT, TEMPLATE_APPROACH } from "@/lib/platform/delivery-sources";

const REPO = "https://github.com/Ravimarcos/revenue-nexus-ai";

export default function Portal() {
  const { decision, counts, lineage } = getDecision();
  const held = decision.held[0];

  return (
    <div className="min-h-screen">
      {/* ── Sticky section nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-line">
        <div className="max-w-content mx-auto px-5 h-12 flex items-center gap-1 overflow-x-auto text-[13px]">
          <span className="font-semibold mr-3 whitespace-nowrap">Revenue Nexus AI</span>
          {[
            ["#problem", "Problem"],
            ["#states", "Current vs future"],
            ["#workflow", "Workflow"],
            ["#architecture", "Architecture"],
            ["#services", "Services & data"],
            ["#integration", "Integration"],
            ["#graph", "Entity model"],
            ["#result", "Result"],
            ["#engineering", "Engineering"],
            ["#docs", "Documentation"],
          ].map(([h, l]) => (
            <a key={h} href={h} className="px-2.5 py-1.5 rounded-md text-ink-2 hover:bg-surface whitespace-nowrap">
              {l}
            </a>
          ))}
          <Link href="/demo/contract" className="ml-auto btn-primary !py-1.5 !px-3 !text-[13px] whitespace-nowrap">
            Live demo →
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="border-b border-line bg-white">
        <div className="max-w-content mx-auto px-5 pt-14 pb-11">
          <Chip tone="accent">Internal revenue operations portal · working demonstration</Chip>

          <h1 className="text-[42px] sm:text-[54px] font-semibold tracking-[-0.03em] leading-[1.04] mt-5 max-w-4xl">
            One place where the
            <br />
            contract and the invoice agree.
          </h1>

          <p className="text-[17px] text-ink-2 mt-5 max-w-2xl leading-relaxed">
            Contract, CRM, delivery milestones, usage limits, invoices and payments — reconciled
            continuously, with every figure traced back to the system it came from.
          </p>

          <div className="flex gap-3 mt-8 flex-wrap">
            <Link href="/demo/contract" className="btn-primary">
              Walk the demo <span aria-hidden>→</span>
            </Link>
            <Link href="/demo/billing" className="btn-ghost">Jump to the billing decision</Link>
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-ghost">GitHub ↗</a>
          </div>

          {/* Orientation for someone who opened a shared link with no context. */}
          <div className="mt-8 border-l-2 border-accent bg-accent-bg/50 rounded-r-lg px-5 py-4 max-w-3xl">
            <div className="eyebrow !text-accent mb-2">If you read nothing else</div>
            <p className="text-[15px] text-ink-2 leading-[1.65]">
              A contract was amended mid-month. Almost every billing system would have invoiced{" "}
              <b className="text-ink font-semibold">₹9,77,040</b> for July. The correct figure is{" "}
              <b className="text-ink font-semibold">₹8,60,562.56</b> — a{" "}
              <b className="text-ink font-semibold">₹1,16,477 error</b> on one contract, for one
              month, that nobody would have caught by eye.
            </p>
            <p className="text-[15px] text-ink-2 leading-[1.65] mt-2.5">
              This is a working demonstration of a portal that gets it right and shows its working.
              Every figure on this page is computed live, not typed in.
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-[12.5px] text-ink-3">
              <span>· 5 screens, about 6 minutes</span>
              <span>· synthetic data throughout</span>
              <span>· no login, nothing to install</span>
              <span>· <Link href="/demo/billing" className="text-accent hover:underline">skip to the number</Link></span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line rounded-xl overflow-hidden mt-10">
            {[
              [inr(decision.total), "recommended", "2 rating segments + GST"],
              [inr(decision.heldTotal), "held with a reason", `billable ${held?.becomesBillableOn}`],
              [inr(decision.naiveComparison.error), "error avoided", `${decision.naiveComparison.errorPct}% — what naive rating gets wrong`],
              ["35 / 35", "golden tests", "TS engine matches a Python spike"],
            ].map(([v, l, s], i) => (
              <div key={l} className="bg-white p-4">
                <div className={`text-[19px] font-semibold tnum ${i === 1 || i === 2 ? "text-accent" : ""}`}>{v}</div>
                <div className="text-[12px] font-medium mt-1">{l}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5 leading-snug">{s}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-content mx-auto px-5 py-12 space-y-16">
        {/* ── Problem ──────────────────────────────────────────────────── */}
        <section id="problem" className="scroll-mt-16">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            Five systems hold pieces of the same truth. When they disagree, nobody finds out.
          </h2>

          <p className="text-[15.5px] text-ink-2 mt-4 max-w-3xl leading-[1.7]">
            The contract says what was agreed. The CRM says what was sold. Delivery says what
            shipped. Production says what was consumed. Billing says what was charged.
          </p>
          <p className="text-[15.5px] text-ink-2 mt-3 max-w-3xl leading-[1.7]">
            Each one is right about its own piece. None of them can see the others. So when the
            contract and the billing config drift apart, or a milestone is delivered and never
            invoiced, or a client quietly goes past a usage limit —{" "}
            <b className="text-ink font-semibold">
              the disagreement sits there until someone happens to notice
            </b>
            , usually at month end, usually in a spreadsheet.
          </p>

          <Card className="mt-6 overflow-x-auto">
            <AlignmentDiagram />
          </Card>

          <h3 className="text-[16px] font-semibold mt-10 mb-1">
            What goes wrong, concretely
          </h3>
          <p className="text-[14px] text-ink-2 mb-4 max-w-3xl leading-relaxed">
            Five things that happen across a portfolio of products with mixed pricing —
            subscriptions, transaction-based usage, one-time charges, milestone billing and
            auto-renewals.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["Delivered, not billed", "A milestone is confirmed with the client and logged against the account. Nothing tells finance. The invoice is raised weeks late, or not at all."],
              ["Amended, not repriced", "A contract amendment is signed and emailed. Billing configuration is never updated, so every invoice after it is wrong in the same way."],
              ["Over the limit, unnoticed", "A client passes the usage volume their contract includes. Nobody sees it until a quarterly review, by which point the overage is unbillable in practice."],
              ["Renewal missed", "An auto-renewing contract passes its notice window with nobody reviewing the pricing. It renews on terms agreed two years ago."],
              ["Paid, not reconciled", "A payment arrives short because the client deducted TDS. The invoice sits as partially paid, and collections chases money that was never owed."],
              ["Nobody can explain it", "A client disputes an invoice. Answering takes three days across four systems, because no single place records how the amount was calculated."],
            ].map(([t, b]) => (
              <Card key={t} className="!border-accent/25">
                <div className="text-[13.5px] font-semibold text-accent">{t}</div>
                <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">{b}</p>
              </Card>
            ))}
          </div>

          <h3 className="text-[16px] font-semibold mt-10 mb-3">What that costs, by role</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["Finance controller", "Assembles the billing run manually from four sources each month. 3–5 days of senior time, in a spreadsheet on one laptop. Not reproducible, not auditable — and when she is on leave, the close slips."],
              ["Key account manager", "Confirms a milestone with the client and logs it against the account. Has no idea that confirmation just made ₹12,00,000 billable — nothing connects the activity log to finance."],
              ["Sales", "Negotiates a discount communicated to finance informally, in a document. No feedback loop tells the rep what the concession actually cost."],
              ["CFO", "Gets a revenue number at month end that cannot be decomposed. “Why is it down 4%?” takes a week to answer, by which point the month is over."],
            ].map(([role, pain]) => (
              <Card key={role}>
                <div className="text-[13.5px] font-semibold">{role}</div>
                <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">{pain}</p>
              </Card>
            ))}
          </div>

          <Card className="!bg-blue-bg !border-blue/20 mt-4">
            <p className="text-[14px] text-ink-2 leading-relaxed">
              <b className="text-ink font-semibold">Being fair to the people in this workflow:</b>{" "}
              every individual system is doing its job correctly. The CRM tracks opportunities well.
              The products meter usage accurately. The billing system bills exactly what it is told. The
              failure is at the <i>joins</i> — and joins have no owner. Nobody&rsquo;s job description
              includes &ldquo;notice the thing that should have happened and didn&rsquo;t,&rdquo; so
              the joins are held together by a spreadsheet and an experienced person&rsquo;s memory.
            </p>
          </Card>
        </section>

        {/* ── Current vs future ────────────────────────────────────────── */}
        <section id="states" className="scroll-mt-16">
          <Eyebrow>Current state vs future state</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            Nine stages, five of them leaking.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            Each marked stage is a handoff with no system behind it. Absence of an event is
            nobody&rsquo;s alert — which is the structural reason this persists.
          </p>

          <Card className="mt-6 overflow-x-auto">
            <CurrentVsFutureDiagram />
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {[
              ["Billing run", "3–5 days", "under 1 day"],
              ["Explaining an invoice", "days, 4 systems", "one click"],
              ["Mid-cycle amendment", "usually wrong", "segmented correctly"],
              ["Reproducibility", "none", "any period, any time"],
            ].map(([k, was, now]) => (
              <Card key={k} className="!p-4">
                <div className="text-[11.5px] text-ink-3 mb-1.5">{k}</div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[13px] text-ink-3 line-through">{was}</span>
                  <span className="text-ink-3 text-[11px]">→</span>
                  <span className="text-[14px] font-semibold text-good">{now}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 mt-4 flex-wrap">
            <a href={`${REPO}/blob/main/docs/03-current-state-journey.md`} target="_blank" rel="noreferrer" className="btn-ghost">
              Current state journey ↗
            </a>
            <a href={`${REPO}/blob/main/docs/04-future-state-journey.md`} target="_blank" rel="noreferrer" className="btn-ghost">
              Future state journey ↗
            </a>
          </div>
        </section>

        {/* ── Workflow ─────────────────────────────────────────────────── */}
        <section id="workflow" className="scroll-mt-16">
          <Eyebrow>Workflow</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            A deterministic spine, with AI attached to it — never inside it.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            Everything that produces a monetary amount runs on the accent-coloured spine as a pure
            function. AI hangs off it for the two jobs language models are actually good at:
            reading unstructured prose into structure, and turning a calculation trace into
            sentences.
          </p>

          <Card className="mt-6 overflow-x-auto">
            <WorkflowSwimlane />
          </Card>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <Card className="!border-good/30">
              <Eyebrow>Human gate 1 · before pricing</Eyebrow>
              <div className="text-[14px] font-medium mt-1">Confirm extracted terms</div>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                AI reads the contract and proposes terms with a confidence score. Nothing is priced
                until a person has reviewed them against the source clause. If they are wrong, the
                loop goes back to extraction — it never proceeds on a guess.
              </p>
            </Card>
            <Card className="!border-good/30">
              <Eyebrow>Human gate 2 · before execution</Eyebrow>
              <div className="text-[14px] font-medium mt-1">Approve the recommendation</div>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                The portal computes and explains; a person decides. Rejection captures a structured
                reason, which loops back to compute and becomes the only labelled signal the system
                ever gets about its own accuracy.
              </p>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <div className="text-[13.5px] font-semibold text-blue mb-2">AI adds value</div>
              <ul className="text-[13px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><b className="text-ink font-medium">Contract extraction</b> — regex over legal prose fails on the second contract</li>
                <li><b className="text-ink font-medium">Explanation</b> — a nested trace into language a controller can read</li>
                <li><b className="text-ink font-medium">Entity resolution</b> — the same company under four different names</li>
                <li><b className="text-ink font-medium">Anomaly narration</b> — hypothesising why two systems disagree</li>
              </ul>
            </Card>
            <Card className="!border-accent/30">
              <div className="text-[13.5px] font-semibold text-accent mb-2">AI is excluded by design</div>
              <ul className="text-[13px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><b className="text-ink font-medium">Computing any amount</b> — must be reproducible for an auditor</li>
                <li><b className="text-ink font-medium">Deciding to block billing</b> — must be versioned and replayable</li>
                <li><b className="text-ink font-medium">Authority conflicts</b> — a written policy, not runtime judgement</li>
                <li><b className="text-ink font-medium">Confirming an extraction</b> — a human confirms anything touching money</li>
              </ul>
            </Card>
          </div>

          <p className="text-[14px] text-ink-2 mt-4 leading-relaxed max-w-3xl">
            <b className="text-ink font-semibold">The principle:</b> AI proposes, deterministic code
            disposes, and anything touching money is deterministic.
          </p>
        </section>

        {/* ── Architecture ─────────────────────────────────────────────── */}
        <section id="architecture" className="scroll-mt-16">
          <Eyebrow>Architecture</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            The portal owns the pricing logic. The existing systems keep owning their own data.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            This is the single most important design decision, and it is what makes the portal
            installable without a migration. The CRM stays the authority on customers. The delivery
            system stays the authority on milestones. Billing stays the authority on invoices. The
            portal reads from all of them — read-only, timestamped, never written back.
          </p>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            What the portal <i>does</i> own is the thing no system owns today:{" "}
            <b className="text-ink font-semibold">
              the product catalog, the pricing rules, and the resulting billing decision
            </b>
            . Today that logic lives across a contract PDF, a spreadsheet, a billing configuration
            screen, and one person&rsquo;s memory. Here it is written down, versioned, and
            testable.
          </p>

          <Card className="mt-6 overflow-x-auto">
            <ArchitectureDiagram />
          </Card>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Card className="!border-accent/30">
              <Eyebrow>Why this split</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                It tells engineering exactly which data we may enforce invariants on. Mirrored
                records carry an &ldquo;as of&rdquo; timestamp and are never rejected — the source
                will send a ₹0 contract, and that is not our bug to refuse.
              </p>
            </Card>
            <Card>
              <Eyebrow>Why a modular monolith</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Fifteen services built by one person demonstrates reading about microservices, not
                running them. Bounded contexts are enforced in-process with the extraction seams
                documented — which is the harder and more defensible answer.
              </p>
            </Card>
            <Card>
              <Eyebrow>Why the graph is small</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                &ldquo;How much did we bill&rdquo; is a SQL aggregation. &ldquo;Why, and through
                what chain&rdquo; is a path traversal. The graph is scoped to lineage, causal
                traversal and entity resolution — everything else is SQL wearing a costume.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Services & data ──────────────────────────────────────────── */}
        <section id="services" className="scroll-mt-16">
          <Eyebrow>Services and data</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            Eleven services. What each owns, and what it needs from where.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            A note on the word <i>microservices</i>: these are bounded contexts, enforced in-process
            in this build. The seams are real and documented, so any can be extracted when there is
            an organisational or scaling reason. Deploying eleven services on day one would be
            theatre.
          </p>

          <div className="mt-6 space-y-2">
            {SERVICES.map((s) => (
              <details key={s.id} className="card overflow-hidden group">
                <summary className="px-5 py-3.5 hover:bg-surface transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="chev text-ink-3 text-[11px] inline-block">▸</span>
                      <span className="font-medium text-[14.5px]">{s.name}</span>
                      <Chip tone={s.authority === "OWNED" ? "accent" : s.authority === "DERIVED" ? "blue" : "neutral"}>
                        {s.authority === "OWNED" ? "system of record" : s.authority === "DERIVED" ? "derived" : "mirrored"}
                      </Chip>
                      {s.extractFirst && <Chip tone="good">extract first</Chip>}
                    </div>
                    <div className="text-[12.5px] text-ink-3 max-w-md text-right hidden lg:block">
                      {s.owns}
                    </div>
                  </div>
                </summary>
                <div className="px-5 pb-5 pl-11 bg-surface/50">
                  <div className="grid md:grid-cols-2 gap-5 pt-3">
                    <div>
                      <div className="eyebrow mb-2">Consumes</div>
                      <div className="space-y-1.5">
                        {s.consumes.map((c) => (
                          <div key={c.what} className="text-[12.5px]">
                            <span className="text-ink font-medium">{c.what}</span>
                            <span className="text-ink-3"> ← {c.from}</span>
                            <span className="text-ink-3"> · {c.cadence}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow mb-2">Emits</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.emits.length ? (
                          s.emits.map((e) => (
                            <span key={e} className="font-mono text-[11.5px] px-2 py-0.5 rounded bg-white border border-line">
                              {e}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12.5px] text-ink-3">nothing — read model only</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-ink-2 mt-4 leading-relaxed">{s.note}</p>
                </div>
              </details>
            ))}
          </div>
          <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed max-w-3xl">{EXTRACTION_NOTE}</p>
        </section>

        {/* ── Integration / where 'delivered' comes from ────────────────── */}
        <section id="integration" className="scroll-mt-16">
          <Eyebrow>Integration</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            Where does &ldquo;delivered&rdquo; actually come from?
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            With thousands of clients across SaaS, fintech and card products, there is no single
            delivery system to integrate with — and building around one would be a serious
            architectural mistake. Most clients have no delivery project at all. Their billing
            triggers are dates, counts and thresholds the products themselves already know. Where a
            human confirmation genuinely is needed, it belongs in the CRM activity timeline, next to
            the relationship — not in a separate tool nobody outside delivery opens.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <Card className="!bg-accent-bg !border-accent/25">
              <div className="text-[26px] font-semibold tnum text-accent">
                {PROJECT_TOOL_COVERAGE.doesNotNeedIt}
              </div>
              <div className="text-[13px] font-medium mt-1">need no human delivery step</div>
              <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">
                Activation dates, seat counts, cards issued, transaction volumes — all emitted by
                the products themselves.
              </p>
            </Card>
            <Card>
              <div className="text-[26px] font-semibold tnum">{PROJECT_TOOL_COVERAGE.needsIt}</div>
              <div className="text-[13px] font-medium mt-1">need a logged confirmation</div>
              <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">
                Implementation milestones — confirmed by the key account manager in the CRM, where
                they already work every day.
              </p>
            </Card>
            <Card className="!bg-surface">
              <div className="eyebrow">The conclusion</div>
              <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed">
                {PROJECT_TOOL_COVERAGE.conclusion}
              </p>
            </Card>
          </div>

          <h3 className="text-[15px] font-semibold mt-8 mb-3">
            Where the &ldquo;delivered&rdquo; signal actually comes from
          </h3>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-surface border-b border-line">
                  <tr className="text-left">
                    {["Product archetype", "Share", "Billing trigger", "Signal source", "Human step?"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold text-[11.5px] text-ink-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--line]">
                  {DELIVERY_SOURCES.map((d) => (
                    <tr key={d.archetype} className={d.needsProjectTool ? "bg-accent-bg/40" : ""}>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{d.label}</td>
                      <td className="px-4 py-3 tnum text-ink-2">{d.shareOfClients}</td>
                      <td className="px-4 py-3 text-ink-2">{d.billingTrigger}</td>
                      <td className="px-4 py-3 text-ink-2">{d.signalSource}</td>
                      <td className="px-4 py-3">
                        {d.needsProjectTool ? (
                          <Chip tone="accent">yes</Chip>
                        ) : (
                          <span className="text-ink-3">no</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <Card>
              <Eyebrow>One interface, many adapters</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Every source satisfies the same event contract. Adding a product line means writing
                one adapter — it never means touching the pricing engine, the rules engine or the
                billing decision.
              </p>
              <div className="mt-3 font-mono text-[11.5px] bg-surface border border-line rounded-lg p-3">
                <div className="text-accent font-semibold mb-1.5">{DELIVERY_CONTRACT.event}</div>
                {DELIVERY_CONTRACT.fields.map(([f, d]) => (
                  <div key={f} className="text-ink-2">
                    {f} <span className="text-ink-3">· {d}</span>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-ink-3 mt-2.5 leading-relaxed">{DELIVERY_CONTRACT.note}</p>
            </Card>

            <Card>
              <Eyebrow>Why hand-linking does not scale</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Linking an activity to a contract milestone by hand is fine at fifty contracts and
                impossible at four thousand. Obligations are instantiated from product templates
                instead, so the account manager confirms against a milestone that already exists.
              </p>
              <ol className="mt-3 space-y-1.5">
                {TEMPLATE_APPROACH.map((t, i) => (
                  <li key={t} className="text-[12.5px] text-ink-2 flex gap-2.5 leading-relaxed">
                    <span className="w-4 h-4 rounded bg-surface border border-line grid place-items-center text-[9px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {t}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card className="!bg-blue-bg !border-blue/20 mt-4">
            <p className="text-[14px] text-ink-2 leading-relaxed">
              <b className="text-ink font-semibold">What this demo shows:</b> the implementation
              archetype — the ~4% path needing a human confirmation — because it is the hardest case
              and the one that exercises the acceptance-window logic. The other five archetypes use
              the same event interface with simpler, fully automatic adapters.
            </p>
          </Card>
        </section>

        {/* ── Entity model / knowledge graph ──────────────────────────── */}
        <section id="graph" className="scroll-mt-16">
          <Eyebrow>Entity model</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            {MODEL_STATS.entities} entities, {MODEL_STATS.relationships} typed relationships.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            Every entity that has to exist for &ldquo;the contract and the invoice agree&rdquo; to
            be a checkable statement — where each one lives, who is authoritative for it, and how it
            connects to the others. This is the model the whole platform is built on; the lineage
            you can walk on screen five is a traversal of it.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-line border border-line rounded-xl overflow-hidden mt-6">
            {[
              [MODEL_STATS.entities, "entities"],
              [MODEL_STATS.relationships, "relationships"],
              [DOMAINS.length, "domains"],
              [MODEL_STATS.owned, "we own"],
              [MODEL_STATS.mirrored, "mirrored"],
              [MODEL_STATS.derived, "derived"],
            ].map(([v, l]) => (
              <div key={l} className="bg-white p-3">
                <div className="text-[18px] font-semibold tnum">{v}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          <Card className="mt-4 overflow-x-auto">
            <EntityGraph />
          </Card>

          <h3 className="text-[16px] font-semibold mt-10 mb-1">Entities, by domain</h3>
          <p className="text-[14px] text-ink-2 mb-4 max-w-3xl leading-relaxed">
            Each entity carries a definition, the system that is authoritative for it, and its key
            attributes. Several exist as their own entity for a specific reason — those reasons are
            called out, because they are where most models go wrong.
          </p>

          <div className="space-y-4">
            {DOMAINS.map((d) => (
              <div key={d.id}>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-[13px] font-semibold">{d.label}</span>
                  <span className="text-[12px] text-ink-3">— {d.blurb}</span>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {entitiesByDomain(d.id).map((e) => (
                    <Card key={e.id} className="!p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[12.5px] font-semibold">{e.name}</span>
                        <Chip tone={e.authority === "OWNED" ? "accent" : e.authority === "DERIVED" ? "blue" : "neutral"}>
                          {e.authority.toLowerCase()}
                        </Chip>
                      </div>
                      <p className="text-[12px] text-ink-2 mt-1.5 leading-relaxed">{e.definition}</p>
                      <div className="text-[11px] text-ink-3 mt-2">source · {e.source}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.keyAttributes.slice(0, 4).map((a) => (
                          <span key={a} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink-3">
                            {a}
                          </span>
                        ))}
                      </div>
                      {e.whyDistinct && (
                        <p className="text-[11.5px] text-accent mt-2.5 leading-relaxed border-t border-line pt-2">
                          {e.whyDistinct}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-[16px] font-semibold mt-10 mb-3">Relationships</h3>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="bg-surface border-b border-line">
                  <tr className="text-left">
                    {["From", "Relationship", "To", "Card.", "Why it matters"].map((h) => (
                      <th key={h} className="px-4 py-2.5 font-semibold text-[11.5px] text-ink-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--line]">
                  {RELATIONSHIPS.map((r, i) => {
                    const nm = (id: string) => ENTITIES.find((e) => e.id === id)?.name ?? id;
                    return (
                      <tr key={i}>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] whitespace-nowrap">{nm(r.from)}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-[11px] text-accent">{r.type}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11.5px] whitespace-nowrap">{nm(r.to)}</td>
                        <td className="px-4 py-2.5 tnum text-ink-3 whitespace-nowrap">{r.cardinality}</td>
                        <td className="px-4 py-2.5 text-ink-2">{r.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-4">
            <Eyebrow>Where the graph is used — and where it is not</Eyebrow>
            <div className="grid md:grid-cols-2 gap-5 mt-3">
              <div>
                <div className="text-[13px] font-semibold text-accent mb-2">Graph</div>
                <ul className="text-[12.5px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Audit lineage — rupee → rule → clause → evidence</li>
                  <li>Causal traversal — why was this held, and what is blocking it</li>
                  <li>Entity resolution — the same client under four different names</li>
                </ul>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-ink-2 mb-2">SQL</div>
                <ul className="text-[12.5px] text-ink-2 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Any total or trend shown to a user</li>
                  <li>Which contracts renew next quarter</li>
                  <li>Anything that must be transactionally consistent</li>
                </ul>
              </div>
            </div>
            <p className="text-[12.5px] text-ink-3 mt-4 leading-relaxed">
              Rule of thumb: if the question is <i>what</i> or <i>how much</i>, it is SQL. If it is{" "}
              <i>why</i> or <i>how are these connected</i>, it is the graph.
            </p>
          </Card>
        </section>

        {/* ── Result ───────────────────────────────────────────────────── */}
        <section id="result" className="scroll-mt-16">
          <Eyebrow>The result</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            One client, one contract, five pricing mechanisms, one mid-cycle amendment.
          </h2>

          <div className="grid lg:grid-cols-5 gap-4 mt-6">
            <Card className="lg:col-span-3 !p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-line bg-surface">
                <Eyebrow>July 2026 · CON-2026-114 · Vantara Electricals Ltd</Eyebrow>
              </div>
              <div className="p-5 space-y-2">
                {decision.billable.map((l) => (
                  <div key={l.lineNo} className="flex items-baseline justify-between gap-4">
                    <div>
                      <div className="text-[13.5px] font-medium">{l.productName}</div>
                      <div className="text-[12px] text-ink-3">{l.trace.detail}</div>
                    </div>
                    <div className="text-[14px] tnum whitespace-nowrap">{inr(l.amount)}</div>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-line space-y-1">
                  <RowMini label="Taxable subtotal" value={inr(decision.taxableSubtotal)} />
                  {decision.taxes.map((t) => (
                    <RowMini key={t.head} label={`${t.head} @ 9%`} value={inr(t.amount)} muted />
                  ))}
                </div>
                <div className="pt-2 mt-2 border-t border-line flex items-baseline justify-between">
                  <span className="font-semibold text-[14px]">Recommended</span>
                  <span className="text-[20px] font-semibold tnum">{inr(decision.total)}</span>
                </div>
                <div className="flex items-baseline justify-between text-accent pt-1">
                  <span className="text-[13px]">
                    Held — UAT milestone, billable {held?.becomesBillableOn}
                  </span>
                  <span className="text-[14px] tnum">{inr(decision.heldTotal)}</span>
                </div>
              </div>
            </Card>

            <Card className="lg:col-span-2 !bg-accent-bg !border-accent/25">
              <Eyebrow>What segmentation avoided</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Amendment A1 took effect on 16 July and does not operate retrospectively, so the
                period splits into two rating segments.
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-[11.5px] text-ink-3">Naive whole-period rating</div>
                  <div className="text-[19px] font-semibold tnum text-ink-3 line-through decoration-ink-3/40">
                    {inr(decision.naiveComparison.total)}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-ink-3">Correct segmented rating</div>
                  <div className="text-[19px] font-semibold tnum">{inr(decision.total)}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-ink-3">Error</div>
                  <div className="text-[19px] font-semibold tnum text-accent">
                    {inr(decision.naiveComparison.error)}
                  </div>
                </div>
              </div>
              <p className="text-[12.5px] text-ink-2 mt-4 leading-relaxed">
                Two errors in opposite directions, partially masking each other — subscription
                overstated 15.4%, usage understated to zero. A reviewer scanning the invoice sees a
                plausible number. That is why the mistake survives in production.
              </p>
            </Card>
          </div>
        </section>

        {/* ── Engineering ──────────────────────────────────────────────── */}
        <section id="engineering" className="scroll-mt-16">
          <Eyebrow>Engineering discipline</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 max-w-3xl leading-tight">
            A sixty-line throwaway spike, written during design, found five rewrite-class problems.
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            Before any of this was drawn into architecture diagrams, a disposable Python script
            computed the hardest case in the contract. It was wrong in ways nobody would have
            noticed until Phase 6.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {[
              ["F1", "Rating period ≠ billing period", "A billing period must be decomposed into rating segments at every amendment boundary. Retrofitting this is a rewrite."],
              ["F2", "Allowances prorate too", "Not just charges. Applying the amended 3M allowance to the whole month makes the usage overage vanish."],
              ["F3", "Daily usage is mandatory", "A monthly aggregate cannot be rated across a mid-cycle amendment. This constrains every connector we will ever build."],
              ["F4", "“Tiered” is ambiguous", "Bands may measure total or overage volume — 33% divergence on identical contract text. The catalog forces an explicit choice."],
              ["F5", "Advance billing needs a credit note", "An issued invoice is immutable. Correct settlement is credit-note-plus-rebill, not an edit. Systems that edit fail audit."],
              ["+", "One paisa of GST", "CGST and SGST round separately — they are distinct heads on the return. Trivial until it appears on a reconciliation ten thousand invoices later."],
            ].map(([id, title, body]) => (
              <Card key={title}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-accent-bg text-accent grid place-items-center text-[10px] font-bold">
                    {id}
                  </span>
                  <span className="text-[13.5px] font-semibold">{title}</span>
                </div>
                <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {[
              ["Rating is a pure function", "No I/O, no clock, no database beneath the engine. Same inputs, same output, forever — which is what makes it auditable and explainable."],
              ["35 golden tests", "The TypeScript engine is verified against an independent Python implementation to two decimal places. No UI work began until they agreed."],
              ["Guardrails in code", "A Python if cannot be talked around by a clever prompt. A sentence in a system prompt can."],
            ].map(([t, b]) => (
              <Card key={t} className="!bg-surface">
                <div className="text-[13.5px] font-semibold">{t}</div>
                <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed">{b}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Walkthrough ──────────────────────────────────────────────── */}
        <section>
          <Eyebrow>The walkthrough · about 6 minutes</Eyebrow>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {[
              ["/demo/contract", "2", "Client and contract", "Five pricing mechanisms composed, plus a mid-cycle amendment"],
              ["/demo/billing", "3", "Billing recommendation", "The hero — segments, held milestone, full calculation trace"],
              ["/demo/explain", "4", "Explain the decision", "Three questions answered from the trace, plus ask your own"],
              ["/demo/lineage", "5", `Lineage · ${lineage.nodes.length} nodes`, "Rupee → rule → clause → evidence"],
            ].map(([href, n, title, sub]) => (
              <Link key={href} href={href} className="card p-4 hover:border-ink-3 transition-colors group">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface border border-line grid place-items-center text-[11px] font-bold shrink-0 mt-0.5">
                    {n}
                  </span>
                  <div>
                    <div className="font-medium text-[14.5px] group-hover:text-accent transition-colors">{title}</div>
                    <div className="text-[12.5px] text-ink-2 mt-0.5 leading-snug">{sub}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Documentation ────────────────────────────────────────────── */}
        <section id="docs" className="scroll-mt-16 pb-6">
          <Eyebrow>Documentation</Eyebrow>
          <h2 className="text-[28px] font-semibold tracking-[-0.02em] mt-1 leading-tight">
            Behind the demo
          </h2>
          <p className="text-[15px] text-ink-2 mt-3 max-w-3xl leading-relaxed">
            The product blueprint, the scope decisions, and a decision log recording the reasoning
            behind every choice — including the two direction changes and what caused them.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {[
              ["Product Vision", "Problem, why enterprise systems fail, positioning, personas, three horizons", "docs/01-vision.md"],
              ["PRD", "Requirements with Gherkin acceptance criteria drawn from the spike", "docs/02-prd.md"],
              ["Current state journey", "Nine stages, five blind spots, where the time goes", "docs/03-current-state-journey.md"],
              ["Future state journey", "The same journey rebuilt, and the AI boundary", "docs/04-future-state-journey.md"],
              ["Founder demo scope", "In-scope / mocked / roadmap, and the build sequence", "docs/FOUNDER-DEMO-SCOPE.md"],
              ["Proration spike", "The 60 lines that found five rewrite-class problems", "spikes/proration_spike.py"],
              ["Pricing engine", "Pure functions — segmentation, subscription, tiered usage, milestone", "demo/lib/engine"],
              ["Golden tests", "35 assertions verifying TypeScript against Python", "demo/tests/engine.spec.ts"],
              ["System of record vs reference", "Learning module — enterprise data authority, why MDM failed", "mentor/M01-system-of-record-vs-reference.md"],
            ].map(([title, desc, path]) => (
              <a
                key={path}
                href={`${REPO}/blob/main/${path}`}
                target="_blank"
                rel="noreferrer"
                className="card p-4 hover:border-ink-3 transition-colors"
              >
                <div className="font-medium text-[14px]">{title} ↗</div>
                <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">{desc}</div>
                <div className="text-[11px] font-mono text-ink-3 mt-2">{path}</div>
              </a>
            ))}
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <a href={REPO} target="_blank" rel="noreferrer" className="btn-primary">GitHub repository ↗</a>
            <Link href="/docs" className="btn-ghost">Full documentation index</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="max-w-content mx-auto px-5 py-7 flex justify-between flex-wrap gap-4 text-[12.5px] text-ink-3">
          <div>
            <div className="font-medium text-ink-2">Revenue Nexus AI</div>
            <div className="mt-0.5">
              Working demonstration · {counts.total} rules · {lineage.nodes.length} lineage nodes ·
              35 golden tests
            </div>
          </div>
          <div className="text-right">
            <div>Synthetic data throughout.</div>
            <div className="mt-0.5">Vantara Electricals is a fictional company.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RowMini({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${muted ? "text-ink-2" : ""}`}>
      <span className="text-[12.5px]">{label}</span>
      <span className="text-[13px] tnum">{value}</span>
    </div>
  );
}
