# Plan A — Content Platform & SEO Libraries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested, manifest-driven content layer (R2 loader, content index, set rules, slugs, per-section loaders, i18n/SEO helpers, sitemap generators) that Plan B's pages consume, while leaving the currently deployed site fully working.

**Architecture:** Everything in this plan lives under `src/lib/content/`, `src/lib/i18n/`, `src/lib/seo/`, `scripts/`, `test/` and `src/generated/`. No existing page or component is modified, so `npm run build` stays green throughout. The loader reads R2 through a bucket binding in the Worker and falls back to `https://cdn.studyvirus.com` at build time and in tests. A validation script walks every manifest, verifies each file exists on the CDN, and writes `src/generated/content-index.json`; everything else (page existence, sitemap entries, stats) derives from that index.

**Tech Stack:** Next.js 14.2 (App Router), TypeScript 5 (strict), `@opennextjs/cloudflare` 1.15, Node 24 test runner via `tsx`, Cloudflare R2.

**Spec:** `docs/superpowers/specs/2026-09-07-studyvirus-web-rebuild-design.md` — read §2 (verified facts), §4 (architecture) and §8 (sitemaps) before starting.

## Global Constraints

- Repo: `C:\Users\manme\Desktop\StyleID\studyvirus-web`, branch `master`. Node `v24.14.1`, npm 11.
- **Do not** modify `src/lib/gkApps.ts` (generated), `src/app/privacy/**`, `src/app/apps/stylescan/**`, the Firebase proxy in `middleware.ts`, or the WordPress redirects in `next.config.mjs`. The CBT portal and bank-player files are deleted in Plan B, not here; the working tree has uncommitted edits to them — leave them alone, never `git add -A`; always `git add` explicit paths.
- **Model tiers** (user preference): each task carries a `Model:` line. `fable` = Fable 5.1 for the hard ones; `opus` / `sonnet` for moderate and easy ones.
- Bucket keys, not URLs, everywhere: `gk/…`, `bank/…`, `apps/…`. CDN base for fallback is exactly `https://cdn.studyvirus.com`.
- Paid prefixes that the loader must refuse: `mock-content/`, `gk/mocks-v2/mock-content/`, `gk/mocks-v2/sectional-content/`, `gk/mocks-v2/topic-content/`. Pro prefixes it must also refuse: `gk/notes/`, `gk/master-notes/`, `gk/master-notes-oneliners/`, `gk/oneliners/`, `gk/aptitude/content/notes/`, `gk/0-Current Affairs/capsule/`, `gk/0-Current Affairs/magazine/`.
- Set rule constants: `NORMAL_SET_SIZE = 10`, `LAST_SET_SIZE = 20` (spec §5.3).
- Languages: exactly `"en"` and `"hi"`; hreflang codes `en-IN`, `hi-IN`, `x-default` → English; all hreflang/canonical URLs fully qualified `https://studyvirus.com/...`.
- Sitemap children ≤ 45,000 URLs each.
- Test command for every task: `npm test` (defined in Task 1). Type check: `npx tsc --noEmit`.
- Commit after every task with the exact message given; end every commit message with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

## File Structure

| File | Responsibility |
|---|---|
| `test/*.test.ts` | Node test-runner tests, one file per module |
| `test/fixtures/*.json` | Small hand-written manifest fixtures (never the real 200 KB files) |
| `src/lib/content/keys.ts` | Bucket key builders, `encodeKey`, paid/Pro prefix guard |
| `src/lib/content/bucket.ts` | Resolves the R2 binding (or `null`) — the only file that imports `@opennextjs/cloudflare` |
| `src/lib/content/loader.ts` | `getText` / `getJson` with binding-or-HTTPS, TTL memo |
| `src/lib/content/index.ts` | Reads `src/generated/content-index.json`: `hasKey`, `counts`, `listDir`, `totals` |
| `src/lib/content/sets.ts` | `buildSets` (app rule), `setCount`, `getSet` |
| `src/lib/content/slugs.ts` | `topicSlug`, `chapterSlug`, `dashed`, aptitude slug helpers |
| `src/lib/content/topics.ts` | Topic manifest loader, visibility, English-by-key, lookups |
| `src/lib/content/pyq.ts` | PYQ config loader, paper enumeration |
| `src/lib/content/aptitude.ts` | Two-family aptitude manifest loader, tier-1 filter, slugs |
| `src/lib/content/currentAffairs.ts` | Daily CA enumeration from the index, month grouping, staleness |
| `src/lib/content/articles.ts` | Article index + loader |
| `src/lib/content/apps.ts` | `apps/registry.json` reader with graceful absence |
| `src/lib/content/examFacts.ts` | Per-exam structured facts (body, stages) + bank exams + extra exams |
| `src/lib/content/hindi.ts` | Hindi availability rule |
| `src/lib/content/stats.ts` | Site-wide numbers from index totals |
| `src/lib/i18n/lang.ts` | `Lang`, `href`, `splitLang` |
| `src/lib/i18n/routing.ts` | Pure middleware decision function |
| `src/lib/i18n/alternates.ts` | canonical + hreflang builder |
| `src/lib/seo/jsonld.ts` | BreadcrumbList / Organization / SoftwareApplication builders |
| `src/lib/seo/referrer.ts` | Play URL with install referrer |
| `src/lib/seo/monetisation.ts` | Ad/CTA placement per page kind |
| `src/lib/seo/sitemaps.ts` | Pure sitemap entry generators + chunking |
| `src/lib/seo/assetlinks.ts` + `src/lib/content/assetlinks.csv` + `src/app/.well-known/assetlinks.json/route.ts` | Digital Asset Links |
| `scripts/validate-content.mjs` | Walks manifests, checks CDN, writes the content index |
| `src/generated/content-index.json` | Generated, committed |
| `cloudflare-env.d.ts`, `wrangler.jsonc`, `open-next.config.ts`, `next.config.mjs` | R2 bindings, incremental cache, dev bindings |

---

### Task 1: Test tooling

**Model:** `sonnet`

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `test/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` runs every `test/**/*.test.ts` with Node's built-in runner through `tsx`.

- [ ] **Step 1: Install dev dependencies**

```bash
cd /c/Users/manme/Desktop/StyleID/studyvirus-web
npm install --save-dev tsx@^4.19.0 @cloudflare/workers-types@^4.20250906.0
```

- [ ] **Step 2: Add scripts to `package.json`**

Replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "node scripts/validate-content.mjs && next build",
  "start": "next start",
  "lint": "next lint",
  "test": "node --import tsx --test \"test/**/*.test.ts\"",
  "typecheck": "tsc --noEmit",
  "validate:content": "node scripts/validate-content.mjs",
  "cf:build": "node scripts/validate-content.mjs && opennextjs-cloudflare build",
  "preview": "npm run cf:build && opennextjs-cloudflare preview",
  "deploy": "npm run cf:build && opennextjs-cloudflare deploy"
}
```

(`scripts/validate-content.mjs` is created in Task 7; until then `npm run build` will fail at that step — that is expected and is why Tasks 1–6 only run `npm test` and `npm run typecheck`.)

- [ ] **Step 3: Write the smoke test**

`test/smoke.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

test("test runner executes TypeScript", () => {
  const x: number = 1 + 1;
  assert.equal(x, 2);
});
```

- [ ] **Step 4: Run it**

Run: `npm test`
Expected: `# pass 1`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json test/smoke.test.ts
git commit -m "chore: add node test runner via tsx and workers types

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Bucket keys and the publishable guard

**Model:** `sonnet`

**Files:**
- Create: `src/lib/content/keys.ts`
- Test: `test/keys.test.ts`

**Interfaces:**
- Produces:
  - `encodeKey(key: string): string`
  - `assertPublishable(key: string): void` (throws `Error` for paid/Pro prefixes unless the key ends with `/manifest.json`)
  - `PAID_PREFIXES`, `PRO_PREFIXES` (readonly string arrays)
  - `keys` object with builders: `topicsManifest()`, `chapterFile(folder, file)`, `pyqConfig()`, `pyqPaper(prefix, n)`, `gkAptitudeManifest()`, `bankManifest()`, `aptitudeSet(family, subjectFolder, chapterFolder, typeFolder, file)`, `caDaily(date)`, `articlesIndex()`, `article(file)`, `appsRegistry()`, `webMethod(family, chapterId)`
  - `type AptitudeFamily = "ssc-railway" | "bank"`

- [ ] **Step 1: Write the failing tests**

`test/keys.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeKey, assertPublishable, keys } from "../src/lib/content/keys";

test("encodeKey encodes spaces and ampersands but keeps slashes", () => {
  assert.equal(
    encodeKey("gk/1-Indian History/13-Viceroys & Acts.json"),
    "gk/1-Indian%20History/13-Viceroys%20%26%20Acts.json",
  );
});

test("assertPublishable refuses paid and Pro prefixes", () => {
  for (const k of [
    "mock-content/sbi-clerk/sbi-clerk-mock-05.json",
    "gk/mocks-v2/mock-content/rrb-ntpc-cbt1/mock-02.json",
    "gk/mocks-v2/sectional-content/x.json",
    "gk/mocks-v2/topic-content/x.json",
    "gk/notes/1-Indian History/x.json",
    "gk/master-notes/x.json",
    "gk/oneliners/x.json",
    "gk/aptitude/content/notes/quant/quant_algebra.json",
    "gk/0-Current Affairs/capsule/2026_03.json",
    "gk/0-Current Affairs/magazine/2026_03.pdf",
  ]) {
    assert.throws(() => assertPublishable(k), /refusing/, k);
  }
});

test("assertPublishable allows manifests inside paid prefixes and all free keys", () => {
  assertPublishable("mock-content/manifest.json");
  assertPublishable("gk/topics.json");
  assertPublishable("gk/1-Indian History/1-Indus Valley.json");
  assertPublishable("gk/24-Previous Year Papers/pyq_rrb_ntpc_set01.json");
  assertPublishable("bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json");
  assertPublishable("gk/0-Current Affairs/daily/2026_09_01.json");
});

test("key builders produce the verified CDN layout", () => {
  assert.equal(keys.topicsManifest(), "gk/topics.json");
  assert.equal(keys.chapterFile("1-Indian History", "1-Indus Valley.json"), "gk/1-Indian History/1-Indus Valley.json");
  assert.equal(keys.pyqPaper("pyq_rrb_ntpc_set", 1), "gk/24-Previous Year Papers/pyq_rrb_ntpc_set01.json");
  assert.equal(keys.pyqPaper("pyq_rrb_ntpc_set", 31), "gk/24-Previous Year Papers/pyq_rrb_ntpc_set31.json");
  assert.equal(
    keys.aptitudeSet("bank", "1-Quantitative Aptitude", "01_number_series", "1-Missing Term", "Foundation/Set 01.json"),
    "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json",
  );
  assert.equal(
    keys.aptitudeSet("ssc-railway", "quant", "01_number_system_hcf_lcm", "1-Divisibility Rules", "Set 01.json"),
    "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules/Set 01.json",
  );
  assert.equal(keys.caDaily("2026_09_01"), "gk/0-Current Affairs/daily/2026_09_01.json");
  assert.equal(keys.article("crack-first-attempt.json"), "gk/articles/crack-first-attempt.json");
  assert.equal(keys.appsRegistry(), "apps/registry.json");
  assert.equal(keys.webMethod("bank", "01_number_series"), "gk/aptitude/web-method/bank/01_number_series.json");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `Cannot find module '../src/lib/content/keys'`.

- [ ] **Step 3: Implement `src/lib/content/keys.ts`**

```ts
// Bucket keys for the studyvirus-content R2 bucket. Keys, never URLs.
// Layout verified live 2026-09-07 (spec §2).

export type AptitudeFamily = "ssc-railway" | "bank";

export const PAID_PREFIXES = [
  "mock-content/",
  "gk/mocks-v2/mock-content/",
  "gk/mocks-v2/sectional-content/",
  "gk/mocks-v2/topic-content/",
] as const;

export const PRO_PREFIXES = [
  "gk/notes/",
  "gk/master-notes/",
  "gk/master-notes-oneliners/",
  "gk/oneliners/",
  "gk/aptitude/content/notes/",
  "gk/0-Current Affairs/capsule/",
  "gk/0-Current Affairs/magazine/",
] as const;

/** Throws if the key is paid or Pro content. Manifests inside paid prefixes are public. */
export function assertPublishable(key: string): void {
  if (key.endsWith("/manifest.json")) return;
  for (const p of [...PAID_PREFIXES, ...PRO_PREFIXES]) {
    if (key.startsWith(p)) throw new Error(`refusing to read non-free content key: ${key}`);
  }
}

/** Percent-encode each path segment; slashes stay slashes. */
export function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

const pad2 = (n: number) => String(n).padStart(2, "0");

export const keys = {
  topicsManifest: () => "gk/topics.json",
  chapterFile: (folder: string, file: string) => `gk/${folder}/${file}`,
  pyqConfig: () => "gk/pyq-config.json",
  pyqPaper: (prefix: string, n: number) => `gk/24-Previous Year Papers/${prefix}${pad2(n)}.json`,
  gkAptitudeManifest: () => "gk/aptitude/manifest.json",
  bankManifest: () => "bank/manifest.json",
  aptitudeSet: (
    family: AptitudeFamily,
    subjectFolder: string,
    chapterFolder: string,
    typeFolder: string,
    file: string,
  ) =>
    family === "bank"
      ? `bank/${subjectFolder}/${chapterFolder}/${typeFolder}/${file}`
      : `gk/aptitude/content/${subjectFolder}/${chapterFolder}/${typeFolder}/${file}`,
  caDaily: (date: string) => `gk/0-Current Affairs/daily/${date}.json`,
  articlesIndex: () => "gk/articles/index.json",
  article: (file: string) => `gk/articles/${file}`,
  appsRegistry: () => "apps/registry.json",
  webMethod: (family: AptitudeFamily, chapterId: string) => `gk/aptitude/web-method/${family}/${chapterId}.json`,
} as const;
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/keys.ts test/keys.test.ts
git commit -m "feat(content): bucket key builders and paid/Pro prefix guard

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Content loader (R2 binding or HTTPS)

**Model:** `fable`

**Files:**
- Create: `src/lib/content/bucket.ts`, `src/lib/content/loader.ts`
- Test: `test/loader.test.ts`

**Interfaces:**
- Consumes: `assertPublishable`, `encodeKey` from Task 2.
- Produces:
  - `type BucketLike = { get(key: string): Promise<{ text(): Promise<string>; uploaded?: Date } | null> }`
  - `resolveBucket(): Promise<BucketLike | null>` and `__setBucketResolver(fn)` (tests only) in `bucket.ts`
  - `getText(key): Promise<{ text: string; lastModified?: Date } | null>`
  - `getJson<T>(key): Promise<T | null>`
  - `__clearMemo()` (tests only)
  - `CDN_BASE = "https://cdn.studyvirus.com"`

- [ ] **Step 1: Write the failing tests**

`test/loader.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { getText, getJson, __clearMemo, CDN_BASE } from "../src/lib/content/loader";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => null);
  globalThis.fetch = originalFetch;
});

test("uses the bucket binding when present and never calls fetch", async () => {
  let fetched = false;
  globalThis.fetch = (async () => { fetched = true; return new Response("x"); }) as typeof fetch;
  const uploaded = new Date("2026-09-01T00:00:00Z");
  __setBucketResolver(async () => ({
    async get(key: string) {
      assert.equal(key, "gk/topics.json");
      return { text: async () => '{"topics":[]}', uploaded };
    },
  }));
  const res = await getJson<{ topics: unknown[] }>("gk/topics.json");
  assert.deepEqual(res, { topics: [] });
  assert.equal(fetched, false);
  const t = await getText("gk/topics.json");
  assert.equal(t?.lastModified?.toISOString(), uploaded.toISOString());
});

test("falls back to the CDN over HTTPS with an encoded key", async () => {
  let url = "";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    url = String(input);
    return new Response('{"en":[1],"hi":[1]}', { status: 200, headers: { "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT" } });
  }) as typeof fetch;
  const res = await getJson<{ en: number[] }>("gk/1-Indian History/13-Viceroys & Acts.json");
  assert.equal(url, `${CDN_BASE}/gk/1-Indian%20History/13-Viceroys%20%26%20Acts.json`);
  assert.deepEqual(res?.en, [1]);
});

test("returns null on 404 and on malformed JSON", async () => {
  globalThis.fetch = (async () => new Response("nope", { status: 404 })) as typeof fetch;
  assert.equal(await getJson("gk/missing.json"), null);
  __clearMemo();
  globalThis.fetch = (async () => new Response("{not json", { status: 200 })) as typeof fetch;
  assert.equal(await getJson("gk/bad.json"), null);
});

test("refuses paid keys before touching the network", async () => {
  globalThis.fetch = (async () => { throw new Error("must not fetch"); }) as typeof fetch;
  await assert.rejects(() => getText("gk/mocks-v2/mock-content/rrb-ntpc-cbt1/mock-02.json"), /refusing/);
});

test("memoises a key for the TTL window", async () => {
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response("{}", { status: 200 }); }) as typeof fetch;
  await getJson("gk/topics.json");
  await getJson("gk/topics.json");
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot find `../src/lib/content/bucket`.

- [ ] **Step 3: Implement `src/lib/content/bucket.ts`**

```ts
// The only module that knows about @opennextjs/cloudflare. Returns the R2
// binding when running inside the Worker (or `next dev` with
// initOpenNextCloudflareForDev), otherwise null so the loader falls back to
// HTTPS. Same-zone Worker→Worker fetch to cdn.studyvirus.com fails
// (spec §2), which is why the binding exists.

export type BucketObject = { text(): Promise<string>; uploaded?: Date };
export type BucketLike = { get(key: string): Promise<BucketObject | null> };

async function defaultResolver(): Promise<BucketLike | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx?.env as unknown as { CONTENT?: BucketLike } | undefined;
    return env?.CONTENT ?? null;
  } catch {
    return null;
  }
}

let resolver: () => Promise<BucketLike | null> = defaultResolver;

export function resolveBucket(): Promise<BucketLike | null> {
  return resolver();
}

/** Test seam. */
export function __setBucketResolver(fn: () => Promise<BucketLike | null>): void {
  resolver = fn;
}
```

- [ ] **Step 4: Implement `src/lib/content/loader.ts`**

```ts
import { assertPublishable, encodeKey } from "./keys";
import { resolveBucket } from "./bucket";

export const CDN_BASE = "https://cdn.studyvirus.com";
const MEMO_TTL_MS = 60_000;

export interface ContentObject {
  text: string;
  lastModified?: Date;
}

const memo = new Map<string, { at: number; value: Promise<ContentObject | null> }>();

export function __clearMemo(): void {
  memo.clear();
}

