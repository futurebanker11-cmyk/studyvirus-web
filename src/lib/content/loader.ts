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

async function fetchFromCdn(key: string): Promise<ContentObject | null> {
  const res = await fetch(`${CDN_BASE}/${encodeKey(key)}`, {
    // Next.js data-cache hint; ignored outside Next.
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) return null;
  const lm = res.headers.get("last-modified");
  return { text: await res.text(), lastModified: lm ? new Date(lm) : undefined };
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
  const entry = { at: now, ttl: MEMO_TTL_MS, value: load(key).catch(() => null) };
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
