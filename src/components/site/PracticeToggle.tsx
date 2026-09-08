"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * Hide the answers while you attempt the set.
 *
 * ── Why this is a CSS toggle and not conditional rendering ──
 *
 * It writes `data-practice="on"` onto the wrapper element SetPageShell
 * rendered, and two rules in globals.css hide `.answer` and `.explanation`
 * beneath it. That is the entire mechanism. The answers, the explanations and
 * the mark on the correct option are in the server-rendered HTML in every
 * mode, always.
 *
 * The alternative — rendering the answer only when practice mode is off —
 * would be simpler React and would be wrong. This site was flagged for a
 * content gap where its answers only existed after JavaScript ran: crawlers
 * indexed pages of bare questions, and a reader with a slow connection or a
 * screen reader got the same. Hiding with CSS keeps every answer in the
 * document for a crawler (which does not toggle attributes) while genuinely
 * hiding it from the reader — `display: none` is respected by assistive
 * technology too, so a reader in practice mode does not have the answer read
 * out to them either.
 *
 * ── Why the DOM, not React state ──
 *
 * The wrapper is a server component; the questions inside it are server
 * components. Lifting a boolean up to make them all client components would
 * ship the entire question bank to the browser as a serialised prop tree, for
 * a feature that is one attribute. So this writes the attribute directly and
 * owns nothing else.
 *
 * ── Why the default is "off" ──
 *
 * The reader who arrives from a search result wants to see the answer. A
 * reader who wants to practise asks for it, and the choice is remembered so
 * they do not ask again on every set. Because the choice is restored after
 * mount, first paint always matches the server HTML — no hydration mismatch,
 * and no flash of hidden answers for the majority who never turn it on.
 */

const KEY = "sv_practice";

export default function PracticeToggle({
  /** id of the wrapper element that carries `data-practice`. */
  target,
  lang,
}: {
  target: string;
  lang: Lang;
}) {
  const [on, setOn] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore the remembered choice after mount. Doing this in an effect rather
  // than in the initial state is what keeps the server HTML and the first
  // client render identical.
  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(KEY) === "on";
    } catch {
      /* private mode — the choice just won't survive the session */
    }
    setMounted(true);
    if (saved) {
      setOn(true);
      document.getElementById(target)?.setAttribute("data-practice", "on");
    }
  }, [target]);

  function toggle() {
    const next = !on;
    const el = document.getElementById(target);
    if (next) el?.setAttribute("data-practice", "on");
    else el?.removeAttribute("data-practice");
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {
      /* private mode */
    }
    setOn(next);
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-x-3 gap-y-1">
      <button
        type="button"
        onClick={toggle}
        // Until mounted the remembered choice is unknown, so announce nothing
        // rather than a state that is about to change under the reader.
        aria-pressed={mounted ? on : undefined}
        className={`ui inline-flex min-h-[40px] items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
          on
            ? "border-accent bg-accent-wash text-ink"
            : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
        }`}
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {on ? (
            // Struck-through eye — answers are hidden
            <>
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <path d="M1 1l22 22" />
            </>
          ) : (
            <>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
        {/* The label names the action the button performs next, so it is never
            ambiguous about which state it is describing. */}
        {on ? t(lang, "common.showAnswers") : t(lang, "set.hideAnswers")}
      </button>

      <p className="ui text-xs text-ink-faint">{t(lang, "set.practiceHint")}</p>
    </div>
  );
}
