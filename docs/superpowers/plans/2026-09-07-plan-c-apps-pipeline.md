# Plan C — Play Sync Pipeline (apps registry) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily job in the existing ops service that reads the Play developer page, mirrors each listing's rating, description, icon and screenshots into R2, and publishes `apps/registry.json` — so the site's apps directory is never hardcoded and never stale.

**Architecture:** A new job module in `studyvirus-ops` following that service's existing shape (pure exported functions + a `run({db, log, dry})` entry, registered in `src/main.mjs`'s `JOBS` array). No LLM: this is HTML extraction plus R2 PUTs. It reuses the S3 client pattern from `src/jobs/caPublish.mjs` and the same shrink-guard discipline. Parsing is best-effort and fails safe: a listing that will not parse keeps its previous registry entry.

**Tech Stack:** Node 24 ESM, `@aws-sdk/client-s3` (already a dependency), the ops SQLite db and notifier.

**Spec:** `studyvirus-web/docs/superpowers/specs/2026-09-07-studyvirus-web-rebuild-design.md` §7.

**Repo:** `C:\Users\manme\Desktop\studyvirus-ops` (note: **not** the web repo).

## Global Constraints

- **Model tiers:** `fable` for the parser and the publish guard, `opus`/`sonnet` elsewhere.
- Developer page: `https://play.google.com/store/apps/developer?id=Manmeet+Kumar`. Listing pages: `https://play.google.com/store/apps/details?id=<pkg>&hl=en&gl=IN`.
- R2 bucket `studyvirus-content`, credentials already in the ops config as `CONFIG.R2` (read from `studyvirus-cms/.env.local`).
- Keys: `apps/registry.json`, `apps/{package}/icon.webp`, `apps/{package}/shot-{n}.webp`.
- Caps: max 100 listings per run, 10 s per fetch, ≤ 6 screenshots per app, images resized to ≤ 1080 px tall.
- **Shrink guard:** abort and alert if the new registry would have fewer than 90% of the previous run's apps.
- Every job must honour `--dry` (no writes, no sends) like every other ops job.
- Commit in the ops repo; messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/jobs/playSync.mjs` | The job: fetch → parse → mirror → publish |
| `src/playParse.mjs` | Pure HTML → data functions (no I/O) |
| `test/playParse.test.mjs` | Parser tests against saved fixture HTML |
| `test/playSync.test.mjs` | Job tests with injected fetch + S3 client |
| `test/fixtures/play-developer.html`, `play-listing.html` | Saved real pages (trimmed) |
| `src/main.mjs` | Register the job |
| `docs/PLAY_SYNC.md` | What it does, how to run it, how to recover |

---

### Task 1: Capture fixtures and write the parser

**Model:** `fable`

**Files:**
- Create: `test/fixtures/play-developer.html`, `test/fixtures/play-listing.html`, `src/playParse.mjs`, `test/playParse.test.mjs`

**Interfaces:**
- Produces:
  - `parseDeveloperPage(html): string[]` — unique package ids, in page order.
  - `parseListing(html, pkg): { package, name, description, rating: number|null, ratingCount: number|null, installs: string|null, icon: string|null, screenshots: string[], updatedAt: string|null } | null` — `null` when the page yields no name (a parse failure, not an empty app).
  - `imageUrl(url, maxHeight): string` — rewrites Play's `=w…-h…` image suffix to a fixed height.

- [ ] **Step 1: Save real fixtures**

```bash
cd /c/Users/manme/Desktop/studyvirus-ops
mkdir -p test/fixtures
curl -sL "https://play.google.com/store/apps/developer?id=Manmeet+Kumar&hl=en&gl=IN" -o test/fixtures/play-developer.html
curl -sL "https://play.google.com/store/apps/details?id=com.railwaygk.ntpc&hl=en&gl=IN" -o test/fixtures/play-listing.html
wc -c test/fixtures/*.html
```
Expected: both files are hundreds of KB. If either is under 50 KB, Play served a consent or bot page — retry with `-H "Accept-Language: en-IN"`; if it still fails, STOP and report, because the whole job depends on these pages being fetchable from this machine.

- [ ] **Step 2: Inspect what the fixtures actually contain**

```bash
grep -o 'details?id=[a-zA-Z0-9._]*' test/fixtures/play-developer.html | sort -u | head -20
grep -o 'details?id=[a-zA-Z0-9._]*' test/fixtures/play-developer.html | sort -u | wc -l
grep -o '"[0-9]\.[0-9]"' test/fixtures/play-listing.html | head -5
grep -o 'https://play-lh.googleusercontent.com/[^"\\]*' test/fixtures/play-listing.html | head -5
```
Write down the real package count — the parser test asserts it.

- [ ] **Step 3: Write the failing tests** `test/playParse.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDeveloperPage, parseListing, imageUrl } from '../src/playParse.mjs';

const dev = readFileSync(new URL('./fixtures/play-developer.html', import.meta.url), 'utf8');
const listing = readFileSync(new URL('./fixtures/play-listing.html', import.meta.url), 'utf8');

test('developer page yields unique package ids including known apps', () => {
  const pkgs = parseDeveloperPage(dev);
  assert.ok(pkgs.length >= 40, `only ${pkgs.length} packages`);
  assert.equal(new Set(pkgs).size, pkgs.length);
  assert.ok(pkgs.includes('com.railwaygk.ntpc'));
  assert.ok(pkgs.every((p) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(p)));
});

test('listing yields name, rating, screenshots', () => {
  const l = parseListing(listing, 'com.railwaygk.ntpc');
  assert.ok(l);
  assert.match(l.name, /RRB|NTPC/i);
  assert.ok(l.description.length > 50);
  assert.ok(l.rating === null || (l.rating > 0 && l.rating <= 5));
  assert.ok(l.ratingCount === null || l.ratingCount >= 0);
  assert.ok(l.icon === null || l.icon.startsWith('https://play-lh.googleusercontent.com/'));
  assert.ok(l.screenshots.length >= 1);
  assert.ok(l.screenshots.every((s) => s.startsWith('https://play-lh.googleusercontent.com/')));
});

test('a page that is not a listing returns null rather than a half-entry', () => {
  assert.equal(parseListing('<html><body>nope</body></html>', 'com.x'), null);
});

test('imageUrl pins a height', () => {
  assert.equal(imageUrl('https://play-lh.googleusercontent.com/abc=w526-h296', 1080), 'https://play-lh.googleusercontent.com/abc=h1080');
  assert.equal(imageUrl('https://play-lh.googleusercontent.com/abc', 1080), 'https://play-lh.googleusercontent.com/abc=h1080');
});
```

- [ ] **Step 4: Run to verify failure** — `npm test test/playParse.test.mjs` → module not found.

- [ ] **Step 5: Implement `src/playParse.mjs`**

Play's HTML is generated and its class names change, so parse only on stable anchors: `details?id=` links for packages; the embedded `AF_initDataCallback` JSON blobs and `<meta>`/`itemprop` attributes for listing fields; `play-lh.googleusercontent.com` URLs for images. Extract with tolerant regexes, dedupe, and return `null` when the name is missing. Prefer the `og:title`/`og:description` meta tags for name and description (stable for years), the `[0-9.]` rating from the aria-label near "stars", and image URLs filtered by their size suffix (icons are square `=s`/`=w240-h240`, screenshots are `=w526-h296` style).

Write the implementation against what the fixtures actually contain — inspect first (Step 2), then code. Keep every regex commented with the anchor it relies on and what breaks if Play changes it.

- [ ] **Step 6: Run tests** — `npm test test/playParse.test.mjs` → pass.

- [ ] **Step 7: Commit**

```bash
git add src/playParse.mjs test/playParse.test.mjs test/fixtures
git commit -m "feat(play): tolerant parser for the developer page and listing pages

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: The job — mirror assets and publish the registry

**Model:** `fable`

**Files:**
- Create: `src/jobs/playSync.mjs`, `test/playSync.test.mjs`
- Modify: `src/main.mjs`

**Interfaces:**
- Consumes: `parseDeveloperPage`, `parseListing`, `imageUrl`; `CONFIG`, `mkLogger`, `kvGet`/`kvSet`, `notify`.
- Produces:
  - `buildRegistry(listings, { examMap }): { generatedAt, apps: [...] }` — pure; maps package → `{ slug, examId, category }` using `examMap`.
  - `shrinkGuard(prev, next): { ok: boolean; reason?: string }`
  - `run({ db, log, dry })` — the job entry the scheduler calls.
  - Job metadata: `name: 'play-sync'`, `daily: '05:00'`, `catchUp: true`, `exclusive: true`.

- [ ] **Step 1: Write the failing tests** `test/playSync.test.mjs`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRegistry, shrinkGuard, EXAM_MAP } from '../src/jobs/playSync.mjs';

const listing = (pkg, name) => ({ package: pkg, name, description: 'd', rating: 4.5, ratingCount: 100, installs: '10,000+', icon: 'i', screenshots: ['s1'], updatedAt: '2026-08-01' });

test('buildRegistry maps known packages to exam ids and slugs', () => {
  const r = buildRegistry([listing('com.railwaygk.ntpc', 'RRB NTPC GK 2026')], { examMap: EXAM_MAP });
  assert.equal(r.apps[0].examId, 'rrb_ntpc');
  assert.equal(r.apps[0].slug, 'rrb-ntpc');
  assert.ok(r.generatedAt);
});

test('an unknown package still gets an entry, slugged from its package', () => {
  const r = buildRegistry([listing('com.brand.newthing', 'New Thing')], { examMap: EXAM_MAP });
  assert.equal(r.apps[0].examId, undefined);
  assert.equal(r.apps[0].slug, 'com-brand-newthing');
  assert.equal(r.apps[0].category, 'other');
});

test('shrink guard blocks a collapse and allows growth', () => {
  const prev = { apps: Array.from({ length: 70 }, (_, i) => ({ package: `p${i}` })) };
  assert.equal(shrinkGuard(prev, { apps: prev.apps.slice(0, 60) }).ok, false);
  assert.equal(shrinkGuard(prev, { apps: prev.apps.slice(0, 66) }).ok, true);
  assert.equal(shrinkGuard(prev, { apps: [...prev.apps, { package: 'new' }] }).ok, true);
  assert.equal(shrinkGuard(null, { apps: [] }).ok, true);
});
```

- [ ] **Step 2: Run to verify failure** — module not found.

- [ ] **Step 3: Implement `src/jobs/playSync.mjs`**

Structure:

```js
// playSync.mjs — keeps studyvirus.com/apps honest.
//
// The website's apps directory must never hardcode a rating: a stale rating is
// itself a trust problem, and the listings change without telling anyone. Once
// a day this reads the developer page, then each listing, mirrors the icon and
// screenshots into R2, and publishes apps/registry.json — the file the site
// reads. Everything is best-effort per app: a listing that will not parse keeps
// whatever the previous registry said about it, so one Play markup change
// cannot blank the directory.
```

- `EXAM_MAP`: package → `{ examId, slug, category }`, generated by reading `rrb-ntpc-gk/config/exams.js` and `bank-apps/config/exams.js` at module load (both are plain JS objects; parse with a regex over `package:` / `id:` / `category:` lines rather than importing RN code), with a hand-written fallback for the six bank packages.
- `fetchAll(packages, { fetchImpl, concurrency: 4 })` with a 10 s timeout, 3 retries and a 1 s delay between listing fetches (be a polite client).
- `mirrorAssets(listing, { client, dry })` — downloads icon + up to 6 screenshots, PUTs them to `apps/{pkg}/…` with `CacheControl: 'public, max-age=86400'`. Store as-is (Play already serves WebP for these URLs when a height suffix is used); do **not** add an image library dependency.
- `publishRegistry(registry, { client, dry })` — one PUT of `apps/registry.json`, then read it back through `${CONFIG.CDN}/apps/registry.json?v=…` and assert the app count matches, exactly as `caPublish` verifies its uploads.
- `run({ db, log, dry })` — orchestrates, applies `shrinkGuard` against the previous registry (fetched from the CDN), records the run in the ops db with `kvSet('play_sync_last', …)`, and `notify()`s only on failure or on a change in app count.

- [ ] **Step 4: Register the job** in `src/main.mjs`: import it and add `playSync` to the `JOBS` array after `caPublish`.

- [ ] **Step 5: Run tests** — `npm test` (whole ops suite) → all green, including the pre-existing tests.

- [ ] **Step 6: Dry run against the real Play pages**

```bash
npm run job play-sync -- --dry
```
Expected: logs a package count matching the developer page, per-listing parse results, and "would PUT" lines for the registry and assets — with no network writes. Investigate any listing that fails to parse before continuing.

- [ ] **Step 7: Commit**

```bash
git add src/jobs/playSync.mjs test/playSync.test.mjs src/main.mjs
git commit -m "feat(play): daily play-sync job mirrors listings and publishes apps/registry.json

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: First real publish and documentation

**Model:** `sonnet`

**Files:**
- Create: `docs/PLAY_SYNC.md`
- Modify: `README.md` (job table)

- [ ] **Step 1: Run it for real**

```bash
npm run job play-sync
```
Expected: exit 0; the registry is published and read back.

- [ ] **Step 2: Verify on the CDN**

```bash
curl -s "https://cdn.studyvirus.com/apps/registry.json" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log('apps',r.apps.length,'generatedAt',r.generatedAt);console.log(r.apps.slice(0,3).map(a=>[a.slug,a.rating,a.screenshots.length]))})"
curl -s -o /dev/null -w "%{http_code}\n" "https://cdn.studyvirus.com/apps/com.railwaygk.ntpc/icon.webp"
```
Expected: an app count in the 60s–70s, real ratings, ≥1 screenshot each, and `200` for the icon.

- [ ] **Step 3: Confirm the site picks it up**

In the web repo:
```bash
cd /c/Users/manme/Desktop/StyleID/studyvirus-web && npm run build && npx next start -p 3010 &
curl -s http://localhost:3010/apps | grep -c "aggregateRating\|★\|rating"
```
Expected: non-zero — the directory is now registry-driven. (If Plan B is not yet deployed, this only proves the loader; the live check happens at Plan B Task 16.)

- [ ] **Step 4: Write `docs/PLAY_SYNC.md`** — what the job does, the exact R2 keys it writes, the shrink guard, what to do when Play changes its markup (update `src/playParse.mjs` regexes, refresh the fixtures, run the parser tests), and how to force a run.

- [ ] **Step 5: Add the job to the README job table** with schedule `daily 05:00`, family `—`, model `none`, cap `100 listings`.

- [ ] **Step 6: Commit**

```bash
git add docs/PLAY_SYNC.md README.md
git commit -m "docs(play): document the play-sync job and its recovery path

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Self-review against the spec

- §7.1 daily job, developer page → listings → assets → registry, caps and shrink guard → Tasks 1, 2. ✔
- §7.2 site reads the registry and degrades without it → covered by Plan A Task 13 and Plan B Task 11; verified here in Task 3 Step 3. ✔
- §7.3 install referrer and assetlinks → Plan A Tasks 15 and 17 (not this pipeline). ✔
- Ops conventions (pure functions + `run()`, `--dry`, db-recorded, notify on failure, verified read-back) match `caPublish.mjs`. ✔

Type consistency: `buildRegistry` emits exactly the `AppEntry` shape Plan A Task 13's `apps.ts` declares (`package, slug, examId?, name, description, rating?, ratingCount?, installs?, icon?, screenshots[], updatedAt?, category?`).
