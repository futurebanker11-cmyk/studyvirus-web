export const runtime = "edge";

/**
 * POST /api/report — a same-origin proxy for a question report.
 *
 * The browser posts here instead of to the API worker directly, so the page
 * never needs a CORS preflight on a phone with a slow connection, and so the
 * upstream host is not a URL in the page source that anyone can spray.
 *
 * ── The real upstream contract ──
 *
 * `POST https://studyvirus-api.futurebanker11.workers.dev/api/report-question`
 * is `postQuestionReport()` in studyvirus-api/src/reports.js. The plan for this
 * task assumed `{source, key, question: <number>, note}` in and `{ok: true}`
 * out. BOTH are wrong; verified live against production, 2026-09-08:
 *
 *   {"question":"…","reason":"…","source":"web"}  → {"reported":true}   200
 *   {"source":"web","key":"test","note":"…"}      → {"error":"question
 *                                                   and reason required"} 400
 *
 * Required: `question` — the question TEXT, not a set key and not a question
 * number — and `reason`, what the reporter says is wrong. Optional and stored:
 * appId, source, options, correctIndex, questionId, fileName, topicFolder,
 * topicName, chapterName, setIndex, lang. Everything is clamped server-side,
 * so this proxy validates only what it must and lets the API own its limits.
 *
 * `device_id` is deliberately NOT forwarded even if a client sends one. It
 * exists for a per-install 20/day cap in the native apps; a web page has no
 * such identity, anonymous reports are explicitly allowed by the API, and
 * minting an id here would mean inventing a tracking identifier to enforce an
 * optional limit.
 *
 * ── The response shape ──
 *
 * This returns its own `{ok}` shape rather than mirroring the upstream body:
 * the browser only needs success or failure, and building the client around
 * an `ok` field the upstream never sends (it sends `reported`) is exactly the
 * bug the plan's version had. Success is decided on the upstream HTTP STATUS.
 *
 * The status is passed through faithfully, because the three failures mean
 * genuinely different things to the reader:
 *   400 — the report was malformed (ReportError shows "describe the mistake")
 *   429 — the daily cap was hit (a different message; not a failure to retry)
 *   502 — the upstream is unreachable (worth trying again in a moment)
 */

const UPSTREAM = "https://studyvirus-api.futurebanker11.workers.dev/api/report-question";

/** Fields the API accepts. Anything else in the request body is dropped. */
const STRING_FIELDS = [
  "source",
  "questionId",
  "fileName",
  "topicFolder",
  "topicName",
  "chapterName",
  "lang",
] as const;

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "bad json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  // The two the API requires. Rejecting here rather than forwarding an empty
  // report saves a round-trip from a phone and gives the same 400 the API
  // would have given.
  const question = typeof b.question === "string" ? b.question.trim() : "";
  const reason = typeof b.reason === "string" ? b.reason.trim() : "";
  if (!question || !reason) {
    return Response.json({ ok: false, error: "question and reason required" }, { status: 400 });
  }

  // An allow-list, not a spread: this endpoint is public and unauthenticated,
  // and forwarding whatever arrived would let a caller set fields (device_id
  // above all) that this proxy has decided not to send.
  const payload: Record<string, unknown> = { question, reason };
  for (const key of STRING_FIELDS) {
    const v = b[key];
    if (typeof v === "string" && v) payload[key] = v;
  }
  payload.source = typeof payload.source === "string" ? payload.source : "web";

  if (Array.isArray(b.options)) {
    payload.options = b.options.slice(0, 10).map((o) => String(o));
  }
  // The API stores a non-integer as NULL, so an absent or bogus index is
  // simply not sent rather than being coerced into a real-looking 0.
  if (Number.isInteger(b.correctIndex)) payload.correctIndex = b.correctIndex;
  if (Number.isInteger(b.setIndex)) payload.setIndex = b.setIndex;

  let res: Response;
  try {
    res = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // The worker is unreachable from here — that is a gateway failure, not the
    // reader's malformed input, so it must not surface as a 400.
    return Response.json({ ok: false, error: "upstream unreachable" }, { status: 502 });
  }

  if (res.ok) return Response.json({ ok: true });

  // 400 and 429 are the API's own verdicts and are passed through unchanged;
  // anything else upstream (500, 503, an HTML error page) is a gateway
  // failure from the browser's point of view.
  const status = res.status === 400 || res.status === 429 ? res.status : 502;
  return Response.json({ ok: false }, { status });
}
