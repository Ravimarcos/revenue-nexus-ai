/**
 * Swimlane workflow — six phases across, four actors down.
 *
 * Two things the diagram exists to make unmissable:
 *   1. The human decision points, and what happens when a human says no.
 *   2. That the deterministic engine sits in its own lane, and AI sits in
 *      another — they never occupy the same box.
 */

const PHASES = [
  "PHASE 0 · SETUP",
  "PHASE 1 · INGEST",
  "PHASE 2 · EVIDENCE",
  "PHASE 3 · COMPUTE",
  "PHASE 4 · REVIEW",
  "PHASE 5 · EXECUTE",
];

type Box = {
  phase: number;
  lane: number;
  title: string;
  sub: string;
  kind: "sys" | "ai" | "human" | "engine";
};

const LANES = [
  { name: "SOURCE SYSTEMS", sub: "CRM · contracts · products · telemetry" },
  { name: "AI LAYER", sub: "proposes, never computes" },
  { name: "DETERMINISTIC ENGINE", sub: "pure functions · reproducible" },
  { name: "HUMAN", sub: "confirms and approves" },
];

const BOXES: Box[] = [
  { phase: 0, lane: 0, title: "Publish catalog", sub: "products, pricing,\nobligation templates", kind: "sys" },
  { phase: 0, lane: 3, title: "Define rules", sub: "constrained DSL,\nversioned", kind: "human" },

  { phase: 1, lane: 0, title: "Contract executed", sub: "signed document\n+ CRM record", kind: "sys" },
  { phase: 1, lane: 1, title: "Extract terms", sub: "prose → structure\nconfidence scored", kind: "ai" },
  { phase: 1, lane: 3, title: "Confirm terms", sub: "review against source\nclause by clause", kind: "human" },

  { phase: 2, lane: 0, title: "Delivery signal", sub: "activation, cards issued,\nmilestone sign-off", kind: "sys" },
  { phase: 2, lane: 0, title: "Usage buckets", sub: "daily granularity\nenforced", kind: "sys" },

  { phase: 3, lane: 2, title: "Segment period", sub: "split at every\namendment boundary", kind: "engine" },
  { phase: 3, lane: 2, title: "Rate & apply rules", sub: "prorate, tier, tax\nemit full trace", kind: "engine" },

  { phase: 4, lane: 1, title: "Explain", sub: "render the trace\ninto language", kind: "ai" },
  { phase: 4, lane: 3, title: "Approve or reject", sub: "reject captures\na structured reason", kind: "human" },

  { phase: 5, lane: 0, title: "Billing system", sub: "issues the invoice\nfiles compliance", kind: "sys" },
];

const COL_W = 178;
const COL_GAP = 12;
const LANE_H = 108;
const LEFT = 138;
const TOP = 52;
const BOX_H = 46;