async function load(key: string): Promise<ContentObject | null> {
  const bucket = await resolveBucket();
  if (bucket) {
    const obj = await bucket.get(key);
    if (!obj) return null;
    return { text: await obj.text(), lastModified: obj.uploaded };
  }
  const res = await fetch(`${CDN_BASE}/${encodeKey(key)}`, {
    // Next.js data-cache hint; ignored outside Next.
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) return null;
  const lm = res.headers.get("last-modified");
  return { text: await res.text(), lastModified: lm ? new Date(lm) : undefined };
}

export function getText(key: string): Promise<ContentObject | null> {
  assertPublishable(key);
  const now = Date.now();
  const hit = memo.get(key);
  if (hit && now - hit.at < MEMO_TTL_MS) return hit.value;
  const value = load(key).catch(() => null);
  memo.set(key, { at: now, value });
  return value;
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
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: all pass; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/bucket.ts src/lib/content/loader.ts test/loader.test.ts
git commit -m "feat(content): R2-binding loader with CDN fallback and TTL memo

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Cloudflare bindings (content bucket, dev bindings, env types)

**Model:** `opus`

**Files:**
- Modify: `wrangler.jsonc`, `next.config.mjs` (top of file only), `tsconfig.json`
- Create: `cloudflare-env.d.ts`

**Interfaces:**
- Produces: `CloudflareEnv` global interface with `CONTENT: R2Bucket`; the Worker and `next dev` both expose `env.CONTENT`.

- [ ] **Step 1: Add the binding to `wrangler.jsonc`**

Replace the whole file with:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "studyvirus-web",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-03-25",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  // Content bucket, read-only from the site's point of view. Same bucket the
  // apps and the cdn-gate Worker use. The site reads it through this binding
  // because a same-zone fetch to cdn.studyvirus.com fails (spec §2).
  "r2_buckets": [
    { "binding": "CONTENT", "bucket_name": "studyvirus-content" }
  ]
}
```

- [ ] **Step 2: Create `cloudflare-env.d.ts` at the repo root**

```ts
/// <reference types="@cloudflare/workers-types" />
// Bindings declared in wrangler.jsonc. @opennextjs/cloudflare's
// getCloudflareContext() returns env typed as CloudflareEnv when this
// interface exists.
declare global {
  interface CloudflareEnv {
    CONTENT: R2Bucket;
    ASSETS: Fetcher;
  }
}
export {};
```

- [ ] **Step 3: Include it in `tsconfig.json`**

Change `"include"` to:

```json
"include": ["next-env.d.ts", "cloudflare-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
```

- [ ] **Step 4: Expose bindings to `next dev`**

At the very top of `next.config.mjs` (before `const nextConfig`), add:

```js
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
// Makes wrangler.jsonc bindings (CONTENT) available via getCloudflareContext()
// during `next dev`. No effect on `next build` or production.
initOpenNextCloudflareForDev();
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm test`
Expected: clean. Then run `npx wrangler deploy --dry-run --outdir /tmp/sv-dry 2>&1 | tail -5` only if a `.open-next` build exists; otherwise skip — the binding is exercised end-to-end in Task 22.

- [ ] **Step 6: Commit**

```bash
git add wrangler.jsonc cloudflare-env.d.ts tsconfig.json next.config.mjs
git commit -m "chore(cf): bind the studyvirus-content R2 bucket and type the env

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Set rules (port of the app's `buildSets`)

**Model:** `fable`

**Files:**
- Create: `src/lib/content/sets.ts`
- Test: `test/sets.test.ts`

**Interfaces:**
- Produces:
  - `NORMAL_SET_SIZE = 10`, `LAST_SET_SIZE = 20`
  - `buildSets<T extends { passageGroup?: string }>(questions: T[]): T[][]`
  - `setCount(questions): number`
  - `getSet(questions, n: number /* 1-based */): T[] | null`
  - `setRange(questions, n): { from: number; to: number } | null` (1-based question numbers)

- [ ] **Step 1: Write the failing tests**

`test/sets.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSets, setCount, getSet, setRange } from "../src/lib/content/sets";

const qs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `q${i + 1}` }));

test("empty input yields no sets", () => {
  assert.deepEqual(buildSets([]), []);
  assert.equal(setCount([]), 0);
});

test("up to 20 questions is a single set", () => {
  assert.equal(buildSets(qs(5)).length, 1);
  assert.equal(buildSets(qs(20)).length, 1);
  assert.equal(buildSets(qs(20))[0].length, 20);
});

test("21 questions become 10 + 11", () => {
  const s = buildSets(qs(21));
  assert.deepEqual(s.map((x) => x.length), [10, 11]);
});

test("70 questions become five tens and a final twenty (matches the app)", () => {
  const s = buildSets(qs(70));
  assert.deepEqual(s.map((x) => x.length), [10, 10, 10, 10, 10, 20]);
  assert.equal(setCount(qs(70)), 6);
});

test("25 questions become 10 + 15; 40 become 10 + 10 + 20", () => {
  assert.deepEqual(buildSets(qs(25)).map((x) => x.length), [10, 15]);
  assert.deepEqual(buildSets(qs(40)).map((x) => x.length), [10, 10, 20]);
});

test("passage chapters get one set per passage in first-seen order", () => {
  const p = [
    { id: "a1", passageGroup: "P1" }, { id: "a2", passageGroup: "P1" },
    { id: "b1", passageGroup: "P2" }, { id: "b2", passageGroup: "P2" }, { id: "b3", passageGroup: "P2" },
    { id: "solo" },
    { id: "c1", passageGroup: "P3" },
  ];
  const s = buildSets(p);
  assert.deepEqual(s.map((x) => x.map((q) => q.id)), [["a1", "a2"], ["b1", "b2", "b3"], ["solo"], ["c1"]]);
});

test("passage rule only applies when at least 80% carry passageGroup", () => {
  const p = [{ id: "a", passageGroup: "P1" }, ...qs(9)];
  assert.equal(buildSets(p).length, 1); // 10 questions, plain rule
});

test("getSet and setRange are 1-based and null out of range", () => {
  const q = qs(70);
  assert.equal(getSet(q, 1)?.[0].id, "q1");
  assert.equal(getSet(q, 6)?.length, 20);
  assert.equal(getSet(q, 7), null);
  assert.equal(getSet(q, 0), null);
  assert.deepEqual(setRange(q, 6), { from: 51, to: 70 });
  assert.equal(setRange(q, 9), null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/content/sets.ts`**

```ts
// Port of rrb-ntpc-gk/src/hooks/useQuestions.js buildSets (2026-08-22).
// The site MUST number sets exactly as the app does (spec §5.3).

export const NORMAL_SET_SIZE = 10;
export const LAST_SET_SIZE = 20;

type HasPassage = { passageGroup?: string };

export function buildSets<T extends HasPassage>(questions: T[]): T[][] {
  const list = questions || [];
  if (list.length === 0) return [];

  const grouped = list.filter((q) => q && q.passageGroup);
  if (grouped.length >= list.length * 0.8) {
    const order: string[] = [];
    const byGroup = new Map<string, T[]>();
    for (const q of list) {
      const key = q.passageGroup || `__solo_${order.length}`;
      if (!byGroup.has(key)) {
        byGroup.set(key, []);
        order.push(key);
      }
      byGroup.get(key)!.push(q);
    }
    return order.map((k) => byGroup.get(k)!);
  }

  if (list.length <= LAST_SET_SIZE) return [list];

  const sets: T[][] = [];
  let i = 0;
  while (i < list.length) {
    const remaining = list.length - i;
    if (remaining <= LAST_SET_SIZE && sets.length > 0) {
      sets.push(list.slice(i));
      break;
    }
    sets.push(list.slice(i, i + NORMAL_SET_SIZE));
    i += NORMAL_SET_SIZE;
  }
  return sets;
}

export function setCount<T extends HasPassage>(questions: T[]): number {
  return buildSets(questions).length;
}

export function getSet<T extends HasPassage>(questions: T[], n: number): T[] | null {
  if (!Number.isInteger(n) || n < 1) return null;
  const sets = buildSets(questions);
  return sets[n - 1] ?? null;
}

export function setRange<T extends HasPassage>(questions: T[], n: number): { from: number; to: number } | null {
  if (!Number.isInteger(n) || n < 1) return null;
  const sets = buildSets(questions);
  if (n > sets.length) return null;
  let from = 1;
  for (let i = 0; i < n - 1; i++) from += sets[i].length;
  return { from, to: from + sets[n - 1].length - 1 };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/sets.ts test/sets.test.ts
git commit -m "feat(content): port the app's set-chunking rule (10/last-20/passage)

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Slugs

**Model:** `sonnet`

**Files:**
- Create: `src/lib/content/slugs.ts`
- Test: `test/slugs.test.ts`

**Interfaces:**
- Produces:
  - `topicSlug(key: string): string` — `_` → `-` (identical to the current site)
  - `chapterSlug(nameEn: string): string` — identical to the current site's rule
  - `dashed(id: string): string` — `_` → `-`
  - `aptitudeChapterSlug(chapterId: string): string` — strips a leading `NN_` and dashes the rest
  - `aptitudeSubjectSlug(subjectId: string): string` — fixed map
  - `parseSetParam(param: string): number | null` — `"set-7"` → `7`

- [ ] **Step 1: Write the failing tests**

`test/slugs.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { topicSlug, chapterSlug, dashed, aptitudeChapterSlug, aptitudeSubjectSlug, parseSetParam } from "../src/lib/content/slugs";

test("topicSlug matches the live site", () => {
  assert.equal(topicSlug("famous_people"), "famous-people");
  assert.equal(topicSlug("history"), "history");
});

test("chapterSlug matches the live site for every punctuation case in the manifest", () => {
  assert.equal(chapterSlug("Indus Valley"), "indus-valley");
  assert.equal(chapterSlug("Buddhism & Jainism"), "buddhism-jainism");
  assert.equal(chapterSlug("Viceroys & Acts"), "viceroys-acts");
  assert.equal(chapterSlug("Revolt of 1857"), "revolt-of-1857");
  assert.equal(chapterSlug("Chola & South Kingdoms"), "chola-south-kingdoms");
  assert.equal(chapterSlug("  Spaced   Name "), "spaced-name");
  assert.equal(chapterSlug("Synonyms (Basic)"), "synonyms-basic");
});

test("aptitude slugs", () => {
  assert.equal(dashed("previous_year_papers"), "previous-year-papers");
  assert.equal(aptitudeChapterSlug("01_number_system_hcf_lcm"), "number-system-hcf-lcm");
  assert.equal(aptitudeChapterSlug("30_number_series"), "number-series");
  assert.equal(aptitudeChapterSlug("algebra"), "algebra");
  assert.equal(aptitudeSubjectSlug("quant"), "quant");
  assert.equal(aptitudeSubjectSlug("di"), "data-interpretation");
  assert.equal(aptitudeSubjectSlug("puzzles"), "puzzles");
  assert.equal(aptitudeSubjectSlug("previous_year_papers"), "previous-year-questions");
  assert.equal(aptitudeSubjectSlug("unknown_thing"), "unknown-thing");
});

test("parseSetParam", () => {
  assert.equal(parseSetParam("set-7"), 7);
  assert.equal(parseSetParam("set-07"), 7);
  assert.equal(parseSetParam("set-x"), null);
  assert.equal(parseSetParam("7"), null);
  assert.equal(parseSetParam("set-0"), null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/content/slugs.ts`**

```ts
// URL slugs. topicSlug/chapterSlug are copied verbatim from the previous
// src/lib/topics.ts so no existing URL moves (spec §4.2).

export function topicSlug(key: string): string {
  return key.replace(/_/g, "-");
}

export function chapterSlug(chapterEn: string): string {
  return chapterEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function dashed(id: string): string {
  return id.replace(/_/g, "-");
}

export function aptitudeChapterSlug(chapterId: string): string {
  return dashed(chapterId.replace(/^\d+_/, ""));
}

const SUBJECT_SLUGS: Record<string, string> = {
  quant: "quant",
  reasoning: "reasoning",
  di: "data-interpretation",
  puzzles: "puzzles",
  english: "english",
  previous_year_papers: "previous-year-questions",
};

export function aptitudeSubjectSlug(subjectId: string): string {
  return SUBJECT_SLUGS[subjectId] ?? dashed(subjectId);
}

export function parseSetParam(param: string): number | null {
  const m = /^set-(\d+)$/.exec(param);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}
```

Note the `.trim()` position: the live site trims **after** collapsing dashes, which leaves a leading/trailing dash for names with leading spaces; no manifest chapter has leading/trailing spaces, so trimming first is equivalent for every real name and correct for the edge case. The test pins the behaviour.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/slugs.ts test/slugs.test.ts
git commit -m "feat(content): slug helpers pinned to live URLs plus aptitude slugs

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Content validation script and the generated index

**Model:** `fable`

**Files:**
- Create: `scripts/validate-content.mjs`
- Create: `src/generated/content-index.json` (generated by running the script)
- Create: `src/lib/content/index.ts`
- Test: `test/contentIndex.test.ts`

**Interfaces:**
- Produces (index file shape):
  ```ts
  interface ContentIndex {
    generatedAt: string;                       // ISO
    files: Record<string /*dir*/, Record<string /*file*/, [number, number]>>; // [en count, hi count]
    totals: {
      topicQuestions: number; topicChapters: number; topicSets: number;
      pyqQuestions: number; pyqPapers: number; pyqExams: number;
      aptitudeQuestions: number; aptitudeSets: number;
      englishQuestions: number; englishChapters: number;
      caQuestions: number; caDays: number;
      articles: number;
    };
  }
  ```
- Produces (`index.ts`): `hasKey(key)`, `counts(key): [number, number] | null`, `listDir(dir): string[]` (sorted), `totals()`, `splitKey(key): [dir, file]`, `getIndex(): ContentIndex`, `__setIndexForTests(idx)`.

- [ ] **Step 1: Write the failing test for the reader**

`test/contentIndex.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hasKey, counts, listDir, totals, splitKey, __setIndexForTests } from "../src/lib/content/index";

const fixture = {
  generatedAt: "2026-09-07T00:00:00Z",
  files: {
    "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "5-Prehistoric.json": [40, 0] },
    "gk/0-Current Affairs/daily": { "2026_09_02.json": [10, 10], "2026_09_01.json": [10, 10] },
  },
  totals: {
    topicQuestions: 110, topicChapters: 2, topicSets: 9,
    pyqQuestions: 0, pyqPapers: 0, pyqExams: 0,
    aptitudeQuestions: 0, aptitudeSets: 0,
    englishQuestions: 0, englishChapters: 0,
    caQuestions: 20, caDays: 2, articles: 0,
  },
};

beforeEach(() => __setIndexForTests(fixture));

test("splitKey", () => {
  assert.deepEqual(splitKey("gk/1-Indian History/1-Indus Valley.json"), ["gk/1-Indian History", "1-Indus Valley.json"]);
  assert.deepEqual(splitKey("gk/topics.json"), ["gk", "topics.json"]);
});

test("hasKey and counts", () => {
  assert.equal(hasKey("gk/1-Indian History/1-Indus Valley.json"), true);
  assert.equal(hasKey("gk/1-Indian History/nope.json"), false);
  assert.deepEqual(counts("gk/1-Indian History/5-Prehistoric.json"), [40, 0]);
  assert.equal(counts("gk/nope/x.json"), null);
});

test("listDir is sorted ascending", () => {
  assert.deepEqual(listDir("gk/0-Current Affairs/daily"), ["2026_09_01.json", "2026_09_02.json"]);
  assert.deepEqual(listDir("gk/none"), []);
});

test("totals", () => {
  assert.equal(totals().caDays, 2);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/lib/content/index.ts`**

```ts
import generated from "@/generated/content-index.json";

export interface ContentTotals {
  topicQuestions: number; topicChapters: number; topicSets: number;
  pyqQuestions: number; pyqPapers: number; pyqExams: number;
  aptitudeQuestions: number; aptitudeSets: number;
  englishQuestions: number; englishChapters: number;
  caQuestions: number; caDays: number;
  articles: number;
}

export interface ContentIndex {
  generatedAt: string;
  files: Record<string, Record<string, [number, number]>>;
  totals: ContentTotals;
}

let index: ContentIndex = generated as unknown as ContentIndex;

export function getIndex(): ContentIndex {
  return index;
}

export function __setIndexForTests(idx: ContentIndex): void {
  index = idx;
}

export function splitKey(key: string): [string, string] {
  const i = key.lastIndexOf("/");
  return i < 0 ? ["", key] : [key.slice(0, i), key.slice(i + 1)];
}

export function hasKey(key: string): boolean {
  const [dir, file] = splitKey(key);
  return Boolean(index.files[dir]?.[file]);
}

export function counts(key: string): [number, number] | null {
  const [dir, file] = splitKey(key);
  return index.files[dir]?.[file] ?? null;
}

export function listDir(dir: string): string[] {
  return Object.keys(index.files[dir] ?? {}).sort();
}

export function totals(): ContentTotals {
  return index.totals;
}
```

- [ ] **Step 4: Create a placeholder index so the import resolves**

`src/generated/content-index.json`:

```json
{ "generatedAt": "1970-01-01T00:00:00.000Z", "files": {}, "totals": { "topicQuestions": 0, "topicChapters": 0, "topicSets": 0, "pyqQuestions": 0, "pyqPapers": 0, "pyqExams": 0, "aptitudeQuestions": 0, "aptitudeSets": 0, "englishQuestions": 0, "englishChapters": 0, "caQuestions": 0, "caDays": 0, "articles": 0 } }
```

Run: `npm test` → reader tests pass.

- [ ] **Step 5: Write `scripts/validate-content.mjs`**

```js
#!/usr/bin/env node
// Walks every manifest the site publishes from, verifies each file exists on
// the CDN, counts questions, and writes src/generated/content-index.json.
// Pages and sitemaps only ever emit URLs for keys in this index (spec §4.2, §10).
//
//   node scripts/validate-content.mjs            # normal
//   node scripts/validate-content.mjs --force    # skip regression + shrink guards
//   node scripts/validate-content.mjs --offline  # rebuild totals from the committed index, no network
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "generated", "content-index.json");
const CDN = "https://cdn.studyvirus.com";
const CONCURRENCY = 24;
const force = process.argv.includes("--force");
const offline = process.argv.includes("--offline");

const NORMAL = 10, LAST = 20;
const ENGLISH_KEYS = new Set(["english_full", "english_basic"]);
const CA_START = new Date(Date.UTC(2026, 3, 1)); // 2026-04-01

const enc = (key) => key.split("/").map(encodeURIComponent).join("/");
const pad2 = (n) => String(n).padStart(2, "0");

function setCount(n) {
  if (n <= 0) return 0;
  if (n <= LAST) return 1;
  let i = 0, sets = 0;
  while (i < n) {
    const rem = n - i;
    if (rem <= LAST && sets > 0) { sets++; break; }
    sets++; i += NORMAL;
  }
  return sets;
}

async function fetchJson(key) {
  const res = await fetch(`${CDN}/${enc(key)}`);
  if (res.status === 404) return { status: 404 };
  if (!res.ok) throw new Error(`${res.status} for ${key}`);
  const text = await res.text();
  try { return { status: 200, json: JSON.parse(text) }; }
  catch { return { status: 200, malformed: true }; }
}

async function mustJson(key) {
  const r = await fetchJson(key);
  if (r.status !== 200 || r.malformed) throw new Error(`manifest unavailable or malformed: ${key}`);
  return r.json;
}

// kind decides how [en, hi] is counted
function countFor(kind, json) {
  if (kind === "bilingual") {
    const en = Array.isArray(json?.en) ? json.en.length : Array.isArray(json) ? json.length : 0;
    const hi = Array.isArray(json?.hi) ? json.hi.length : 0;
    return [en, hi];
  }
  if (kind === "aptitude") {
    const q = Array.isArray(json?.questions) ? json.questions : [];
    return [q.length, q.filter((x) => typeof x?.question_hi === "string" && x.question_hi.trim()).length];
  }
  if (kind === "article") {
    const p = Array.isArray(json?.paragraphs) ? json.paragraphs : [];
    return [p.length, p.filter((x) => typeof x?.hi === "string" && x.hi.trim()).length];
  }
  return [0, 0];
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

function assertUnique(label, values) {
  const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) throw new Error(`duplicate ${label}: ${v}`);
    seen.add(v);
  }
}

const chapterSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
const aptChapterSlug = (id) => id.replace(/^\d+_/, "").replace(/_/g, "-");

async function collect() {
  const targets = []; // { key, kind, section, meta }

  // Topics (incl. hidden — English lives in hidden entries)
  const topics = (await mustJson("gk/topics.json")).topics;
  assertUnique("topic key", topics.map((t) => t.key));
  for (const t of topics) {
    if (t.screen === "CurrentAffairs") continue;
    assertUnique(`chapter slug in ${t.key}`, (t.chapters || []).map((c) => chapterSlug(c.en)));
    const section = ENGLISH_KEYS.has(t.key) ? "english" : "topic";
    for (const c of t.chapters || []) targets.push({ key: `gk/${t.folder}/${c.file}`, kind: "bilingual", section, meta: { hidden: !!t.hiddenFromList } });
  }

  // PYQ
  const pyq = (await mustJson("gk/pyq-config.json")).exams.filter((e) => e.sets > 0);
  assertUnique("pyq id", pyq.map((e) => e.id));
  for (const e of pyq) for (let n = 1; n <= e.sets; n++) targets.push({ key: `gk/24-Previous Year Papers/${e.prefix}${pad2(n)}.json`, kind: "bilingual", section: "pyq", meta: { exam: e.id } });

  // Aptitude, two families, tier-1 only
  const fams = [
    { family: "ssc-railway", manifest: "gk/aptitude/manifest.json", base: (s, c, t, f) => `gk/aptitude/content/${s}/${c}/${t}/${f}` },
    { family: "bank", manifest: "bank/manifest.json", base: (s, c, t, f) => `bank/${s}/${c}/${t}/${f}` },
  ];
  for (const fam of fams) {
    const m = await mustJson(fam.manifest);
    assertUnique(`${fam.family} subject id`, m.subjects.map((s) => s.id));
    for (const s of m.subjects) {
      assertUnique(`${fam.family}/${s.id} chapter slug`, s.chapters.map((c) => aptChapterSlug(c.id)));
      for (const c of s.chapters) {
        assertUnique(`${fam.family}/${s.id}/${c.id} type slug`, (c.types || []).map((t) => chapterSlug(t.name?.en || t.id)));
        for (const t of c.types || []) for (const st of t.sets || []) {
          if (st.tier !== 1) continue;
          targets.push({ key: fam.base(s.folder, c.folder, t.folder, st.file), kind: "aptitude", section: "aptitude", meta: {} });
        }
      }
    }
  }

  // Current affairs dailies: every date from CA_START to today
  const today = new Date();
  for (let d = new Date(CA_START); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = `${d.getUTCFullYear()}_${pad2(d.getUTCMonth() + 1)}_${pad2(d.getUTCDate())}`;
    targets.push({ key: `gk/0-Current Affairs/daily/${date}.json`, kind: "bilingual", section: "ca", meta: { neverFail: true } });
  }

  // Articles
  const articles = (await mustJson("gk/articles/index.json")).articles || [];
  assertUnique("article id", articles.map((a) => a.id));
  for (const a of articles) targets.push({ key: `gk/articles/${a.file}`, kind: "article", section: "articles", meta: {} });

  return { targets, pyqExams: pyq.length };
}

function totalsFrom(files, targets) {
  const t = { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 };
  const pyqExamIds = new Set();
  for (const tg of targets) {
    const [dir, file] = [tg.key.slice(0, tg.key.lastIndexOf("/")), tg.key.slice(tg.key.lastIndexOf("/") + 1)];
    const c = files[dir]?.[file];
    if (!c) continue;
    const en = c[0];
    switch (tg.section) {
      case "topic": t.topicQuestions += en; t.topicChapters++; t.topicSets += setCount(en); break;
      case "english": t.englishQuestions += en; t.englishChapters++; break;
      case "pyq": t.pyqQuestions += en; t.pyqPapers++; pyqExamIds.add(tg.meta.exam); break;
      case "aptitude": t.aptitudeQuestions += en; t.aptitudeSets++; break;
      case "ca": t.caQuestions += en; t.caDays++; break;
      case "articles": t.articles++; break;
    }
  }
  t.pyqExams = pyqExamIds.size;
  return t;
}

async function main() {
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;

  if (offline) {
    if (!previous) throw new Error("--offline needs an existing index");
    console.log(`offline: keeping ${Object.values(previous.files).reduce((a, d) => a + Object.keys(d).length, 0)} keys`);
    return;
  }

  const { targets } = await collect();
  console.log(`checking ${targets.length} files on ${CDN} …`);

  const files = {};
  const missing = [], malformed = [];
  let done = 0;
  await mapLimit(targets, CONCURRENCY, async (tg) => {
    let r;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { r = await fetchJson(tg.key); break; } catch (e) { if (attempt === 2) throw e; await new Promise((res) => setTimeout(res, 500 * (attempt + 1))); }
    }
    if (r.status === 404) { if (!tg.meta.neverFail) missing.push(tg); }
    else if (r.malformed) malformed.push(tg.key);
    else {
      const [dir, file] = [tg.key.slice(0, tg.key.lastIndexOf("/")), tg.key.slice(tg.key.lastIndexOf("/") + 1)];
      (files[dir] ??= {})[file] = countFor(tg.kind, r.json);
    }
    if (++done % 500 === 0) console.log(`  ${done}/${targets.length}`);
  });

  if (malformed.length) {
    console.error(`MALFORMED (${malformed.length}):`); malformed.forEach((k) => console.error("  " + k));
    process.exit(1);
  }

  // Regression guard: keys present before, missing now.
  const regressions = [];
  if (previous) {
    for (const [dir, m] of Object.entries(previous.files)) for (const file of Object.keys(m)) {
      if (!files[dir]?.[file] && targets.some((t) => t.key === `${dir}/${file}`)) regressions.push(`${dir}/${file}`);
    }
  }
  const neverPresent = missing.filter((tg) => !regressions.includes(tg.key));
  if (neverPresent.length) {
    console.warn(`WARN never-present (${neverPresent.length}), not failing:`);
    neverPresent.slice(0, 40).forEach((tg) => console.warn("  " + tg.key));
    if (neverPresent.length > 40) console.warn(`  … +${neverPresent.length - 40} more`);
  }
  if (regressions.length && !force) {
    console.error(`REGRESSION: ${regressions.length} previously-present files are gone (use --force to accept):`);
    regressions.slice(0, 40).forEach((k) => console.error("  " + k));
    process.exit(1);
  }

  const count = Object.values(files).reduce((a, d) => a + Object.keys(d).length, 0);
  const prevCount = previous ? Object.values(previous.files).reduce((a, d) => a + Object.keys(d).length, 0) : 0;
  if (previous && prevCount > 0 && count < prevCount * 0.9 && !force) {
    console.error(`SHRINK GUARD: index would shrink ${prevCount} → ${count} (use --force to accept)`);
    process.exit(1);
  }

  const out = { generatedAt: new Date().toISOString(), files, totals: totalsFrom(files, targets) };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`wrote ${OUT}: ${count} files`);
  console.log(JSON.stringify(out.totals, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 6: Run the script for real**

Run: `node scripts/validate-content.mjs`
Expected: finishes in a few minutes; prints totals with `topicQuestions` ≈ 62,000, `pyqPapers` = 2,232, `pyqExams` = 70, `aptitudeSets` ≈ 4,300, `caDays` ≥ 147, `articles` = 137; warnings for the visible `english` topic (`gk/45-English Grammar/…`) are expected; exit code 0. If the run reports MALFORMED, stop and report the keys — do not edit content.

- [ ] **Step 7: Sanity-check the generated index**

Run:
```bash
node -e "const i=require('./src/generated/content-index.json');console.log(Object.keys(i.files).length,'dirs');console.log(i.files['gk/1-Indian History']['1-Indus Valley.json'])"
```
Expected: a dir count in the hundreds; `[ 70, 70 ]`.

- [ ] **Step 8: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: pass.

- [ ] **Step 9: Commit**

```bash
git add scripts/validate-content.mjs src/lib/content/index.ts src/generated/content-index.json test/contentIndex.test.ts
git commit -m "feat(content): validation script writes the content index; index reader

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Topics loader (manifest-driven, English by key)

**Model:** `opus`

**Files:**
- Create: `src/lib/content/topics.ts`
- Create: `test/fixtures/topics.json`
- Test: `test/topics.test.ts`

**Interfaces:**
- Consumes: `getJson` (Task 3), `keys` (Task 2), `hasKey`/`counts` (Task 7), `topicSlug`/`chapterSlug` (Task 6), `setCount` (Task 5).
- Produces:
  ```ts
  interface ManifestChapter { file: string; en: string; hi: string }
  interface ManifestTopic { key: string; folder: string; emoji: string; en: { name: string; desc: string }; hi: { name: string; desc: string }; accent: string; exams?: string[]; hiddenFromList?: boolean; screen?: string; badge?: string; chapters: ManifestChapter[] }
  interface ChapterInfo { topic: ManifestTopic; chapter: ManifestChapter; key: string; slug: string; enCount: number; hiCount: number; sets: number }
  loadTopics(): Promise<ManifestTopic[]>
  visibleTopics(all): ManifestTopic[]            // !hidden, not CA, not English, ≥1 existing chapter
  englishTopics(all): ManifestTopic[]           // keys english_full, english_basic, in that order
  findTopicBySlug(list, slug): ManifestTopic | undefined
  chaptersOf(topic): ChapterInfo[]              // only chapters whose file exists in the index
  findChapter(topic, slug): ChapterInfo | undefined
  topicsForExam(all, examId): ManifestTopic[]
  adjacentChapters(topic, slug): { prev?: ChapterInfo; next?: ChapterInfo }
  ENGLISH_KEYS
  ```

- [ ] **Step 1: Create the fixture** `test/fixtures/topics.json`

```json
{
  "topics": [
    { "key": "current_affairs", "folder": "0-Current Affairs", "emoji": "📰", "screen": "CurrentAffairs", "hiddenFromList": true, "exams": ["rrb_ntpc"], "en": { "name": "Current Affairs", "desc": "" }, "hi": { "name": "करेंट अफेयर्स", "desc": "" }, "accent": "#ef4444", "chapters": [] },
    { "key": "history", "folder": "1-Indian History", "emoji": "🏛️", "exams": ["rrb_ntpc", "ssc_cgl"], "en": { "name": "Indian History", "desc": "Ancient to Modern" }, "hi": { "name": "भारतीय इतिहास", "desc": "" }, "accent": "#d97706",
      "chapters": [ { "file": "1-Indus Valley.json", "en": "Indus Valley", "hi": "सिंधु घाटी" }, { "file": "13-Viceroys & Acts.json", "en": "Viceroys & Acts", "hi": "वायसराय" }, { "file": "99-Missing.json", "en": "Missing Chapter", "hi": "x" } ] },
    { "key": "english", "folder": "45-English Grammar", "emoji": "🔤", "exams": ["ssc_cgl"], "en": { "name": "English", "desc": "" }, "hi": { "name": "अंग्रेज़ी", "desc": "" }, "accent": "#000", "chapters": [ { "file": "1-Nope.json", "en": "Nope", "hi": "x" } ] },
    { "key": "english_full", "folder": "45-English Grammar Full", "emoji": "📚", "hiddenFromList": true, "exams": ["ssc_cgl"], "en": { "name": "English Grammar Full", "desc": "" }, "hi": { "name": "अंग्रेज़ी", "desc": "" }, "accent": "#000", "chapters": [ { "file": "1-Idioms and Phrases SSC.json", "en": "Idioms & Phrases", "hi": "मुहावरे" } ] },
    { "key": "english_basic", "folder": "46-English Grammar Basic", "emoji": "🔤", "hiddenFromList": true, "exams": [], "en": { "name": "English Grammar Basic", "desc": "" }, "hi": { "name": "अंग्रेज़ी", "desc": "" }, "accent": "#000", "chapters": [ { "file": "1-Synonyms_Basic.json", "en": "Synonyms (Basic)", "hi": "पर्यायवाची" } ] },
    { "key": "ghost", "folder": "98-Ghost", "emoji": "👻", "exams": ["rrb_ntpc"], "en": { "name": "Ghost", "desc": "" }, "hi": { "name": "x", "desc": "" }, "accent": "#000", "chapters": [ { "file": "1-Gone.json", "en": "Gone", "hi": "x" } ] }
  ]
}
```

- [ ] **Step 2: Write the failing tests** `test/topics.test.ts`

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadTopics, visibleTopics, englishTopics, findTopicBySlug, chaptersOf, findChapter, topicsForExam, adjacentChapters } from "../src/lib/content/topics";

const manifest = readFileSync(new URL("./fixtures/topics.json", import.meta.url), "utf8");

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "gk/topics.json" ? { text: async () => manifest } : null; } }));
  __setIndexForTests({
    generatedAt: "x",
    files: {
      "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "13-Viceroys & Acts.json": [40, 0] },
      "gk/45-English Grammar Full": { "1-Idioms and Phrases SSC.json": [30, 30] },
      "gk/46-English Grammar Basic": { "1-Synonyms_Basic.json": [20, 20] },
    },
    totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 },
  });
});

test("visibleTopics drops CA, English, hidden and topics with no existing files", async () => {
  const all = await loadTopics();
  assert.deepEqual(visibleTopics(all).map((t) => t.key), ["history"]);
});

test("englishTopics picks the two hidden keys in fixed order", async () => {
  const all = await loadTopics();
  assert.deepEqual(englishTopics(all).map((t) => t.key), ["english_full", "english_basic"]);
});

test("chaptersOf only lists existing files, with counts and app-rule set counts", async () => {
  const all = await loadTopics();
  const hist = findTopicBySlug(visibleTopics(all), "history")!;
  const chs = chaptersOf(hist);
  assert.deepEqual(chs.map((c) => c.slug), ["indus-valley", "viceroys-acts"]);
  assert.equal(chs[0].key, "gk/1-Indian History/1-Indus Valley.json");
  assert.equal(chs[0].enCount, 70);
  assert.equal(chs[0].hiCount, 70);
  assert.equal(chs[0].sets, 6);
  assert.equal(chs[1].hiCount, 0);
  assert.equal(findChapter(hist, "missing-chapter"), undefined);
});

test("topicsForExam and adjacentChapters", async () => {
  const all = await loadTopics();
  assert.deepEqual(topicsForExam(all, "rrb_ntpc").map((t) => t.key), ["history"]);
  const hist = findTopicBySlug(all, "history")!;
  const adj = adjacentChapters(hist, "indus-valley");
  assert.equal(adj.prev, undefined);
  assert.equal(adj.next?.slug, "viceroys-acts");
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `src/lib/content/topics.ts`**

```ts
import { getJson } from "./loader";
import { keys } from "./keys";
import { hasKey, counts } from "./index";
import { topicSlug, chapterSlug } from "./slugs";
import { setCount } from "./sets";

export interface ManifestChapter { file: string; en: string; hi: string }
export interface ManifestTopic {
  key: string; folder: string; emoji: string;
  en: { name: string; desc: string }; hi: { name: string; desc: string };
  accent: string; exams?: string[]; hiddenFromList?: boolean; screen?: string; badge?: string;
  chapters: ManifestChapter[];
}
export interface ChapterInfo {
  topic: ManifestTopic; chapter: ManifestChapter; key: string; slug: string;
  enCount: number; hiCount: number; sets: number;
}

export const ENGLISH_KEYS = ["english_full", "english_basic"] as const;

export async function loadTopics(): Promise<ManifestTopic[]> {
  const m = await getJson<{ topics: ManifestTopic[] }>(keys.topicsManifest());
  return m?.topics ?? [];
}

export function chaptersOf(topic: ManifestTopic): ChapterInfo[] {
  const out: ChapterInfo[] = [];
  for (const chapter of topic.chapters || []) {
    const key = keys.chapterFile(topic.folder, chapter.file);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ topic, chapter, key, slug: chapterSlug(chapter.en), enCount: c[0], hiCount: c[1], sets: setCount(Array.from({ length: c[0] })) });
  }
  return out;
}

function hasAnyChapter(t: ManifestTopic): boolean {
  return (t.chapters || []).some((c) => hasKey(keys.chapterFile(t.folder, c.file)));
}

export function visibleTopics(all: ManifestTopic[]): ManifestTopic[] {
  return all.filter((t) => !t.hiddenFromList && t.screen !== "CurrentAffairs" && !(ENGLISH_KEYS as readonly string[]).includes(t.key) && t.key !== "english" && hasAnyChapter(t));
}

export function englishTopics(all: ManifestTopic[]): ManifestTopic[] {
  return ENGLISH_KEYS.map((k) => all.find((t) => t.key === k)).filter((t): t is ManifestTopic => Boolean(t && hasAnyChapter(t)));
}

export function findTopicBySlug(list: ManifestTopic[], slug: string): ManifestTopic | undefined {
  return list.find((t) => topicSlug(t.key) === slug);
}

export function findChapter(topic: ManifestTopic, slug: string): ChapterInfo | undefined {
  return chaptersOf(topic).find((c) => c.slug === slug);
}

export function topicsForExam(all: ManifestTopic[], examId: string): ManifestTopic[] {
  return visibleTopics(all).filter((t) => (t.exams || []).includes(examId));
}

export function adjacentChapters(topic: ManifestTopic, slug: string): { prev?: ChapterInfo; next?: ChapterInfo } {
  const chs = chaptersOf(topic);
  const i = chs.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return { prev: chs[i - 1], next: chs[i + 1] };
}
```

The `english` key exclusion in `visibleTopics` is belt-and-braces: its folder is not on the CDN today (so `hasAnyChapter` already drops it), but if that folder ever appears it must still not become a third English section without a deliberate decision.

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npm run typecheck`
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/topics.ts test/topics.test.ts test/fixtures/topics.json
git commit -m "feat(content): manifest-driven topics loader with index-gated chapters

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: PYQ loader

**Model:** `sonnet`

**Files:**
- Create: `src/lib/content/pyq.ts`
- Test: `test/pyq.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface PyqExam { id: string; en: string; hi: string; category: string; prefix: string; sets: number; emoji?: string; paperType?: string }
  interface PyqPaper { exam: PyqExam; n: number; key: string; enCount: number; hiCount: number }
  loadPyqExams(): Promise<PyqExam[]>              // sets > 0 and at least one existing paper
  pyqSlug(exam: PyqExam, slugOverrides: Record<string,string>): string
  findPyqBySlug(list, slug, overrides): PyqExam | undefined
  papersOf(exam): PyqPaper[]                      // only existing files, ascending n
  findPaper(exam, n): PyqPaper | undefined
  ```
  `slugOverrides` maps exam id → slug (Task 12 supplies it from the exam registry so `/pyq/rpf` keeps working).

- [ ] **Step 1: Write the failing tests** `test/pyq.test.ts`

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadPyqExams, pyqSlug, findPyqBySlug, papersOf, findPaper } from "../src/lib/content/pyq";

const config = JSON.stringify({ exams: [
  { id: "rrb_ntpc", en: "RRB NTPC", hi: "RRB NTPC", category: "railway", prefix: "pyq_rrb_ntpc_set", sets: 3 },
  { id: "rpf_constable", en: "RPF", hi: "RPF", category: "railway", prefix: "pyq_rpf_set", sets: 2 },
  { id: "inactive", en: "X", hi: "X", category: "x", prefix: "pyq_x_set", sets: 0 },
  { id: "empty", en: "E", hi: "E", category: "x", prefix: "pyq_e_set", sets: 2 },
]});

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "gk/pyq-config.json" ? { text: async () => config } : null; } }));
  __setIndexForTests({ generatedAt: "x", files: { "gk/24-Previous Year Papers": {
    "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set03.json": [40, 40], "pyq_rpf_set01.json": [40, 0], "pyq_rpf_set02.json": [40, 40],
  } }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("loadPyqExams keeps active exams with at least one existing paper", async () => {
  const exams = await loadPyqExams();
  assert.deepEqual(exams.map((e) => e.id), ["rrb_ntpc", "rpf_constable"]);
});

test("slugs honour overrides, else dash the id", async () => {
  const exams = await loadPyqExams();
  const ov = { rpf_constable: "rpf" };
  assert.equal(pyqSlug(exams[0], ov), "rrb-ntpc");
  assert.equal(pyqSlug(exams[1], ov), "rpf");
  assert.equal(findPyqBySlug(exams, "rpf", ov)?.id, "rpf_constable");
  assert.equal(findPyqBySlug(exams, "rpf-constable", ov), undefined);
});

test("papersOf skips missing files and findPaper is exact", async () => {
  const [ntpc] = await loadPyqExams();
  assert.deepEqual(papersOf(ntpc).map((p) => p.n), [1, 3]);
  assert.equal(papersOf(ntpc)[1].key, "gk/24-Previous Year Papers/pyq_rrb_ntpc_set03.json");
  assert.equal(findPaper(ntpc, 2), undefined);
  assert.equal(findPaper(ntpc, 3)?.enCount, 40);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 3: Implement `src/lib/content/pyq.ts`**

```ts
import { getJson } from "./loader";
import { keys } from "./keys";
import { counts } from "./index";
import { dashed } from "./slugs";

export interface PyqExam { id: string; en: string; hi: string; category: string; prefix: string; sets: number; emoji?: string; paperType?: string }
export interface PyqPaper { exam: PyqExam; n: number; key: string; enCount: number; hiCount: number }

export function papersOf(exam: PyqExam): PyqPaper[] {
  const out: PyqPaper[] = [];
  for (let n = 1; n <= exam.sets; n++) {
    const key = keys.pyqPaper(exam.prefix, n);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ exam, n, key, enCount: c[0], hiCount: c[1] });
  }
  return out;
}

export async function loadPyqExams(): Promise<PyqExam[]> {
  const cfg = await getJson<{ exams: PyqExam[] }>(keys.pyqConfig());
  return (cfg?.exams ?? []).filter((e) => e.sets > 0 && papersOf(e).length > 0);
}

export function pyqSlug(exam: PyqExam, slugOverrides: Record<string, string>): string {
  return slugOverrides[exam.id] ?? dashed(exam.id);
}

export function findPyqBySlug(list: PyqExam[], slug: string, slugOverrides: Record<string, string>): PyqExam | undefined {
  return list.find((e) => pyqSlug(e, slugOverrides) === slug);
}

export function findPaper(exam: PyqExam, n: number): PyqPaper | undefined {
  return papersOf(exam).find((p) => p.n === n);
}
```

- [ ] **Step 4: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/pyq.ts test/pyq.test.ts
git commit -m "feat(content): PYQ loader from pyq-config with index-gated papers

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Aptitude loader (two families, tier-1 only)

**Model:** `fable`

**Files:**
- Create: `src/lib/content/aptitude.ts`
- Create: `test/fixtures/aptitude-bank.json`, `test/fixtures/aptitude-gk.json`
- Test: `test/aptitude.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type AptitudeFamily = "ssc-railway" | "bank"   (re-exported from keys)
  interface AptSetRef { id: string; file: string; tier: number; count: number; name: { en: string; hi: string } }
  interface AptType { id: string; folder: string; name: { en: string; hi: string }; sets: AptSetRef[] }
  interface AptChapter { id: string; folder: string; name: { en: string; hi: string }; emoji?: string; types: AptType[] }
  interface AptSubject { id: string; folder: string; icon?: string; name: { en: string; hi: string }; chapters: AptChapter[] }
  interface AptFamilyInfo { family: AptitudeFamily; slug: AptitudeFamily; name: { en: string; hi: string }; examQualifier: { en: string; hi: string }; subjects: AptSubject[] }
  interface AptSetInfo { family: AptitudeFamily; subject: AptSubject; chapter: AptChapter; type: AptType; set: AptSetRef; n: number; key: string; enCount: number; hiCount: number }
  FAMILIES: readonly AptitudeFamily[]
  loadFamily(family): Promise<AptFamilyInfo>       // tier-1 filtered; empty types/chapters/subjects removed
  subjectSlug(s: AptSubject): string; chapterSlug(c: AptChapter): string; typeSlug(t: AptType): string
  findSubject(fam, slug), findAptChapter(subject, slug), findType(chapter, slug)
  setsOf(family, subject, chapter, type): AptSetInfo[]   // n = 1-based among tier-1 sets, existing files only
  findAptSet(family, subject, chapter, type, n): AptSetInfo | undefined
  ```

- [ ] **Step 1: Create fixtures**

`test/fixtures/aptitude-bank.json`:

```json
{ "version": 1, "subjects": [
  { "id": "quant", "folder": "1-Quantitative Aptitude", "icon": "🔢", "name": { "en": "Quantitative Aptitude", "hi": "मात्रात्मक अभिक्षमता" }, "chapters": [
    { "id": "01_number_series", "folder": "01_number_series", "name": { "en": "Number Series", "hi": "संख्या श्रृंखला" }, "types": [
      { "id": "type_01", "folder": "1-Missing Term", "name": { "en": "Missing Term", "hi": "लुप्त पद" }, "sets": [
        { "id": "set_01", "file": "Foundation/Set 01.json", "tier": 1, "count": 10, "name": { "en": "Set 01", "hi": "सेट 01" } },
        { "id": "set_02", "file": "Foundation/Set 02.json", "tier": 2, "count": 10, "name": { "en": "Set 02", "hi": "सेट 02" } },
        { "id": "set_03", "file": "Foundation/Set 03.json", "tier": 1, "count": 10, "name": { "en": "Set 03", "hi": "सेट 03" } },
        { "id": "set_04", "file": "Foundation/Set 04.json", "tier": 1, "count": 10, "name": { "en": "Set 04", "hi": "सेट 04" } }
      ] },
      { "id": "type_02", "folder": "2-Wrong Term", "name": { "en": "Wrong Term", "hi": "गलत पद" }, "sets": [
        { "id": "set_01", "file": "Foundation/Set 01.json", "tier": 2, "count": 10, "name": { "en": "Set 01", "hi": "सेट 01" } }
      ] }
    ] }
  ] },
  { "id": "previous_year_papers", "folder": "7-Previous Year Papers", "name": { "en": "Previous Year Questions Papers", "hi": "पिछले वर्ष" }, "chapters": [
    { "id": "1-Quantitative Aptitude", "folder": "1-Quantitative Aptitude", "name": { "en": "Quantitative Aptitude", "hi": "x" }, "types": [
      { "id": "t", "folder": "t", "name": { "en": "T", "hi": "T" }, "sets": [ { "id": "s", "file": "S.json", "tier": 2, "count": 10, "name": { "en": "S", "hi": "S" } } ] }
    ] }
  ] }
] }
```

`test/fixtures/aptitude-gk.json`:

```json
{ "version": 1, "subjects": [
  { "id": "quant", "folder": "quant", "icon": "🔢", "name": { "en": "Quantitative Aptitude", "hi": "मात्रात्मक अभिक्षमता" }, "chapters": [
    { "id": "01_number_system_hcf_lcm", "folder": "01_number_system_hcf_lcm", "emoji": "🔢", "name": { "en": "Number System, HCF & LCM", "hi": "संख्या पद्धति" }, "types": [
      { "id": "type_01", "folder": "1-Divisibility Rules", "name": { "en": "Divisibility Rules", "hi": "x" }, "sets": [
        { "id": "set_01", "file": "Set 01.json", "tier": 1, "count": 10, "name": { "en": "Set 01", "hi": "सेट 01" } }
      ] }
    ] }
  ] }
] }
```

- [ ] **Step 2: Write the failing tests** `test/aptitude.test.ts`

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadFamily, subjectSlug, chapterSlug, typeSlug, findSubject, findAptChapter, findType, setsOf, findAptSet } from "../src/lib/content/aptitude";

const bank = readFileSync(new URL("./fixtures/aptitude-bank.json", import.meta.url), "utf8");
const gk = readFileSync(new URL("./fixtures/aptitude-gk.json", import.meta.url), "utf8");

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) {
    if (key === "bank/manifest.json") return { text: async () => bank };
    if (key === "gk/aptitude/manifest.json") return { text: async () => gk };
    return null;
  } }));
  __setIndexForTests({ generatedAt: "x", files: {
    "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation": { "Set 01.json": [10, 10], "Set 04.json": [10, 0] },
    "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules": { "Set 01.json": [10, 10] },
  }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("bank family: tier-2 sets, empty types and empty subjects are removed", async () => {
  const fam = await loadFamily("bank");
  assert.equal(fam.slug, "bank");
  assert.deepEqual(fam.subjects.map((s) => s.id), ["quant"]);              // PYQ subject had only tier-2
  const quant = fam.subjects[0];
  assert.deepEqual(quant.chapters[0].types.map((t) => t.id), ["type_01"]); // Wrong Term had only tier-2
  assert.deepEqual(quant.chapters[0].types[0].sets.map((s) => s.id), ["set_01", "set_03", "set_04"]);
});

test("slugs and lookups", async () => {
  const fam = await loadFamily("bank");
  const s = findSubject(fam, "quant")!;
  assert.equal(subjectSlug(s), "quant");
  const c = findAptChapter(s, "number-series")!;
  assert.equal(chapterSlug(c), "number-series");
  const t = findType(c, "missing-term")!;
  assert.equal(typeSlug(t), "missing-term");
});

test("setsOf numbers tier-1 sets 1..n and skips files missing from the index", async () => {
  const fam = await loadFamily("bank");
  const s = fam.subjects[0], c = s.chapters[0], t = c.types[0];
  const sets = setsOf("bank", s, c, t);
  // set_03's file is not in the index → dropped; numbering follows the tier-1 order that remains
  assert.deepEqual(sets.map((x) => [x.n, x.set.id]), [[1, "set_01"], [2, "set_04"]]);
  assert.equal(sets[0].key, "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json");
  assert.equal(sets[1].hiCount, 0);
  assert.equal(findAptSet("bank", s, c, t, 3), undefined);
});

test("ssc-railway family reads the gk manifest and content path", async () => {
  const fam = await loadFamily("ssc-railway");
  assert.equal(fam.examQualifier.en, "SSC CGL, CHSL, MTS & RRB NTPC, Group D");
  const s = fam.subjects[0], c = s.chapters[0], t = c.types[0];
  assert.equal(chapterSlug(c), "number-system-hcf-lcm");
  assert.equal(setsOf("ssc-railway", s, c, t)[0].key, "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules/Set 01.json");
});
```

- [ ] **Step 3: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 4: Implement `src/lib/content/aptitude.ts`**

```ts
import { getJson } from "./loader";
import { keys, type AptitudeFamily } from "./keys";
import { counts } from "./index";
import { aptitudeChapterSlug, aptitudeSubjectSlug, chapterSlug as nameSlug } from "./slugs";

export type { AptitudeFamily };

export interface AptSetRef { id: string; file: string; tier: number; count: number; name: { en: string; hi: string } }
export interface AptType { id: string; folder: string; name: { en: string; hi: string }; sets: AptSetRef[] }
export interface AptChapter { id: string; folder: string; name: { en: string; hi: string }; emoji?: string; types: AptType[] }
export interface AptSubject { id: string; folder: string; icon?: string; name: { en: string; hi: string }; chapters: AptChapter[] }
export interface AptFamilyInfo {
  family: AptitudeFamily; slug: AptitudeFamily;
  name: { en: string; hi: string }; examQualifier: { en: string; hi: string };
  subjects: AptSubject[];
}
export interface AptSetInfo {
  family: AptitudeFamily; subject: AptSubject; chapter: AptChapter; type: AptType; set: AptSetRef;
  n: number; key: string; enCount: number; hiCount: number;
}

export const FAMILIES: readonly AptitudeFamily[] = ["ssc-railway", "bank"];

const FAMILY_META: Record<AptitudeFamily, { manifest: string; name: { en: string; hi: string }; examQualifier: { en: string; hi: string } }> = {
  "ssc-railway": {
    manifest: keys.gkAptitudeManifest(),
    name: { en: "SSC & Railway", hi: "SSC और रेलवे" },
    examQualifier: { en: "SSC CGL, CHSL, MTS & RRB NTPC, Group D", hi: "SSC CGL, CHSL, MTS और RRB NTPC, ग्रुप D" },
  },
  bank: {
    manifest: keys.bankManifest(),
    name: { en: "Bank", hi: "बैंक" },
    examQualifier: { en: "SBI PO, SBI Clerk, IBPS PO, IBPS Clerk & RRB", hi: "SBI PO, SBI क्लर्क, IBPS PO, IBPS क्लर्क और RRB" },
  },
};

function tierOne(subjects: AptSubject[]): AptSubject[] {
  return subjects
    .map((s) => ({
      ...s,
      chapters: (s.chapters || [])
        .map((c) => ({ ...c, types: (c.types || []).map((t) => ({ ...t, sets: (t.sets || []).filter((x) => x.tier === 1) })).filter((t) => t.sets.length > 0) }))
        .filter((c) => c.types.length > 0),
    }))
    .filter((s) => s.chapters.length > 0);
}

export async function loadFamily(family: AptitudeFamily): Promise<AptFamilyInfo> {
  const meta = FAMILY_META[family];
  const m = await getJson<{ subjects: AptSubject[] }>(meta.manifest);
  return { family, slug: family, name: meta.name, examQualifier: meta.examQualifier, subjects: tierOne(m?.subjects ?? []) };
}

export const subjectSlug = (s: AptSubject) => aptitudeSubjectSlug(s.id);
export const chapterSlug = (c: AptChapter) => aptitudeChapterSlug(c.id);
export const typeSlug = (t: AptType) => nameSlug(t.name?.en || t.id);

export const findSubject = (fam: AptFamilyInfo, slug: string) => fam.subjects.find((s) => subjectSlug(s) === slug);
export const findAptChapter = (s: AptSubject, slug: string) => s.chapters.find((c) => chapterSlug(c) === slug);
export const findType = (c: AptChapter, slug: string) => c.types.find((t) => typeSlug(t) === slug);

export function setsOf(family: AptitudeFamily, subject: AptSubject, chapter: AptChapter, type: AptType): AptSetInfo[] {
  const out: AptSetInfo[] = [];
  for (const set of type.sets) {
    const key = keys.aptitudeSet(family, subject.folder, chapter.folder, type.folder, set.file);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ family, subject, chapter, type, set, n: out.length + 1, key, enCount: c[0], hiCount: c[1] });
  }
  return out;
}

