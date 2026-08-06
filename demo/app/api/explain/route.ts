import { NextResponse } from "next/server";
import { getDecision } from "@/lib/decision";
import explanations from "@/fixtures/explanations.json";

export const runtime = "nodejs";

/**
 * Live explanation — an ENHANCEMENT, never a dependency.
 *
 * Without ANTHROPIC_API_KEY this returns the pre-computed, human-reviewed
 * answers. The demo therefore cannot fail because of a rate limit, an expired
 * key, or a cold start — which matters when the link is opened weeks after it
 * was shared, on a phone, with no warning.
 *
 * Note the prompt construction: the model is handed the completed calculation
 * trace and asked to render it. It is explicitly forbidden from computing.
 * Every number it emits must already exist in the trace it was given.
 */
export async function POST(req: Request) {
  const { question } = (await req.json().catch(() => ({}))) as { question?: string };
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({
      mode: "precomputed",
      note: "No ANTHROPIC_API_KEY configured, so this is the closest reviewed answer rather than a live response. Set the key locally or in Vercel to generate against the calculation trace.",
      answer: bestMatch(question),
    });
  }

  const { decision, firings } = getDecision();

  const system = [
    "You explain billing decisions to a finance controller.",
    "",
    "ABSOLUTE CONSTRAINT: you must not perform arithmetic. Every monetary figure,",
    "count, and date you state must appear verbatim in the calculation trace you",
    "are given. If a number is not in the trace, you may not state it. You are",
    "rendering a completed computation into language, not reconstructing it.",
    "",
    "Cite the contract clause or rule id behind each claim. Be concise and precise.",
    "Write in plain business English. No marketing language.",
  ].join("\n");

  const payload = {
    period: decision.period,
    segments: decision.segments.map((s) => ({ ...s, fraction: s.fraction.toString() })),
    billable: decision.billable,
    held: decision.held,
    taxableSubtotal: decision.taxableSubtotal,
    taxes: decision.taxes,
    total: decision.total,
    naiveComparison: decision.naiveComparison,
    rules: firings.map((f) => ({
      id: f.rule.id, name: f.rule.name, statement: f.rule.statement,
      fired: f.fired, observed: f.observed, effect: f.effect,
    })),
  };

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1200,
        system,
        messages: [
          {
            role: "user",
            content: `Question: ${question ?? "Why is this the recommended amount?"}\n\nCalculation trace:\n${JSON.stringify(payload, null, 2)}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    return NextResponse.json({
      mode: "live",
      answer: {
        body: text.split(/\n{2,}/).filter(Boolean),
        sources: [{ label: "Computed by the pricing engine · rendered by the model" }],
      },
    });
  } catch {
    // Graceful degradation — the demo continues regardless.
    return NextResponse.json({
      mode: "precomputed-fallback",
      note: "Live generation was unavailable, so this is the reviewed answer. The demo does not depend on the API being reachable.",
      answer: bestMatch(question),
    });
  }
}

/** Cheap keyword overlap — good enough to route three canned answers. */
function bestMatch(question?: string) {
  if (!question) return explanations.answers[0];
  const q = question.toLowerCase();
  const score = (text: string) =>
    text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && q.includes(w)).length;

  return (
    [...explanations.answers].sort(
      (a, b) => score(b.question + " " + b.summary) - score(a.question + " " + a.summary)
    )[0] ?? explanations.answers[0]
  );
}
