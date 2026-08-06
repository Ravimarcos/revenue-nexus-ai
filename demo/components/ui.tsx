import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow mb-2">{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "accent" | "good" | "blue";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-surface text-ink-2 border border-line",
    accent: "bg-accent-bg text-accent",
    good: "bg-good-bg text-good",
    blue: "bg-blue-bg text-blue",
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

/** Marks whether a fact is ours or mirrored — the M01 argument, visible. */
export function Authority({ owned, source }: { owned: boolean; source?: string }) {
  return owned ? (
    <Chip tone="accent">System of record{source ? ` · ${source}` : ""}</Chip>
  ) : (
    <Chip tone="neutral">Mirrored{source ? ` · ${source}` : ""}</Chip>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "accent" | "good";
}) {
  const colors = { neutral: "text-ink", accent: "text-accent", good: "text-good" };
  return (
    <div className="card p-4">
      <div className="eyebrow mb-2">{label}</div>
      <div className={`text-xl font-semibold tnum ${colors[tone]}`}>{value}</div>
      {sub && <div className="text-[12px] text-ink-3 mt-1 leading-snug">{sub}</div>}
    </div>
  );
}

export function StepNav({ current }: { current: number }) {
  const steps = [
    { n: 1, href: "/", label: "Overview" },
    { n: 2, href: "/demo/contract", label: "Contract" },
    { n: 3, href: "/demo/billing", label: "Billing" },
    { n: 4, href: "/demo/explain", label: "Explain" },
    { n: 5, href: "/demo/lineage", label: "Lineage" },
  ];
  return (
    <nav className="sticky bottom-0 z-20 bg-white/95 backdrop-blur border-t border-line">
      <div className="max-w-content mx-auto px-5 py-2.5 flex items-center gap-1 overflow-x-auto">
        {steps.map((s) => {
          const active = s.n === current;
          return (
            <Link
              key={s.n}
              href={s.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-colors ${
                active ? "bg-ink text-white font-medium" : "text-ink-2 hover:bg-surface"
              }`}
            >
              <span
                className={`w-[18px] h-[18px] rounded-full grid place-items-center text-[10px] font-bold ${
                  active ? "bg-white/20" : "bg-surface border border-line"
                }`}
              >
                {s.n}
              </span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageHeader({
  step,
  title,
  lede,
  right,
}: {
  step: string;
  title: string;
  lede?: string;
  right?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-white">
      <div className="max-w-content mx-auto px-5 py-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="max-w-2xl">
            <Eyebrow>{step}</Eyebrow>
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] leading-tight">{title}</h1>
            {lede && <p className="text-ink-2 text-[14.5px] mt-2 leading-relaxed">{lede}</p>}
          </div>
          {right}
        </div>
      </div>
    </header>
  );
}

export function NextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="btn-primary">
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