export function findAptSet(family: AptitudeFamily, subject: AptSubject, chapter: AptChapter, type: AptType, n: number): AptSetInfo | undefined {
  return setsOf(family, subject, chapter, type).find((s) => s.n === n);
}
```

- [ ] **Step 5: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/aptitude.ts test/aptitude.test.ts test/fixtures/aptitude-bank.json test/fixtures/aptitude-gk.json
git commit -m "feat(content): two-family aptitude loader, tier-1 only, index-gated sets

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Current affairs and articles loaders

**Model:** `opus`

**Files:**
- Create: `src/lib/content/currentAffairs.ts`, `src/lib/content/articles.ts`
- Test: `test/currentAffairs.test.ts`, `test/articles.test.ts`

**Interfaces:**
- Produces (`currentAffairs.ts`):
  ```ts
  interface CaDay { date: string /* YYYY_MM_DD */; month: string /* YYYY_MM */; key: string; enCount: number; hiCount: number; iso: string /* YYYY-MM-DD */ }
  listDays(): CaDay[]                       // newest first, from the index
  listMonths(): { month: string; days: CaDay[] }[]   // newest first
  daysOfMonth(month): CaDay[]               // oldest first
  findDay(date): CaDay | undefined
  isStale(day, now = new Date()): boolean   // older than 90 days
  monthLabel(month, lang): string           // "September 2026" / "सितंबर 2026"
  CA_DAILY_DIR = "gk/0-Current Affairs/daily"
  ```
- Produces (`articles.ts`):
  ```ts
  interface ArticleMeta { id: string; title_en: string; title_hi?: string; category: string; tag?: string; readTime?: number; views?: string; file: string }
  interface ArticleBody { id: string; paragraphs: { type?: string; en: string; hi?: string }[] }
  loadArticles(): Promise<ArticleMeta[]>    // only those whose file is in the index
  findArticle(list, id)
  loadArticleBody(meta): Promise<ArticleBody | null>
  articleHasHindi(meta): boolean            // index hi count === en count and > 0
  ```

- [ ] **Step 1: Write failing tests**

`test/currentAffairs.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { listDays, listMonths, daysOfMonth, findDay, isStale, monthLabel } from "../src/lib/content/currentAffairs";

