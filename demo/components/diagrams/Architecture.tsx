/**
 * Platform architecture.
 *
 * The single idea the diagram has to carry: accent = what we are authoritative
 * for, neutral = what we mirror. Two colours only, so the eye reads the
 * authority split before it reads any label.
 */
export function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 900 636"
      className="w-full h-auto"
      role="img"
      aria-labelledby="archT archD"
    >
      <title id="archT">Revenue Nexus platform architecture</title>
      <desc id="archD">
        Eight tiers. Web application, API gateway with authentication, AI explanation layer, then
        the core split into a system of record we own — product catalog, pricing engine, rules
        engine, billing decision — and a read-only system of reference mirroring customer,
        contract, usage and invoices. Below: event bus, Postgres and graph storage, integration
        gateway, and external source systems.
      </desc>

      <defs>
        <marker id="a-ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--line)" strokeWidth="1.3" />
        </marker>
      </defs>

      <style>{`
        .a-bx{fill:#fff;stroke:var(--line);stroke-width:1}
        .a-mir{fill:var(--surface);stroke:var(--line);stroke-width:1}
        .a-own{fill:var(--accent-bg);stroke:var(--accent);stroke-width:1.3}
        .a-grp{fill:none;stroke:var(--line);stroke-width:1;stroke-dasharray:3 3}
        .a-t{fill:var(--ink);font:600 12.5px ui-sans-serif,system-ui,sans-serif}
        .a-s{fill:var(--ink-3);font:400 10px ui-sans-serif,system-ui,sans-serif}
        .a-tier{fill:var(--ink-3);font:700 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.11em}
        .a-own-tier{fill:var(--accent);font:700 9px ui-sans-serif,system-ui,sans-serif;letter-spacing:.11em}
        .a-ln{stroke:var(--line);stroke-width:1.3;fill:none;marker-end:url(#a-ar)}
      `}</style>

      {/* legend */}
      <rect x="30" y="8" width="10" height="10" rx="2" className="a-own" />
      <text x="46" y="17" className="a-s">system of record — we own this, invariants enforced</text>
      <rect x="360" y="8" width="10" height="10" rx="2" className="a-mir" />
      <text x="376" y="17" className="a-s">system of reference — read-only mirror, never written back</text>

      {/* 1 · presentation */}
      <text x="30" y="44" className="a-tier">PRESENTATION</text>
      <rect x="30" y="50" width="840" height="42" rx="7" className="a-bx" />
      <text x="450" y="68" className="a-t" textAnchor="middle">Web Application</text>
      <text x="450" y="83" className="a-s" textAnchor="middle">
        React · Next.js · dashboard, contract, billing review, explanation, lineage
      </text>

      <path className="a-ln" d="M450,92 L450,108" />

      {/* 2 · gateway */}
      <rect x="30" y="112" width="840" height="34" rx="7" className="a-bx" />
      <text x="450" y="133" className="a-t" textAnchor="middle">
        API Gateway · OAuth 2.0 / OIDC · role-based access · rate limiting
      </text>

      <path className="a-ln" d="M450,146 L450,162" />

      {/* 3 · AI */}
      <text x="30" y="160" className="a-tier">AI LAYER</text>
      <rect x="30" y="166" width="840" height="60" rx="7" className="a-grp" />
      <rect x="42" y="177" width="268" height="38" rx="5" className="a-bx" />
      <text x="176" y="192" className="a-t" textAnchor="middle">Explanation Agent</text>
      <text x="176" y="206" className="a-s" textAnchor="middle">renders the trace · never computes</text>
      <rect x="316" y="177" width="268" height="38" rx="5" className="a-bx" />
      <text x="450" y="192" className="a-t" textAnchor="middle">Contract Extraction</text>
      <text x="450" y="206" className="a-s" textAnchor="middle">proposes · human confirms</text>
      <rect x="590" y="177" width="268" height="38" rx="5" className="a-bx" />
      <text x="724" y="192" className="a-t" textAnchor="middle">Entity Resolution</text>
      <text x="724" y="206" className="a-s" textAnchor="middle">matches across systems</text>

      <path className="a-ln" d="M450,226 L450,246" />

      {/* 4 · core — system of record */}
      <text x="30" y="262" className="a-own-tier">SYSTEM OF RECORD</text>
      <rect x="30" y="268" width="498" height="152" rx="7" className="a-grp" />
      <rect x="42" y="280" width="230" height="42" rx="5" className="a-own" />
      <text x="157" y="297" className="a-t" textAnchor="middle">Product Catalog</text>
      <text x="157" y="311" className="a-s" textAnchor="middle">admin-configured, versioned</text>
      <rect x="284" y="280" width="232" height="42" rx="5" className="a-own" />
      <text x="400" y="297" className="a-t" textAnchor="middle">Pricing Engine</text>
      <text x="400" y="311" className="a-s" textAnchor="middle">pure function · no I/O</text>
      <rect x="42" y="332" width="230" height="42" rx="5" className="a-own" />
      <text x="157" y="349" className="a-t" textAnchor="middle">Rules Engine</text>
      <text x="157" y="363" className="a-s" textAnchor="middle">constrained DSL · decision tree</text>
      <rect x="284" y="332" width="232" height="42" rx="5" className="a-own" />
      <text x="400" y="349" className="a-t" textAnchor="middle">Billing Decision</text>
      <text x="400" y="363" className="a-s" textAnchor="middle">recommends · never issues</text>
      <text x="279" y="398" className="a-s" textAnchor="middle">
        Modular monolith · bounded contexts enforced in-process
      </text>
      <text x="279" y="411" className="a-s" textAnchor="middle">
        every amount carries a complete rule firing trace
      </text>

      {/* 4b · system of reference */}
      <text x="548" y="262" className="a-tier">SYSTEM OF REFERENCE</text>
      <rect x="548" y="268" width="322" height="152" rx="7" className="a-grp" />
      <rect x="560" y="280" width="146" height="38" rx="5" className="a-mir" />
      <text x="633" y="303" className="a-t" textAnchor="middle">Client</text>
      <rect x="716" y="280" width="142" height="38" rx="5" className="a-mir" />
      <text x="787" y="303" className="a-t" textAnchor="middle">Contract</text>
      <rect x="560" y="326" width="146" height="38" rx="5" className="a-mir" />
      <text x="633" y="349" className="a-t" textAnchor="middle">Usage</text>
      <rect x="716" y="326" width="142" height="38" rx="5" className="a-mir" />
      <text x="787" y="349" className="a-t" textAnchor="middle">Invoice</text>
      <text x="709" y="386" className="a-s" textAnchor="middle">
        &quot;as of&quot; timestamped · no invariants enforced
      </text>
      <text x="709" y="399" className="a-s" textAnchor="middle">
        installs with read-only credentials
      </text>
      <path
        d="M709,412 L709,424 L279,424 L279,414"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.3"
        markerEnd="url(#a-ar)"
      />
      <text x="494" y="437" className="a-s" textAnchor="middle">feeds</text>

      <path className="a-ln" d="M279,420 L279,444" />

      {/* 5 · event bus */}
      <text x="30" y="458" className="a-tier">EVENTS</text>
      <rect x="30" y="450" width="840" height="32" rx="7" className="a-bx" />
      <text x="450" y="470" className="a-t" textAnchor="middle">
        Domain Events — ContractExecuted · UsageRecorded · ObligationSatisfied · PriceComputed
      </text>

      <path className="a-ln" d="M170,482 L170,498" />
      <path className="a-ln" d="M450,482 L450,498" />
      <path className="a-ln" d="M730,482 L730,498" />

      {/* 6 · persistence */}
      <text x="30" y="514" className="a-tier">PERSISTENCE</text>
      <rect x="30" y="502" width="266" height="48" rx="7" className="a-own" />
      <text x="163" y="521" className="a-t" textAnchor="middle">PostgreSQL</text>
      <text x="163" y="536" className="a-s" textAnchor="middle">transactional source of truth</text>
      <rect x="317" y="502" width="266" height="48" rx="7" className="a-mir" />
      <text x="450" y="521" className="a-t" textAnchor="middle">Graph read model</text>
      <text x="450" y="536" className="a-s" textAnchor="middle">lineage · projected from events</text>
      <rect x="604" y="502" width="266" height="48" rx="7" className="a-mir" />
      <text x="737" y="521" className="a-t" textAnchor="middle">Cache</text>
      <text x="737" y="536" className="a-s" textAnchor="middle">rating memoisation</text>

      {/* 7 · integration */}
      <text x="30" y="578" className="a-tier">INTEGRATION</text>
      <rect x="30" y="566" width="840" height="32" rx="7" className="a-bx" />
      <text x="450" y="586" className="a-t" textAnchor="middle">
        Integration Gateway — webhooks · incremental polling · idempotent ingest · reconciliation loop
      </text>

      {/* 8 · external */}
      <rect x="30" y="610" width="132" height="22" rx="4" className="a-mir" />
      <text x="96" y="625" className="a-s" textAnchor="middle">HubSpot</text>
      <rect x="172" y="610" width="132" height="22" rx="4" className="a-mir" />
      <text x="238" y="625" className="a-s" textAnchor="middle">Provisioning</text>
      <rect x="314" y="610" width="132" height="22" rx="4" className="a-mir" />
      <text x="380" y="625" className="a-s" textAnchor="middle">Billing system</text>
      <rect x="456" y="610" width="132" height="22" rx="4" className="a-mir" />
      <text x="522" y="625" className="a-s" textAnchor="middle">Tally / ERP</text>
      <rect x="598" y="610" width="132" height="22" rx="4" className="a-mir" />
      <text x="664" y="625" className="a-s" textAnchor="middle">Usage telemetry</text>
      <rect x="740" y="610" width="130" height="22" rx="4" className="a-mir" />
      <text x="805" y="625" className="a-s" textAnchor="middle">GST portal</text>
    </svg>
  );
}
