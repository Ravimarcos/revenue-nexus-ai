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
 * Resolve the site URL from the environment rather than hardcoding it.
 *
 * If this is wrong, the OG image URL 404s and the link preview silently
 * renders without an image — a failure you would never notice, because
 * nothing errors. Vercel sets VERCEL_URL automatically on every deployment.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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
