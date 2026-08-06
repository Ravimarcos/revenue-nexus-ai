/**
 * The core idea of the portal, in one picture.
 *
 * Five systems each hold a piece of the same truth. Today they are compared
 * by hand, monthly, if at all. The portal reconciles them continuously and
 * makes any disagreement visible.
 */
const SOURCES = [
  ["Contract", "what was agreed", "terms, pricing, milestones,\nrenewal, amendments"],
  ["CRM", "what was sold", "customer, entities,\nseats, opportunity"],
  ["Delivery", "what shipped", "milestones, sign-offs,\nacceptance windows"],
  ["Usage", "what was consumed", "daily volumes\nagainst limits"],
  ["Billing", "what was charged", "invoices, payments,\ncredit notes"],
] as const;

export function AlignmentDiagram() {
  const W = 158;
  const GAP = 14;
  const X0 = 12;
  const TOP = 34;
  const BOX_H = 74;
  const HUB_Y = 176;
  const width = X0 * 2 + SOURCES.length * W + (SOURCES.length - 1) * GAP;

  return (
    <svg viewBox={`0 0 ${width} 288`} className="w-full h-auto" role="img" aria-labelledby="alT alD">
      <title id="alT">Five systems reconciled into one view</title>
      <desc id="alD">
        Contract, CRM, delivery, usage and billing each hold a piece of the same truth. The portal
        reconciles them into a single view and surfaces any disagreement between them, such as a
        milestone delivered but not billed or an amendment not reflected in billing.
      </desc>

      <style>{`
        .al-src{fill:var(--surface);stroke:var(--line);stroke-width:1}
        .al-hub{fill:var(--accent-bg);stroke:var(--accent);stroke-width:1.4}
        .al-t{fill:var(--ink);font:600 13px ui-sans-serif,system-ui,sans-serif}
        .al-q{fill:var(--ink-2);font:400 10.5px ui-sans-serif,system-ui,sans-serif}
        .al-s{fill:var(--ink-3);font:400 9.5px ui-sans-serif,system-ui,sans-serif}
        .al-h{font:700 9.5px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
        .al-ln{stroke:var(--line);stroke-width:1.2;fill:none}
      `}</style>

      <text x={X0} y="16" className="al-h" fill="var(--ink-3)">
        FIVE SYSTEMS, EACH HOLDING PART OF THE SAME TRUTH
      </text>

      {SOURCES.map(([name, question, detail], i) => {
        const x = X0 + i * (W + GAP);
        const cx = x + W / 2;
        return (
          <g key={name}>
            <rect x={x} y={TOP} width={W} height={BOX_H} rx="7" className="al-src" />
            <text x={cx} y={TOP + 21} className="al-t" textAnchor="middle">{name}</text>
            <text x={cx} y={TOP + 36} className="al-q" textAnchor="middle">{question}</text>
            {detail.split("\n").map((l, j) => (
              <text key={j} x={cx} y={TOP + 52 + j * 11} className="al-s" textAnchor="middle">
                {l}
              </text>
            ))}
            {/* elbow into the hub */}
            <path
              className="al-ln"
              d={`M${cx},${TOP + BOX_H} L${cx},${TOP + BOX_H + 18} L${width / 2},${TOP + BOX_H + 18} L${width / 2},${HUB_Y - 4}`}
            />
          </g>
        );
      })}

      {/* hub */}
      <rect x={width / 2 - 232} y={HUB_Y} width="464" height="62" rx="8" className="al-hub" />
      <text x={width / 2} y={HUB_Y + 25} className="al-t" textAnchor="middle">
        One reconciled view
      </text>
      <text x={width / 2} y={HUB_Y + 42} className="al-q" textAnchor="middle">
        every figure traced back to the system it came from
      </text>
      <text x={width / 2} y={HUB_Y + 55} className="al-s" textAnchor="middle">
        and every disagreement between them made visible
      </text>

      {/* outputs */}
      <text x={X0} y={HUB_Y + 88} className="al-h" fill="var(--accent)">
        WHAT IT SURFACES
      </text>
      {[
        "delivered, not billed",
        "amended, not repriced",
        "over the usage limit",
        "renewal approaching",
        "paid, not reconciled",
      ].map((t, i) => {
        const bw = (width - X0 * 2 - 4 * 8) / 5;
        const x = X0 + i * (bw + 8);
        return (
          <g key={t}>
            <rect x={x} y={HUB_Y + 94} width={bw} height="24" rx="5" fill="#fff" stroke="var(--accent)" strokeOpacity="0.35" />
            <text x={x + bw / 2} y={HUB_Y + 110} className="al-s" textAnchor="middle" fill="var(--accent)">
              {t}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