beforeEach(() => __setIndexForTests({ generatedAt: "x", files: { "gk/0-Current Affairs/daily": {
  "2026_08_30.json": [10, 10], "2026_09_02.json": [10, 10], "2026_09_01.json": [12, 0], "notes.txt": [0, 0],
} }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } }));

test("listDays newest first, only date-named json with questions", () => {
  assert.deepEqual(listDays().map((d) => d.date), ["2026_09_02", "2026_09_01", "2026_08_30"]);
  assert.equal(listDays()[0].iso, "2026-09-02");
  assert.equal(listDays()[0].key, "gk/0-Current Affairs/daily/2026_09_02.json");
});

test("months and days of month", () => {
  assert.deepEqual(listMonths().map((m) => [m.month, m.days.length]), [["2026_09", 2], ["2026_08", 1]]);
  assert.deepEqual(daysOfMonth("2026_09").map((d) => d.date), ["2026_09_01", "2026_09_02"]);
  assert.equal(findDay("2026_09_01")?.hiCount, 0);
  assert.equal(findDay("2026_09_09"), undefined);
});

test("staleness is 90 days", () => {
  const d = findDay("2026_08_30")!;
  assert.equal(isStale(d, new Date("2026-11-27T00:00:00Z")), false);
  assert.equal(isStale(d, new Date("2026-11-29T00:00:00Z")), true);
});

