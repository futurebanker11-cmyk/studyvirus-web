import type { Lang } from "@/lib/i18n/lang";
import { t, format } from "@/lib/ui/strings";
import { explanationBlocks } from "@/lib/ui/format";
import { normaliseQuestion, type NormalisedQuestion } from "./normaliseQuestion";
import Math from "./Math";

/**
 * The question renderer. Every question on the site is drawn by this file.
 *
 * ── A server component, and it must stay one ──
 *
 * There is no "use client" here and there must never be. The stem, the four
 * options, the mark on the correct one, the answer line and the explanation
 * are all in the HTML the server sends — that is what makes them indexable,
 * readable with JavaScript off, and present for a screen reader before any
 * hydration. Practice mode hides them with CSS (see globals.css); it does not
 * remove them from the document. The site was flagged for a JS-dependent
 * content gap and this component is the fix.
 *
 * KaTeX runs here too, on the server, via <Math> — a phone on 4G downloads no
 * math JavaScript for a page full of worked solutions.
 *
 * ── Both shapes, one renderer ──
 *
 * normaliseQuestion() resolves GK (`{q, options, answer:"A"-"D", explain}`)
 * and aptitude (`{question, question_hi, correct_index, solution_*}`) to one
 * NormalisedQuestion, so nothing below this line knows which bank a question
 * came from. Aptitude's extra parts — a shortcut method and a trap warning —
 * render only when present, so a GK question is not followed by two empty
 * headings.
 */

/** The letter shown against an option: A, B, C, D … */
const LETTERS = "ABCDEFGHIJ";

function Explanation({ text }: { text: string }) {
  // explanationBlocks (Task 2) does the bullet/sub-bullet parsing; <Math> does
  // the LaTeX. Neither is reimplemented here.
  //
  // No `lang` prop: the <article> below carries lang={lang}, and globals.css
  // selects the Devanagari serif with `:lang(hi)`, which inherits. Marking
  // every inline run would repeat the attribute hundreds of times per page
  // for no change in rendering.
  const blocks = explanationBlocks(text);
  if (blocks.length === 0) return null;

  return (
    <div className="mt-1 space-y-1.5">
      {blocks.map((b, i) => {
        if (b.kind === "bullet") {
          return (
            <p key={i} className="flex gap-2 text-[0.95rem] leading-relaxed">
              <span aria-hidden="true" className="select-none text-ink-faint">
                •
              </span>
              <Math text={b.text} />
            </p>
          );
        }
        if (b.kind === "sub") {
          return (
            <p key={i} className="flex gap-2 pl-4 text-[0.9rem] leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="select-none text-ink-faint">
                –
              </span>
              <Math text={b.text} />
            </p>
          );
        }
        return (
          <p key={i} className="text-[0.95rem] leading-relaxed">
            <Math text={b.text} />
          </p>
        );
      })}
    </div>
  );
}

/**
 * A labelled block under the answer — the explanation, the shortcut, the trap.
 *
 * Marked `.explanation` so practice mode's CSS hides all three together: a
 * worked solution and a "common mistake" note both give the answer away.
 */
function Aside({
  label,
  text,
  tone = "plain",
}: {
  label: string;
  text: string;
  tone?: "plain" | "warn";
}) {
  return (
    <div
      className={`explanation mt-3 ${
        tone === "warn" ? "rounded-md border border-line bg-warn-wash px-3 py-2" : ""
      }`}
    >
      <p
        className={`ui text-xs font-semibold uppercase tracking-wide ${
          tone === "warn" ? "text-warn" : "text-ink-faint"
        }`}
      >
        {label}
      </p>
      <Explanation text={text} />
    </div>
  );
}

export function Question({
  question,
  number,
  lang,
}: {
  question: NormalisedQuestion;
  number: number;
  lang: Lang;
}) {
  const q = question;
  const marked = q.correctIndex >= 0 && q.correctIndex < q.options.length;

  return (
    <article
      // `lang` on the question, not on each run inside it: globals.css picks
      // the Devanagari serif (and its matched optical size and line-height)
      // off `:lang(hi)`, which inherits, and a crawler is told which language
      // the question is in.
      lang={lang}
      className="border-b border-line py-6 first:pt-0 last:border-b-0"
      // The bank's own id, so a report filed against this question names
      // something the CMS can look up.
      data-question-id={q.id}
    >
      <h2 className="ui text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {format(lang, "set.questionN", { n: number })}
      </h2>

      <div className="mt-1.5 text-[1.05rem] font-medium leading-snug">
        <Math text={q.stem} />
      </div>

      {q.options.length > 0 && (
        <ol className="mt-3 space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = marked && i === q.correctIndex;
            return (
              <li
                key={i}
                // `option-correct` is what practice mode neutralises. The
                // option is ALWAYS rendered with its real state in the HTML;
                // only its appearance changes.
                className={`flex min-h-[44px] items-start gap-3 rounded-md border px-3 py-2 text-[0.97rem] ${
                  isCorrect
                    ? "option-correct border-ok bg-ok-wash"
                    : "border-line bg-surface"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`ui mt-0.5 shrink-0 font-semibold ${
                    isCorrect ? "text-ok" : "text-ink-faint"
                  }`}
                >
                  {LETTERS[i] ?? i + 1}.
                </span>
                <span className="min-w-0 flex-1">
                  <Math text={opt} />
                </span>
                {isCorrect && (
                  // Colour is never the only signal: the tick is a second one,
                  // and the visually-hidden text is a third for a screen
                  // reader. All three are hidden together in practice mode.
                  <span className="option-mark shrink-0 text-ok">
                    <svg
                      aria-hidden="true"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-1"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span className="sr-only">{t(lang, "set.correctOption")}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* The answer line. `.answer` is the practice-mode hook. When the source
          does not identify an option, this says so rather than going quiet —
          a silent question looks like a rendering bug to a reader. */}
      <p className="answer ui mt-3 text-sm">
        <span className="font-semibold text-ink-soft">{t(lang, "common.answer")}: </span>
        {marked ? (
          <span className="font-semibold text-ok">
            {LETTERS[q.correctIndex] ?? q.correctIndex + 1}.{" "}
            <Math text={q.options[q.correctIndex]} />
          </span>
        ) : (
          <span className="text-ink-faint">{t(lang, "set.answerUnknown")}</span>
        )}
      </p>

      {q.explanation && (
        <Aside label={t(lang, "common.explanation")} text={q.explanation} />
      )}
      {q.shortcut && <Aside label={t(lang, "common.shortcut")} text={q.shortcut} />}
      {q.trap && (
        <Aside label={t(lang, "common.trap")} text={q.trap} tone="warn" />
      )}
    </article>
  );
}

/**
 * A run of questions, numbered from `startNumber`.
 *
 * `startNumber` exists because a paged set continues the numbering of the one
 * before it: the reader's "question 34" should be the 34th question of the
 * chapter, not the 4th of page 4.
 */
export default function QuestionList({
  questions,
  lang,
  startNumber = 1,
}: {
  questions: Record<string, unknown>[];
  lang: Lang;
  startNumber?: number;
}) {
  return (
    <>
      {questions.map((raw, i) => (
        <Question
          key={i}
          question={normaliseQuestion(raw, lang)}
          number={startNumber + i}
          lang={lang}
        />
      ))}
    </>
  );
}
