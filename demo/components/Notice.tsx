import type { ReactNode } from "react";

/**
 * "What to notice" callout.
 *
 * This link gets shared and read alone, with nobody narrating. Everything a
 * presenter would have said out loud has to be on the screen instead —
 * otherwise the reader sees a table of numbers and misses the point entirely.
 */
export function Notice({
  label = "What to notice",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-l-2 border-accent bg-accent-bg/50 rounded-r-lg px-5 py-4">
      <div className="eyebrow !text-accent mb-1.5">{label}</div>
      <div className="text-[14px] text-ink-2 leading-relaxed max-w-3xl space-y-2">{children}</div>
    </div>
  );
}
