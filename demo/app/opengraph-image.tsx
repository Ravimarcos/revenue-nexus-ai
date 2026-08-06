import { ImageResponse } from "next/og";

/**
 * The link preview card.
 *
 * When a link is pasted into WhatsApp or Slack, this image IS the pitch —
 * often the only thing a recipient sees before deciding whether to tap. It
 * gets the headline question and the one number that makes the point.
 */
export const runtime = "edge";
export const alt = "Revenue Nexus AI — one place where the contract and the invoice agree";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf9f5",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              letterSpacing: 2,
              color: "#b4553b",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Internal Revenue Operations Portal
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#26251f",
              lineHeight: 1.05,
              letterSpacing: -2,
              marginTop: 26,
            }}
          >
            Why is this invoice
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              color: "#26251f",
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            this amount?
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#55544c",
              marginTop: 26,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            Contract, CRM, delivery, usage and billing — reconciled, with every rupee traced back to
            the clause that earned it.
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {[
            ["₹8,60,562.56", "recommended", "#26251f"],
            ["₹12,00,000", "held, with a reason", "#b4553b"],
            ["₹1,16,477", "error avoided", "#b4553b"],
            ["35 / 35", "golden tests", "#26251f"],
          ].map(([v, l, c]) => (
            <div
              key={l}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                border: "1px solid #e4e2da",
                borderRadius: 14,
                padding: "18px 24px",
                flex: 1,
              }}
            >
              <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ display: "flex", fontSize: 18, color: "#86857c", marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
