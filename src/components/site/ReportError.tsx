"use client";

import { useId, useState } from "react";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";
import type { NormalisedQuestion } from "./normaliseQuestion";

/**
 * "Report a mistake" — one question at a time.
 *
 * ── Why this asks for a written reason ──
 *
 * The upstream API (studyvirus-api, src/reports.js, postQuestionReport) takes
 * TWO required fields: `question` — the actual question TEXT — and `reason`,
 * what the reporter says is wrong. Without either it answers
 * `{"error":"question and reason required"}` with a 400. Verified live against
 * the production worker on 2026-09-08.
 *
 * So the form collects a real sentence. A one-tap "this is wrong" button would
 * be friendlier to build and would be rejected by the server every single
 * time — a broken feature shipped to real readers. It is also worth asking
 * for: a reports queue whose rows all say "wrong" cannot be triaged, and these
 * rows are read by a human in the studyvirus-cms admin console.
 *
 * ── What gets sent ──
 *
 * The question text itself, plus every piece of context the page happens to
 * know (topic, chapter, set, language, the options as rendered and which one
 * the site currently marks correct). The API accepts and stores all of it, and
 * a triager who can see the options and the current answer key can resolve a
 * report without going and finding the file first.
 *
 * NOT sent: `device_id`. The API uses it for an optional 20-reports-a-day cap
 * on a native app install. A web page has no such identity to offer, and
 * minting one — a random id in localStorage — would be inventing a tracking
 * identifier to enforce a limit the server treats as optional. Anonymous
 * reports are explicitly allowed (they simply skip that extra cap) and every
 * field is clamped server-side regardless.
 *
 * ── Progressive enhancement ──
 *
 * This is a client component and it is the ONLY interactive part of a set
 * page. It renders as a collapsed <details>, so with JavaScript off a reader
 * still sees the control and the heading; the submit is what needs JS. The
 * questions, answers and explanations around it are all server-rendered and
 * owe nothing to this file.
 */

/** Everything the API will accept, beyond the reason the reader types. */
export interface ReportContext {
  /** Where in the site this was filed from, e.g. "web-topics". Clamped to 40. */
  source?: string;
  /** The topic's folder key, e.g. "1-Indian History". */
  topicFolder?: string;
  topicName?: string;
  chapterName?: string;
  /** 0-based index of the set within its chapter. */
  setIndex?: number;
  /** The content file this question came from. */
  fileName?: string;
}

type Status = "idle" | "sending" | "sent" | "error" | "empty" | "limited";

export default function ReportError({
  question,
  lang,
  context = {},
}: {
  /** The question as rendered — its text is the API's required `question`. */
  question: NormalisedQuestion;
  lang: Lang;
  context?: ReportContext;
}) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const fieldId = useId();

  const busy = status === "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = reason.trim();
    // The server would reject an empty reason with a 400; saying so here saves
    // the reader a round-trip and a generic failure message.
    if (!text) {
      setStatus("empty");
      return;
    }
    setStatus("sending");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // The two the API requires.
          question: question.stem,
          reason: text,
          // Context it accepts and a triager needs. correctIndex is omitted
          // rather than sent as -1 when the site marks nothing: the API stores
          // a non-integer as NULL, and -1 would read as a real index.
          questionId: question.id,
          options: question.options,
          correctIndex: question.correctIndex >= 0 ? question.correctIndex : undefined,
          lang,
          source: context.source ?? "web",
          topicFolder: context.topicFolder,
          topicName: context.topicName,
          chapterName: context.chapterName,
          fileName: context.fileName,
          setIndex: context.setIndex,
        }),
      });
      if (res.ok) setStatus("sent");
      else if (res.status === 429) setStatus("limited");
      else setStatus("error");
    } catch {
      // Offline, or the request never left the phone.
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="no-print mt-3 text-sm text-ok" role="status">
        {t(lang, "report.thanks")}
      </p>
    );
  }

  return (
    <details className="no-print mt-3">
      <summary className="ui inline-block cursor-pointer text-sm text-ink-faint underline-offset-4 hover:text-ink">
        {t(lang, "report.open")}
      </summary>

      <form onSubmit={submit} className="mt-3 max-w-measure">
        <label htmlFor={fieldId} className="ui block text-sm font-medium text-ink-soft">
          {t(lang, "report.heading")}
        </label>
        <textarea
          id={fieldId}
          name="reason"
          rows={3}
          // The server clamps at 600; stopping here means the reader never
          // types a sentence that is silently cut off in the database.
          maxLength={600}
          required
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (status === "empty" || status === "error") setStatus("idle");
          }}
          placeholder={t(lang, "report.placeholder")}
          className="ui mt-1.5 block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint"
        />

        <div className="mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="ui inline-flex min-h-[40px] items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ? t(lang, "report.sending") : t(lang, "report.submit")}
          </button>

          {/* role="alert" so a screen reader is told about a failure it did
              not cause and cannot see. */}
          {status === "empty" && (
            <span role="alert" className="ui text-sm text-err">
              {t(lang, "report.needReason")}
            </span>
          )}
          {status === "error" && (
            <span role="alert" className="ui text-sm text-err">
              {t(lang, "report.failed")}
            </span>
          )}
          {status === "limited" && (
            <span role="alert" className="ui text-sm text-warn">
              {t(lang, "report.rateLimited")}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}
