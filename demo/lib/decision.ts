import { computeBillingDecision } from "./engine/compose";
import { buildPeriod } from "./engine/segment";
import { loadContract, loadMilestones, loadUsage } from "./data";
import { evaluateRules, firedCount } from "./rules/evaluate";
import { buildLineage } from "./lineage/build";

/**
 * The single computation the whole demo renders.
 *
 * Every screen reads from this. There is exactly one source of the numbers,
 * and it is a pure function over committed fixtures — which is why the same
 * figure appears identically on five screens without any of them being
 * hardcoded.
 */
export const PERIOD = buildPeriod("2026-07-01", "2026-07-31", "July 2026");
export const AS_OF = "2026-07-31";

export function getDecision() {
  const contract = loadContract();
  const decision = computeBillingDecision({
    contract,
    period: PERIOD,
    usageDays: loadUsage(),
    milestoneEvidence: loadMilestones(),
    asOf: AS_OF,
  });
  const firings = evaluateRules(decision);
  const counts = firedCount(firings);
  const lineage = buildLineage(decision, firings);
  return { contract, decision, firings, counts, lineage };
}
