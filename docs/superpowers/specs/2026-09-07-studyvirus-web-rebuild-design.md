# StudyVirus.com rebuild — design spec

**Date:** 2026-09-07
**Repo:** `C:\Users\manme\Desktop\StyleID\studyvirus-web` (Next.js 14 + `@opennextjs/cloudflare`, deployed as a Cloudflare Worker on studyvirus.com)
**Source brief:** the five-pass SEO audit artifact ("StudyVirus Indexation Audit", compiled 1–7 Sep 2026). Every decision below traces to a section of that audit or to a verified fact about the current codebase and content.

## 1. Goal

Rebuild the public site so that:

1. Every free piece of content on Cloudflare R2 is a real, indexable, server-rendered page in **both English and Hindi**, and the sitemap declares all of it.
2. Nothing that is Pro in the apps appears on the site.
3. The site earns through AdSense now, with the page-level ad/install-CTA split the audit specifies, and can add paid mocks/ebooks later without restructuring.
4. The home page is exam-first: exam categories → per-exam hub → that exam's content and its Play Store app.
5. The apps directory (`/apps`, `/apps/{slug}`) exists with synced ratings and real screenshots, never hardcoded.
6. The homepage numbers are computed at build time and are true.

## 2. Facts this design rests on (verified 2026-09-07)

| Fact | Where verified |
|---|---|
| All content is on R2 bucket `studyvirus-content`, served at `cdn.studyvirus.com` behind the `studyvirus-cdn-gate` Worker. GK tree under `gk/`, bank tree under `bank/`. Hostinger is retired (user confirmation, 2026-09-07). | `studyvirus-api/cdn-gate/wrangler.toml`, `bank-apps/src/hooks/useQuestions.js:15-16`, live `curl` |
| The site Worker cannot `fetch()` `cdn.studyvirus.com` at runtime: same-zone Worker→Worker fetch fails. | `src/lib/bankCatalog.ts:8-14` (the 2026-08-08 incident) |
| Manifests: `gk/topics.json` (66 topics, 848 chapters), `gk/pyq-config.json` (70 exams), `gk/aptitude/manifest.json`, `bank/manifest.json` (6 subjects, tier field per set), `gk/articles/index.json`, `gk/0-Current Affairs/{daily,capsule,magazine}`. | local `gk-data/` mirror + live `curl` |
| Set JSON shape: `{ en: Question[], hi: Question[] }`, `Question = { id, q, options[4], answer: "A"–"D", explain }`. Bank set shape: `{ set_id, title{en,hi}, description{en,hi}, tier, questions[...] }`. | sample files read |
| Real counts: 809 topic-set files / 62,122 questions; 2,232 PYQ papers / 83,567 questions. | computed locally |
| Free in apps: topic sets (incl. rewarded-ad-unlock sets), all PYQ papers, current affairs, articles, English sets, aptitude sets with `tier === 1`. | `SetListScreen.js:67-78`, `PYQScreen.js:37`, `CurrentAffairsScreen.js:217`, `AptitudeSetsScreen.js:30`, bank `AptitudeSetsScreen.js:273` |
| Pro in apps (excluded from site): notes, master notes, aptitude notes, one-liners, flash cards, tricks, CBT mock/sectional/topic papers except each exam's free `mock-01`, aptitude sets with `tier === 2`, current-affairs monthly capsules and magazine PDFs (free only for listed `free_months`). | `NotesScreen.js:158`, `NotesChaptersScreen.js` (aptitude notes render in the Pro notes screen), `MonthlyCapsuleScreen.js:820`, `MonthlyMagazineScreen.js:343`, `cdn-gate/worker.js PAID_PREFIXES` |
| Two aptitude trees exist with identical set-file shape: `gk/aptitude/` (GK/SSC/Railway apps, quant 33 ch + reasoning 24 ch, 355 tier-1 sets) and `bank/` (bank apps, 6 subjects, ~4,000 tier-1 sets). | live manifests, `rrb-ntpc-gk/src/services/aptitude.js:34` |
| AdSense publisher `ca-pub-3496395300151813`, `public/ads.txt` present. | `src/components/AdSlot.tsx`, `public/ads.txt` |
| Question-report endpoint exists: `POST /api/report-question` on `studyvirus-api.futurebanker11.workers.dev`. | `studyvirus-api/src/index.js:194` |
| Live apps: 69 GK + 6 bank under Play developer "Manmeet Kumar" (`https://play.google.com/store/apps/developer?id=Manmeet+Kumar`). | `LIVE_VERSIONS.csv`, user message |
| OpenNext is on the default config: ISR revalidation is a no-op; prerendered pages freeze until redeploy; non-prerendered pages render per request. | `open-next.config.ts`, `CLOUDFLARE_DEPLOY.md:89-98` |
| FAQPage rich results removed by Google 7 May 2026; QAPage requires community answers; no Quiz schema exists. | Audit §8 |