export function WorkflowSwimlane() {
  const width = LEFT + PHASES.length * (COL_W + COL_GAP);
  const height = TOP + LANES.length * LANE_H + 152;

  const colX = (p: number) => LEFT + p * (COL_W + COL_GAP);
  // stack boxes that share a phase+lane
  const stackIndex = (b: Box, i: number) =>
    BOXES.slice(0, i).filter((x) => x.phase === b.phase && x.lane === b.lane).length;
  const boxY = (b: Box, i: number) => TOP + b.lane * LANE_H + 12 + stackIndex(b, i) * (BOX_H + 6);

  const pos = BOXES.map((b, i) => ({ b, x: colX(b.phase) + 6, y: boxY(b, i), w: COL_W - 12 }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-labelledby="swT swD">
      <title id="swT">Billing workflow — six phases, four actors</title>
      <desc id="swD">
        Source systems publish the catalog and contract, AI extracts terms and a human confirms them.
        Delivery and usage evidence arrive. The deterministic engine segments the period, rates it and
        applies rules. AI explains the result, a human approves or rejects, and the billing system
        executes. Rejection loops back to the compute phase; unconfirmed extraction loops back to ingest.
      </desc>

      <defs>
        <marker id="sw-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-3)" />
        </marker>
        <marker id="sw-ar-loop" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
      </defs>

      <style>{`
        .sw-lane{fill:var(--surface)}
        .sw-lane-alt{fill:#fff}
        .sw-sys{fill:#fff;stroke:var(--line);stroke-width:1.2}
        .sw-ai{fill:var(--blue-bg);stroke:var(--blue);stroke-width:1.1;stroke-dasharray:4 3}
        .sw-eng{fill:var(--accent-bg);stroke:var(--accent);stroke-width:1.3}
        .sw-hum{fill:var(--good-bg);stroke:var(--good);stroke-width:1.3}
        .sw-t{fill:var(--ink);font:600 11.5px ui-sans-serif,system-ui,sans-serif}
        .sw-s{fill:var(--ink-3);font:400 9px ui-sans-serif,system-ui,sans-serif}
        .sw-ph{fill:var(--ink-3);font:700 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.09em}
        .sw-ln-t{fill:var(--ink-2);font:700 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.07em}
        .sw-ln-s{fill:var(--ink-3);font:400 8.5px ui-sans-serif,system-ui,sans-serif}
        .sw-flow{stroke:var(--ink-3);stroke-width:1.2;fill:none;marker-end:url(#sw-ar);opacity:.6}
        .sw-loop{stroke:var(--accent);stroke-width:1.4;fill:none;marker-end:url(#sw-ar-loop);stroke-dasharray:5 3}
        .sw-loop-t{fill:var(--accent);font:600 9px ui-sans-serif,system-ui,sans-serif}
      `}</style>

      {/* lane bands */}
      {LANES.map((l, i) => (
        <g key={l.name}>
          <rect x="0" y={TOP + i * LANE_H} width={width} height={LANE_H} className={i % 2 ? "sw-lane-alt" : "sw-lane"} />
          <text x="10" y={TOP + i * LANE_H + 20} className="sw-ln-t">{l.name}</text>
          <text x="10" y={TOP + i * LANE_H + 33} className="sw-ln-s">{l.sub}</text>
          <line x1="0" y1={TOP + i * LANE_H} x2={width} y2={TOP + i * LANE_H} stroke="var(--line)" strokeWidth="1" />
        </g>
      ))}
      <line x1="0" y1={TOP + LANES.length * LANE_H} x2={width} y2={TOP + LANES.length * LANE_H} stroke="var(--line)" />
      <line x1={LEFT - 8} y1={TOP} x2={LEFT - 8} y2={TOP + LANES.length * LANE_H} stroke="var(--line)" />

      {/* phase headers */}
      {PHASES.map((p, i) => (
        <g key={p}>
          <text x={colX(i) + 6} y={TOP - 14} className="sw-ph">{p}</text>
          {i > 0 && (
            <line
              x1={colX(i) - COL_GAP / 2}
              y1={TOP}
              x2={colX(i) - COL_GAP / 2}
              y2={TOP + LANES.length * LANE_H}
              stroke="var(--line)"
              strokeDasharray="3 3"
            />
          )}
        </g>
      ))}

      {/* forward flow arrows between phases, along the active lane */}
      {[
        [0, 0, 1, 0], [1, 0, 1, 1], [1, 1, 1, 3], [1, 3, 2, 0],
        [2, 0, 3, 2], [3, 2, 4, 1], [4, 1, 4, 3], [4, 3, 5, 0],
      ].map(([p1, l1, p2, l2], i) => {
        const x1 = colX(p1) + COL_W - 6;
        const y1 = TOP + l1 * LANE_H + 12 + BOX_H / 2;
        const x2 = colX(p2) + 6;
        const y2 = TOP + l2 * LANE_H + 12 + BOX_H / 2;
        if (p1 === p2) {
          const cx = colX(p1) + COL_W / 2;
          return <path key={i} className="sw-flow" d={`M${cx},${y1 + BOX_H / 2} L${cx},${y2 - BOX_H / 2 - 2}`} />;
        }
        const mx = (x1 + x2) / 2;
        return <path key={i} className="sw-flow" d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`} />;
      })}

      {/* boxes */}
      {pos.map(({ b, x, y, w }, i) => {
        const cls = b.kind === "ai" ? "sw-ai" : b.kind === "engine" ? "sw-eng" : b.kind === "human" ? "sw-hum" : "sw-sys";
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={BOX_H} rx="6" className={cls} />
            <text x={x + 10} y={y + 17} className="sw-t">{b.title}</text>
            {b.sub.split("\n").map((s, j) => (
              <text key={j} x={x + 10} y={y + 30 + j * 10} className="sw-s">{s}</text>
            ))}
          </g>
        );
      })}

      {/* human-in-the-loop rejection paths */}
      {(() => {
        const yApprove = TOP + 3 * LANE_H + 12 + BOX_H;
        const xApprove = colX(4) + COL_W / 2;
        const yCompute = TOP + 2 * LANE_H + 12 + BOX_H + 6 + BOX_H / 2;
        const xCompute = colX(3) + COL_W / 2;
        const loopY = TOP + LANES.length * LANE_H + 20;
        return (
          <>
            <path className="sw-loop" d={`M${xApprove},${yApprove} L${xApprove},${loopY} L${xCompute},${loopY} L${xCompute},${yCompute + BOX_H / 2 + 2}`} />
            <text x={(xApprove + xCompute) / 2} y={loopY + 14} className="sw-loop-t" textAnchor="middle">
              rejected → reason recorded, recomputed
            </text>
          </>
        );
      })()}

      {(() => {
        const yConfirm = TOP + 3 * LANE_H + 12 + BOX_H;
        const xConfirm = colX(1) + COL_W / 2;
        const loopY = TOP + LANES.length * LANE_H + 48;
        const xIngest = colX(1) + 30;
        const yIngest = TOP + 1 * LANE_H + 12 + BOX_H / 2;
        return (
          <>
            <path className="sw-loop" d={`M${xConfirm},${yConfirm} L${xConfirm},${loopY} L${xIngest - 40},${loopY} L${xIngest - 40},${yIngest}`} />
            <text x={xConfirm + 10} y={loopY + 14} className="sw-loop-t">
              not confirmed → extraction corrected, nothing priced until a human agrees
            </text>
          </>
        );
      })()}

      {/* legend */}
      {(() => {
        const y = TOP + LANES.length * LANE_H + 88;
        const items = [
          ["sw-sys", "source system"],
          ["sw-ai", "AI — proposes only"],
          ["sw-eng", "deterministic engine"],
          ["sw-hum", "human decision"],
        ];
        return items.map(([cls, label], i) => (
          <g key={label}>
            <rect x={10 + i * 190} y={y} width="14" height="12" rx="3" className={cls} />
            <text x={30 + i * 190} y={y + 10} className="sw-s" fill="var(--ink-2)">{label}</text>
          </g>
        ));
      })()}

      <text x="10" y={TOP + LANES.length * LANE_H + 124} className="sw-s" fill="var(--ink-2)">
        Two human gates: nothing is priced until extracted terms are confirmed, and nothing is executed until a recommendation is approved.
      </text>
    </svg>
  );
}
