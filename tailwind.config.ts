import type { Config } from "tailwindcss";

/**
 * Colours here are only ever `var(--token)`. The tokens themselves live in
 * `src/app/globals.css`, which is the single place a hex value is written.
 * That keeps light/dark switching free: a utility class resolves to whatever
 * the active theme defined.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-sunk": "var(--surface-sunk)",

        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-faint": "var(--ink-faint)",

        line: "var(--line)",
        "line-strong": "var(--line-strong)",

        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-ink": "var(--accent-ink)",
        "accent-wash": "var(--accent-wash)",

        ok: "var(--ok)",
        "ok-wash": "var(--ok-wash)",
        warn: "var(--warn)",
        "warn-wash": "var(--warn-wash)",
        err: "var(--err)",
        "err-wash": "var(--err-wash)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        deva: ["var(--font-deva)"],
      },
      maxWidth: {
        measure: "var(--measure)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        lift: "var(--shadow-lift)",
      },
      borderColor: {
        DEFAULT: "var(--line)",
      },
    },
  },
  plugins: [],
};
export default config;
