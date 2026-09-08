import type { Lang } from "@/lib/i18n/lang";

/**
 * One question, in the single shape every content page renders.
 *
 * The question bank stores two different things under the word "question", and
 * four later tasks (topics, PYQ, aptitude, English/CA) all render through here,
 * so this is the one place that difference is resolved.
 *
 * ── The two real shapes, verified against production content 2026-09-08 ──
 *
 * GK (`gk/{folder}/{chapter}.json`, e.g. gk/1-Indian History/1-Indus Valley.json):
 *
 *   { "en": [ {id, q, options[4], answer: "A"-"D", explain}, … ],
 *     "hi": [ {id, q, options[4], answer: "A"-"D", explain}, … ] }
 *
 *   Language is a property of the FILE, not of the question: the two arrays are
 *   parallel and every object inside them has the identical five keys. Surveyed
 *   across 30 chapter files / 3,818 questions: 100% carried exactly those keys,
 *   100% had four options, and 100% stored `answer` as a single uppercase
 *   letter. There is no `q_hi`, no `options_hi`, no `explain_hi` in the GK bank.
 *   The PAGE picks the array for its language; `lang` therefore has no effect
 *   on a GK question here, and must not — looking for a "_hi" field that does
 *   not exist would blank out every Hindi question on the site.
 *
 * Aptitude (`gk/aptitude/content/…/Set NN.json`, `bank/…`):
 *
 *   { questions: [ {id, question, question_hi, options[4], options_hi[4],
 *                   correct_index, solution_conventional(_hi),
 *                   solution_shortcut(_hi), trap_warning(_hi), …}, … ] }
 *
 *   Here BOTH languages live on ONE object, so `lang` does the choosing.
 *   Surveyed across 8 sets / 78 questions: `correct_index` was an integer every
 *   time, options were four every time, and `options_hi` was present and the
 *   same length every time. The fallbacks below are for the day that stops
 *   being true, not for today.
 *
 * ── The rule that matters ──
 *
 * `correctIndex` is -1 whenever the source does not unambiguously identify one
 * of the options that are actually being rendered. Marking the WRONG option
 * correct is the single failure a reader trusts completely and cannot detect,
 * so every uncertain path here resolves to "mark nothing" rather than to a
 * guess. QuestionList renders an unmarked question as a plain list — still
 * useful, and honest about what it does not know.
 */
export interface NormalisedQuestion {
  stem: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  shortcut?: string;
  trap?: string;
  id?: string;
}

type Raw = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

/**
 * The requested language's field, falling back to English.
 *
 * A partially-translated aptitude question is real: the Hindi columns are
 * filled chapter by chapter. Showing the English is right; showing an empty
 * stem is not. `.trim()` catches the whitespace-only placeholder ("   ", "x")
 * that a half-finished translation pass leaves behind.
 */
function pick(raw: Raw, en: string, hi: string, lang: Lang): string {
  const wanted = lang === "hi" ? str(raw[hi]).trim() : "";
  return wanted || str(raw[en]);
}

export function normaliseQuestion(raw: Raw, lang: Lang): NormalisedQuestion {
  // `question` is the aptitude discriminator; GK uses `q`. Testing for the
  // aptitude key (rather than for the absence of `q`) means an unrecognised
  // object falls into the GK branch and yields an empty, harmless question
  // rather than throwing on a page that has 24 other good ones.
  const isApt = typeof raw.question === "string";

  const optionsEn = arr(raw.options);
  const optionsHi = arr(raw.options_hi);

  // Hindi options are used only when there are the same number of them.
  // `correct_index` indexes the English array; a Hindi array of a different
  // length would silently shift which option gets the tick — the exact
  // wrong-mark failure this function exists to prevent. A short or empty
  // options_hi therefore falls back to the English array whole, never
  // element-by-element.
  const options =
    isApt && lang === "hi" && optionsHi.length === optionsEn.length && optionsHi.length > 0
      ? optionsHi
      : optionsEn;

  let correctIndex = -1;
  if (isApt) {
    // Number.isInteger, not `typeof === "number"`: 1.5 and NaN are numbers and
    // neither is an option index.
    const ci = raw.correct_index;
    correctIndex = Number.isInteger(ci) && (ci as number) >= 0 && (ci as number) < options.length
      ? (ci as number)
      : -1;
  } else {
    // "A"-"D" (or beyond, for a longer list). Trimmed and upper-cased because
    // " d " is the same answer; anything that is not a single letter — a digit,
    // an empty string, a number, a missing field — resolves to -1 rather than
    // to a guess. A digit is deliberately NOT read as an index: "3" could mean
    // the third option (1-based) or the fourth (0-based), the real bank never
    // writes one, and picking wrong marks the wrong option correct.
    const a = str(raw.answer).trim().toUpperCase();
    const i = /^[A-Z]$/.test(a) ? a.charCodeAt(0) - 65 : -1;
    correctIndex = i >= 0 && i < options.length ? i : -1;
  }

  // Empty string → undefined, so a caller can test `if (q.shortcut)` and the
  // renderer never emits an empty "Shortcut" heading over nothing.
  const shortcut = isApt ? pick(raw, "solution_shortcut", "solution_shortcut_hi", lang) : "";
  const trap = isApt ? pick(raw, "trap_warning", "trap_warning_hi", lang) : "";

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    stem: isApt ? pick(raw, "question", "question_hi", lang) : str(raw.q),
    options,
    correctIndex,
    explanation: isApt
      ? pick(raw, "solution_conventional", "solution_conventional_hi", lang)
      : str(raw.explain),
    shortcut: shortcut || undefined,
    trap: trap || undefined,
  };
}
