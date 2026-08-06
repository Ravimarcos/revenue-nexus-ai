"use client";

import { useState } from "react";

type Mode = "precomputed" | "live" | "precomputed-fallback";

interface Result {
  mode: Mode;
  note?: string;
  answer: { summary?: string; body: string[]; sources?: { label: string }[] };
}

const SUGGESTIONS = [
  "Why is the usage charge so small when they made 2.4 million calls?",
  "If the customer disputes the held milestone, what do I tell them?",
  "What would the invoice have been without the amendment?",
];

/**
 * The "ask it yourself" affordance.
 *
 * Without ANTHROPIC_API_KEY this returns the reviewed pre-computed answer and
 * says so plainly. With a key it generates live against the real calculation
 * trace. Either way the demo works — which is the point of the design.
 */
export function AskLive() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      setResult(await res.json());
    } catch {
      setResult({
        mode: "precomputed-fallback",
        note: "Could not reach the explanation service.",
        answer: { body: ["The pre-computed answers above remain available."] },
      });
    } finally {
      setLoading(false);
    }
  }

  const badge = {
    live: { text: "Generated live · claude-sonnet-5", cls: "bg-good-bg text-good" },
    precomputed: { text: "Pre-computed · reviewed", cls: "bg-blue-bg text-blue" },
    "precomputed-fallback": { text: "Fallback · reviewed answer", cls: "bg-surface text-ink-2 border border-line" },
  };

  return (
    <div className="card p-5">
      <div className="eyebrow mb-2">Ask your own question</div>
      <p className="text-[13px] text-ink-2 mb-4 max-w-2xl leading-relaxed">
        The model receives the completed calculation trace and is instructed that every figure it
        states must already appear in that trace. It renders; it does not compute.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="flex gap-2 flex-wrap"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. why was the milestone not billed this month?"
          className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-lg border border-line bg-white text-[14px] outline-none focus:border-ink-3"
        />
        <button type="submit" disabled={loading || !question.trim()} className="btn-primary disabled:opacity-40">
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="flex gap-2 mt-3 flex-wrap">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setQuestion(s);
              ask(s);
            }}
            className="text-[12px] px-2.5 py-1.5 rounded-md border border-line bg-surface hover:border-ink-3 transition-colors text-left"
          >
            {s}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-5 pt-4 border-t border-line">
          <span className={`chip ${badge[result.mode].cls}`}>{badge[result.mode].text}</span>
          {result.note && <p className="text-[12px] text-ink-3 mt-2">{result.note}</p>}

          {result.answer.summary && (
            <p className="text-[14px] font-medium mt-3 leading-relaxed">{result.answer.summary}</p>
          )}

          <div className="space-y-3 mt-3 max-w-3xl">
            {result.answer.body.map((p, i) => (
              <p
                key={i}
                className="text-[14px] text-ink-2 leading-[1.65] whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: p
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/\*\*(.+?)\*\*/g, '<b class="font-semibold text-ink">$1</b>'),
                }}
              />
            ))}
          </div>

          {!!result.answer.sources?.length && (
            <div className="flex flex-wrap gap-2 mt-4">
              {result.answer.sources.map((s) => (
                <span key={s.label} className="chip bg-blue-bg text-blue">
                  {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