test("monthLabel", () => {
  assert.equal(monthLabel("2026_09", "en"), "September 2026");
  assert.equal(monthLabel("2026_09", "hi"), "सितंबर 2026");
});
```

`test/articles.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadArticles, findArticle, loadArticleBody, articleHasHindi } from "../src/lib/content/articles";

const index = JSON.stringify({ articles: [
  { id: "a", title_en: "A", title_hi: "अ", category: "strategy", file: "a.json" },
  { id: "b", title_en: "B", category: "strategy", file: "b.json" },
  { id: "gone", title_en: "G", category: "x", file: "gone.json" },
]});
const bodyA = JSON.stringify({ id: "a", paragraphs: [{ type: "heading", en: "A", hi: "अ" }, { en: "p", hi: "प" }] });

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) {
    if (key === "gk/articles/index.json") return { text: async () => index };
    if (key === "gk/articles/a.json") return { text: async () => bodyA };
    return null;
  } }));
  __setIndexForTests({ generatedAt: "x", files: { "gk/articles": { "a.json": [2, 2], "b.json": [3, 1] } }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("loadArticles drops entries whose file is not in the index", async () => {
  assert.deepEqual((await loadArticles()).map((a) => a.id), ["a", "b"]);
});

test("hindi availability and body loading", async () => {
  const list = await loadArticles();
  assert.equal(articleHasHindi(findArticle(list, "a")!), true);
  assert.equal(articleHasHindi(findArticle(list, "b")!), false);
  const body = await loadArticleBody(findArticle(list, "a")!);
  assert.equal(body?.paragraphs.length, 2);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 3: Implement `src/lib/content/currentAffairs.ts`**

```ts
import { listDir, counts } from "./index";
import { keys } from "./keys";

export const CA_DAILY_DIR = "gk/0-Current Affairs/daily";
const STALE_DAYS = 90;
const DATE_RE = /^(\d{4})_(\d{2})_(\d{2})\.json$/;

export interface CaDay { date: string; month: string; key: string; enCount: number; hiCount: number; iso: string }

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_HI = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

export function listDays(): CaDay[] {
  const out: CaDay[] = [];
  for (const file of listDir(CA_DAILY_DIR)) {
    const m = DATE_RE.exec(file);
    if (!m) continue;
    const date = file.slice(0, -5);
    const key = keys.caDaily(date);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ date, month: `${m[1]}_${m[2]}`, key, enCount: c[0], hiCount: c[1], iso: `${m[1]}-${m[2]}-${m[3]}` });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function listMonths(): { month: string; days: CaDay[] }[] {
  const by = new Map<string, CaDay[]>();
  for (const d of listDays()) {
    if (!by.has(d.month)) by.set(d.month, []);
    by.get(d.month)!.push(d);
  }
  return [...by.entries()].map(([month, days]) => ({ month, days }));
}

export function daysOfMonth(month: string): CaDay[] {
  return listDays().filter((d) => d.month === month).reverse();
}

export function findDay(date: string): CaDay | undefined {
  return listDays().find((d) => d.date === date);
}

export function isStale(day: CaDay, now: Date = new Date()): boolean {
  const t = Date.parse(`${day.iso}T00:00:00Z`);
  return now.getTime() - t > STALE_DAYS * 86_400_000;
}

export function monthLabel(month: string, lang: "en" | "hi"): string {
  const [y, m] = month.split("_");
  const i = parseInt(m, 10) - 1;
  return `${(lang === "hi" ? MONTHS_HI : MONTHS_EN)[i]} ${y}`;
}
```

- [ ] **Step 4: Implement `src/lib/content/articles.ts`**

```ts
import { getJson } from "./loader";
import { keys } from "./keys";
import { hasKey, counts } from "./index";

export interface ArticleMeta { id: string; title_en: string; title_hi?: string; category: string; tag?: string; readTime?: number; views?: string; file: string }
export interface ArticleBody { id: string; paragraphs: { type?: string; en: string; hi?: string }[] }

export async function loadArticles(): Promise<ArticleMeta[]> {
  const idx = await getJson<{ articles: ArticleMeta[] }>(keys.articlesIndex());
  return (idx?.articles ?? []).filter((a) => hasKey(keys.article(a.file)));
}

export function findArticle(list: ArticleMeta[], id: string): ArticleMeta | undefined {
  return list.find((a) => a.id === id);
}

export function loadArticleBody(meta: ArticleMeta): Promise<ArticleBody | null> {
  return getJson<ArticleBody>(keys.article(meta.file));
}

export function articleHasHindi(meta: ArticleMeta): boolean {
  const c = counts(keys.article(meta.file));
  return Boolean(c && c[0] > 0 && c[1] === c[0]);
}
```

- [ ] **Step 5: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/content/currentAffairs.ts src/lib/content/articles.ts test/currentAffairs.test.ts test/articles.test.ts
git commit -m "feat(content): current-affairs day enumeration and articles loader

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Exam registry extensions (facts, bank exams, app + portal lookups)

**Model:** `opus`

**Files:**
- Modify: `src/lib/exams.ts` (append bank exams and eight app-only exams; add `bank` category; nothing existing removed)
- Create: `src/lib/content/examFacts.ts`
- Test: `test/exams.test.ts`

**Interfaces:**
- Consumes: `EXAMS`, `Exam` from `src/lib/exams.ts`; `GK_APPS` from `src/lib/gkApps.ts` (read-only, generated).
- Produces (`examFacts.ts`):
  ```ts
  interface ExamFacts { body: string; bodyHi: string; stages: string[]; stagesHi: string[] }
  EXAM_FACTS: Record<string /*examId*/, ExamFacts>
  BANK_APP_PACKAGES: Record<string, string>         // sbi_clerk → com.bankprep.sbiclerk …
  factsFor(examId): ExamFacts                        // falls back to a generic entry
  appPackageFor(examId): string | null               // GK_APPS packageName or BANK_APP_PACKAGES
  cbtPortalFor(examId): string | null                // GK_APPS slug where hasMocks
  pyqSlugOverrides(): Record<string,string>          // examId → registry slug, for Task 9
  examIntro(exam: Exam, lang: "en"|"hi", n: { chapters: number; papers: number }): string
  ```

- [ ] **Step 1: Write the failing tests** `test/exams.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMS, EXAM_CATEGORIES, getExamBySlug } from "../src/lib/exams";
import { factsFor, appPackageFor, cbtPortalFor, pyqSlugOverrides, examIntro, EXAM_FACTS } from "../src/lib/content/examFacts";

test("every exam has facts, a unique slug and a known category", () => {
  const slugs = new Set<string>();
  for (const e of EXAMS) {
    assert.ok(EXAM_FACTS[e.id], `facts missing for ${e.id}`);
    assert.ok(!slugs.has(e.slug), `duplicate slug ${e.slug}`);
    slugs.add(e.slug);
    assert.ok(EXAM_CATEGORIES[e.category], `unknown category ${e.category} on ${e.id}`);
  }
});

test("bank exams exist in the registry", () => {
  for (const id of ["sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po"]) {
    const e = EXAMS.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e!.category, "bank");
  }
  assert.equal(getExamBySlug("sbi-po")?.id, "sbi_po");
});

test("app package and portal lookups", () => {
  assert.equal(appPackageFor("rrb_ntpc"), "com.railwaygk.ntpc");
  assert.equal(appPackageFor("sbi_po"), "com.bankprep.sbipo");
  assert.equal(appPackageFor("no_such_exam"), null);
  assert.equal(typeof cbtPortalFor("rrb_ntpc"), "string");
  assert.equal(cbtPortalFor("no_such_exam"), null);
});

test("pyq slug overrides come from the registry", () => {
  const ov = pyqSlugOverrides();
  assert.equal(ov["rpf_constable"], "rpf");
  assert.equal(ov["rrb_ntpc"], "rrb-ntpc");
});

test("examIntro reads naturally in both languages", () => {
  const e = getExamBySlug("rrb-ntpc")!;
  const en = examIntro(e, "en", { chapters: 120, papers: 31 });
  assert.match(en, /Railway Recruitment Boards/);
  assert.match(en, /CBT 1/);
  assert.match(en, /120 chapters/);
  assert.match(en, /31 previous-year papers/);
  const hi = examIntro(e, "hi", { chapters: 120, papers: 31 });
  assert.match(hi, /रेलवे भर्ती बोर्ड/);
  assert.match(hi, /120 अध्याय/);
  assert.equal(factsFor("unknown_id").stages.length > 0, true);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → facts module missing / bank exams missing.

- [ ] **Step 3: Extend `src/lib/exams.ts`**

Append these entries inside the `EXAMS` array, after the last `labour_inspector` line:

```ts
  // ── Bank (6 bank apps, bank-apps/config/exams.js) ──
  { id: 'sbi_clerk', slug: 'sbi-clerk', en: 'SBI Clerk', hi: 'SBI क्लर्क', fullName: 'State Bank of India Junior Associate (Clerk)', category: 'bank', color: '#1e40af', icon: '🏦' },
  { id: 'sbi_po', slug: 'sbi-po', en: 'SBI PO', hi: 'SBI PO', fullName: 'State Bank of India Probationary Officer', category: 'bank', color: '#1d4ed8', icon: '🏦' },
  { id: 'ibps_clerk', slug: 'ibps-clerk', en: 'IBPS Clerk', hi: 'IBPS क्लर्क', fullName: 'IBPS Customer Service Associate (Clerk)', category: 'bank', color: '#0f766e', icon: '🏦' },
  { id: 'ibps_po', slug: 'ibps-po', en: 'IBPS PO', hi: 'IBPS PO', fullName: 'IBPS Probationary Officer / Management Trainee', category: 'bank', color: '#0e7490', icon: '🏦' },
  { id: 'ibps_rrb_clerk', slug: 'ibps-rrb-clerk', en: 'IBPS RRB Clerk', hi: 'IBPS RRB क्लर्क', fullName: 'IBPS RRB Office Assistant (Multipurpose)', category: 'bank', color: '#7c2d12', icon: '🏦' },
  { id: 'ibps_rrb_po', slug: 'ibps-rrb-po', en: 'IBPS RRB PO', hi: 'IBPS RRB PO', fullName: 'IBPS RRB Officer Scale I', category: 'bank', color: '#9a3412', icon: '🏦' },

  // ── Exams that have a live app but were missing from this registry (LIVE_VERSIONS.csv) ──
  { id: 'gujarat_police', slug: 'gujarat-police', en: 'Gujarat Police', hi: 'गुजरात पुलिस', fullName: 'Gujarat Police Constable / LRB', category: 'police', color: '#1a237e', icon: '👮' },
  { id: 'maharashtra_police', slug: 'maharashtra-police', en: 'Maharashtra Police', hi: 'महाराष्ट्र पुलिस', fullName: 'Maharashtra Police Constable', category: 'police', color: '#b71c1c', icon: '👮' },
  { id: 'wbcs', slug: 'wbcs', en: 'WBCS', hi: 'WBCS', fullName: 'West Bengal Civil Service', category: 'state_psc', color: '#4a148c', icon: '🏛️' },
  { id: 'jpsc', slug: 'jpsc', en: 'JPSC', hi: 'JPSC', fullName: 'Jharkhand Public Service Commission', category: 'state_psc', color: '#004d40', icon: '🏛️' },
  { id: 'upsssc_lower', slug: 'upsssc-lower', en: 'UPSSSC Lower', hi: 'UPSSSC लोअर', fullName: 'UPSSSC Lower Subordinate', category: 'state_sub', color: '#1a237e', icon: '📝' },
  { id: 'bpsc_tre', slug: 'bpsc-tre', en: 'BPSC TRE', hi: 'BPSC TRE', fullName: 'Bihar Teacher Recruitment Exam', category: 'teaching', color: '#880e4f', icon: '🎓' },
  { id: 'mptet', slug: 'mptet', en: 'MPTET', hi: 'MPTET', fullName: 'Madhya Pradesh Teacher Eligibility Test', category: 'teaching', color: '#1b5e20', icon: '🎓' },
  { id: 'gram_sevak', slug: 'gram-sevak', en: 'Gram Sevak', hi: 'ग्राम सेवक', fullName: 'Gram Sevak / Village Development', category: 'revenue', color: '#4e342e', icon: '📑' },
```

And add `bank: 'Bank Exams',` as the **fourth** entry of `EXAM_CATEGORIES` (after `police`), so home-page category order reads Railway, SSC, Police, Bank, Defence…

- [ ] **Step 4: Create `src/lib/content/examFacts.ts`**

```ts
import type { Exam } from "@/lib/exams";
import { EXAMS } from "@/lib/exams";
import { GK_APPS } from "@/lib/gkApps";

export interface ExamFacts { body: string; bodyHi: string; stages: string[]; stagesHi: string[] }

const F = (body: string, bodyHi: string, stages: string[], stagesHi: string[]): ExamFacts => ({ body, bodyHi, stages, stagesHi });
const RRB = ["Railway Recruitment Boards (RRB)", "रेलवे भर्ती बोर्ड (RRB)"] as const;
const SSC = ["Staff Selection Commission (SSC)", "कर्मचारी चयन आयोग (SSC)"] as const;
const UPSC = ["Union Public Service Commission (UPSC)", "संघ लोक सेवा आयोग (UPSC)"] as const;
const IBPS = ["Institute of Banking Personnel Selection (IBPS)", "बैंकिंग कार्मिक चयन संस्थान (IBPS)"] as const;
const PMI = ["Prelims", "Mains", "Interview"], PMI_HI = ["प्रारंभिक", "मुख्य", "साक्षात्कार"];
const PM = ["Prelims", "Mains"], PM_HI = ["प्रारंभिक", "मुख्य"];
const WP = ["Written exam", "Physical test (PET/PST)"], WP_HI = ["लिखित परीक्षा", "शारीरिक परीक्षा (PET/PST)"];
const W = ["Written exam"], W_HI = ["लिखित परीक्षा"];

export const EXAM_FACTS: Record<string, ExamFacts> = {
  rrb_ntpc: F(RRB[0], RRB[1], ["CBT 1", "CBT 2", "Typing / CBAT", "Document verification"], ["CBT 1", "CBT 2", "टाइपिंग / CBAT", "दस्तावेज़ सत्यापन"]),
  rrb_group_d: F(RRB[0], RRB[1], ["CBT", "PET", "Document verification"], ["CBT", "PET", "दस्तावेज़ सत्यापन"]),
  rrb_alp: F(RRB[0], RRB[1], ["CBT 1", "CBT 2", "CBAT", "Document verification"], ["CBT 1", "CBT 2", "CBAT", "दस्तावेज़ सत्यापन"]),
  rpf_constable: F("Railway Protection Force (via RRB)", "रेलवे सुरक्षा बल (RRB द्वारा)", ["CBT", "PET / PMT", "Document verification"], ["CBT", "PET / PMT", "दस्तावेज़ सत्यापन"]),
  ssc_cgl: F(SSC[0], SSC[1], ["Tier 1", "Tier 2"], ["टियर 1", "टियर 2"]),
  ssc_chsl: F(SSC[0], SSC[1], ["Tier 1", "Tier 2 (incl. typing / DEST)"], ["टियर 1", "टियर 2 (टाइपिंग / DEST सहित)"]),
  ssc_mts: F(SSC[0], SSC[1], ["CBT (Session 1 & 2)", "PET / PST (Havaldar)"], ["CBT (सत्र 1 और 2)", "PET / PST (हवलदार)"]),
  ssc_gd: F(SSC[0], SSC[1], ["CBT", "PET / PST", "Medical"], ["CBT", "PET / PST", "मेडिकल"]),
  ssc_cpo: F(SSC[0], SSC[1], ["Paper 1", "PET / PST", "Paper 2", "Medical"], ["पेपर 1", "PET / PST", "पेपर 2", "मेडिकल"]),
  delhi_police: F("SSC, for Delhi Police", "SSC, दिल्ली पुलिस के लिए", ["CBT", "PE & MT"], ["CBT", "PE और MT"]),
  up_police: F("UP Police Recruitment & Promotion Board (UPPRPB)", "उ.प्र. पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB)", ["Written exam", "PST / PET", "Document verification"], ["लिखित परीक्षा", "PST / PET", "दस्तावेज़ सत्यापन"]),
  bihar_police: F("Central Selection Board of Constable (CSBC), Bihar", "केंद्रीय चयन पर्षद (सिपाही भर्ती), बिहार", WP, WP_HI),
  haryana_police: F("Haryana Staff Selection Commission (via CET)", "हरियाणा कर्मचारी चयन आयोग (CET द्वारा)", ["CET", "Knowledge test", "PST / PMT"], ["CET", "ज्ञान परीक्षा", "PST / PMT"]),
  rajasthan_police: F("Rajasthan Police", "राजस्थान पुलिस", WP, WP_HI),
  mp_police: F("MP Employees Selection Board (MPESB)", "म.प्र. कर्मचारी चयन मंडल (MPESB)", ["Paper 1 (Paper 2 for technical posts)", "PET / PMT"], ["पेपर 1 (तकनीकी पदों के लिए पेपर 2)", "PET / PMT"]),
  gujarat_police: F("Lokrakshak Recruitment Board (LRB), Gujarat", "लोकरक्षक भर्ती बोर्ड (LRB), गुजरात", WP, WP_HI),
  maharashtra_police: F("Maharashtra Police", "महाराष्ट्र पुलिस", WP, WP_HI),
  nda: F(UPSC[0], UPSC[1], ["Written (Maths, GAT)", "SSB interview"], ["लिखित (गणित, GAT)", "SSB साक्षात्कार"]),
  upsc_cds: F(UPSC[0], UPSC[1], ["Written (English, GK, Maths)", "SSB interview"], ["लिखित (अंग्रेज़ी, GK, गणित)", "SSB साक्षात्कार"]),
  upsc_capf: F(UPSC[0], UPSC[1], ["Paper 1", "Paper 2", "PET", "Interview"], ["पेपर 1", "पेपर 2", "PET", "साक्षात्कार"]),
  agniveer_army: F("Indian Army", "भारतीय सेना", ["Online CEE", "Physical test", "Medical"], ["ऑनलाइन CEE", "शारीरिक परीक्षा", "मेडिकल"]),
  agniveer_navy_af: F("Indian Navy / Indian Air Force", "भारतीय नौसेना / वायुसेना", ["Online exam", "Physical fitness test", "Medical"], ["ऑनलाइन परीक्षा", "शारीरिक दक्षता परीक्षा", "मेडिकल"]),
  aissee_sainik: F("National Testing Agency (NTA)", "राष्ट्रीय परीक्षा एजेंसी (NTA)", ["Written (AISSEE)", "Medical"], ["लिखित (AISSEE)", "मेडिकल"]),
  upsc_cse: F(UPSC[0], UPSC[1], PMI, PMI_HI),
  ib_acio: F("Intelligence Bureau, Ministry of Home Affairs", "आसूचना ब्यूरो, गृह मंत्रालय", ["Tier 1", "Tier 2", "Interview"], ["टियर 1", "टियर 2", "साक्षात्कार"]),
  ctet: F("Central Board of Secondary Education (CBSE)", "केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  kvs_nvs: F("Kendriya Vidyalaya Sangathan / Navodaya Vidyalaya Samiti", "केंद्रीय विद्यालय संगठन / नवोदय विद्यालय समिति", ["Written exam", "Interview"], ["लिखित परीक्षा", "साक्षात्कार"]),
  ugc_net: F("National Testing Agency (NTA)", "राष्ट्रीय परीक्षा एजेंसी (NTA)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  uptet: F("UP Basic Education Board (UPBEB)", "उ.प्र. बेसिक शिक्षा परिषद (UPBEB)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  stet_bihar: F("Bihar School Examination Board (BSEB)", "बिहार विद्यालय परीक्षा समिति (BSEB)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  super_tet: F("UP Basic Education Board (UPBEB)", "उ.प्र. बेसिक शिक्षा परिषद (UPBEB)", W, W_HI),
  reet: F("Board of Secondary Education, Rajasthan (BSER)", "माध्यमिक शिक्षा बोर्ड, राजस्थान (BSER)", ["Level 1", "Level 2"], ["लेवल 1", "लेवल 2"]),
  bpsc_tre: F("Bihar Public Service Commission (BPSC)", "बिहार लोक सेवा आयोग (BPSC)", W, W_HI),
  mptet: F("MP Employees Selection Board (MPESB)", "म.प्र. कर्मचारी चयन मंडल (MPESB)", W, W_HI),
  uppsc: F("Uttar Pradesh Public Service Commission (UPPSC)", "उत्तर प्रदेश लोक सेवा आयोग (UPPSC)", PMI, PMI_HI),
  bpsc: F("Bihar Public Service Commission (BPSC)", "बिहार लोक सेवा आयोग (BPSC)", PMI, PMI_HI),
  rpsc_ras: F("Rajasthan Public Service Commission (RPSC)", "राजस्थान लोक सेवा आयोग (RPSC)", PMI, PMI_HI),
  mppsc: F("Madhya Pradesh Public Service Commission (MPPSC)", "मध्य प्रदेश लोक सेवा आयोग (MPPSC)", PMI, PMI_HI),
  hpsc_hcs: F("Haryana Public Service Commission (HPSC)", "हरियाणा लोक सेवा आयोग (HPSC)", PMI, PMI_HI),
  ukpsc: F("Uttarakhand Public Service Commission (UKPSC)", "उत्तराखंड लोक सेवा आयोग (UKPSC)", PMI, PMI_HI),
  wbcs: F("West Bengal Public Service Commission (WBPSC)", "पश्चिम बंगाल लोक सेवा आयोग (WBPSC)", PMI, PMI_HI),
  jpsc: F("Jharkhand Public Service Commission (JPSC)", "झारखंड लोक सेवा आयोग (JPSC)", PMI, PMI_HI),
  upsssc_pet: F("UP Subordinate Services Selection Commission (UPSSSC)", "उ.प्र. अधीनस्थ सेवा चयन आयोग (UPSSSC)", ["Preliminary Eligibility Test (PET)"], ["प्रारंभिक अर्हता परीक्षा (PET)"]),
  upsssc_lower: F("UP Subordinate Services Selection Commission (UPSSSC)", "उ.प्र. अधीनस्थ सेवा चयन आयोग (UPSSSC)", PM, PM_HI),
  bssc: F("Bihar Staff Selection Commission (BSSC)", "बिहार कर्मचारी चयन आयोग (BSSC)", PM, PM_HI),
  rsmssb: F("Rajasthan Staff Selection Board (RSMSSB)", "राजस्थान कर्मचारी चयन बोर्ड (RSMSSB)", W, W_HI),
  mpesb_vyapam: F("MP Employees Selection Board (MPESB / Vyapam)", "म.प्र. कर्मचारी चयन मंडल (MPESB / व्यापम)", W, W_HI),
  up_forest_guard: F("UPSSSC", "UPSSSC", WP, WP_HI),
  raj_forest_guard: F("RSMSSB", "RSMSSB", WP, WP_HI),
  mp_forest_guard: F("MPESB", "MPESB", WP, WP_HI),
  jharkhand_forest_guard: F("JSSC", "JSSC", WP, WP_HI),
  bihar_forest_guard: F("CSBC, Bihar", "CSBC, बिहार", WP, WP_HI),
  haryana_forest_guard: F("HSSC", "HSSC", WP, WP_HI),
  raj_jail_prahari: F("RSMSSB", "RSMSSB", WP, WP_HI),
  bihar_jail_warder: F("CSBC, Bihar", "CSBC, बिहार", WP, WP_HI),
  up_jail_prahari: F("UPPRPB", "UPPRPB", WP, WP_HI),
  mp_jail_prahari: F("MPESB", "MPESB", WP, WP_HI),
  up_lekhpal: F("UPSSSC", "UPSSSC", ["Written exam (after PET)"], ["लिखित परीक्षा (PET के बाद)"]),
  raj_patwari: F("RSMSSB", "RSMSSB", W, W_HI),
  mp_patwari: F("MPESB", "MPESB", W, W_HI),
  haryana_patwari: F("HSSC", "HSSC", ["CET", "Written exam"], ["CET", "लिखित परीक्षा"]),
  gram_panchayat_vdo: F("UPSSSC", "UPSSSC", ["Written exam", "Interview (where applicable)"], ["लिखित परीक्षा", "साक्षात्कार (जहाँ लागू)"]),
  gram_sevak: F("State rural development boards", "राज्य ग्रामीण विकास बोर्ड", W, W_HI),
  epfo_ssa_eo: F("UPSC / EPFO", "UPSC / EPFO", ["Written exam", "Interview"], ["लिखित परीक्षा", "साक्षात्कार"]),
  fci_manager: F("Food Corporation of India (FCI)", "भारतीय खाद्य निगम (FCI)", ["Phase 1", "Phase 2", "Interview"], ["चरण 1", "चरण 2", "साक्षात्कार"]),
  agriculture_supervisor: F("RSMSSB", "RSMSSB", W, W_HI),
  ibps_afo: F(IBPS[0], IBPS[1], PMI, PMI_HI),
  labour_inspector: F("State labour departments", "राज्य श्रम विभाग", W, W_HI),
  sbi_clerk: F("State Bank of India (SBI)", "भारतीय स्टेट बैंक (SBI)", PM, PM_HI),
  sbi_po: F("State Bank of India (SBI)", "भारतीय स्टेट बैंक (SBI)", ["Prelims", "Mains", "Psychometric test, GD & Interview"], ["प्रारंभिक", "मुख्य", "साइकोमेट्रिक टेस्ट, GD और साक्षात्कार"]),
  ibps_clerk: F(IBPS[0], IBPS[1], PM, PM_HI),
  ibps_po: F(IBPS[0], IBPS[1], PMI, PMI_HI),
  ibps_rrb_clerk: F(IBPS[0], IBPS[1], PM, PM_HI),
  ibps_rrb_po: F(IBPS[0], IBPS[1], PMI, PMI_HI),
};

const GENERIC: ExamFacts = F("the conducting body", "आयोजक संस्था", W, W_HI);

export function factsFor(examId: string): ExamFacts {
  return EXAM_FACTS[examId] ?? GENERIC;
}

export const BANK_APP_PACKAGES: Record<string, string> = {
  sbi_clerk: "com.bankprep.sbiclerk",
  sbi_po: "com.bankprep.sbipo",
  ibps_clerk: "com.bankprep.ibpsclerk",
  ibps_po: "com.bankprep.ibpspo",
  ibps_rrb_clerk: "com.bankprep.ibpsrrbclerk",
  ibps_rrb_po: "com.bankprep.ibpsrrbpo",
};

export function appPackageFor(examId: string): string | null {
  const gk = GK_APPS.find((a) => a.id === examId);
  return gk?.packageName ?? BANK_APP_PACKAGES[examId] ?? null;
}

export function cbtPortalFor(examId: string): string | null {
  const gk = GK_APPS.find((a) => a.id === examId && a.hasMocks);
  return gk?.slug ?? null;
}

export function pyqSlugOverrides(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of EXAMS) out[e.id] = e.slug;
  return out;
}

export function examIntro(exam: Exam, lang: "en" | "hi", n: { chapters: number; papers: number }): string {
  const f = factsFor(exam.id);
  if (lang === "hi") {
    const stages = f.stagesHi.join(", ");
    const papers = n.papers > 0 ? ` और ${n.papers} पिछले वर्ष के प्रश्नपत्र` : "";
    return `${exam.hi} (${exam.fullName}) का आयोजन ${f.bodyHi} द्वारा किया जाता है। चयन के चरण: ${stages}। यहाँ ${n.chapters} अध्याय${papers} हिंदी और अंग्रेज़ी में, उत्तर और व्याख्या सहित, निःशुल्क उपलब्ध हैं।`;
  }
  const stages = f.stages.join(", ");
  const papers = n.papers > 0 ? ` and ${n.papers} previous-year papers` : "";
  return `${exam.en} (${exam.fullName}) is conducted by ${f.body}. Selection stages: ${stages}. Practice ${n.chapters} chapters${papers} free, in Hindi and English, with answers and explanations.`;
}
```

- [ ] **Step 5: Run tests and typecheck** — `npm test && npm run typecheck` → pass. If `GK_APPS` has no `rrb_ntpc` entry with `hasMocks: true`, the portal test fails: inspect `src/lib/gkApps.ts` for the `rrb_ntpc` entry and adjust the test's expectation to the exam id that does have mocks — do **not** edit `gkApps.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/exams.ts src/lib/content/examFacts.ts test/exams.test.ts
git commit -m "feat(content): exam facts, bank + app-only exams, package/portal lookups

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Hindi availability, stats, apps registry reader

**Model:** `sonnet`

**Files:**
- Create: `src/lib/content/hindi.ts`, `src/lib/content/stats.ts`, `src/lib/content/apps.ts`
- Test: `test/hindi.test.ts`, `test/stats.test.ts`, `test/apps.test.ts`

**Interfaces:**
- `hindi.ts`: `hasHindiCounts(enCount, hiCount): boolean` (en>0 && hi===en); `hasHindiSet(set: { hi?: unknown[]; en?: unknown[] }): boolean`.
- `stats.ts`: `siteStats(): { questions: number; chapters: number; papers: number; pyqExams: number; caDays: number; articles: number; aptitudeSets: number }`; `formatCount(n, lang): string` (`62122` → `"62,122"` for en, `"62,122"` for hi — Indian grouping `"62,122"`, `"1,45,689"`).
- `apps.ts`:
  ```ts
  interface AppEntry { package: string; slug: string; examId?: string; name: string; description: string; rating?: number; ratingCount?: number; installs?: string; icon?: string; screenshots: string[]; updatedAt?: string; category?: string }
  interface AppsRegistry { generatedAt: string; apps: AppEntry[] }
  loadAppsRegistry(): Promise<AppsRegistry | null>
  appForExam(reg, examId): AppEntry | undefined
  appBySlug(reg, slug): AppEntry | undefined
  ```

- [ ] **Step 1: Write failing tests**

`test/hindi.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hasHindiCounts, hasHindiSet } from "../src/lib/content/hindi";

test("hindi requires a complete, non-empty hi array", () => {
  assert.equal(hasHindiCounts(70, 70), true);
  assert.equal(hasHindiCounts(70, 69), false);
  assert.equal(hasHindiCounts(0, 0), false);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1, 2] }), true);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1] }), false);
  assert.equal(hasHindiSet({ en: [1] }), false);
});
```

`test/stats.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { siteStats, formatCount } from "../src/lib/content/stats";

beforeEach(() => __setIndexForTests({ generatedAt: "x", files: {}, totals: {
  topicQuestions: 62122, topicChapters: 809, topicSets: 5413, pyqQuestions: 83567, pyqPapers: 2232, pyqExams: 70,
  aptitudeQuestions: 43000, aptitudeSets: 4300, englishQuestions: 8474, englishChapters: 22, caQuestions: 1470, caDays: 147, articles: 137,
} }));

test("siteStats sums every free section", () => {
  const s = siteStats();
  assert.equal(s.questions, 62122 + 83567 + 43000 + 8474 + 1470);
  assert.equal(s.chapters, 809 + 22);
  assert.equal(s.papers, 2232);
  assert.equal(s.pyqExams, 70);
});

test("formatCount uses Indian grouping", () => {
  assert.equal(formatCount(62122, "en"), "62,122");
  assert.equal(formatCount(198633, "en"), "1,98,633");
  assert.equal(formatCount(198633, "hi"), "1,98,633");
  assert.equal(formatCount(999, "en"), "999");
});
```

`test/apps.test.ts`:

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadAppsRegistry, appForExam, appBySlug } from "../src/lib/content/apps";

const reg = JSON.stringify({ generatedAt: "2026-09-07T00:00:00Z", apps: [
  { package: "com.railwaygk.ntpc", slug: "rrb-ntpc", examId: "rrb_ntpc", name: "RRB NTPC GK 2026", description: "d", rating: 4.6, ratingCount: 1200, screenshots: ["apps/com.railwaygk.ntpc/shot-1.webp"] },
]});

beforeEach(() => { __clearMemo(); });

test("registry absent → null, present → entries", async () => {
  __setBucketResolver(async () => ({ async get() { return null; } }));
  assert.equal(await loadAppsRegistry(), null);
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "apps/registry.json" ? { text: async () => reg } : null; } }));
  const r = await loadAppsRegistry();
  assert.equal(r?.apps.length, 1);
  assert.equal(appForExam(r!, "rrb_ntpc")?.package, "com.railwaygk.ntpc");
  assert.equal(appBySlug(r!, "rrb-ntpc")?.rating, 4.6);
  assert.equal(appBySlug(r!, "nope"), undefined);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → modules missing.

- [ ] **Step 3: Implement the three modules**

`src/lib/content/hindi.ts`:

```ts
// Spec §4.5: a Hindi page exists only when the source has Hindi for every unit.
export function hasHindiCounts(enCount: number, hiCount: number): boolean {
  return enCount > 0 && hiCount === enCount;
}

export function hasHindiSet(set: { en?: unknown[]; hi?: unknown[] }): boolean {
  const en = Array.isArray(set.en) ? set.en.length : 0;
  const hi = Array.isArray(set.hi) ? set.hi.length : 0;
  return hasHindiCounts(en, hi);
}
```

`src/lib/content/stats.ts`:

```ts
import { totals } from "./index";

export function siteStats() {
  const t = totals();
  return {
    questions: t.topicQuestions + t.pyqQuestions + t.aptitudeQuestions + t.englishQuestions + t.caQuestions,
    chapters: t.topicChapters + t.englishChapters,
    papers: t.pyqPapers,
    pyqExams: t.pyqExams,
    caDays: t.caDays,
    articles: t.articles,
    aptitudeSets: t.aptitudeSets,
  };
}

/** Indian digit grouping: 1,98,633. Same in both languages (Devanagari digits are not used). */
export function formatCount(n: number, _lang: "en" | "hi"): string {
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}
```

`src/lib/content/apps.ts`:

```ts
import { getJson } from "./loader";
import { keys } from "./keys";

export interface AppEntry {
  package: string; slug: string; examId?: string; name: string; description: string;
  rating?: number; ratingCount?: number; installs?: string; icon?: string; screenshots: string[];
  updatedAt?: string; category?: string;
}
export interface AppsRegistry { generatedAt: string; apps: AppEntry[] }

export async function loadAppsRegistry(): Promise<AppsRegistry | null> {
  const r = await getJson<AppsRegistry>(keys.appsRegistry());
  return r && Array.isArray(r.apps) ? r : null;
}

export const appForExam = (reg: AppsRegistry, examId: string) => reg.apps.find((a) => a.examId === examId);
export const appBySlug = (reg: AppsRegistry, slug: string) => reg.apps.find((a) => a.slug === slug);
```

- [ ] **Step 4: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/content/hindi.ts src/lib/content/stats.ts src/lib/content/apps.ts test/hindi.test.ts test/stats.test.ts test/apps.test.ts
git commit -m "feat(content): hindi availability rule, site stats, apps registry reader

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: i18n primitives and the routing decision

**Model:** `fable`

**Files:**
- Create: `src/lib/i18n/lang.ts`, `src/lib/i18n/routing.ts`, `src/lib/i18n/alternates.ts`
- Test: `test/i18n.test.ts`

**Interfaces:**
- `lang.ts`: `type Lang = "en" | "hi"`; `LANGS`; `isLang(x): x is Lang`; `href(lang, path): string` (`en` → `path`, `hi` → `/hi${path}`, `/` → `/hi`); `splitLang(pathname): { lang: Lang; path: string }`; `otherLang(lang)`.
- `routing.ts`: `CONTENT_ROUTES` set; `decide(pathname): { action: "next" } | { action: "rewrite"; to: string } | { action: "redirect"; to: string }`:
  - `/hi` or `/hi/...` → `{ action: "next" }`
  - `/en` or `/en/...` → `redirect` to the prefix-less path (the internal rewrite target must never be a public duplicate)
  - first segment in `CONTENT_ROUTES` (or pathname `/`) → `rewrite` to `/en` + pathname
  - `/apps/stylescan...` → `next` (third-party pages stay static)
  - first segment in `PASSTHROUGH` (`privacy`, `b`, `_next`, `api`, anything containing `.`) → `next`
  - retired CBT portal slugs (`PORTAL_SLUGS` from `gkApps.ts`) → `redirect` to `/exam/{exam slug}` when the portal's app id is in the exam registry, else `/exam`; `/bank` and `/bank/...` → `redirect` to `/exam#bank`; `/cbt/...` and `/mock-content/...` → `redirect` to `/exam`
  - anything else → `redirect` to `/topics` (the existing WordPress rule)
- `alternates.ts`: `SITE = "https://studyvirus.com"`; `abs(path)`; `buildAlternates({ lang, path, hasHi }): { canonical: string; languages?: Record<string,string> }`.

- [ ] **Step 1: Write failing tests** `test/i18n.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { href, splitLang, isLang, otherLang } from "../src/lib/i18n/lang";
import { decide } from "../src/lib/i18n/routing";
import { buildAlternates, abs } from "../src/lib/i18n/alternates";

test("href and splitLang", () => {
  assert.equal(href("en", "/topics/history"), "/topics/history");
  assert.equal(href("hi", "/topics/history"), "/hi/topics/history");
  assert.equal(href("hi", "/"), "/hi");
  assert.deepEqual(splitLang("/hi/topics/history"), { lang: "hi", path: "/topics/history" });
  assert.deepEqual(splitLang("/hi"), { lang: "hi", path: "/" });
  assert.deepEqual(splitLang("/topics"), { lang: "en", path: "/topics" });
  assert.equal(isLang("hi"), true); assert.equal(isLang("fr"), false);
  assert.equal(otherLang("en"), "hi");
});

test("decide: content routes rewrite to /en, hi passes, portals pass, unknown redirects", () => {
  assert.deepEqual(decide("/"), { action: "rewrite", to: "/en" });
  assert.deepEqual(decide("/topics/history/indus-valley/set-1"), { action: "rewrite", to: "/en/topics/history/indus-valley/set-1" });
  assert.deepEqual(decide("/exam/rrb-ntpc"), { action: "rewrite", to: "/en/exam/rrb-ntpc" });
  assert.deepEqual(decide("/apps"), { action: "rewrite", to: "/en/apps" });
  assert.deepEqual(decide("/apps/rrb-ntpc"), { action: "rewrite", to: "/en/apps/rrb-ntpc" });
  assert.deepEqual(decide("/apps/stylescan/privacy-policy"), { action: "next" });
  assert.deepEqual(decide("/hi/topics/history"), { action: "next" });
  assert.deepEqual(decide("/hi"), { action: "next" });
  assert.deepEqual(decide("/en/topics/history"), { action: "redirect", to: "/topics/history" });
  assert.deepEqual(decide("/en"), { action: "redirect", to: "/" });
  assert.deepEqual(decide("/bank/mock/x"), { action: "redirect", to: "/exam#bank" });
  assert.deepEqual(decide("/ssccgl"), { action: "redirect", to: "/exam/ssc-cgl" });
  assert.deepEqual(decide("/rrbntpc/mock/abc"), { action: "redirect", to: "/exam/rrb-ntpc" });
  assert.deepEqual(decide("/cbt/player.html"), { action: "redirect", to: "/exam" });
  assert.deepEqual(decide("/mock-content/manifest.json"), { action: "redirect", to: "/exam" });
  assert.deepEqual(decide("/privacy/bpsc-tre"), { action: "next" });
  assert.deepEqual(decide("/b/ABC123"), { action: "next" });
  assert.deepEqual(decide("/sitemap.xml"), { action: "next" });
  assert.deepEqual(decide("/.well-known/assetlinks.json"), { action: "next" });
  assert.deepEqual(decide("/_next/static/x.js"), { action: "next" });
  assert.deepEqual(decide("/api/x"), { action: "next" });
  assert.deepEqual(decide("/biology/29/"), { action: "redirect", to: "/topics" });
});

test("alternates", () => {
  assert.equal(abs("/topics"), "https://studyvirus.com/topics");
  assert.deepEqual(buildAlternates({ lang: "en", path: "/topics/history", hasHi: true }), {
    canonical: "https://studyvirus.com/topics/history",
    languages: { "en-IN": "https://studyvirus.com/topics/history", "hi-IN": "https://studyvirus.com/hi/topics/history", "x-default": "https://studyvirus.com/topics/history" },
  });
  assert.deepEqual(buildAlternates({ lang: "hi", path: "/topics/history", hasHi: true }).canonical, "https://studyvirus.com/hi/topics/history");
  assert.deepEqual(buildAlternates({ lang: "en", path: "/topics/history", hasHi: false }), { canonical: "https://studyvirus.com/topics/history" });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → modules missing.

- [ ] **Step 3: Implement**

`src/lib/i18n/lang.ts`:

```ts
export type Lang = "en" | "hi";
export const LANGS: readonly Lang[] = ["en", "hi"];

export function isLang(x: unknown): x is Lang {
  return x === "en" || x === "hi";
}

export function href(lang: Lang, path: string): string {
  if (lang === "en") return path;
  return path === "/" ? "/hi" : `/hi${path}`;
}

export function splitLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === "/hi") return { lang: "hi", path: "/" };
  if (pathname.startsWith("/hi/")) return { lang: "hi", path: pathname.slice(3) };
  return { lang: "en", path: pathname };
}

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "hi" : "en");
```

`src/lib/i18n/routing.ts`:

```ts
import { GK_APPS, PORTAL_SLUGS } from "@/lib/gkApps";
import { EXAMS } from "@/lib/exams";

