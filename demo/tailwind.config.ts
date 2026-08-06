import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        line: "var(--line)",
        surface: "var(--surface)",
        accent: "var(--accent)",
        "accent-bg": "var(--accent-bg)",
        good: "var(--good)",
        "good-bg": "var(--good-bg)",
        blue: "var(--blue)",
        "blue-bg": "var(--blue-bg)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "-apple-system", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: { content: "1120px" },
    },
  },
  plugins: [],
} satisfies Config;
