import type { TraceStep } from "@/lib/engine/types";
import { inr } from "@/lib/engine/money";

function looksLikeMoney(s?: string) {
  return !!s && /^-?\d+\.\d{2}$/.test(s);
}

/**
 * Renders the calculation trace.
 *
 * Progressive disclosure by design: the hero screen has to be readable in
 * three minutes, so detail is collapsed until asked for. Every leaf carries
 * the formula that produced it — this is the artifact that makes the amount
 * defensible, and it is also exactly what the AI layer reads to write its
 * explanation. Nothing is generated; it is rendered.
 */
export function Trace({ step, depth = 0 }: { step: TraceStep; depth?: number }) {
  const hasChildren = !!step.children?.length;
  const amount = looksLikeMoney(step.amount) ? inr(step.amount!) : step.amount;

  const body = (
    <div className={depth === 0 ? "" : "pl-4 border-l border-line ml-1"}>
      <div className="flex items-baseline justify-between gap-4 py-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {hasChildren && depth > 0 && <span className="chev text-ink-3 text-[10px]">▸</span>}
            <span className={`${depth === 0 ? "font-medium" : "text-[13.5px]"} text-ink`}>
              {step.label}
            </span>
          </div>
          <div className="text-[12.5px] text-ink-2 leading-snug mt-0.5">{step.detail}</div>
          {step.formula && step.formula !== "—" && (
            <div className="text-[12px] font-mono text-ink-3 mt-1">{step.formula}</div>
          )}
          {step.sourceRef && (
            <div className="text-[11.5px] text-blue mt-1">
              {step.sourceRef.startsWith("http") ? "↗ " : "§ "}
              {step.sourceRef.replace(/^https?:\/\//, "")}
            </div>
          )}
        </div>
        {amount && (
          <div className="text-[13.5px] tnum font-medium whitespace-nowrap shrink-0">{amount}</div>
        )}
      </div>
      {hasChildren && (
        <div className="mt-0.5">
          {step.children!.map((c) => (
            <Trace key={c.id} step={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  if (depth === 1 && hasChildren) {
    return (
      <details className="border-l border-line pl-4 ml-1">
        <summary className="py-1.5">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <span className="chev text-ink-3 text-[10px] mr-1.5 inline-block">▸</span>
              <span className="text-[13.5px] text-ink font-medium">{step.label}</span>
              <div className="text-[12.5px] text-ink-2 leading-snug mt-0.5 ml-4">{step.detail}</div>
              {step.formula && step.formula !== "—" && (
                <div className="text-[12px] font-mono text-ink-3 mt-1 ml-4">{step.formula}</div>
              )}
            </div>
            {amount && <div className="text-[13.5px] tnum font-medium whitespace-nowrap">{amount}</div>}
          </div>
        </summary>
        <div className="pb-2">
          {step.children!.map((c) => (
            <Trace key={c.id} step={c} depth={depth + 1} />
          ))}
        </div>
      </details>
    );
  }

  return body;
}