// Routes rendered under src/app/[lang]/ (Plan B). The middleware rewrites the
// prefix-less English URL to /en/... internally; /hi/... passes through.
export const CONTENT_ROUTES = new Set([
  "topics", "exam", "pyq", "aptitude", "english", "current-affairs", "articles", "apps",
  "about", "contact", "terms", "privacy-policy",
]);

// Never rewritten: the (legacy) route group pages and route handlers.
const PASSTHROUGH = new Set(["hi", "b", "privacy", "mock-tests"]);

// Third-party pages that live under /apps but outside [lang].
const STATIC_APPS = new Set(["stylescan"]);

// Retired CBT portals (spec §3): send each to its exam hub.
const PORTAL_TO_EXAM: Record<string, string> = {};
for (const slug of PORTAL_SLUGS) {
  const app = GK_APPS.find((a) => a.slug === slug);
  const exam = app && EXAMS.find((e) => e.id === app.id);
  PORTAL_TO_EXAM[slug] = exam ? `/exam/${exam.slug}` : "/exam";
}
const RETIRED_TO_EXAM = new Set(["cbt", "mock-content"]);

export type Decision = { action: "next" } | { action: "rewrite"; to: string } | { action: "redirect"; to: string };

export function decide(pathname: string): Decision {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { action: "rewrite", to: "/en" };
  const first = segments[0];
  if (first.startsWith("_next") || first === "api" || first.includes(".")) return { action: "next" };
  if (first === "en") return { action: "redirect", to: segments.length === 1 ? "/" : `/${segments.slice(1).join("/")}` };
  if (PASSTHROUGH.has(first)) return { action: "next" };
  if (first === "apps" && segments[1] && STATIC_APPS.has(segments[1])) return { action: "next" };
  if (CONTENT_ROUTES.has(first)) return { action: "rewrite", to: `/en${pathname}` };
  if (first === "bank") return { action: "redirect", to: "/exam#bank" };
  if (RETIRED_TO_EXAM.has(first)) return { action: "redirect", to: "/exam" };
  if (first in PORTAL_TO_EXAM) return { action: "redirect", to: PORTAL_TO_EXAM[first] };
  return { action: "redirect", to: "/topics" };
}
```

(`mock-tests` is in PASSTHROUGH so the 301 added in Plan B's `next.config.mjs` handles it rather than the middleware. The `/ssccgl` → `/exam/ssc-cgl` expectation assumes `gkApps.ts` maps slug `ssccgl` to id `ssc_cgl` and `rrbntpc` to `rrb_ntpc`; if the generated registry differs, fix the test's expected hub, not the registry.)

`src/lib/i18n/alternates.ts`:

```ts
import { href, type Lang } from "./lang";

