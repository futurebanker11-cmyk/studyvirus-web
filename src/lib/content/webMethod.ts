import { getJson } from "./loader";
import { keys, type AptitudeFamily } from "./keys";

/**
 * The web-only "method" note for one aptitude chapter — the formula, one
 * worked example and the mistakes that cost marks.
 *
 * ── Why this is a separate object, and why null is the normal answer ──
 *
 * The question bank has no room for a chapter-level explainer: a set file is a
 * list of questions, and the manifest carries names and folders. So the method
 * note lives on its own key, `gk/aptitude/web-method/{family}/{chapterId}.json`
 * (keys.webMethod), authored per chapter as the section grows.
 *
 * NOTHING is authored yet. Every path was checked live on 2026-09-08 and every
 * one 404s, so `null` is what production returns for all 119 chapters today,
 * and the chapter page's plain H1 branch is the one real readers meet. That is
 * why this returns `null` rather than throwing on a miss: a chapter with no
 * method note is the ordinary case, not an error, and the page simply omits
 * the section. getJson already answers `null` for a missing object and for
 * malformed JSON, so no try/catch is needed here.
 *
 * ── Why the fields are validated rather than cast ──
 *
 * These files are hand-authored, which is exactly the source that eventually
 * ships a `mistakes` written as a string instead of an array, or an example
 * left out of a first draft. A blind cast would put `undefined.map` on a
 * production page. Each field is coerced to the type the page renders, and a
 * file whose English formula is empty is treated as not authored at all —
 * the page's whole method-first branch keys off this returning non-null, and
 * an empty shell would give a reader an H1 promising a formula over nothing.
 *
 * Hindi is optional per field: a note may be authored in English first. The
 * page falls back to the English text rather than rendering a blank section.
 */
export interface WebMethod {
  formula_en: string;
  formula_hi: string;
  example_en: string;
  example_hi: string;
  mistakes_en: string[];
  mistakes_hi: string[];
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : [];

export async function loadWebMethod(
  family: AptitudeFamily,
  chapterId: string,
): Promise<WebMethod | null> {
  const raw = await getJson<Record<string, unknown>>(keys.webMethod(family, chapterId));
  if (!raw || typeof raw !== "object") return null;

  const formula_en = str(raw.formula_en);
  // The English formula is the one required field: it is what the method-first
  // H1 advertises. Without it there is no method note, whatever else the file
  // happens to carry.
  if (!formula_en) return null;

  const example_en = str(raw.example_en);
  const mistakes_en = strs(raw.mistakes_en);

  return {
    formula_en,
    // Hindi falls back to the English so a half-translated note still renders
    // a complete Hindi page rather than an empty box under a heading.
    formula_hi: str(raw.formula_hi) || formula_en,
    example_en,
    example_hi: str(raw.example_hi) || example_en,
    mistakes_en,
    mistakes_hi: strs(raw.mistakes_hi).length > 0 ? strs(raw.mistakes_hi) : mistakes_en,
  };
}
