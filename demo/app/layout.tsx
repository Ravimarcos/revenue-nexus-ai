import type { Metadata } from "next";
import "./globals.css";

const TITLE = "Revenue Nexus — why is this invoice this amount?";
const DESC =
  "An internal revenue operations portal. Contract, CRM, delivery, usage and billing reconciled into one view — with every rupee traced back to the clause that earned it. Working demo, ~6 min read.";

/**
 * Metadata is tuned for a shared link rather than for search. When this is
 * pasted into a chat, the preview card is often the only thing a recipient
 * sees before deciding whether to open it.
 */
/**
 * The canonical, stable public URL.
 *
 * Deliberately NOT derived from VERCEL_URL. That variable resolves to the
 * per-deployment hostname (revenue-nexus-abc123-....vercel.app), which
 * changes on every deploy and — with Vercel's deployment protection enabled —
 * redirects anonymous requests to a login page. The result is a link preview
 * with a broken image, and nothing errors to tell you.
 *
 * The production alias is stable and public, so it is what the metadata must
 * point at. Override with NEXT_PUBLIC_SITE_URL for a custom domain.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://revenue-nexus-ai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    type: "website",
    siteName: "Revenue Nexus",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