export const SITE = "https://studyvirus.com";
export const abs = (path: string) => `${SITE}${path === "/" ? "" : path}`;

export function buildAlternates(o: { lang: Lang; path: string; hasHi: boolean }): { canonical: string; languages?: Record<string, string> } {
  const canonical = abs(href(o.lang, o.path));
  if (!o.hasHi) return { canonical };
  const en = abs(o.path), hi = abs(href("hi", o.path));
  return { canonical, languages: { "en-IN": en, "hi-IN": hi, "x-default": en } };
}
```

- [ ] **Step 4: Run tests** — `npm test && npm run typecheck` → pass. (`abs("/")` returns `https://studyvirus.com` with no trailing slash; that is the home canonical the current layout already uses.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n test/i18n.test.ts
git commit -m "feat(i18n): lang helpers, pure middleware decision, hreflang builder

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: SEO helpers — JSON-LD, Play referrer, monetisation placement

**Model:** `sonnet`

**Files:**
- Create: `src/lib/seo/jsonld.ts`, `src/lib/seo/referrer.ts`, `src/lib/seo/monetisation.ts`
- Test: `test/seo.test.ts`

**Interfaces:**
- `jsonld.ts`: `breadcrumbList(items: { name: string; url: string }[])`, `organization()`, `softwareApplication(a: { name: string; description: string; packageName: string; url: string; rating?: number; ratingCount?: number })` — each returns a plain object with `@context`/`@type`; `FORBIDDEN_TYPES = ["FAQPage", "QAPage", "Quiz"]`.
- `referrer.ts`: `playUrl(pkg: string, kind: "exam-hub" | "app-page" | "apps-hub" | "content" | "home", slug: string): string`.
- `monetisation.ts`: `type PageKind = "home" | "exam-hub" | "apps" | "content" | "static"`; `placement(kind): { ads: Array<"top" | "in-article" | "sticky-bottom" | "footer">; installCta: "hero" | "end" | "strip" | "none" }`.

- [ ] **Step 1: Write failing tests** `test/seo.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbList, organization, softwareApplication, FORBIDDEN_TYPES } from "../src/lib/seo/jsonld";
import { playUrl } from "../src/lib/seo/referrer";
import { placement } from "../src/lib/seo/monetisation";

test("breadcrumbList positions are 1-based and absolute", () => {
  const b = breadcrumbList([{ name: "Home", url: "https://studyvirus.com" }, { name: "Topics", url: "https://studyvirus.com/topics" }]) as { itemListElement: { position: number; item: string }[] };
  assert.equal(b.itemListElement[1].position, 2);
  assert.equal(b.itemListElement[1].item, "https://studyvirus.com/topics");
});

test("organization carries no superlatives", () => {
  const o = organization() as { description: string; sameAs: string[] };
  assert.doesNotMatch(o.description, /largest|#1|No\.? ?1/i);
  assert.ok(o.sameAs.some((u) => u.includes("play.google.com")));
});

test("softwareApplication omits aggregateRating under 5 ratings", () => {
  const withRating = softwareApplication({ name: "A", description: "d", packageName: "p", url: "u", rating: 4.6, ratingCount: 120 }) as Record<string, unknown>;
  assert.ok(withRating.aggregateRating);
  const few = softwareApplication({ name: "A", description: "d", packageName: "p", url: "u", rating: 5, ratingCount: 3 }) as Record<string, unknown>;
  assert.equal(few.aggregateRating, undefined);
  assert.deepEqual(FORBIDDEN_TYPES, ["FAQPage", "QAPage", "Quiz"]);
});

test("playUrl carries the install referrer", () => {
  const u = playUrl("com.railwaygk.ntpc", "exam-hub", "rrb-ntpc");
  assert.equal(u, "https://play.google.com/store/apps/details?id=com.railwaygk.ntpc&referrer=utm_source%3Dstudyvirus.com%26utm_medium%3Dweb%26utm_campaign%3Dexam-hub%26utm_content%3Drrb-ntpc");
});

test("placement follows the audit table", () => {
  assert.deepEqual(placement("content"), { ads: ["in-article", "sticky-bottom"], installCta: "end" });
  assert.deepEqual(placement("exam-hub"), { ads: ["footer"], installCta: "hero" });
  assert.deepEqual(placement("apps"), { ads: ["footer"], installCta: "hero" });
  assert.deepEqual(placement("home"), { ads: ["in-article", "footer"], installCta: "strip" });
  assert.deepEqual(placement("static"), { ads: [], installCta: "none" });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → modules missing.

- [ ] **Step 3: Implement**

`src/lib/seo/jsonld.ts`:

```ts
// Only the three structured-data types that are current and fit this site
// (spec §4.6). FAQPage rich results were removed by Google on 7 May 2026;
// QAPage requires community answers; no Quiz type exists.
export const FORBIDDEN_TYPES = ["FAQPage", "QAPage", "Quiz"] as const;

export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyVirus",
    url: "https://studyvirus.com",
    logo: "https://studyvirus.com/og-image.png",
    sameAs: ["https://play.google.com/store/apps/developer?id=Manmeet+Kumar"],
    description: "Free practice questions, previous-year papers and current affairs for Indian government exams, in Hindi and English.",
  };
}

export function softwareApplication(a: { name: string; description: string; packageName: string; url: string; rating?: number; ratingCount?: number }) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.name,
    description: a.description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Android",
    offers: { "@type": "Offer", price: 0, priceCurrency: "INR" },
    downloadUrl: a.url,
    installUrl: a.url,
    identifier: a.packageName,
  };
  if (a.rating !== undefined && a.ratingCount !== undefined && a.ratingCount >= 5) {
    base.aggregateRating = { "@type": "AggregateRating", ratingValue: a.rating, ratingCount: a.ratingCount, bestRating: 5, worstRating: 1 };
  }
  return base;
}
```

`src/lib/seo/referrer.ts`:

```ts
export type ReferrerKind = "exam-hub" | "app-page" | "apps-hub" | "content" | "home";

export function playUrl(pkg: string, kind: ReferrerKind, slug: string): string {
  const referrer = `utm_source=studyvirus.com&utm_medium=web&utm_campaign=${kind}&utm_content=${slug}`;
  return `https://play.google.com/store/apps/details?id=${pkg}&referrer=${encodeURIComponent(referrer)}`;
}
```

`src/lib/seo/monetisation.ts`:

```ts
// Spec §6: one primary CTA per page type. Content pages are ad-first with a
// single app card at the end; exam hubs and app pages are install-first with
// ads only in the footer.
export type PageKind = "home" | "exam-hub" | "apps" | "content" | "static";
export type AdSpot = "top" | "in-article" | "sticky-bottom" | "footer";
export type InstallCta = "hero" | "end" | "strip" | "none";

export function placement(kind: PageKind): { ads: AdSpot[]; installCta: InstallCta } {
  switch (kind) {
    case "content": return { ads: ["in-article", "sticky-bottom"], installCta: "end" };
    case "exam-hub": return { ads: ["footer"], installCta: "hero" };
    case "apps": return { ads: ["footer"], installCta: "hero" };
    case "home": return { ads: ["in-article", "footer"], installCta: "strip" };
    case "static": return { ads: [], installCta: "none" };
  }
}
```

- [ ] **Step 4: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo/jsonld.ts src/lib/seo/referrer.ts src/lib/seo/monetisation.ts test/seo.test.ts
git commit -m "feat(seo): JSON-LD builders, Play install referrer, ad/CTA placement rules

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Sitemap generators (pure)

**Model:** `fable`

**Files:**
- Create: `src/lib/seo/sitemaps.ts`
- Test: `test/sitemaps.test.ts`

**Interfaces:**
- Consumes: Tasks 8–13 loaders, `href`, `abs`, `hasHindiCounts`.
- Produces:
  ```ts
  interface SitemapEntry { url: string; lastModified?: Date; changeFrequency?: "daily" | "weekly" | "monthly" | "yearly"; priority?: number }
  interface SitemapData { topics: ManifestTopic[]; pyqExams: PyqExam[]; families: AptFamilyInfo[]; articles: ArticleMeta[]; exams: Exam[]; apps: AppEntry[]; now: Date }
  MAX_PER_SITEMAP = 45000
  entriesFor(section: SitemapSection, lang: Lang, data: SitemapData): SitemapEntry[]
  SECTIONS: readonly SitemapSection[]   // "static" | "exams" | "topics" | "sets" | "pyq" | "aptitude" | "english" | "current-affairs" | "articles" | "apps"
  chunk(entries, size = MAX_PER_SITEMAP): SitemapEntry[][]
  sitemapIds(data): { id: string; section; lang; part: number }[]   // ids like "en-sets-0", "hi-topics-0"
  ```
  Hindi sections only include units that pass `hasHindiCounts` (sets, PYQ papers, aptitude sets, CA days, articles); hubs (topics, chapters, exams, apps, static) always exist in both languages.

- [ ] **Step 1: Write failing tests** `test/sitemaps.test.ts`

```ts
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests } from "../src/lib/content/index";
import { entriesFor, chunk, sitemapIds, MAX_PER_SITEMAP, SECTIONS } from "../src/lib/seo/sitemaps";
import type { SitemapData } from "../src/lib/seo/sitemaps";
import type { ManifestTopic } from "../src/lib/content/topics";
import { EXAMS } from "../src/lib/exams";

const topics = (JSON.parse(readFileSync(new URL("./fixtures/topics.json", import.meta.url), "utf8")) as { topics: ManifestTopic[] }).topics;

const data: SitemapData = {
  topics,
  pyqExams: [{ id: "rrb_ntpc", en: "RRB NTPC", hi: "RRB NTPC", category: "railway", prefix: "pyq_rrb_ntpc_set", sets: 2 }],
  families: [],
  articles: [{ id: "a", title_en: "A", category: "x", file: "a.json" }],
  exams: EXAMS.slice(0, 2),
  apps: [],
  now: new Date("2026-09-07T00:00:00Z"),
};

beforeEach(() => __setIndexForTests({ generatedAt: "x", files: {
  "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "13-Viceroys & Acts.json": [40, 0] },
  "gk/45-English Grammar Full": { "1-Idioms and Phrases SSC.json": [30, 30] },
  "gk/46-English Grammar Basic": { "1-Synonyms_Basic.json": [20, 20] },
  "gk/24-Previous Year Papers": { "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set02.json": [40, 10] },
  "gk/0-Current Affairs/daily": { "2026_09_01.json": [10, 10], "2026_08_01.json": [10, 0] },
  "gk/articles": { "a.json": [2, 2] },
}, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } }));

test("sets: every app-rule set for English, only fully-Hindi chapters for Hindi", () => {
  const en = entriesFor("sets", "en", data).map((e) => e.url);
  assert.equal(en.filter((u) => u.includes("/indus-valley/set-")).length, 6);
  assert.equal(en.filter((u) => u.includes("/viceroys-acts/set-")).length, 3);
  assert.ok(en.includes("https://studyvirus.com/topics/history/indus-valley/set-6"));
  const hi = entriesFor("sets", "hi", data).map((e) => e.url);
  assert.equal(hi.filter((u) => u.includes("/viceroys-acts/")).length, 0);
  assert.ok(hi.includes("https://studyvirus.com/hi/topics/history/indus-valley/set-1"));
});