## 3. What stays, what goes (amended 2026-09-07 per user decision)

**Removed from the site until the paid-mocks launch** (user: the CBT portals are for paid mocks launching later; don't engineer around them). They remain in git history and come back with the paid launch:

- CBT portals and the bank web player: `src/app/[sscexam]/**`, `src/app/bank/**`, `public/cbt/**`, `public/bank/**`, `public/mock-content/**` (paid bank papers with answer keys served ungated as static files today), `src/lib/sscCatalog.ts`, `src/lib/bankCatalog.ts`, `src/components/{bank,ssc}/**`, and the portal branch of `SiteShell`. Their URLs 301 to the matching exam hub (`/ssccgl` → `/exam/ssc-cgl`, `/bank` → `/exam#bank`) so any link equity moves to the hub.
- The uncommitted working-tree edits to those files predate this work; they are discarded together with the files (the user was told before this decision).

**Kept as-is (Play-linked or functional):**

- Per-app privacy pages `src/app/privacy/**` and the third-party pages `src/app/apps/stylescan/**` — moved unchanged into the `(legacy)` route group so they keep a root layout; URLs do not change.
- `src/lib/gkApps.ts` (generated registry; used for package/portal lookups), `/b/[code]` battle-invite route handler, the Firebase auth proxy in `src/middleware.ts`, all WordPress-era redirects in `next.config.mjs`, `public/ads.txt`, `public/app-ads.txt`.
- The deploy pipeline (`npm run deploy`, GitHub → Cloudflare build).

## 4. Architecture

### 4.1 Content access: R2 binding with HTTPS fallback

`wrangler.jsonc` gains:

```jsonc
"r2_buckets": [{ "binding": "CONTENT", "bucket_name": "studyvirus-content" }]
```

`src/lib/content/loader.ts` exposes `getJson<T>(key: string): Promise<T | null>` and `getText(key)`:

- **In the Worker** (`getCloudflareContext()` succeeds and `env.CONTENT` exists): `env.CONTENT.get(key)`. No HTTP, no gate, no same-zone problem.
- **At build time / `next dev` / tests**: `fetch("https://cdn.studyvirus.com/" + encodeKey(key))`. The build machine is not in the zone, and every key the site reads is public on the CDN.
- Keys are bucket keys (`gk/1-Indian History/1-Indus Valley.json`), never URLs. One `encodeKey` handles spaces and `&`.
- A per-request memo (`React.cache`) dedupes the manifest reads that every page makes.
- The loader never reads under the paid prefixes (`mock-content/`, `gk/mocks-v2/{mock,sectional,topic}-content/`) except `manifest.json` files, enforced by an allow-list assertion in the loader so a future page cannot accidentally publish paid content.

### 4.2 Manifests are the source of truth

Delete `src/lib/topics.ts`, `src/lib/pyq.ts`, `src/lib/english.ts` (hand-copied, already stale: 13 PYQ exams vs 70 live). Replace with `src/lib/content/`:

| Module | Reads | Provides |
|---|---|---|
| `topics.ts` | `gk/topics.json` | visible topics (`hiddenFromList !== true`), chapters, `exams[]` tags, slug ↔ key maps |
| `pyq.ts` | `gk/pyq-config.json` | exams with `sets > 0`, file name pattern `{prefix}{NN}.json` |
| `english.ts` | `gk/topics.json` topics with keys `english_full` and `english_basic`, selected **by key** and regardless of `hiddenFromList` (verified: these two folders exist on the CDN; the visible `english` topic's folder `45-English Grammar` does not and is excluded by the content index) | same shape as topics |
| `aptitude.ts` | **two manifests, two families:** `gk/aptitude/manifest.json` (family `ssc-railway`: quant 33 ch, reasoning 24 ch; files at `gk/aptitude/content/{subject.folder}/{chapter.folder}/{type.folder}/{set.file}`) and `bank/manifest.json` (family `bank`: quant, DI, puzzles, reasoning, English, previous_year_papers; files at `bank/{subject.folder}/{chapter.folder}/{type.folder}/{set.file}`) | family → subjects → chapters → types → sets, **filtered to `tier === 1`**; a chapter or type with zero tier-1 sets is omitted. Both trees share one set-file shape (`questions[]` with `question`, `question_hi`, `options`, `options_hi`, `correct_index`, `solution_conventional(_hi)`, `solution_shortcut(_hi)`, `trap_warning(_hi)`). The bank `previous_year_papers` subject is subject-wise ("Previous Year Questions"), and its quant chapter has no tier-1 sets |
| `currentAffairs.ts` | `gk/0-Current Affairs/daily/{YYYY_MM_DD}.json` only (date-named `{en[],hi[]}` sets, no index; from 2026-04-01; existence from the content index). **Monthly capsules and magazine PDFs are Pro in the app** (`MonthlyCapsuleScreen`/`MonthlyMagazineScreen` unlock only `free_months`) and are never read | days grouped by month |
| `contentIndex.ts` | `.content-index.json` produced by `npm run validate:content` (§10) | the set of R2 keys that exist, with size, question counts (en/hi) and last-modified. **Pages and sitemaps only emit URLs for keys in the index**, so a manifest entry whose file is missing can never become a 404 in the sitemap |
| `articles.ts` | `gk/articles/index.json` | article index + `fetchArticle(id)` |
| `apps.ts` | `apps/registry.json` (new, §7) | live apps, ratings, screenshots |
| `exams.ts` | **stays a repo file** (`src/lib/exams.ts`, extended) | editorial data per exam: slug, names, full name, category, hub intro copy (en/hi), `pyqId`, `appId`, `cbtPortalSlug` |
| `stats.ts` | walks all manifests at build | `{ questions, chapters, papers, exams, apps }` — the one number set used everywhere |

Slugs: topic slug = existing `topicSlug(key)` rule; chapter slug = existing `chapterSlug(name)` rule, so current URLs do not move. Both functions move into `src/lib/content/slugs.ts` with tests pinning the current output for every chapter in the manifest.

### 4.3 Rendering and caching

- Content pages do not use `dynamic = "force-static"` (it would freeze content until redeploy). Instead:
  - `generateStaticParams` prerenders the hub layer (home, category, exam hubs, topic hubs, chapter pages, apps) at build.
  - Set pages, PYQ pages, aptitude sets, current-affairs days render on demand with `revalidate = 3600`.
- Enable the OpenNext R2 incremental cache so `revalidate` actually works: `open-next.config.ts` → `defineCloudflareConfig({ incrementalCache: r2IncrementalCache })` with a `NEXT_INC_CACHE_R2_BUCKET` binding to a **new** bucket `studyvirus-next-cache` (never the content bucket, so a cache purge can't touch content). This is the snippet the repo already documents. If the R2 cache cannot be enabled for any reason, fallback is on-demand render with `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`; the plan verifies which path is live.
- Every page's HTML contains the full question text, options, correct answer and explanation for its language. The quiz UI is a client component that receives the already-rendered data and adds interaction; it never fetches.

### 4.4 Locale routing: `/hi/` subdirectory

Per audit §6. Implementation:

- Content routes live under `src/app/[lang]/...` with `lang ∈ { "en", "hi" }`.
- `src/middleware.ts` rewrites every public content path that does not start with `/hi/` to `/en/...` internally (a rewrite, not a redirect: the address bar stays `/topics/...`). `/hi/...` passes through. Non-content routes (§3 list, `/api`, `/_next`, files) are excluded from the rewrite.
- `src/app/[lang]/layout.tsx` sets `<html lang={lang === "hi" ? "hi" : "en"}>`.
- URL helpers: `href(lang, path)` returns `path` for `en` and `/hi${path}` for `hi`. Nothing in the app hand-builds `/en/`.
- `generateMetadata` on every content page emits `alternates.canonical` (self) and `alternates.languages = { "en-IN": enUrl, "hi-IN": hiUrl, "x-default": enUrl }` **only when the Hindi variant exists** (§4.5). Fully qualified `https://studyvirus.com/...` URLs.
- The client language toggle is replaced by a link to the counterpart URL. `localStorage["sv_lang"]` is read once on the home page only to suggest (not auto-redirect) the Hindi home.

### 4.5 Hindi availability rule

A Hindi page exists for a unit only if the source data has Hindi for it:

- Set page: `hi.length === en.length` and `hi.length > 0`.
- Chapter/topic/exam hub: always (names carry `hi`; body copy is authored bilingual in `exams.ts` and the layout strings file).
- Aptitude set: `questions[].question_hi` (or the bank set's `hi` variant) present for every question; otherwise English-only.
- Article: `title_hi` and `content_hi` present.
- Current-affairs day: `hi` array present.

If the rule fails: the `/hi/` URL returns 404, no hreflang is emitted on the English page, and the Hindi sitemap omits it. A Hindi page never falls back to English body text.

### 4.6 Structured data

- `BreadcrumbList` on every page (component `JsonLd.Breadcrumbs`).
- `Organization` on the home page (already present; keep, correct the description to remove "India's largest").
- `SoftwareApplication` on `/apps/{slug}` with `applicationCategory: "EducationalApplication"`, `operatingSystem: "Android"`, `offers: { price: 0, priceCurrency: "INR" }`, `aggregateRating` from the registry (omitted if rating count < 5), `downloadUrl` to the Play listing.
- No `FAQPage`, no `QAPage`, no `Quiz`. A lint test greps the built HTML for those types and fails if found.

## 5. Site map and page templates

### 5.1 Home `/`

Exam-first. Sections in order:

1. Header: wordmark, primary nav (Exams, Topics, PYQ, Aptitude, Current Affairs, Apps), language link, search (client-side over manifest names).
2. Hero: H1 with the computed total ("{N} free practice questions for {E} exams, in Hindi and English"), one primary CTA to Exams, one secondary to PYQ. **No superlatives.** Stat row: questions, papers, chapters, apps — all from `stats.ts`.
3. **Exam categories**: Railway, SSC, Police, Bank, Defence, UPSC & Central, Teaching, State PSC, State subordinate, Forest & Jail, Revenue & Patwari, Agriculture & Labour. Each card lists its exams as links to `/exam/{slug}`. Categories and membership come from `exams.ts`.
4. Subjects grid (visible topics from the manifest, with real chapter and question counts).
5. PYQ strip (top exams by paper count).
6. Latest current affairs (last 7 days + current month).
7. Apps strip: one card per category linking to `/apps#category`.
8. About-the-site block (short, brand-only, links to `/about`).

Ads: one in-feed unit after section 4, one before the footer. Install CTA: the apps strip only.

### 5.2 Exam hub `/exam/{slug}` — "the exam's home page"

Install-first page (audit §2 table). Sections:

1. Breadcrumb, H1 "{Exam} {year}: free GK questions, PYQ & mock test", intro copy (en/hi from `exams.ts`), exam facts (conducting body, stages, subjects) from `exams.ts`.
2. **App card** (primary CTA above the fold): icon, name, synced rating, install button with referrer (§7.3). If the exam has no app in the registry, the card shows the category's general app.
3. Subjects for this exam: topics whose `exams[]` contains the exam id, with chapter counts, linking to `/topics/{subject}`.
4. PYQ: papers for this exam (`pyqId`), linking to `/pyq/{exam}`.
5. Free mock: link to the existing CBT portal's free `mock-01` (`cbtPortalSlug`), labelled clearly as the one free paper.
6. Aptitude: bank-category exams link to `/aptitude/bank` subjects; SSC and Railway exams link to `/aptitude/ssc-railway` subjects; other categories omit the section.
7. Related exams in the same category.

Ads: footer only.

Bank exams (`sbi_clerk`, `sbi_po`, `ibps_clerk`, `ibps_po`, `ibps_rrb_clerk`, `ibps_rrb_po`) are ordinary exam hubs in the Bank category; their subject section is aptitude-first (quant, reasoning, English, DI, puzzles) rather than GK-first, decided by `category === "bank"`.

### 5.3 Topics

- `/topics` — subjects grid grouped: General GK, Science, State GK, Specialist. Grouping is an editorial map in `src/lib/content/topicGroups.ts` keyed by topic key; unmapped topics fall into General GK.
- `/topics/{subject}` — chapter list with set and question counts, exams served, intro line.
- `/topics/{subject}/{chapter}` — chapter page: intro (chapter name, question count, exams), **all** sets as cards, related chapters, PYQ for the top exams, single app card at the end.
- `/topics/{subject}/{chapter}/set-N` — **set page** (§5.7).
- `/topics/{subject}/{chapter}/notes` and `/oneliners` → **301** to the chapter page (Pro content).

Sets are derived exactly as the app derives them (`buildSets` in `rrb-ntpc-gk/src/hooks/useQuestions.js`, `NORMAL_SET_SIZE = 10`, `LAST_SET_SIZE = 20`): (a) if ≥ 80% of questions carry `passageGroup`, one set per passage group in first-seen order; (b) else if the chapter has ≤ 20 questions, one set; (c) else slice 10 at a time, and when the remaining questions number ≤ 20 (and at least one set already exists) they all go into the final set. The current site slices 10 at a time and therefore disagrees with the app on **every** chapter (verified 2026-09-07: 809 of 809 differ; 6,222 site set-pages vs 5,413 app sets). Adopting the app rule means the last one or two `set-N` URLs of each chapter stop existing; a request for `set-N` with `N > setCount` **301s to the last set**, so already-indexed tail URLs keep resolving. Set 1…N-2 are byte-identical between the two rules, so those URLs keep their content.

### 5.4 PYQ

- `/pyq` — exams grouped by category, paper counts.
- `/pyq/{exam}` — paper list (Set 1…N), each with question count; intro copy; app card at end.
- `/pyq/{exam}/set-N` — set page template with paper-level extras: year/shift if present in the JSON, section breakdown if present.
- Source: `gk/24-Previous Year Papers/{prefix}{NN}.json` for the 70 GK-config exams only. The bank manifest's `previous_year_papers` subject is subject-wise, not exam-wise, and is published under `/aptitude/previous-year-questions/...` (§5.5). Bank exam hubs link there from their aptitude section.

### 5.5 Aptitude (audit §4 "method-first")

- `/aptitude` — two families, each exam-qualified in its H1 so the page never competes for school-grade traffic (audit §3): **SSC & Railway** (`/aptitude/ssc-railway`, from the GK aptitude manifest: Quantitative Aptitude, Reasoning) and **Bank** (`/aptitude/bank`, from the bank manifest: Quantitative Aptitude, Reasoning, Data Interpretation, Puzzles & Seating, English, Previous Year Questions). Family slugs: `ssc-railway`, `bank`. Subject slugs: `quant`, `reasoning`, `data-interpretation`, `puzzles`, `english`, `previous-year-questions` (bank English is a different set from the GK English topics and is published here, not under `/english`).
- `/aptitude/{family}/{subject}/{chapter}` — **primary target**. H1 "{Chapter}: formula, shortcuts & practice questions for {SSC CGL, CHSL, RRB NTPC | SBI PO, IBPS PO, Clerk}", then method block, worked example, common mistakes, then types → free sets, then related chapters and exam hubs.
  - Method block source: new free file `gk/aptitude/web-method/{family}/{chapter_id}.json` = `{ formula_en, formula_hi, example_en, example_hi, mistakes_en[], mistakes_hi[] }`. Authored later, outside this build; **until it exists the page renders the manifest chapter name, the sets' `description`/`series_rubric`**, and the H1 drops "formula, shortcuts &". The Pro aptitude notes (`gk/aptitude/content/notes/**`) are never read.
- `/aptitude/{family}/{subject}/{chapter}/{type}/set-N` — set page for tier-1 sets. Tier-2 sets are not listed, not linked, not in the sitemap. Solutions render `solution_conventional` then, when present, `solution_shortcut` under a "Shortcut" heading and `trap_warning` as a callout. Inline `$…$` / `$$…$$` LaTeX is rendered server-side with KaTeX (CSS inlined, no client JS); lines beginning `📊 [VISUAL:` and the following `DATA:` line are stripped (they are app-only render hints).

### 5.6 English (GK English topics)

`/english`, `/english/{section}/{chapter}`, `/english/{section}/{chapter}/set-N` keep their URLs; they are the two English topics in the manifest rendered with the topic templates.

### 5.7 Set page template (shared by topics, PYQ, aptitude, English, CA day)

1. Breadcrumb (`BreadcrumbList`), H1 "{Chapter} — Set N ({count} questions)" plus exam tags, language link to the counterpart.
2. Practice toggle (client): "Show answers" (default on for first paint, so answers are in HTML) / "Practice mode" hides answers and explanations until an option is chosen, keeps score locally.
3. Questions: number, stem, four options with the correct one marked, explanation rendered from the `explain` bullet text (markdown-lite: `•`, `–`, `**bold**`).
4. Between every 5 questions: one in-article ad unit (max 2 per page on mobile).
5. Footer of the set: previous/next set, back to chapter, **"Report an error in this set"** link → small form (question number + note) posting to `POST /api/report-question` with `{ source: "web", key, questionId, note }`.
6. One quiet app card (icon, name, rating, install button) at the very end.

### 5.8 Current affairs

- `/current-affairs` — current month capsule + last 30 days.
- `/current-affairs/monthly/{YYYY_MM}` — the durable page, **built from that month's free daily sets**: H1 "{Month YYYY} current affairs: {N} questions with answers for SSC, Railway, Bank & Police", a day-by-day list with question counts, and the full question list of the month's dailies rendered inline (answers visible) so the page is the audit's "monthly compilation" as an indexable HTML asset. Capsule and magazine PDFs are Pro and are not linked.
- `/current-affairs/daily/{YYYY_MM_DD}` — day set (set page template). Pages older than 90 days emit `robots: noindex, follow` and stay linked from the monthly page.

### 5.9 Articles

`/articles`, `/articles/{id}` from the article index, bilingual where `content_hi` exists.

### 5.10 Apps directory

- `/apps` — categories in the home-page order; each app as a card: icon, name, one-line description, synced rating + count, install button, and a "Practice on the site" link to the matching `/exam/{slug}` (or `/topics` for general apps).
- `/apps/{slug}` — per audit §5 template: title "{App name} – Free Practice & Mock Tests", H1, What's inside (from the registry's Play description, first 400 chars, + feature list from `exams.ts`), Screenshots (from R2 mirror, real per-app), Why this app (features that the site can't do: offline, daily quiz, leaderboard, flash cards — feature flags from the app config), **How it compares to practising on the site** (generated table: site has X sets / app adds Y), links into `/exam/{slug}`, `/pyq/{exam}`, `/topics`, Download section with the referrer link. `SoftwareApplication` schema.
- Slug = exam slug for exam apps, app id for general apps.

### 5.11 Static pages

`/about` (brand-only, what the content is, how it is made, how to report errors, no person named — user decision), `/contact`, `/privacy-policy`, `/terms`: rewritten in the new design, same URLs.

## 6. Ads and install CTA rules (audit §2)

| Page type | Primary | Secondary |
|---|---|---|
| Set pages, chapter pages, PYQ lists, aptitude, CA, articles | AdSense (in-article units, sticky bottom on mobile) | one app card at end of page |
| Exam hubs, `/apps`, `/apps/{slug}` | Install (app card above the fold, no sticky ad) | one footer ad unit |
| Home | Balanced: two ad units, apps strip | — |
| About, contact, privacy, terms | none | none |

`AdSlot` becomes a single component with a `placement` prop; the page type decides via `src/lib/monetisation.ts`, so no page hand-places both.

## 7. Apps registry pipeline (studyvirus-ops)

### 7.1 Job `play-sync`, daily 05:00 IST

1. Fetch `https://play.google.com/store/apps/developer?id=Manmeet+Kumar`; extract every `details?id=` package.
2. For each package fetch the listing page; parse title, short/long description, rating value, rating count, install bucket, icon URL, screenshot URLs, last-updated. Parsing is best-effort HTML extraction; a package whose parse fails keeps its previous registry entry and is logged.
3. Download icon + up to 6 screenshots, convert to WebP (max 1080px tall), write to R2 `apps/{package}/icon.webp`, `apps/{package}/shot-{n}.webp`.
4. Write `apps/registry.json` = `{ generatedAt, apps: [{ package, examId?, slug, name, description, rating, ratingCount, installs, icon, screenshots[], updatedAt }] }`. `examId`/`slug` mapping comes from `rrb-ntpc-gk/config/exams.js` + `bank-apps/config/exams.js` packages; unknown packages get `slug = package` and category `other`.
5. Publish through the same R2 client the ops `ca-publish` job uses, then read back through the CDN to verify.

Caps: one run per day, max 100 listings, 10s per fetch, and a **shrink guard**: if the new registry has fewer than 90% of the previous run's apps, the run aborts and alerts (a Play HTML change must not blank the directory).

### 7.2 Site side

`apps.ts` reads `apps/registry.json`; missing file → `/apps` renders from `exams.ts` without ratings/screenshots and the per-app page omits `aggregateRating` and the screenshots section. The site never hardcodes a rating.

### 7.3 Attribution and App Links

- Every Play link: `https://play.google.com/store/apps/details?id={package}&referrer=utm_source%3Dstudyvirus.com%26utm_medium%3Dweb%26utm_campaign%3D{page-kind}%26utm_content%3D{slug}`.
- `/.well-known/assetlinks.json` served as a route handler generated from `src/lib/content/assetlinks.csv` (`package,sha256`). Rows present today: none; the file ships as `[]` and grows as fingerprints are pasted from Play Console → App integrity. Adding the `intent-filter` to the apps is an app-repo task, noted, not done here.

## 8. Sitemaps, robots, redirects

- `/sitemap.xml` becomes a **sitemap index** (`src/app/sitemap.ts` returning multiple sitemaps via `generateSitemaps`): `static`, `exams`, `topics`, `sets-{subject-batch}`, `pyq`, `aptitude`, `english`, `current-affairs`, `articles`, `apps`, and the `hi-*` twins. Each child ≤ 45,000 URLs. All generated from the manifests; the declared count equals the page count by construction. A test asserts every URL a sitemap emits returns 200 in a local build sample.
- `lastModified`: the R2 object's `uploaded` timestamp when read through the binding; build date otherwise.
- Redirects (301) added to `next.config.mjs`: `/topics/:s/:c/notes`, `/topics/:s/:c/oneliners` → `/topics/:s/:c`; `/mock-tests`, `/mock-tests/:slug` → `/exam/:slug` (or `/exam` for the root); `/exam` stays.
- `robots.ts` unchanged (`/api/` disallowed, sitemap declared).
- CA dailies > 90 days: `noindex` via `generateMetadata`.

## 9. Design system

Worked in detail with the frontend-design skill at implementation; constraints fixed here:

- Light and dark themes via CSS variables; theme follows `prefers-color-scheme` with a toggle.
- Typography: one Latin text face and one Devanagari face loaded together (Google Fonts via `next/font`, subsets `latin` + `devanagari`), sized so Hindi and English pages have equal visual weight. Reading measure ~70ch for explanations.
- Tailwind stays (already installed); the token layer is CSS variables, not arbitrary hex in JSX.
- No client JS on a content page beyond the quiz layer, the report form, the theme toggle and the ad loader. No carousels, no animation libraries.
- Mobile-first; sticky bottom ad reserves its height to avoid layout shift; images have width/height.
- Performance budget: LCP < 2.5s on a mid-range Android over 4G, CLS < 0.1, no render-blocking third-party except the AdSense loader (async).

## 10. Testing

- **Unit** (`node --test`, TypeScript via `tsx`): loader key encoding and paid-prefix guard; slug functions pinned against the full manifest; set chunking matches the app rule; Hindi availability rule; sitemap generators (counts, no duplicates, ≤ 45k per child); monetisation placement per page kind; assetlinks generator; referrer builder.
- **Content validation script** (`npm run validate:content`): walks every manifest entry, fetches each file from the CDN (parallel, ~3,500 files), checks shape, counts `en`/`hi` questions, and writes `.content-index.json` (§4.2). Runs as part of `npm run cf:build` (and `npm run build`), so both local and Cloudflare CI builds regenerate it; the generated file is also committed so a build without network still has a valid index. Fails the build on a malformed file, and on a **regression**: any key present in the previously committed index that is now missing. Keys that were never present (e.g. the manifest's visible `english` topic whose folder is not on the CDN) are logged as warnings, not failures, so a known content gap cannot block deploys. Also fails if the index shrinks by more than 10% versus the previous committed index (same shrink-guard idea the ops service uses); `--force` overrides both guards for a deliberate removal. The script also asserts slug uniqueness within every manifest level it walks, and writes the section totals (`totals`) into the index so `stats.ts` needs no second pass.
- **E2E smoke** (Playwright, against `npm run preview`): home, one exam hub, one chapter, one set (en + hi), one PYQ set, one aptitude chapter, one CA day, `/apps`, one `/apps/{slug}`, `/sitemap.xml` + one child. Asserts: question text present in HTML without JS, `<html lang>`, hreflang pair present and reciprocal, canonical self, BreadcrumbList present, no FAQPage/QAPage, 301s for notes/oneliners/mock-tests.
- **Lighthouse** on the set page and exam hub (mobile) as a report, thresholds from §9.

## 11. Rollout

1. Build behind the Worker's preview URL; run validation + E2E.
2. Deploy. Submit the new sitemap index in Search Console (user action; the account still lacks property access per audit §0 — granting it is the first ops task).
3. Ops: enable the `play-sync` job; add the `NEXT_INC_CACHE_R2_BUCKET` bucket.
4. Watch the five audit metrics (§10 of the audit): indexed URLs, Hindi indexed URLs, declared vs real, site-attributed installs, ad vs install performance.

## 12. Out of scope

Reddit/Telegram distribution; paid mocks and ebooks (the page templates leave room: a set list can carry a "Pro" row type later); accounts or login on the public site; authoring the aptitude method blocks (content task, the template is ready); app-side `intent-filter` changes; Search Console access.
