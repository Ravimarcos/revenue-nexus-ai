/**
 * Current vs future state, side by side.
 *
 * Nine stages each, aligned so the eye can compare row by row. The five
 * dotted breaks on the left are where money leaks today — each is a handoff
 * with no system behind it.
 */
const CURRENT = [
  ["Sales negotiates", "CRM stores an amount, not a structure", false],
  ["Contract executed", "terms re-keyed into billing by hand", true],
  ["Implementation runs", "milestone done — finance not notified", true],
  ["Usage accumulates", "monthly CSV, granularity destroyed", true],
  ["Amendment signed", "a PDF in someone's inbox", true],
  ["Finance assembles", "4 sources, 1 spreadsheet, 3–5 days", false],
  ["Invoice issued", "keyed manually; if wrong, immutable", false],
  ["Payment arrives short", "TDS read as a shortfall", true],
  ["Reconciliation", "quarterly, manual, incomplete", false],
] as const;

const FUTURE = [
  ["Contract ingested", "extracted, human-confirmed, drives pricing"],
  ["Pricing computed", "segmented at the amendment boundary"],
  ["Usage ingested", "daily granularity enforced at the connector"],
  ["Delivery linked", "CRM activity becomes evidence"],
  ["Rules evaluated", "6 fire, 1 blocks with a reason and a date"],
  ["Recommendation", "₹8,60,562.56 · ₹12,00,000 held"],
  ["Explanation", "every rupee traced to its clause"],
  ["Finance approves", "decides, rather than assembles"],
  ["Payment settled", "TDS recognised, not chased"],
] as const;

export function CurrentVsFutureDiagram() {
  const ROW_H = 44;
  const TOP = 46;
  const COL_W = 400;
  const RIGHT_X = 470;
  const height = TOP + CURRENT.length * ROW_H + 16;

  return (
    <svg
      viewBox={`0 0 870 ${height}`}
      className="w-full h-auto"
      role="img"
      aria-labelledby="cfT cfD"
    >
      <title id="cfT">Current state versus future state</title>
      <desc id="cfD">
        Nine stages on each side. Today: terms re-keyed by hand, milestones nobody reports, usage
        aggregated monthly, amendments arriving by email, and a three-to-five day billing run in a
        spreadsheet. With Revenue Nexus: terms drive pricing directly, usage arrives daily,
        amendments create rating segments, and the run is computed and approved in under a day.
      </desc>

      <style>{`
        .c-row-a{fill:var(--accent-bg);stroke:var(--accent);stroke-width:1;stroke-opacity:.25}
        .c-row-n{fill:#fff;stroke:var(--line);stroke-width:1}
        .c-row-g{fill:var(--good-bg);stroke:var(--good);stroke-width:1;stroke-opacity:.3}
        .c-t{fill:var(--ink);font:600 12px ui-sans-serif,system-ui,sans-serif}
        .c-s{fill:var(--ink-2);font:400 10.5px ui-sans-serif,system-ui,sans-serif}
        .c-h{font:700 10px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
        .c-leak{fill:var(--accent);font:700 8.5px ui-sans-serif,system-ui,sans-serif}
      `}</style>

      <text x="0" y="16" className="c-h" fill="var(--accent)">TODAY</text>
      <text x="0" y="32" className="c-s">nine stages · five places money leaks</text>
      <text x={RIGHT_X} y="16" className="c-h" fill="var(--good)">WITH REVENUE NEXUS</text>
      <text x={RIGHT_X} y="32" className="c-s">terms flow into pricing · the human approves</text>

      {CURRENT.map(([title, sub, leak], i) => {
        const y = TOP + i * ROW_H;
        return (
          <g key={title}>
            <rect
              x="0"
              y={y}
              width={COL_W}
              height={ROW_H - 8}
              rx="6"
              className={leak ? "c-row-a" : "c-row-n"}
            />
            <text x="12" y={y + 16} className="c-t">{title}</text>
            <text x="12" y={y + 29} className="c-s">{sub}</text>
            {leak && (
              <text x={COL_W - 12} y={y + 22} className="c-leak" textAnchor="end">
                LEAK
              </text>
            )}
          </g>
        );
      })}

      {FUTURE.map(([title, sub], i) => {
        const y = TOP + i * ROW_H;
        return (
          <g key={title}>
            <rect x={RIGHT_X} y={y} width={COL_W} height={ROW_H - 8} rx="6" className="c-row-g" />
            <text x={RIGHT_X + 12} y={y + 16} className="c-t">{title}</text>
            <text x={RIGHT_X + 12} y={y + 29} className="c-s">{sub}</text>
          </g>
        );
      })}

      {/* centre arrows */}
      {CURRENT.map((_, i) => {
        const y = TOP + i * ROW_H + (ROW_H - 8) / 2;
        return (
          <path
            key={i}
            d={`M${COL_W + 14},${y} L${RIGHT_X - 14},${y}`}
            stroke="var(--line)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
