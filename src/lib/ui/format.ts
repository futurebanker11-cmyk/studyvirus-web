import katex from "katex";

/**
 * The question bank is authored for the Android app, which renders a few
 * things the web never will. These helpers strip those app-only artefacts and
 * turn the remaining plain text into something the web can lay out.
 *
 * Everything here runs on the server: KaTeX renders to HTML at build/request
 * time so a content page ships no math JavaScript to a phone on 4G.
 */

/** App-only render hints: a 📊 [VISUAL:...] line and the DATA: line under it. */
export function stripVisualHints(text: string): string {
  return text
    .split("\n")
    .reduce<{ out: string[]; skipData: boolean }>(
      (acc, line) => {
        // The emoji is a surrogate pair, so it must be grouped before `?` —
        // a bare `📊?` would only make the low surrogate optional and would
        // never match a hint line written without the emoji.
        if (/^\s*(?:📊)?\s*\[VISUAL:/.test(line)) return { out: acc.out, skipData: true };
        if (acc.skipData && /^\s*DATA:/.test(line)) return { out: acc.out, skipData: false };
        return { out: [...acc.out, line], skipData: false };
      },
      { out: [], skipData: false },
    )
    .out.join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type Block = { kind: "bullet" | "sub" | "para"; text: string };

/**
 * Split an explanation into typed lines. Authors use `•` for a top-level point
 * and `–`/`-` for a nested one; anything else is a paragraph.
 */
export function explanationBlocks(text: string): Block[] {
  return stripVisualHints(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("•")) return { kind: "bullet" as const, text: line.slice(1).trim() };
      if (line.startsWith("–") || line.startsWith("-")) return { kind: "sub" as const, text: line.slice(1).trim() };
      return { kind: "para" as const, text: line };
    });
}

// $$block$$ and $inline$. A lone $ followed by a digit and later another $ with
// a space before it is currency, not math — require no space just inside the
// delimiters and at least one operator/letter to treat it as math.
const BLOCK = /\$\$([^$]+)\$\$/g;
const INLINE = /\$(\S(?:[^$\n]*\S)?)\$/g;
const LOOKS_MATHY = /[=+\-*/^_\\{}]|\\[a-zA-Z]+/;

/**
 * A body that is only digits, currency words and a separator is a pair of
 * prices, not an expression — "5 and $6" style spans reach here because the
 * inline delimiters are greedy across the intervening text. Requiring a run of
 * plain prose to disqualify the span keeps "12-5=7" (math) apart from
 * "5 and 6" and "120 and CP is 100" (rupees).
 */
const PROSE_INSIDE = /\s(?:and|or|to|for|is|at|by|per|each|then|than|of|the)\s/i;

export function renderInlineMath(text: string): string {
  let out = text.replace(BLOCK, (_m, body: string) =>
    katex.renderToString(body.trim(), { displayMode: true, throwOnError: false }),
  );
  out = out.replace(INLINE, (m, body: string) =>
    LOOKS_MATHY.test(body) && !PROSE_INSIDE.test(body)
      ? katex.renderToString(body.trim(), { displayMode: false, throwOnError: false })
      : m,
  );
  return out;
}
