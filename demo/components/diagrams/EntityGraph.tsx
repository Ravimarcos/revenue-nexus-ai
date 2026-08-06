import { ENTITIES, RELATIONSHIPS, DOMAINS, type Domain } from "@/lib/platform/entity-model";

/**
 * Entity-relationship graph, clustered by domain.
 *
 * Laid out by hand rather than force-directed, and grouped into domain
 * clusters rather than strung left to right — because the question this has
 * to answer is "what are the things and how do they connect", not "what
 * happens first". A flow chart cannot answer that.
 */

type P = { x: number; y: number };

// Hand-placed so related entities sit near each other and edges stay readable.
const POS: Record<string, P> = {
  // COMMERCIAL — top left
  client: { x: 40, y: 60 },
  "billing-entity": { x: 40, y: 122 },
  contact: { x: 40, y: 184 },
  contract: { x: 214, y: 92 },
  clause: { x: 214, y: 154 },
  amendment: { x: 214, y: 30 },
  renewal: { x: 40, y: 246 },

  // CATALOG — top right
  product: { x: 560, y: 30 },
  "pricing-plan": { x: 734, y: 30 },
  "rate-card": { x: 908, y: 30 },
  rule: { x: 734, y: 92 },

  // DELIVERY — middle
  obligation: { x: 388, y: 154 },
  entitlement: { x: 388, y: 92 },
  activity: { x: 388, y: 278 },
  satisfaction: { x: 388, y: 216 },

  // CONSUMPTION — middle right
  usage: { x: 560, y: 216 },
  segment: { x: 560, y: 154 },

  // FINANCIAL — bottom right
  decision: { x: 734, y: 216 },
  invoice: { x: 908, y: 216 },
  "credit-note": { x: 908, y: 278 },
  payment: { x: 908, y: 340 },
  tds: { x: 908, y: 402 },

  // GOVERNANCE — bottom left/middle
  approval: { x: 734, y: 340 },
  audit: { x: 734, y: 402 },
};

const W = 156;
const H = 46;

const DOMAIN_COLOUR: Record<Domain, string> = {
  COMMERCIAL: "var(--blue)",
  CATALOG: "var(--accent)",
  DELIVERY: "var(--good)",
  CONSUMPTION: "var(--good)",
  FINANCIAL: "var(--ink-2)",
  GOVERNANCE: "var(--ink-3)",
};

const AUTH_FILL: Record<string, string> = {
  OWNED: "var(--accent-bg)",
  MIRRORED: "#ffffff",
  DERIVED: "var(--blue-bg)",
};

export function EntityGraph() {
  const VB_W = 1090;
  const VB_H = 500;

  const centre = (id: string) => {
    const p = POS[id];
    return p ? { x: p.x + W / 2, y: p.y + H / 2 } : null;
  };

  /** Anchor the edge on whichever side of the box faces the target. */
  function anchor(a: P, b: P) {
    const ax = a.x + W / 2, ay = a.y + H / 2;
    const bx = b.x + W / 2, by = b.y + H / 2;
    const dx = bx - ax, dy = by - ay;
    if (Math.abs(dx) > Math.abs(dy) * 1.4) {
      return dx > 0
        ? { x1: a.x + W, y1: ay, x2: b.x, y2: by }
        : { x1: a.x, y1: ay, x2: b.x + W, y2: by };
    }
    return dy > 0
      ? { x1: ax, y1: a.y + H, x2: bx, y2: b.y }
      : { x1: ax, y1: a.y, x2: bx, y2: b.y + H };
  }

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-labelledby="egT egD">
      <title id="egT">Entity relationship model</title>
      <desc id="egD">
        Twenty-four entities across six domains — commercial, catalog, delivery, consumption,
        financial and governance — connected by thirty typed relationships. Client has billing
        entities and is party to contracts; contracts contain clauses and are amended; products are
        priced by plans and template obligations; activities evidence satisfaction; entitlements
        limit usage; amendments create rating segment boundaries; rules produce billing decisions,
        which recommend invoices, settled by payments carrying TDS credits.
      </desc>

      <defs>
        <marker id="eg-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--ink-3)" />
        </marker>
      </defs>

      <style>{`
        .eg-box{stroke-width:1.3}
        .eg-n{fill:var(--ink);font:600 11.5px ui-sans-serif,system-ui,sans-serif}
        .eg-d{fill:var(--ink-3);font:400 8.5px ui-sans-serif,system-ui,sans-serif}
        .eg-e{stroke:var(--ink-3);stroke-width:1;fill:none;marker-end:url(#eg-ar);opacity:.45}
        .eg-el{fill:var(--ink-3);font:600 7px ui-sans-serif,system-ui,sans-serif;letter-spacing:.03em}
        .eg-dom{font:700 8.5px ui-sans-serif,system-ui,sans-serif;letter-spacing:.1em}
      `}</style>

      {/* edges first */}
      {RELATIONSHIPS.map((r, i) => {
        const a = POS[r.from], b = POS[r.to];
        if (!a || !b) return null;
        const { x1, y1, x2, y2 } = anchor(a, b);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const horizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
        const d = horizontal
          ? `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2 - 2},${y2}`
          : `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2 - 2}`;
        return (
          <g key={i}>
            <path className="eg-e" d={d} />
            <text x={mx} y={my - 3} className="eg-el" textAnchor="middle">
              {r.type}
            </text>
          </g>
        );
      })}

      {/* entities */}
      {ENTITIES.map((e) => {
        const p = POS[e.id];
        if (!p) return null;
        const stroke = DOMAIN_COLOUR[e.domain];
        return (
          <g key={e.id}>
            <rect
              x={p.x} y={p.y} width={W} height={H} rx="6"
              className="eg-box"
              fill={AUTH_FILL[e.authority]}
              stroke={stroke}
              strokeOpacity={e.authority === "MIRRORED" ? 0.45 : 0.85}
              strokeDasharray={e.authority === "DERIVED" ? "4 3" : undefined}
            />
            <rect x={p.x} y={p.y} width="3.5" height={H} rx="1.75" fill={stroke} opacity="0.8" />
            <text x={p.x + 11} y={p.y + 19} className="eg-n">{e.name}</text>
            <text x={p.x + 11} y={p.y + 33} className="eg-d">
              {e.source.length > 26 ? e.source.slice(0, 25) + "…" : e.source}
            </text>
          </g>
        );
      })}

      {/* domain legend */}
      {DOMAINS.map((d, i) => (
        <g key={d.id}>
          <rect x={40 + i * 172} y={VB_H - 42} width="10" height="10" rx="2" fill={DOMAIN_COLOUR[d.id]} opacity="0.85" />
          <text x={56 + i * 172} y={VB_H - 33} className="eg-d" fill="var(--ink-2)">{d.label}</text>
        </g>
      ))}

      {/* authority legend */}
      <g>
        <rect x="40" y={VB_H - 20} width="10" height="10" rx="2" fill="var(--accent-bg)" stroke="var(--accent)" />
        <text x="56" y={VB_H - 11} className="eg-d">we own it</text>
        <rect x="150" y={VB_H - 20} width="10" height="10" rx="2" fill="#fff" stroke="var(--ink-3)" strokeOpacity=".5" />
        <text x="166" y={VB_H - 11} className="eg-d">mirrored from a source system</text>
        <rect x="360" y={VB_H - 20} width="10" height="10" rx="2" fill="var(--blue-bg)" stroke="var(--blue)" strokeDasharray="3 2" />
        <text x="376" y={VB_H - 11} className="eg-d">derived — computed, never entered</text>
      </g>
    </svg>
  );
}