test("topics section lists hubs and chapters, not sets; hi mirrors en", () => {
  const en = entriesFor("topics", "en", data).map((e) => e.url);
  assert.ok(en.includes("https://studyvirus.com/topics"));
  assert.ok(en.includes("https://studyvirus.com/topics/history"));
  assert.ok(en.includes("https://studyvirus.com/topics/history/indus-valley"));
  assert.ok(!en.some((u) => u.includes("/set-")));
  assert.equal(entriesFor("topics", "hi", data).length, en.length);
});

test("pyq: exam hub + existing papers; Hindi only where hi is complete", () => {
  const en = entriesFor("pyq", "en", data).map((e) => e.url);
  assert.deepEqual(en, ["https://studyvirus.com/pyq", "https://studyvirus.com/pyq/rrb-ntpc", "https://studyvirus.com/pyq/rrb-ntpc/set-1", "https://studyvirus.com/pyq/rrb-ntpc/set-2"]);
  const hi = entriesFor("pyq", "hi", data).map((e) => e.url);
  assert.ok(hi.includes("https://studyvirus.com/hi/pyq/rrb-ntpc/set-1"));
  assert.ok(!hi.includes("https://studyvirus.com/hi/pyq/rrb-ntpc/set-2"));
});

test("current affairs: monthly + daily, stale dailies excluded", () => {
  const en = entriesFor("current-affairs", "en", data).map((e) => e.url);
  assert.ok(en.includes("https://studyvirus.com/current-affairs/monthly/2026_09"));
  assert.ok(en.includes("https://studyvirus.com/current-affairs/daily/2026_09_01"));
  assert.ok(en.includes("https://studyvirus.com/current-affairs/monthly/2026_08"));
  const old = entriesFor("current-affairs", "en", { ...data, now: new Date("2026-12-15T00:00:00Z") }).map((e) => e.url);
  assert.ok(!old.includes("https://studyvirus.com/current-affairs/daily/2026_08_01"));
});

test("english, articles, exams, static, apps", () => {
  assert.ok(entriesFor("english", "en", data).map((e) => e.url).includes("https://studyvirus.com/english/english_full/idioms-phrases/set-1"));
  assert.ok(entriesFor("articles", "hi", data).map((e) => e.url).includes("https://studyvirus.com/hi/articles/a"));
  assert.ok(entriesFor("exams", "en", data).map((e) => e.url).includes(`https://studyvirus.com/exam/${EXAMS[0].slug}`));
  assert.ok(entriesFor("static", "hi", data).map((e) => e.url).includes("https://studyvirus.com/hi"));
  assert.deepEqual(entriesFor("apps", "en", data).map((e) => e.url), ["https://studyvirus.com/apps"]);
});

test("chunking and ids", () => {
  const many = Array.from({ length: MAX_PER_SITEMAP + 1 }, (_, i) => ({ url: `u${i}` }));
  assert.equal(chunk(many).length, 2);
  const ids = sitemapIds(data);
  assert.ok(ids.some((i) => i.id === "en-sets-0"));
  assert.ok(ids.some((i) => i.id === "hi-topics-0"));
  assert.equal(new Set(ids.map((i) => i.id)).size, ids.length);
  assert.ok(SECTIONS.includes("aptitude"));
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → module missing.

- [ ] **Step 3: Implement `src/lib/seo/sitemaps.ts`**

```ts
import type { ManifestTopic } from "@/lib/content/topics";
import { visibleTopics, englishTopics, chaptersOf } from "@/lib/content/topics";
import { topicSlug } from "@/lib/content/slugs";
import type { PyqExam } from "@/lib/content/pyq";
import { papersOf, pyqSlug } from "@/lib/content/pyq";
import type { AptFamilyInfo } from "@/lib/content/aptitude";
import { subjectSlug, chapterSlug as aptChapterSlug, typeSlug, setsOf } from "@/lib/content/aptitude";
import type { ArticleMeta } from "@/lib/content/articles";
import { articleHasHindi } from "@/lib/content/articles";
import { listDays, listMonths, isStale } from "@/lib/content/currentAffairs";
import type { AppEntry } from "@/lib/content/apps";
import type { Exam } from "@/lib/exams";
import { pyqSlugOverrides } from "@/lib/content/examFacts";
import { hasHindiCounts } from "@/lib/content/hindi";
import { href, LANGS, type Lang } from "@/lib/i18n/lang";
import { abs } from "@/lib/i18n/alternates";

export interface SitemapEntry { url: string; lastModified?: Date; changeFrequency?: "daily" | "weekly" | "monthly" | "yearly"; priority?: number }
export interface SitemapData { topics: ManifestTopic[]; pyqExams: PyqExam[]; families: AptFamilyInfo[]; articles: ArticleMeta[]; exams: Exam[]; apps: AppEntry[]; now: Date }

export const MAX_PER_SITEMAP = 45_000;
export const SECTIONS = ["static", "exams", "topics", "sets", "pyq", "aptitude", "english", "current-affairs", "articles", "apps"] as const;
export type SitemapSection = (typeof SECTIONS)[number];

const e = (lang: Lang, path: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number, now: Date): SitemapEntry =>
  ({ url: abs(href(lang, path)), lastModified: now, changeFrequency, priority });

export function entriesFor(section: SitemapSection, lang: Lang, d: SitemapData): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  const hiOk = (en: number, hi: number) => lang === "en" || hasHindiCounts(en, hi);
  switch (section) {
    case "static":
      for (const p of ["/", "/topics", "/pyq", "/aptitude", "/english", "/current-affairs", "/articles", "/exam", "/apps", "/about", "/contact", "/privacy-policy", "/terms"])
        out.push(e(lang, p, p === "/" ? "daily" : "weekly", p === "/" ? 1 : 0.6, d.now));
      break;
    case "exams":
      for (const x of d.exams) out.push(e(lang, `/exam/${x.slug}`, "weekly", 0.8, d.now));
      break;
    case "topics":
      out.push(e(lang, "/topics", "weekly", 0.9, d.now));
      for (const t of visibleTopics(d.topics)) {
        out.push(e(lang, `/topics/${topicSlug(t.key)}`, "weekly", 0.8, d.now));
        for (const c of chaptersOf(t)) out.push(e(lang, `/topics/${topicSlug(t.key)}/${c.slug}`, "monthly", 0.7, d.now));
      }
      break;
    case "sets":
      for (const t of visibleTopics(d.topics)) for (const c of chaptersOf(t)) {
        if (!hiOk(c.enCount, c.hiCount)) continue;
        for (let n = 1; n <= c.sets; n++) out.push(e(lang, `/topics/${topicSlug(t.key)}/${c.slug}/set-${n}`, "monthly", 0.6, d.now));
      }
      break;
    case "pyq": {
      const ov = pyqSlugOverrides();
      out.push(e(lang, "/pyq", "weekly", 0.9, d.now));
      for (const x of d.pyqExams) {
        const s = pyqSlug(x, ov);
        out.push(e(lang, `/pyq/${s}`, "monthly", 0.8, d.now));
        for (const p of papersOf(x)) if (hiOk(p.enCount, p.hiCount)) out.push(e(lang, `/pyq/${s}/set-${p.n}`, "monthly", 0.6, d.now));
      }
      break;
    }
    case "aptitude":
      out.push(e(lang, "/aptitude", "weekly", 0.8, d.now));
      for (const f of d.families) {
        out.push(e(lang, `/aptitude/${f.slug}`, "weekly", 0.8, d.now));
        for (const s of f.subjects) {
          out.push(e(lang, `/aptitude/${f.slug}/${subjectSlug(s)}`, "weekly", 0.7, d.now));
          for (const c of s.chapters) {
            out.push(e(lang, `/aptitude/${f.slug}/${subjectSlug(s)}/${aptChapterSlug(c)}`, "monthly", 0.7, d.now));
            for (const t of c.types) for (const st of setsOf(f.family, s, c, t))
              if (hiOk(st.enCount, st.hiCount)) out.push(e(lang, `/aptitude/${f.slug}/${subjectSlug(s)}/${aptChapterSlug(c)}/${typeSlug(t)}/set-${st.n}`, "monthly", 0.5, d.now));
          }
        }
      }
      break;
    case "english":
      out.push(e(lang, "/english", "weekly", 0.8, d.now));
      for (const t of englishTopics(d.topics)) for (const c of chaptersOf(t)) {
        out.push(e(lang, `/english/${t.key}/${c.slug}`, "monthly", 0.7, d.now));
        if (!hiOk(c.enCount, c.hiCount)) continue;
        for (let n = 1; n <= c.sets; n++) out.push(e(lang, `/english/${t.key}/${c.slug}/set-${n}`, "monthly", 0.6, d.now));
      }
      break;
    case "current-affairs":
      out.push(e(lang, "/current-affairs", "daily", 0.9, d.now));
      for (const m of listMonths()) out.push(e(lang, `/current-affairs/monthly/${m.month}`, "weekly", 0.7, d.now));
      for (const day of listDays()) if (!isStale(day, d.now) && hiOk(day.enCount, day.hiCount)) out.push(e(lang, `/current-affairs/daily/${day.date}`, "monthly", 0.6, d.now));
      break;
    case "articles":
      out.push(e(lang, "/articles", "weekly", 0.7, d.now));
      for (const a of d.articles) if (lang === "en" || articleHasHindi(a)) out.push(e(lang, `/articles/${a.id}`, "monthly", 0.6, d.now));
      break;
    case "apps":
      out.push(e(lang, "/apps", "weekly", 0.8, d.now));
      for (const a of d.apps) out.push(e(lang, `/apps/${a.slug}`, "weekly", 0.7, d.now));
      break;
  }
  return out;
}

export function chunk(entries: SitemapEntry[], size = MAX_PER_SITEMAP): SitemapEntry[][] {
  const out: SitemapEntry[][] = [];
  for (let i = 0; i < entries.length; i += size) out.push(entries.slice(i, i + size));
  return out.length ? out : [[]];
}

export function sitemapIds(d: SitemapData): { id: string; section: SitemapSection; lang: Lang; part: number }[] {
  const ids: { id: string; section: SitemapSection; lang: Lang; part: number }[] = [];
  for (const lang of LANGS) for (const section of SECTIONS) {
    const parts = chunk(entriesFor(section, lang, d));
    parts.forEach((_, part) => ids.push({ id: `${lang}-${section}-${part}`, section, lang, part }));
  }
  return ids;
}
```

- [ ] **Step 4: Run tests** — `npm test && npm run typecheck` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo/sitemaps.ts test/sitemaps.test.ts
git commit -m "feat(seo): pure sitemap generators per section and language with chunking

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: Digital Asset Links

**Model:** `sonnet`

**Files:**
- Create: `src/lib/seo/assetlinks.ts`, `src/lib/content/assetlinks.csv`, `src/app/.well-known/assetlinks.json/route.ts`
- Test: `test/assetlinks.test.ts`

**Interfaces:**
- `parseAssetlinksCsv(csv: string): { package: string; sha256: string }[]` (header `package,sha256`, ignores blank lines and `#` comments, validates the fingerprint format `^([0-9A-F]{2}:){31}[0-9A-F]{2}$`, upper-cases input)
- `assetlinks(rows): object[]` — the statement list.

- [ ] **Step 1: Write failing tests** `test/assetlinks.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAssetlinksCsv, assetlinks } from "../src/lib/seo/assetlinks";

const fp = Array.from({ length: 32 }, () => "ab").join(":");

test("parses rows, skips comments/blank, normalises case, rejects bad fingerprints", () => {
  const rows = parseAssetlinksCsv(`package,sha256\n# comment\n\ncom.railwaygk.ntpc,${fp}\ncom.bad,zz:zz\n`);
  assert.deepEqual(rows, [{ package: "com.railwaygk.ntpc", sha256: fp.toUpperCase() }]);
});

test("statements have the App Links shape", () => {
  const s = assetlinks([{ package: "com.x", sha256: fp.toUpperCase() }]) as { relation: string[]; target: { package_name: string; sha256_cert_fingerprints: string[] } }[];
  assert.deepEqual(s[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(s[0].target.package_name, "com.x");
  assert.deepEqual(assetlinks([]), []);
});
```

- [ ] **Step 2: Run to verify failure** — module missing.

- [ ] **Step 3: Implement**

`src/lib/seo/assetlinks.ts`:

```ts
const FP = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function parseAssetlinksCsv(csv: string): { package: string; sha256: string }[] {
  const out: { package: string; sha256: string }[] = [];
  for (const raw of csv.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.toLowerCase().startsWith("package,")) continue;
    const [pkg, sha] = line.split(",").map((s) => s.trim());
    const sha256 = (sha || "").toUpperCase();
    if (!pkg || !FP.test(sha256)) continue;
    out.push({ package: pkg, sha256 });
  }
  return out;
}

export function assetlinks(rows: { package: string; sha256: string }[]) {
  return rows.map((r) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: r.package, sha256_cert_fingerprints: [r.sha256] },
  }));
}
```

`src/lib/content/assetlinks.csv`:

```
# Android App Links. One row per app: package,SHA-256 of the APP SIGNING key
# (Play Console → Setup → App integrity → App signing key certificate).
# Not the upload key. Rows with an invalid fingerprint are ignored.
package,sha256
```

`src/app/.well-known/assetlinks.json/route.ts`:

```ts
import csv from "@/lib/content/assetlinks.csv";
import { parseAssetlinksCsv, assetlinks } from "@/lib/seo/assetlinks";

export const dynamic = "force-static";

export function GET() {
  const body = JSON.stringify(assetlinks(parseAssetlinksCsv(csv)));
  return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
}
```

For the CSV import to work, add a raw-loader rule. In `next.config.mjs`, inside `nextConfig`, add:

```js
  webpack(config) {
    config.module.rules.push({ test: /\.csv$/, type: "asset/source" });
    return config;
  },
```

and create `src/types/raw.d.ts`:

```ts
declare module "*.csv" {
  const content: string;
  export default content;
}
```

- [ ] **Step 4: Run tests and typecheck** — `npm test && npm run typecheck` → pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/seo/assetlinks.ts src/lib/content/assetlinks.csv "src/app/.well-known/assetlinks.json/route.ts" src/types/raw.d.ts next.config.mjs test/assetlinks.test.ts
git commit -m "feat(seo): /.well-known/assetlinks.json generated from a fingerprint CSV

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: Enable the OpenNext R2 incremental cache and prove the binding end-to-end

**Model:** `fable`

**Files:**
- Modify: `open-next.config.ts`, `wrangler.jsonc`, `cloudflare-env.d.ts`
- Create: `src/app/api/_health/content/route.ts` (tiny diagnostic route; kept, it is also the deploy smoke check)

**Interfaces:**
- Produces: `GET /api/_health/content` → `{ source: "binding" | "https", topics: number, indexGeneratedAt: string }`.

- [ ] **Step 1: Create the cache bucket**

Run: `npx wrangler r2 bucket create studyvirus-next-cache`
Expected: `Created bucket 'studyvirus-next-cache'`.

- [ ] **Step 2: Bind it**

In `wrangler.jsonc`, extend `r2_buckets`:

```jsonc
  "r2_buckets": [
    { "binding": "CONTENT", "bucket_name": "studyvirus-content" },
    // OpenNext incremental cache (ISR). Separate bucket so a cache purge can
    // never touch content.
    { "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "studyvirus-next-cache" }
  ]
```

In `cloudflare-env.d.ts`, add `NEXT_INC_CACHE_R2_BUCKET: R2Bucket;` to `CloudflareEnv`.

- [ ] **Step 3: Switch the adapter to the R2 cache**

Replace `open-next.config.ts` with:

```ts
// OpenNext adapter config for Cloudflare Workers.
// R2 incremental cache so `revalidate` on content pages actually refreshes
// (spec §4.3). Requires the NEXT_INC_CACHE_R2_BUCKET binding in wrangler.jsonc.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
```

- [ ] **Step 4: Add the health route** `src/app/api/_health/content/route.ts`

```ts
import { resolveBucket } from "@/lib/content/bucket";
import { loadTopics } from "@/lib/content/topics";
import { getIndex } from "@/lib/content/index";

export const dynamic = "force-dynamic";

export async function GET() {
  const bucket = await resolveBucket();
  const topics = await loadTopics();
  return Response.json({ source: bucket ? "binding" : "https", topics: topics.length, indexGeneratedAt: getIndex().generatedAt });
}
```

- [ ] **Step 5: Build and preview the Worker locally**

Run: `npm run preview` (this runs validate → opennext build → wrangler preview on `http://localhost:8787`). In a second terminal:

```bash
curl -s http://localhost:8787/api/_health/content
```

Expected: `{"source":"binding","topics":66,...}`. If `source` is `"https"`, the binding is not reaching `getCloudflareContext` — check that `wrangler.jsonc` parsed (run `npx wrangler deploy --dry-run`) before continuing. Also confirm the existing site still serves: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8787/topics/history` → `200`. Stop the preview with Ctrl+C.

- [ ] **Step 6: Run the full suite one more time**

Run: `npm test && npm run typecheck`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add open-next.config.ts wrangler.jsonc cloudflare-env.d.ts src/app/api/_health/content/route.ts
git commit -m "chore(cf): R2 incremental cache for ISR and a content health route

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-review against the spec

- §4.1 loader with binding + HTTPS fallback + paid guard → Tasks 2, 3, 4. ✔
- §4.2 manifests as source of truth; every loader; content index; exams registry stays editorial → Tasks 7–13. ✔ (`src/lib/topics.ts`/`pyq.ts`/`english.ts` are deleted in Plan B once no page imports them.)
- §4.3 rendering/caching: R2 incremental cache → Task 18. Page `revalidate` values are Plan B.
- §4.4 locale routing: pure decision + helpers → Task 14; middleware wiring and `[lang]` routes are Plan B.
- §4.5 Hindi availability → Task 13, applied in Task 16.
- §4.6 structured data builders + forbidden list → Task 15; the HTML lint that greps built output is Plan B (needs pages).
- §5.3 set rule + tail-set redirect: rule in Task 5; the redirect lives in the set page (Plan B).
- §7.2/7.3 apps reader, referrer, assetlinks → Tasks 13, 15, 17. The registry producer is Plan C.
- §8 sitemap generators → Task 16; `src/app/sitemap.ts` wiring is Plan B.
- §10 unit tests for every module listed → present in every task; content validation → Task 7.

Type consistency checked: `ChapterInfo.sets` (Task 8) is consumed by Task 16 as `c.sets`; `AptSetInfo.n/key/enCount/hiCount` (Task 10) consumed by Task 16; `pyqSlugOverrides()` (Task 12) consumed by Task 16; `hasHindiCounts` (Task 13) consumed by Task 16; `href`/`abs` (Task 14) consumed by Task 16.
