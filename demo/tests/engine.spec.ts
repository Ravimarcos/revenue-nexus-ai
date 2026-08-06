/**
 * GOLDEN TESTS — the S2 gate.
 *
 * Every expected value below is the output of spikes/proration_spike.py.
 * If the TypeScript engine and the Python spike disagree by one paisa,
 * one of them is wrong, and no UI work proceeds until they agree.
 *
 * Run: npx tsx tests/engine.spec.ts
 */
import { computeBillingDecision } from "../lib/engine/compose";
import { buildPeriod } from "../lib/engine/segment";
import { inr } from "../lib/engine/money";
import { loadContract, loadUsage, loadMilestones } from "../lib/data";

let pass = 0;
let fail = 0;

function eq(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  ok ? pass++ : fail++;
  const mark = ok ? "  ✓" : "  ✗";
  console.log(`${mark} ${label.padEnd(52)} ${String(actual).padStart(16)}${ok ? "" : `   expected ${expected}`}`);
}

function section(title: string) {
  console.log(`\n${title}\n${"─".repeat(74)}`);
}

const contract = loadContract();
const usageDays = loadUsage();
const milestones = loadMilestones();
const period = buildPeriod("2026-07-01", "2026-07-31", "July 2026");

const decision = computeBillingDecision({
  contract,
  period,
  usageDays,
  milestoneEvidence: milestones,
  asOf: "2026-07-31",
});

console.log("═".repeat(74));
console.log("GOLDEN TESTS — CON-2026-114 · July 2026 · vs proration_spike.py");
console.log("═".repeat(74));

section("SEGMENTATION (spike finding F1)");
eq("segment count", decision.segments.length, 2);
eq("segment 1 label", decision.segments[0].label, "Base terms");
eq("segment 1 range", `${decision.segments[0].start}..${decision.segments[0].end}`, "2026-07-01..2026-07-15");
eq("segment 1 days", decision.segments[0].days, 15);
eq("segment 2 label", decision.segments[1].label, "Amendment A1");
eq("segment 2 range", `${decision.segments[1].start}..${decision.segments[1].end}`, "2026-07-16..2026-07-31");
eq("segment 2 days", decision.segments[1].days, 16);
eq("segment days sum to period", decision.segments.reduce((n, s) => n + s.days, 0), 31);

section("SUBSCRIPTION — prorated per segment");
const sub = decision.billable.find((l) => l.lineNo === 1)!;
eq("seg 1  500 users, 0% disc, 15/31", sub.trace.children![0].amount, "290322.58");
eq("seg 2  750 users, 8% disc, 16/31", sub.trace.children![1].amount, "427354.84");
eq("subscription total", sub.amount, "717677.42");

section("USAGE — allowance prorated per segment (F2, F3)");
const usg = decision.billable.find((l) => l.lineNo === 2)!;
eq("seg 1 calls", usg.trace.children![0].children![0].amount, "11,61,290");
eq("seg 1 prorated allowance", usg.trace.children![0].children![1].amount, "9,67,742");
eq("seg 1 chargeable overage", usg.trace.children![0].children![2].amount, "1,93,548");
eq("seg 1 charge @ ₹0.06 total-volume band", usg.trace.children![0].amount, "11612.88");
eq("seg 2 calls", usg.trace.children![1].children![0].amount, "12,38,710");
eq("seg 2 prorated allowance", usg.trace.children![1].children![1].amount, "15,48,387");
eq("seg 2 within allowance", usg.trace.children![1].amount, "0.00");
eq("usage total", usg.amount, "11612.88");

section("MILESTONE — held with reason (FR-5.4)");
eq("held line count", decision.held.length, 1);
eq("held amount", decision.held[0].amount, "1200000.00");
eq("held rule", decision.held[0].holdRuleId, "RULE-MILESTONE-007");
eq("becomes billable", decision.held[0].becomesBillableOn, "2026-08-13");
eq("no milestone billed this period", decision.billable.filter((l) => l.lineNo === 3).length, 0);

section("TAX — heads rounded separately");
eq("taxable subtotal", decision.taxableSubtotal, "729290.30");
eq("CGST head", decision.taxes[0].head, "CGST");
eq("CGST amount", decision.taxes[0].amount, "65636.13");
eq("SGST amount", decision.taxes[1].amount, "65636.13");

section("INVOICE TOTAL");
eq("recommended total", decision.total, "860562.56");
eq("held total", decision.heldTotal, "1200000.00");

section("NAIVE COMPARISON — the demonstration");
eq("naive whole-period total", decision.naiveComparison.total, "977040.00");
eq("error vs correct", decision.naiveComparison.error, "116477.44");
eq("error %", decision.naiveComparison.errorPct, "13.5");

section("PURITY — same inputs, same output (FR-3.2)");
const again = computeBillingDecision({
  contract, period, usageDays, milestoneEvidence: milestones, asOf: "2026-07-31",
});
eq("deterministic across calls", again.total, decision.total);
eq("trace identical", JSON.stringify(again.billable) === JSON.stringify(decision.billable), "true");

console.log("\n" + "═".repeat(74));
console.log(`  ${pass} passed, ${fail} failed`);
console.log(`  Recommended ${inr(decision.total)}   ·   Held ${inr(decision.heldTotal)}`);
console.log("═".repeat(74));

if (fail > 0) {
  console.error("\nGATE FAILED — engine does not reproduce the spike. No UI work proceeds.\n");
  process.exit(1);
}
console.log("\nGATE PASSED — engine reproduces proration_spike.py exactly.\n");
