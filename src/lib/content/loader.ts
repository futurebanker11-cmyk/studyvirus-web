import { assertPublishable, encodeKey } from "./keys";
import { resolveBucket } from "./bucket";

export const CDN_BASE = "https://cdn.studyvirus.com";
const MEMO_TTL_MS = 60_000;
// A failed load (throw, non-2xx, missing object) is memoised far more briefly:
// one transient R2/CDN blip must not become a minute of 404s for that key.
const FAILURE_TTL_MS = 5_000;

export interface ContentObject {
  text: string;
  lastModified?: Date;
}

const memo = new Map<string, { at: number; ttl: number; value: Promise<ContentObject | null> }>();

export function __clearMemo(): void {
  memo.clear();
}

// A transient CDN failure and a genuinely absent object both arrive here as
// "no content", and the callers cannot tell them apart: a page that gets null
// calls notFound(). During `next build` that turns a real page into a 404 in
// the output, and the post-build HTML lint then fails the whole build on it.
//
// That is not hypothetical. The 2026-09-21 Cloudflare build failed with two
// Hindi monthly current-affairs pages rendered as empty 404s
// (hi/.../2026_07 and 2026_09, both exactly 24,671 bytes — the notFound()
// shell), while the other four months built at ~2.4MB. The month page requires
// EVERY day in the month to load, so it makes 21-31 CDN reads; one failure
// among them sinks the page. An identical local rebuild passed all five lint
// rules with zero violations and all six months rendered, and a direct probe
// confirmed the data was complete (nullFiles=0, noHindi=0 for all three months
// checked). The build was a coin flip, not a content problem.
//
// So: retry a FAILED REQUEST, but never a 404. A 404 is the CDN answering
// authoritatively that the key is absent, which is a real answer and must stay
// fast — retrying it would add latency to every legitimately-missing key.
// Retries apply to thrown errors (DNS, connection reset, timeout) and to 5xx.
const RETRIES = 2;
const RETRY_BASE_MS = 150;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchFromCdn(key: string): Promise<ContentObject | null> {
  const url = `${CDN_BASE}/${encodeKey(key)}`;
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_BASE_MS * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, {
        // Next.js data-cache hint; ignored outside Next.
        next: { revalidate: 3600 },
      } as RequestInit);
      // Authoritative "not here" — do not retry, do not treat as an error.
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) {
        lastError = new Error(`${res.status} for ${key}`);
        // 5xx and friends are worth another go; other 4xx are not.
        if (res.status < 500) return null;
        continue;
      }
      const lm = res.headers.get("last-modified");
      return { text: await res.text(), lastModified: lm ? new Date(lm) : undefined };
    } catch (err) {
      lastError = err;
    }
  }

  // Every attempt failed for a reason that was NOT "the object is absent".
  // Throwing rather than returning null matters during a build: getText()
  // converts it back to null for request-time callers, but a thrown error is
  // what lets a build surface the difference if it ever wants to.
  throw lastError instanceof Error ? lastError : new Error(`CDN fetch failed for ${key}`);
}

// ⛔ A bucket-miss (bucket.get returns null) is ambiguous, and the two cases
// need OPPOSITE handling:
//
//   1. Real deployed Worker, real R2, key genuinely absent → this IS the
//      answer; falling through to fetch() would hit the same-zone
//      Worker-to-Worker restriction the binding exists to avoid (spec §2),
//      and must not happen.
//   2. `next build` (SSG) or `next dev` under @opennextjs/cloudflare →
//      getCloudflareContext's own async path synthesizes a REAL but locally
//      EMPTY miniflare R2 binding whenever it detects Node.js or SSG
//      (its inNodejsRuntime || inSSG() check, independent of whether
//      initOpenNextCloudflareForDev() was ever called — confirmed by
//      reproduction on a completely empty, gitignored .wrangler/, 2026-09-08:
//      Plan B Task 4 review). A miss here means "nothing seeded locally",
//      not "doesn't exist", and every [lang] page using this loader would
//      otherwise silently prerender with empty sections and no build error.
//
// `process.env.NEXT_RUNTIME === "nodejs"` is the same signal
// @opennextjs/cloudflare's own getCloudflareContextAsync uses to decide
// whether to synthesize that local context in the first place (case 2 is
// only ever reachable when this is true or `inSSG()` is true — Node.js SSG
// implies this too). The real deployed Worker runs on the edge runtime, so
// this is never "nodejs" there — only case 1 can occur in production, and
// this fallback is never reached.
// A function, not a module-load-time constant: NEXT_RUNTIME is stable for the
// life of a real process, but reading it live keeps this branch exercisable
// in tests without fighting module-caching order.
function isNodeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "nodejs";
}

async function load(key: string): Promise<ContentObject | null> {
  const bucket = await resolveBucket();
  if (bucket) {
    const obj = await bucket.get(key);
    if (obj) return { text: await obj.text(), lastModified: obj.uploaded };
    if (!isNodeRuntime()) return null; // real Worker: a miss is authoritative
    // Node.js (build/dev): the binding may be an empty local stub. Try the
    // CDN before giving up — see the block comment above.
  }
  return fetchFromCdn(key);
}

export async function getText(key: string): Promise<ContentObject | null> {
  assertPublishable(key);
  const now = Date.now();
  const hit = memo.get(key);
  if (hit && now - hit.at < hit.ttl) return hit.value;
  // Concurrent callers share the in-flight promise under the full TTL; once it
  // settles as a failure the entry's window shrinks so the next caller retries.
  const entry = {
    at: now,
    ttl: MEMO_TTL_MS,
    value: load(key).catch((err: unknown) => {
      // At request time a failed read degrades to "absent" — a live page that
      // 404s for one reader is better than a 500, and the short FAILURE_TTL
      // means the next reader retries.
      //
      // At BUILD time the same silence is how a transient blip becomes a
      // permanently-wrong page in the output: the page calls notFound(), the
      // 404 shell is written to disk, and nothing anywhere says a fetch
      // failed. So during a build, say so on stderr. The retries in
      // fetchFromCdn have already been exhausted by the time this runs.
      if (process.env.NEXT_RUNTIME === "nodejs") {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[content] CDN read failed after retries: ${key} — ${msg}`);
      }
      return null;
    }),
  };
  memo.set(key, entry);
  void entry.value.then((v) => { if (v === null) entry.ttl = FAILURE_TTL_MS; });
  return entry.value;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const obj = await getText(key);
  if (!obj) return null;
  try {
    return JSON.parse(obj.text) as T;
  } catch {
    return null;
  }
}
