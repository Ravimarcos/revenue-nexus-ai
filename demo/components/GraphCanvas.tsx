import type { LineageGraph, NodeKind } from "@/lib/lineage/build";

/**
 * Deliberately hand-laid out in columns rather than force-directed.
 *
 * A force-directed graph of 18 nodes looks impressive and communicates
 * nothing — the reader cannot tell which direction causality flows. A
 * left-to-right column layout makes the chain legible in one pass, which is
 * the entire purpose of this screen.
 */

const COLUMNS: { title: string; kinds: NodeKind[] }[] = [
  { title: "Client", kinds: ["customer"] },
  { title: "Agreement", kinds: ["contract", "amendment"] },
  { title: "Segments", kinds: ["segment"] },
  { title: "Catalog", kinds: ["product"] },
  { title: "Rules", kinds: ["rule"] },
  { title: "Evidence", kinds: ["evidence"] },
  { title: "Decision", kinds: ["decision"] },
];

const COL_W = 168;
const COL_GAP = 26;
const NODE_H = 58;
const NODE_GAP = 12;
const TOP = 34;

export function GraphCanvas({ graph }: { graph: LineageGraph }) {
  // Assign each node an (x, y) from its column and order within it.
  const placed = new Map<string, { x: number; y: number; w: number; h: number }>();
  const columns = COLUMNS.map((col, ci) => {
    const nodes = graph.nodes.filter((n) => col.kinds.includes(n.kind));
    nodes.forEach((n, ri) => {
      placed.set(n.id, {
        x: ci * (COL_W + COL_GAP),
        y: TOP + ri * (NODE_H + NODE_GAP),
        w: COL_W,
        h: NODE_H,
      });
    });
    return { ...col, nodes, ci };
  });

  const width = COLUMNS.length * (COL_W + COL_GAP) - COL_GAP;
  const maxRows = Math.max(...columns.map((c) => c.nodes.length));
  const height = TOP + maxRows * (NODE_H + NODE_GAP) + 10;

  const onPath = (id: string) => graph.auditPath.includes(id);
  const edgeOnPath = (a: string, b: string) => {
    const i = graph.auditPath.indexOf(a);
    const j = graph.auditPath.indexOf(b);
    return i >= 0 && j >= 0 && Math.abs(i - j) === 1;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="Lineage graph tracing the billing decision back through rules, catalog, contract and client"
      style={{ minWidth: width }}
    >
      <defs>
        <marker id="lg-arrow" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="var(--line)" strokeWidth="1.2" />
        </marker>
        <marker id="lg-arrow-hot" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
          <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
        </marker>
      </defs>

      {columns.map((c) => (
        <text
          key={c.title}
          x={c.ci * (COL_W + COL_GAP)}
          y={16}
          fontSize="9.5"
          fontWeight="700"
          letterSpacing="0.09em"
          fill="var(--ink-3)"
        >
          {c.title.toUpperCase()}
        </text>
      ))}

      {/* Edges first, so nodes sit above them */}
      {graph.edges.map((e, i) => {
        const a = placed.get(e.from);
        const b = placed.get(e.to);
        if (!a || !b) return null;
        const hot = edgeOnPath(e.from, e.to) || edgeOnPath(e.to, e.from);
        const x1 = a.x + a.w;
        const y1 = a.y + a.h / 2;
        const x2 = b.x;
        const y2 = b.y + b.h / 2;
        const mx = (x1 + x2) / 2;
        return (
          <path
            key={i}
            d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
            fill="none"
            stroke={hot ? "var(--accent)" : "var(--line)"}
            strokeWidth={hot ? 1.6 : 1}
            markerEnd={hot ? "url(#lg-arrow-hot)" : "url(#lg-arrow)"}
            opacity={hot ? 0.9 : 0.65}
          />
        );
      })}

      {graph.nodes.map((n) => {
        const p = placed.get(n.id);
        if (!p) return null;
        const hot = onPath(n.id);
        const ownedNode = n.authority === "OWNED";
        return (
          <g key={n.id}>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              rx="7"
              fill={hot ? "var(--accent-bg)" : ownedNode ? "#fff" : "var(--surface)"}
              stroke={hot ? "var(--accent)" : "var(--line)"}
              strokeWidth={hot ? 1.5 : 1}
            />
            {ownedNode && (
              <rect x={p.x} y={p.y} width="3" height={p.h} rx="1.5" fill="var(--accent)" opacity={hot ? 1 : 0.45} />
            )}
            <text x={p.x + 11} y={p.y + 19} fontSize="11.5" fontWeight="600" fill="var(--ink)">
              {clip(n.label, 21)}
            </text>
            {n.sublabel && (
              <text x={p.x + 11} y={p.y + 33} fontSize="9.5" fill="var(--ink-2)">
                {clip(n.sublabel, 25)}
              </text>
            )}
            {n.amount ? (
              <text x={p.x + 11} y={p.y + 48} fontSize="10.5" fontWeight="600" fill="var(--accent)">
                {n.amount}
              </text>
            ) : (
              n.detail && (
                <text x={p.x + 11} y={p.y + 47} fontSize="9" fill="var(--ink-3)">
                  {clip(n.detail, 27)}
                </text>
              )
            )}
          </g>
        );
      })}
    </svg>
  );
}

function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
