# Plan B — Public Site, Bilingual Pages & Sitemaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every public page with a bilingual, server-rendered, manifest-driven rebuild — exam-first home, exam hubs, topics, PYQ, aptitude, English, current affairs, articles, apps directory — plus the sitemap index, retire the pre-launch CBT portals, and ship it.

**Architecture:** Every public page moves under `src/app/[lang]/` where `lang ∈ {en, hi}`. Middleware rewrites prefix-less URLs to `/en/...` internally, so existing English URLs never move; `/hi/...` serves real Hindi from the `hi` arrays already in the content. The 26 per-app privacy pages and the `/b/[code]` route move unchanged into a `(legacy)` route group that keeps its own root layout. CBT portals, the bank player and the ungated paid `public/mock-content/` tree are deleted and 301'd to exam hubs (paid mocks relaunch later). All data comes from Plan A's loaders; no page fetches anything itself.

**Tech Stack:** Next.js 14.2 App Router (RSC), TypeScript strict, Tailwind, `@opennextjs/cloudflare`, Playwright for smoke tests.

**Spec:** `docs/superpowers/specs/2026-09-07-studyvirus-web-rebuild-design.md` — §3 (what stays/goes), §5 (page templates), §6 (ads), §8 (sitemaps), §9 (design).

**Depends on:** Plan A (`docs/superpowers/plans/2026-09-07-plan-a-content-platform.md`) — all 18 tasks complete and committed.

## Global Constraints

- Repo `C:\Users\manme\Desktop\StyleID\studyvirus-web`, branch `master`. Always `git add` explicit paths, never `-A`.
- **Model tiers** per task: `fable` (hard), `opus` (moderate), `sonnet` (easy).
- Never fetch content in a page/component — call Plan A loaders (`@/lib/content/*`). Never read a paid or Pro key; `assertPublishable` will throw if you try.
- Every content page: server component, `revalidate = 3600` unless stated, full question text in HTML, `BreadcrumbList` JSON-LD, canonical + hreflang from `buildAlternates`.
- Never emit `FAQPage`, `QAPage` or `Quiz` JSON-LD. Task 14's lint fails the build if you do.
- Ads/CTA come from `placement(pageKind)` (Plan A Task 15) — no page hand-places both an ad and an install CTA.
- Hindi strings are authored, never machine-translated at runtime, and never English fallback in a Hindi page body.
- Commit messages end with `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
- After each task: `npm test && npm run typecheck && npm run build` must pass (build includes content validation).

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` | Root html/body, fonts, AdSense script, Organization JSON-LD |
| `src/app/(legacy)/layout.tsx` | Chrome for privacy + stylescan pages |
| `src/app/(legacy)/privacy/**`, `(legacy)/apps/stylescan/**`, `(legacy)/b/[code]` | Moved unchanged |
| `src/app/[lang]/layout.tsx` | Lang-aware chrome: Header, Footer, `<html lang>` handled by root via params |
| `src/app/[lang]/page.tsx` | Home |
| `src/app/[lang]/exam/page.tsx`, `[slug]/page.tsx` | Exam index + hub |
| `src/app/[lang]/topics/**` | Topics index, topic, chapter, set |
| `src/app/[lang]/pyq/**` | PYQ index, exam, paper |
| `src/app/[lang]/aptitude/**` | Aptitude index, family, subject, chapter, set |
| `src/app/[lang]/english/**` | English index, chapter, set |
| `src/app/[lang]/current-affairs/**` | CA index, monthly, daily |
| `src/app/[lang]/articles/**` | Articles index, article |
| `src/app/[lang]/apps/**` | Apps hub, app landing |
| `src/app/[lang]/{about,contact,terms,privacy-policy}/page.tsx` | Static pages |
| `src/app/sitemap.ts` | Sitemap index + children via `generateSitemaps` |
| `src/app/robots.ts` | Unchanged behaviour, re-verified |
| `src/components/site/*` | New design-system components (Header, Footer, Cards, QuestionList, AdSlot wrapper, AppCard, ReportError, LangLink) |
| `src/lib/ui/strings.ts` | All UI copy, `en`/`hi` keyed |
| `src/lib/ui/format.ts` | Explanation/markdown-lite + LaTeX rendering |
| `test/e2e/*.spec.ts` | Playwright smoke specs |
| `scripts/lint-html.mjs` | Post-build HTML assertions (forbidden JSON-LD, hreflang reciprocity) |

---

### Task 1: Retire the CBT portals and the paid static tree

**Model:** `opus`

**Files:**
- Delete: `src/app/[sscexam]/`, `src/app/bank/`, `src/lib/sscCatalog.ts`, `src/lib/bankCatalog.ts`, `src/components/bank/`, `src/components/ssc/`, `public/cbt/`, `public/bank/`, `public/mock-content/`
- Modify: `src/components/SiteShell.tsx` (drop the portal branch), `src/middleware.ts` (use Plan A's `decide`)
- Test: `test/i18n.test.ts` (already covers the redirects — re-run it)

**Interfaces:**
- Consumes: `decide` from `src/lib/i18n/routing.ts` (Plan A Task 14).
- Produces: no portal routes; `/ssccgl`, `/rrbntpc`, `/bank`, `/cbt/*`, `/mock-content/*` all 301 to exam hubs.

- [ ] **Step 1: Confirm what is being deleted is not linked from a Play listing**

Run:
```bash
grep -rn "studyvirus.com/\(bank\|cbt\|mock-content\|ssccgl\|rrbntpc\)" ~/Desktop/rrb-ntpc-gk/config ~/Desktop/bank-apps/config 2>/dev/null | head
```
Expected: no hits, or only `mockCdnBase` (which points at `cdn.studyvirus.com`, a different host — fine). If an app config points at a `studyvirus.com/<portal>` URL, STOP and report: deleting it would break a shipped app.

- [ ] **Step 2: Delete the portal surfaces**

```bash
cd /c/Users/manme/Desktop/StyleID/studyvirus-web
git rm -r --quiet "src/app/[sscexam]" src/app/bank src/components/bank src/components/ssc src/lib/sscCatalog.ts src/lib/bankCatalog.ts public/cbt public/bank public/mock-content
```

(`git rm` also clears the pre-existing uncommitted edits to those files, which is intended — see spec §3.)

- [ ] **Step 3: Simplify `SiteShell`**

Replace `src/components/SiteShell.tsx` entirely:

```tsx
"use client";
// Chrome for the (legacy) route group only — the 26 per-app privacy pages and
// the stylescan pages. The rebuilt site under [lang] has its own layout.
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <main className="min-h-screen pb-16">{children}</main>
      </div>
      <Footer />
    </>
  );
}
```

- [ ] **Step 4: Rewrite `src/middleware.ts` to use the tested decision function**

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decide } from "@/lib/i18n/routing";

// Firebase Auth custom-domain proxy. authDomain = "studyvirus.com" means the
// sign-in page shows our domain, but the handler assets it serves at /__/auth/*
// and /__/firebase/* live on Firebase Hosting, so we proxy those two prefixes.
// MUST run before decide(), which would otherwise redirect them to /topics.
const FIREBASE_AUTH_ORIGIN = "https://study-virus-wordpress-app.firebaseapp.com";

async function proxyFirebaseAuth(request: NextRequest): Promise<Response> {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, FIREBASE_AUTH_ORIGIN);
  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/__/auth") || pathname.startsWith("/__/firebase")) {
    return proxyFirebaseAuth(request);
  }

  const d = decide(pathname);
  if (d.action === "next") return NextResponse.next();

  const url = request.nextUrl.clone();
  if (d.action === "rewrite") {
    url.pathname = d.to;
    return NextResponse.rewrite(url);
  }
  const [path, hash] = d.to.split("#");
  url.pathname = path;
  url.search = "";
  url.hash = hash ?? "";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Verify nothing still imports the deleted modules**

Run:
```bash
grep -rn "sscCatalog\|bankCatalog\|components/bank\|components/ssc\|PORTAL_SLUGS" src --include=*.ts --include=*.tsx
```
Expected: only `src/lib/i18n/routing.ts` (which imports `PORTAL_SLUGS` from `gkApps.ts` for the redirect map) and `src/lib/gkApps.ts` itself.

- [ ] **Step 6: Test and build**

Run: `npm test && npm run typecheck && npm run build`
Expected: pass. The build will warn that `src/app/topics` etc. still exist — that is fine, they are replaced in later tasks.

- [ ] **Step 7: Commit**

```bash
git add -u
git add src/components/SiteShell.tsx src/middleware.ts
git commit -m "feat(site): retire the pre-launch CBT portals and gate paid content off the site

The nine CBT portals, the bank player and public/mock-content/ were the paid
mock surfaces, which launch later; mock-content/ was also serving paid bank
papers with answer keys as ungated static assets. Every retired URL now 301s
to its exam hub.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Design system foundation — tokens, fonts, strings, primitives

**Model:** `fable`

**Files:**
- Modify: `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`
- Create: `src/lib/ui/strings.ts`, `src/lib/ui/format.ts`, `src/components/site/Container.tsx`, `Prose.tsx`, `ThemeToggle.tsx`
- Test: `test/strings.test.ts`, `test/format.test.ts`

**Interfaces:**
- Produces:
  - `t(lang, key): string` and `T` (typed key union) from `strings.ts`; every key has both `en` and `hi`.
  - `renderExplanation(text: string): ReactNode` from `format.ts` — bullet lines (`•`, `–`), `**bold**`, `$…$`/`$$…$$` LaTeX via KaTeX server-side, strips `📊 [VISUAL:…]` + following `DATA:` line.
  - CSS variables for light and dark, Devanagari + Latin font pair.

- [ ] **Step 1: Install KaTeX**

```bash
npm install katex@^0.16.11 && npm install --save-dev @types/katex@^0.16.7
```

- [ ] **Step 2: Write the failing tests**

`test/format.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { explanationBlocks, stripVisualHints, renderInlineMath } from "../src/lib/ui/format";

test("strips app-only visual hints and their DATA line", () => {
  const s = "Look at the gaps.\n\n📊 [VISUAL:series-steps]\nDATA: {\"terms\":[\"5\"]}\n\n∴ **33**.";
  assert.equal(stripVisualHints(s), "Look at the gaps.\n\n∴ **33**.");
});

test("explanationBlocks splits bullets, sub-bullets and paragraphs", () => {
  const s = "• First point\n• Second point\n– sub point\nPlain paragraph";
  assert.deepEqual(explanationBlocks(s), [
    { kind: "bullet", text: "First point" },
    { kind: "bullet", text: "Second point" },
    { kind: "sub", text: "sub point" },
    { kind: "para", text: "Plain paragraph" },
  ]);
});

test("renderInlineMath converts $..$ and $$..$$ to KaTeX html and leaves plain text", () => {
  const html = renderInlineMath("difference is $12-5=7$ each step");
  assert.match(html, /katex/);
  assert.match(html, /difference is/);
  assert.equal(renderInlineMath("no math here"), "no math here");
  assert.doesNotMatch(renderInlineMath("cost is $5 and $6"), /katex/); // currency, not math
});
```

`test/strings.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, t } from "../src/lib/ui/strings";

test("every string has both languages and no empty value", () => {
  for (const [key, val] of Object.entries(STRINGS)) {
    assert.equal(typeof val.en, "string", `${key}.en`);
    assert.equal(typeof val.hi, "string", `${key}.hi`);
    assert.ok(val.en.trim().length > 0, `${key}.en empty`);
    assert.ok(val.hi.trim().length > 0, `${key}.hi empty`);
  }
});

test("t returns the right language", () => {
  assert.equal(t("en", "nav.topics"), "Topics");
  assert.equal(t("hi", "nav.topics"), "विषय");
});
```

- [ ] **Step 3: Run to verify failure** — `npm test` → modules missing.

- [ ] **Step 4: Implement `src/lib/ui/format.ts`**

```ts
import katex from "katex";

/** App-only render hints: a 📊 [VISUAL:...] line and the DATA: line under it. */
export function stripVisualHints(text: string): string {
  return text
    .split("\n")
    .reduce<{ out: string[]; skipData: boolean }>((acc, line) => {
      if (/^\s*📊?\s*\[VISUAL:/.test(line)) return { out: acc.out, skipData: true };
      if (acc.skipData && /^\s*DATA:/.test(line)) return { out: acc.out, skipData: false };
      return { out: [...acc.out, line], skipData: false };
    }, { out: [], skipData: false })
    .out.join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type Block = { kind: "bullet" | "sub" | "para"; text: string };

export function explanationBlocks(text: string): Block[] {
  return stripVisualHints(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith("•")) return { kind: "bullet" as const, text: line.slice(1).trim() };
      if (line.startsWith("–") || line.startsWith("-")) return { kind: "sub" as const, text: line.slice(1).trim() };
      return { kind: "para" as const, text: line };
    });
}

// $$block$$ and $inline$. A lone $ followed by a digit and later another $ with
// a space before it is currency, not math — require no space just inside the
// delimiters and at least one operator/letter to treat it as math.
const BLOCK = /\$\$([^$]+)\$\$/g;
const INLINE = /\$(\S(?:[^$\n]*\S)?)\$/g;
const LOOKS_MATHY = /[=+\-*/^_\\{}]|\\[a-zA-Z]+/;

export function renderInlineMath(text: string): string {
  let out = text.replace(BLOCK, (_m, body: string) => katex.renderToString(body.trim(), { displayMode: true, throwOnError: false }));
  out = out.replace(INLINE, (m, body: string) => (LOOKS_MATHY.test(body) ? katex.renderToString(body.trim(), { displayMode: false, throwOnError: false }) : m));
  return out;
}
```

- [ ] **Step 5: Implement `src/lib/ui/strings.ts`**

Author every UI string used anywhere in the site as `{ en, hi }`. Start with this set and add keys as later tasks need them (each addition keeps the both-languages test green):

```ts
import type { Lang } from "@/lib/i18n/lang";

export const STRINGS = {
  "nav.exams": { en: "Exams", hi: "परीक्षाएँ" },
  "nav.topics": { en: "Topics", hi: "विषय" },
  "nav.pyq": { en: "PYQ Papers", hi: "पिछले प्रश्नपत्र" },
  "nav.aptitude": { en: "Aptitude", hi: "एप्टीट्यूड" },
  "nav.english": { en: "English", hi: "अंग्रेज़ी" },
  "nav.currentAffairs": { en: "Current Affairs", hi: "करेंट अफेयर्स" },
  "nav.articles": { en: "Articles", hi: "लेख" },
  "nav.apps": { en: "Apps", hi: "ऐप्स" },
  "common.home": { en: "Home", hi: "होम" },
  "common.set": { en: "Set", hi: "सेट" },
  "common.questions": { en: "questions", hi: "प्रश्न" },
  "common.chapters": { en: "chapters", hi: "अध्याय" },
  "common.papers": { en: "papers", hi: "प्रश्नपत्र" },
  "common.answer": { en: "Answer", hi: "उत्तर" },
  "common.explanation": { en: "Explanation", hi: "व्याख्या" },
  "common.shortcut": { en: "Shortcut", hi: "शॉर्टकट" },
  "common.trap": { en: "Common mistake", hi: "सामान्य गलती" },
  "common.readInHindi": { en: "हिंदी में पढ़ें", hi: "Read in English" },
  "common.next": { en: "Next", hi: "अगला" },
  "common.previous": { en: "Previous", hi: "पिछला" },
  "common.showAnswers": { en: "Show answers", hi: "उत्तर दिखाएँ" },
  "common.practiceMode": { en: "Practice mode", hi: "अभ्यास मोड" },
  "common.reportError": { en: "Report an error in this set", hi: "इस सेट में त्रुटि बताएँ" },
  "common.free": { en: "Free", hi: "निःशुल्क" },
  "app.getTheApp": { en: "Get the app", hi: "ऐप डाउनलोड करें" },
  "app.onPlayStore": { en: "Free on Google Play", hi: "Google Play पर निःशुल्क" },
  // … later tasks append their keys here
} as const;

export type T = keyof typeof STRINGS;

export function t(lang: Lang, key: T): string {
  return STRINGS[key][lang];
}
```

- [ ] **Step 6: Rewrite the token layer**

Replace `src/app/globals.css` with a token-first sheet: `@tailwind` directives, then `:root` light tokens (`--bg`, `--surface`, `--ink`, `--ink-soft`, `--line`, `--accent`, `--accent-ink`, `--ok`, `--warn`), a `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` block, a `:root[data-theme="dark"]` block with the same tokens, base element styles, `.katex` sizing, and print-safe defaults. Every colour used anywhere is a token; no raw hex in components.

In `tailwind.config.ts`, map `colors` to `var(--…)` tokens and set `fontFamily.sans` to `var(--font-sans)`, `fontFamily.display` to `var(--font-display)`, `fontFamily.deva` to `var(--font-deva)`.

In `src/app/layout.tsx`, load the fonts:

```tsx
import { Inter, Noto_Sans_Devanagari, Newsreader } from "next/font/google";
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const deva = Noto_Sans_Devanagari({ subsets: ["devanagari"], variable: "--font-deva", display: "swap" });
```

and put `${sans.variable} ${display.variable} ${deva.variable}` on `<body>`. Import `katex/dist/katex.min.css` in the root layout.

- [ ] **Step 7: Run tests, typecheck, build** — `npm test && npm run typecheck && npm run build` → pass.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css tailwind.config.ts src/app/layout.tsx src/lib/ui src/components/site package.json package-lock.json test/strings.test.ts test/format.test.ts
git commit -m "feat(ui): design tokens, Latin+Devanagari fonts, bilingual strings, explanation renderer

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Route skeleton — `[lang]` segment, legacy group, shared chrome

**Model:** `fable`

**Files:**
- Create: `src/app/[lang]/layout.tsx`, `src/app/(legacy)/layout.tsx`
- Move: `src/app/privacy/**` → `src/app/(legacy)/privacy/**`; `src/app/apps/stylescan/**` → `src/app/(legacy)/apps/stylescan/**`; `src/app/b/**` → `src/app/(legacy)/b/**`
- Delete: `src/app/page.tsx` (replaced in Task 4)
- Modify: `src/app/layout.tsx` (chrome moves out of root)
- Create: `src/components/site/Header.tsx`, `Footer.tsx`, `LangLink.tsx`, `AdSlot.tsx`, `AppCard.tsx`
- Delete: `src/components/{Header,Footer,AppBanner,HeaderAd,SidebarAd,StickyBottomAd,LangToggle,NavButtons,SetPills,StudyTabs,SiteShell,AdSlot}.tsx` after the legacy layout stops importing them

**Interfaces:**
- Produces:
  - `[lang]/layout.tsx` exports `generateStaticParams` → `[{lang:"en"},{lang:"hi"}]`, validates the param with `isLang` else `notFound()`.
  - `<Header lang>`, `<Footer lang>`, `<LangLink lang path hasHi>`, `<AdSlot placement>`, `<AppCard app lang variant>`.

- [ ] **Step 1: Move the legacy pages**

```bash
cd /c/Users/manme/Desktop/StyleID/studyvirus-web
mkdir -p "src/app/(legacy)"
git mv src/app/privacy "src/app/(legacy)/privacy"
mkdir -p "src/app/(legacy)/apps"
git mv src/app/apps/stylescan "src/app/(legacy)/apps/stylescan"
rmdir src/app/apps
git mv src/app/b "src/app/(legacy)/b"
```

- [ ] **Step 2: Give the legacy group its own layout**

`src/app/(legacy)/layout.tsx`:

```tsx
// The 26 per-app privacy pages and the stylescan pages, kept exactly as they
// were. They are linked from live Play listings, so their URLs and content
// must not change; only the chrome around them is shared.
import SiteShell from "@/components/SiteShell";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
```

- [ ] **Step 3: Strip chrome out of the root layout**

`src/app/layout.tsx` keeps only: metadata defaults, fonts, `katex` CSS, `<html>`/`<body>`, Organization JSON-LD (from `organization()`), and `{children}`. It must no longer import `SiteShell` or `LangProvider`. Delete `src/lib/LangContext.tsx` — language is a URL segment now.

- [ ] **Step 4: Create the `[lang]` layout**

`src/app/[lang]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n/lang";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Script from "next/script";

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "hi" }];
}

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813" crossOrigin="anonymous" strategy="lazyOnload" />
      <Header lang={lang} />
      <main id="main" className="min-h-screen">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
```

The `lang` attribute on `<html>` is set in the root layout from the URL: since the root layout cannot read the segment in Next 14, set `<html lang="en">` there and override in `[lang]/layout.tsx` with a tiny client component that sets `document.documentElement.lang` **is not acceptable** (crawlers need it in the HTML). Instead, root layout reads the header the middleware sets: in `middleware.ts` add `res.headers.set("x-sv-lang", d.action === "next" && pathname.startsWith("/hi") ? "hi" : "en")` for rewrites and passthroughs, and in the root layout use `headers()` from `next/headers` to read `x-sv-lang`. Document the coupling in a comment in both files.

- [ ] **Step 5: Build the chrome components**

- `Header`: wordmark → `href(lang,"/")`, nav links from `strings.ts` (`nav.*`), a language link to the counterpart of the current path (client component reading `usePathname`), theme toggle, mobile menu. No install button (that is the apps strip's job).
- `Footer`: link columns (Exams by category, Content, About), the one computed stat line from `siteStats()`, copyright.
- `LangLink`: renders `hasHi ? <Link href={counterpart}>…</Link> : null`, labelled from `common.readInHindi`.
- `AdSlot`: same AdSense mechanics as the old component (slot ids `header 4497869583`, `inArticle1 1871706240`, `inArticle2 4306297892`, `sidebar 2969796383`, `stickyBottom 6716838813`, client `ca-pub-3496395300151813`), but takes `placement: AdSpot` and reserves height to avoid CLS.
- `AppCard`: `variant: "hero" | "end" | "strip"`, shows icon, name, rating (only if `ratingCount >= 5`), install button using `playUrl(pkg, kind, slug)`.

- [ ] **Step 6: Delete the superseded components**

```bash
git rm src/components/AppBanner.tsx src/components/HeaderAd.tsx src/components/SidebarAd.tsx src/components/StickyBottomAd.tsx src/components/LangToggle.tsx src/components/NavButtons.tsx src/components/SetPills.tsx src/components/StudyTabs.tsx src/components/AdSlot.tsx src/lib/LangContext.tsx
```

Keep `src/components/{Header,Footer,Breadcrumbs,SiteShell,QuizClient}.tsx` for now — the legacy group and later tasks still use `SiteShell`, `Header`, `Footer` and `Breadcrumbs`; `QuizClient` is replaced in Task 6.

- [ ] **Step 7: Verify the legacy pages still render**

Run: `npm run build` then `npx next start -p 3010 &` and:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/privacy/wbcs
curl -s http://localhost:3010/privacy/wbcs | grep -c "WBCS West Bengal GK 2026 - Privacy Policy"
```
Expected: `200` and `1`. Kill the server.

- [ ] **Step 8: Commit**

```bash
git add -A src/app src/components src/lib
git commit -m "feat(site): [lang] route skeleton, (legacy) group for Play-linked pages, new chrome

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Home page

**Model:** `opus`

**Files:**
- Create: `src/app/[lang]/page.tsx`, `src/components/site/ExamCategoryGrid.tsx`, `SubjectGrid.tsx`, `StatRow.tsx`
- Delete: `src/app/page.tsx`

**Interfaces:**
- Consumes: `loadTopics`, `visibleTopics`, `chaptersOf`, `loadPyqExams`, `loadAppsRegistry`, `siteStats`, `formatCount`, `EXAMS`, `EXAM_CATEGORIES`, `placement("home")`.
- Produces: `/` and `/hi` rendering categories → exams, subjects, PYQ strip, CA strip, apps strip.

- [ ] **Step 1: Write the page**

Sections in the order fixed by spec §5.1: hero (H1 with computed total, two CTAs, stat row), **exam categories** (Railway, SSC, Police, Bank, Defence, UPSC & Central, Teaching, State PSC, State Subordinate, Forest, Jail, Revenue, Agriculture — each card lists its exams linking to `/exam/{slug}`), subjects grid, PYQ strip, current-affairs strip, apps strip, about block. Ads: one in-feed after subjects, one before footer, per `placement("home")`.

Metadata: title `"{N} free practice questions for {E} government exams | StudyVirus"` with `N = formatCount(siteStats().questions, lang)`; description mentioning Hindi and English; `alternates` from `buildAlternates({lang, path:"/", hasHi:true})`. **No "#1", no "10 Lakh+", no 200,000+.**

- [ ] **Step 2: Delete the old home**

```bash
git rm src/app/page.tsx
```

- [ ] **Step 3: Verify both languages render the same computed number**

Run: `npm run build && npx next start -p 3010 &`
```bash
curl -s http://localhost:3010/ | grep -o "[0-9,]\+ free practice questions" | head -1
curl -s http://localhost:3010/hi | grep -c 'lang="hi"'
curl -s http://localhost:3010/ | grep -c "200,000\|#1\|10 Lakh"
```
Expected: a real number like `198,633 free practice questions`; `1`; `0`.

- [ ] **Step 4: Commit**

```bash
git add src/app/[lang]/page.tsx src/components/site
git rm --cached -q src/app/page.tsx 2>/dev/null || true
git commit -m "feat(home): exam-category-first home page with build-time computed totals

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Exam index and exam hub

**Model:** `fable`

**Files:**
- Create: `src/app/[lang]/exam/page.tsx`, `src/app/[lang]/exam/[slug]/page.tsx`
- Delete: `src/app/exam/`

**Interfaces:**
- Consumes: `EXAMS`, `EXAM_CATEGORIES`, `factsFor`, `examIntro`, `appPackageFor`, `topicsForExam`, `chaptersOf`, `loadPyqExams`/`papersOf`/`pyqSlug`, `loadFamily`, `loadAppsRegistry`, `appForExam`, `playUrl`, `placement("exam-hub")`.
- Produces: `/exam`, `/exam/{slug}`, `/hi/exam/{slug}` for all 82 exams.

- [ ] **Step 1: Build `/exam`** — all exams grouped by category, each with its icon, full name and a one-line fact (`factsFor(id).body`). `generateStaticParams` not needed (static route).

- [ ] **Step 2: Build `/exam/[slug]`** — `generateStaticParams` returns every `EXAMS` slug × both langs. Sections per spec §5.2:
  1. Breadcrumb + H1 `"{Exam} {year}: free GK questions, PYQ & practice"` + intro from `examIntro(exam, lang, {chapters, papers})` + a facts list (conducting body, stages).
  2. **App card, above the fold** (`variant="hero"`, `playUrl(pkg,"exam-hub",slug)`); when no app matches, the category's general app; when the registry is absent, a plain Play link with no rating.
  3. Subjects for this exam from `topicsForExam`, with chapter and question counts.
  4. PYQ papers for this exam (matching `pyqSlug`), or a line saying papers are coming.
  5. Aptitude: `category === "bank"` → `/aptitude/bank` subjects; `category ∈ {ssc, railway}` → `/aptitude/ssc-railway` subjects; else omitted.
  6. Related exams in the same category.
  Ads: footer only.

- [ ] **Step 3: Delete the old exam pages**

```bash
git rm -r src/app/exam
```

- [ ] **Step 4: Verify**

Run: `npm run build && npx next start -p 3010 &`
```bash
curl -s http://localhost:3010/exam/rrb-ntpc | grep -c "Railway Recruitment Boards"
curl -s http://localhost:3010/exam/sbi-po | grep -c "aptitude/bank"
curl -s http://localhost:3010/hi/exam/rrb-ntpc | grep -c "रेलवे भर्ती बोर्ड"
curl -s http://localhost:3010/exam/rrb-ntpc | grep -c "FAQPage"
```
Expected: `1`, `1`, `1`, `0`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[lang]/exam"
git add -u
git commit -m "feat(exam): install-first exam hubs for all 82 exams, bilingual

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The shared set page and question renderer

**Model:** `fable`

**Files:**
- Create: `src/components/site/QuestionList.tsx`, `SetPager.tsx`, `ReportError.tsx`, `PracticeToggle.tsx`, `src/components/site/SetPageShell.tsx`
- Create: `src/app/api/report/route.ts` (proxy to the API worker so the browser never needs CORS)
- Test: `test/questionList.test.ts` (pure helpers only)

**Interfaces:**
- Produces:
  - `<QuestionList questions lang startNumber />` — server component; renders stem, four options with the correct one marked, `Answer` line, `Explanation` via `explanationBlocks` + `renderInlineMath`; supports both shapes: GK (`{q, options, answer:"A"-"D", explain}`) and aptitude (`{question, question_hi, options, options_hi, correct_index, solution_conventional(_hi), solution_shortcut(_hi), trap_warning(_hi)}`).
  - `normaliseQuestion(raw, lang)` → `{ stem, options, correctIndex, explanation, shortcut?, trap? }` — the pure function under test.
  - `<SetPageShell>` — breadcrumb, H1, practice toggle, questions with interleaved ads, pager, report link, end app card.
  - `POST /api/report` → forwards `{ key, questionNumber, note }` to `https://studyvirus-api.futurebanker11.workers.dev/api/report-question`.

- [ ] **Step 1: Write the failing test** `test/questionList.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseQuestion } from "../src/components/site/normaliseQuestion";

test("GK shape, English and Hindi", () => {
  const gk = { q: "Q?", options: ["a", "b", "c", "d"], answer: "C", explain: "• because" };
  const n = normaliseQuestion(gk, "en");
  assert.equal(n.stem, "Q?");
  assert.equal(n.correctIndex, 2);
  assert.equal(n.explanation, "• because");
});

test("aptitude shape prefers the requested language and exposes shortcut/trap", () => {
  const apt = {
    question: "EN?", question_hi: "HI?", options: ["1", "2", "3", "4"], options_hi: ["१", "२", "३", "४"],
    correct_index: 0, solution_conventional: "long", solution_conventional_hi: "लंबा",
    solution_shortcut: "fast", solution_shortcut_hi: "तेज़", trap_warning: "careful", trap_warning_hi: "सावधान",
  };
  const en = normaliseQuestion(apt, "en");
  assert.equal(en.stem, "EN?"); assert.equal(en.options[0], "1"); assert.equal(en.correctIndex, 0);
  assert.equal(en.explanation, "long"); assert.equal(en.shortcut, "fast"); assert.equal(en.trap, "careful");
  const hi = normaliseQuestion(apt, "hi");
  assert.equal(hi.stem, "HI?"); assert.equal(hi.options[0], "१"); assert.equal(hi.explanation, "लंबा");
});

test("an out-of-range or missing answer yields correctIndex -1, never a wrong mark", () => {
  assert.equal(normaliseQuestion({ q: "x", options: ["a"], answer: "Z", explain: "" }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ question: "x", options: ["a"], correct_index: 9 }, "en").correctIndex, -1);
});
```

- [ ] **Step 2: Run to verify failure** — module missing.

- [ ] **Step 3: Implement `src/components/site/normaliseQuestion.ts`**

```ts
import type { Lang } from "@/lib/i18n/lang";

export interface NormalisedQuestion {
  stem: string; options: string[]; correctIndex: number;
  explanation: string; shortcut?: string; trap?: string; id?: string;
}

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const arr = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x)) : []);
const pick = (r: Raw, en: string, hi: string, lang: Lang) => {
  const wanted = lang === "hi" ? str(r[hi]) : str(r[en]);
  return wanted || str(r[en]);
};

export function normaliseQuestion(raw: Raw, lang: Lang): NormalisedQuestion {
  const isApt = typeof raw.question === "string";
  const options = isApt
    ? (lang === "hi" && arr(raw.options_hi).length ? arr(raw.options_hi) : arr(raw.options))
    : arr(raw.options);

  let correctIndex = -1;
  if (isApt) {
    const ci = typeof raw.correct_index === "number" ? raw.correct_index : -1;
    correctIndex = ci >= 0 && ci < options.length ? ci : -1;
  } else {
    const a = str(raw.answer).trim().toUpperCase();
    const i = a.length === 1 ? a.charCodeAt(0) - 65 : -1;
    correctIndex = i >= 0 && i < options.length ? i : -1;
  }

  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    stem: isApt ? pick(raw, "question", "question_hi", lang) : str(raw.q),
    options,
    correctIndex,
    explanation: isApt ? pick(raw, "solution_conventional", "solution_conventional_hi", lang) : str(raw.explain),
    shortcut: isApt ? pick(raw, "solution_shortcut", "solution_shortcut_hi", lang) || undefined : undefined,
    trap: isApt ? pick(raw, "trap_warning", "trap_warning_hi", lang) || undefined : undefined,
  };
}
```

- [ ] **Step 4: Build the components** — `QuestionList` (server), `PracticeToggle` (client, toggles a `data-practice` attribute on a wrapper; CSS hides `.answer`/`.explanation` when set, so answers are always in the HTML), `SetPager`, `ReportError` (client form posting to `/api/report`), `SetPageShell` composing them with `placement("content")` ads after every 5th question, max 2 per page.

- [ ] **Step 5: Build the report proxy** `src/app/api/report/route.ts`

```ts
export const runtime = "edge";
const UPSTREAM = "https://studyvirus-api.futurebanker11.workers.dev/api/report-question";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.key !== "string") return Response.json({ ok: false }, { status: 400 });
  const res = await fetch(UPSTREAM, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: "web", key: body.key, question: body.questionNumber ?? null, note: String(body.note ?? "").slice(0, 1000) }),
  });
  return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
```

Before wiring it, confirm the upstream contract:
```bash
curl -s -X POST https://studyvirus-api.futurebanker11.workers.dev/api/report-question -H "content-type: application/json" -d '{"source":"web","key":"test","note":"plan smoke test"}' -o - -w "\n%{http_code}\n"
```
If it rejects the shape, read `~/Desktop/studyvirus-api/src/reports.js` and match the real field names; do not change the API.

- [ ] **Step 6: Run tests and build** — `npm test && npm run typecheck && npm run build` → pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/site "src/app/api/report/route.ts" test/questionList.test.ts
git commit -m "feat(set): shared question renderer for GK and aptitude shapes, practice toggle, error reports

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Topics — index, topic, chapter, set

**Model:** `opus`

**Files:**
- Create: `src/app/[lang]/topics/page.tsx`, `[slug]/page.tsx`, `[slug]/[chapter]/page.tsx`, `[slug]/[chapter]/[set]/page.tsx`, `src/lib/content/topicGroups.ts`
- Delete: `src/app/topics/`
- Modify: `next.config.mjs` (add the notes/oneliners/mock-tests 301s)

**Interfaces:**
- Consumes: Task 6 components, `loadTopics`, `visibleTopics`, `chaptersOf`, `findChapter`, `adjacentChapters`, `getJson`, `getSet`, `setRange`, `setCount`, `hasHindiSet`.
- Produces: `/topics`, `/topics/{subject}`, `/topics/{subject}/{chapter}`, `/topics/{subject}/{chapter}/set-N` and their `/hi/` twins.

- [ ] **Step 1: Create `topicGroups.ts`** — a `Record<string, "general" | "science" | "state" | "specialist">` keyed by topic key, with `general` as the default for unmapped keys. Group every state-GK topic (`bihar_gk`, `up_gk`, …) as `state`, physics/chemistry/biology as `science`, pedagogy/insurance/labour-law style topics as `specialist`.

- [ ] **Step 2: `/topics`** — the four groups, each a grid of subject cards with chapter and question counts from `chaptersOf`.

- [ ] **Step 3: `/topics/[slug]`** — `generateStaticParams` over `visibleTopics` × langs. Chapter list with counts and set counts, exams this subject serves (link to hubs), intro line.

- [ ] **Step 4: `/topics/[slug]/[chapter]`** — `generateStaticParams` over every chapter × langs. Intro, **all** sets as cards (`Set N · questions X–Y`), related chapters (prev/next), PYQ links for the top three exams of this subject, one app card. `hasHi` = `hasHindiCounts(chapter.enCount, chapter.hiCount)`.

- [ ] **Step 5: `/topics/[slug]/[chapter]/[set]`** — `dynamicParams = true`, `revalidate = 3600`, **no** `generateStaticParams` (5,413 × 2 pages would blow the build). Loads the chapter JSON, picks the language array, `getSet`, and renders `SetPageShell`.
  - **Tail redirect (spec §5.3):** if `n > setCount` and `setCount > 0`, `redirect(href(lang, ".../set-" + setCount), RedirectType.replace)` with a 301 — implemented via `permanentRedirect` from `next/navigation`.
  - For `lang === "hi"`, `notFound()` when the chapter has no complete Hindi array.

- [ ] **Step 6: Add the 301s to `next.config.mjs`**

Inside `redirects()`, **before** the existing WordPress rules:

```js
      // Notes and one-liners are Pro in the apps and are no longer published
      // on the site (spec §5.3).
      { source: "/topics/:subject/:chapter/notes", destination: "/topics/:subject/:chapter", permanent: true },
      { source: "/topics/:subject/:chapter/oneliners", destination: "/topics/:subject/:chapter", permanent: true },
      { source: "/hi/topics/:subject/:chapter/notes", destination: "/hi/topics/:subject/:chapter", permanent: true },
      { source: "/hi/topics/:subject/:chapter/oneliners", destination: "/hi/topics/:subject/:chapter", permanent: true },
      // The old mock-tests section is replaced by the exam hubs.
      { source: "/mock-tests", destination: "/exam", permanent: true },
      { source: "/mock-tests/:slug", destination: "/exam/:slug", permanent: true },
```

- [ ] **Step 7: Delete the old routes**

```bash
git rm -r src/app/topics src/app/mock-tests
```

- [ ] **Step 8: Verify**

Run: `npm run build && npx next start -p 3010 &`
```bash
curl -s http://localhost:3010/topics/history/indus-valley/set-1 | grep -c "Radiocarbon"
curl -s http://localhost:3010/hi/topics/history/indus-valley/set-1 | grep -c "रेडियोकार्बन"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/topics/history/indus-valley/set-7   # tail → 301
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/topics/history/indus-valley/notes    # → 301
curl -s http://localhost:3010/topics/history/indus-valley | grep -c "Set 6"
```
Expected: `1`, `1`, `301`, `301`, `1` (Indus Valley has 70 questions → 6 sets under the app rule).

- [ ] **Step 9: Commit**

```bash
git add "src/app/[lang]/topics" src/lib/content/topicGroups.ts next.config.mjs
git add -u
git commit -m "feat(topics): all sets published bilingually; notes/oneliners/mock-tests redirect

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: PYQ — index, exam, paper

**Model:** `sonnet`

**Files:**
- Create: `src/app/[lang]/pyq/page.tsx`, `[exam]/page.tsx`, `[exam]/[set]/page.tsx`
- Delete: `src/app/pyq/`

**Interfaces:** consumes `loadPyqExams`, `pyqSlug`, `papersOf`, `findPaper`, `pyqSlugOverrides`, Task 6 components.

- [ ] **Step 1: `/pyq`** — exams grouped by category with paper counts (all 70, not 13).
- [ ] **Step 2: `/pyq/[exam]`** — `generateStaticParams` over exams × langs; paper list with question counts; intro; app card at end.
- [ ] **Step 3: `/pyq/[exam]/[set]`** — `revalidate = 3600`, no static params; whole paper on one page (40 questions) via `SetPageShell`; `notFound()` for Hindi when the paper's `hi` is incomplete.
- [ ] **Step 4: Delete `src/app/pyq`** — `git rm -r src/app/pyq`
- [ ] **Step 5: Verify**

```bash
curl -s http://localhost:3010/pyq | grep -c "Bihar Police"
curl -s http://localhost:3010/pyq/rrb-ntpc/set-1 | grep -oc "<article" ; # ~40 question blocks
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/pyq/rrb-ntpc/set-99
```
Expected: `1`, a count near 40, `404`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[lang]/pyq"; git add -u
git commit -m "feat(pyq): all 70 exams and 2,232 papers published bilingually

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Aptitude — index, family, subject, chapter, set

**Model:** `opus`

**Files:**
- Create: `src/app/[lang]/aptitude/page.tsx`, `[family]/page.tsx`, `[family]/[subject]/page.tsx`, `[family]/[subject]/[chapter]/page.tsx`, `[family]/[subject]/[chapter]/[type]/[set]/page.tsx`
- Create: `src/lib/content/webMethod.ts`

**Interfaces:**
- `webMethod.ts`: `loadWebMethod(family, chapterId): Promise<{ formula_en, formula_hi, example_en, example_hi, mistakes_en: string[], mistakes_hi: string[] } | null>` via `keys.webMethod` — returns `null` when the authored file does not exist.

- [ ] **Step 1: `/aptitude`** — the two families as cards with their exam qualifiers and subject lists.
- [ ] **Step 2: `/aptitude/[family]`** — subjects with chapter and set counts.
- [ ] **Step 3: `/aptitude/[family]/[subject]`** — chapter list.
- [ ] **Step 4: `/aptitude/[family]/[subject]/[chapter]`** — the primary target. H1 `"{Chapter}: formula, shortcuts & practice questions for {family.examQualifier}"` when `loadWebMethod` returns a file, else `"{Chapter} practice questions for {family.examQualifier}"`. Then method/example/mistakes when present, then types → sets, then related chapters and the family's exam hubs.
- [ ] **Step 5: `/aptitude/[family]/[subject]/[chapter]/[type]/[set]`** — `revalidate = 3600`; renders via `SetPageShell`; solutions show conventional, then `Shortcut` when present, then the trap callout.
- [ ] **Step 6: Verify**

```bash
curl -s http://localhost:3010/aptitude/bank/quant/number-series/missing-term/set-1 | grep -c "katex"
curl -s http://localhost:3010/aptitude/ssc-railway/quant | grep -c "SSC CGL"
curl -s http://localhost:3010/aptitude/bank/quant/number-series/missing-term/set-1 | grep -c "VISUAL:"
```
Expected: `1` (LaTeX rendered), `1`, `0` (hints stripped).

- [ ] **Step 7: Commit**

```bash
git add "src/app/[lang]/aptitude" src/lib/content/webMethod.ts
git commit -m "feat(aptitude): method-first chapter pages and tier-1 sets for both families

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: English, current affairs, articles

**Model:** `opus`

**Files:**
- Create: `src/app/[lang]/english/**`, `src/app/[lang]/current-affairs/**`, `src/app/[lang]/articles/**`
- Delete: `src/app/english/`, `src/app/current-affairs/`, `src/app/articles/`

- [ ] **Step 1: English** — `/english` (the two sections), `/english/{section}/{chapter}`, `/english/{section}/{chapter}/set-N`, driven by `englishTopics`. Keep the existing section keys in URLs (`english_full`, `english_basic`) so current URLs do not move.
- [ ] **Step 2: Current affairs** — `/current-affairs` (this month + last 30 days), `/current-affairs/monthly/{YYYY_MM}` (spec §5.8: H1 with the month's question count, day list, **and the month's questions rendered inline**), `/current-affairs/daily/{YYYY_MM_DD}` (set template, `robots: noindex, follow` when `isStale`).
- [ ] **Step 3: Articles** — `/articles` (grouped by category), `/articles/{id}` rendering `paragraphs` with `type: "heading"` as `<h2>`; Hindi only when `articleHasHindi`.
- [ ] **Step 4: Delete the old routes** — `git rm -r src/app/english src/app/current-affairs src/app/articles`
- [ ] **Step 5: Verify**

```bash
curl -s http://localhost:3010/current-affairs/monthly/2026_09 | grep -c "September 2026"
curl -s http://localhost:3010/current-affairs/daily/2026_04_15 | grep -c "noindex"   # >90 days old
curl -s http://localhost:3010/english/english_full/idioms-phrases/set-1 | grep -c "Answer"
```
Expected: `1`, `1`, `1`.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[lang]/english" "src/app/[lang]/current-affairs" "src/app/[lang]/articles"; git add -u
git commit -m "feat(content): English sets, monthly CA compilations, articles — bilingual

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Apps directory

**Model:** `opus`

**Files:**
- Create: `src/app/[lang]/apps/page.tsx`, `src/app/[lang]/apps/[slug]/page.tsx`

**Interfaces:** consumes `loadAppsRegistry`, `appBySlug`, `EXAMS`, `EXAM_CATEGORIES`, `appPackageFor`, `softwareApplication`, `playUrl`, `placement("apps")`.

- [ ] **Step 1: `/apps`** — categories in home-page order; per app: icon, name, one-line description, rating when `ratingCount >= 5`, install button, and a "Practice on the site" link to `/exam/{slug}` (or `/topics` for general apps). When the registry is absent, render from `EXAMS` + `appPackageFor` with no ratings or screenshots and no `aggregateRating` schema.
- [ ] **Step 2: `/apps/[slug]`** — `generateStaticParams` from the registry (empty list is fine before the ops job runs). Sections per spec §5.10, `SoftwareApplication` JSON-LD, screenshots from R2 URLs, and a generated "app vs site" comparison table using the exam's real counts.
- [ ] **Step 3: Verify with and without a registry**

```bash
curl -s http://localhost:3010/apps | grep -c "Railway"
curl -s http://localhost:3010/apps | grep -c "aggregateRating"   # 0 until the ops job runs
```
Expected: `1`, `0`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[lang]/apps"
git commit -m "feat(apps): apps directory and per-app landing pages, registry-driven

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Static pages

**Model:** `sonnet`

**Files:**
- Create: `src/app/[lang]/{about,contact,terms,privacy-policy}/page.tsx`
- Delete: `src/app/{about,contact,terms,privacy-policy}/`

- [ ] **Step 1: About** — brand only, no person named (user decision). Cover: what the content is, that questions carry original explanations, that Hindi and English are both first-class, how to report an error, and the app portfolio. Include the real computed counts.
- [ ] **Step 2: Contact, Terms, Privacy policy** — port the existing copy into the new design, both languages, `placement("static")` so no ads.
- [ ] **Step 3: Delete the old ones** — `git rm -r src/app/about src/app/contact src/app/terms src/app/privacy-policy`
- [ ] **Step 4: Verify** — all four return 200 in both languages and contain no `adsbygoogle` slot markup.
- [ ] **Step 5: Commit**

```bash
git add "src/app/[lang]/about" "src/app/[lang]/contact" "src/app/[lang]/terms" "src/app/[lang]/privacy-policy"; git add -u
git commit -m "feat(static): about, contact, terms, privacy in the new design, ad-free

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Sitemap index and robots

**Model:** `fable`

**Files:**
- Rewrite: `src/app/sitemap.ts`
- Verify: `src/app/robots.ts`

**Interfaces:** consumes `sitemapIds`, `entriesFor`, `chunk` (Plan A Task 16) and every loader to build `SitemapData`.

- [ ] **Step 1: Implement `generateSitemaps` + `sitemap`**

```ts
import type { MetadataRoute } from "next";
import { loadTopics } from "@/lib/content/topics";
import { loadPyqExams } from "@/lib/content/pyq";
import { loadFamily, FAMILIES } from "@/lib/content/aptitude";
import { loadArticles } from "@/lib/content/articles";
import { loadAppsRegistry } from "@/lib/content/apps";
import { EXAMS } from "@/lib/exams";
import { sitemapIds, entriesFor, chunk, type SitemapData } from "@/lib/seo/sitemaps";

export const revalidate = 86400;

async function data(): Promise<SitemapData> {
  const [topics, pyqExams, articles, reg, ...families] = await Promise.all([
    loadTopics(), loadPyqExams(), loadArticles(), loadAppsRegistry(),
    ...FAMILIES.map((f) => loadFamily(f)),
  ]);
  return { topics, pyqExams, families, articles, exams: EXAMS, apps: reg?.apps ?? [], now: new Date() };
}

export async function generateSitemaps() {
  const ids = sitemapIds(await data());
  return ids.map((i) => ({ id: i.id }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const d = await data();
  const meta = sitemapIds(d).find((i) => i.id === id);
  if (!meta) return [];
  return chunk(entriesFor(meta.section, meta.lang, d))[meta.part] ?? [];
}
```

- [ ] **Step 2: Verify the index and a child**

Run: `npm run build && npx next start -p 3010 &`
```bash
curl -s http://localhost:3010/sitemap.xml | head -20
curl -s http://localhost:3010/sitemap/en-sets-0.xml | grep -c "<loc>"
curl -s http://localhost:3010/sitemap/hi-topics-0.xml | grep -c "/hi/topics/"
```
Expected: a `<sitemapindex>` listing every child; a large `<loc>` count on `en-sets-0`; a non-zero Hindi count. If Next serves children at a different path shape, use whatever `sitemap.xml` itself lists — that is the contract.

- [ ] **Step 3: Count the declared URLs against reality**

```bash
node -e "
const i=require('./src/generated/content-index.json');console.log('index totals',i.totals);
" 
curl -s http://localhost:3010/sitemap.xml | grep -c "<sitemap>"
```
Record both numbers in the commit body — this is the audit's headline metric (3,581 declared vs ~5,500–6,000 real).

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): sitemap index generated from the manifests, both languages

Declared URL count now equals the real page count by construction.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Post-build HTML lint

**Model:** `sonnet`

**Files:**
- Create: `scripts/lint-html.mjs`
- Modify: `package.json` (`build` runs it after `next build`)

- [ ] **Step 1: Write the linter** — walks `.next/server/app/**/*.html` and asserts, failing with the offending file list:
  1. No `"@type":"FAQPage"`, `"QAPage"` or `"Quiz"` anywhere.
  2. Every page with an `hreflang="hi-IN"` link also has `hreflang="en-IN"` and `x-default`, and every hreflang URL is absolute `https://studyvirus.com`.
  3. Every page has exactly one `<h1>`.
  4. No page contains `200,000+`, `India's #1`, or `10 Lakh+`.
  5. Every `BreadcrumbList` has `position` starting at 1.

- [ ] **Step 2: Wire it** — `"build": "node scripts/validate-content.mjs && next build && node scripts/lint-html.mjs"`, same for `cf:build`.
- [ ] **Step 3: Run** — `npm run build`. Fix any page the linter flags (it will catch leftovers from the old copy).
- [ ] **Step 4: Commit**

```bash
git add scripts/lint-html.mjs package.json
git commit -m "chore(seo): post-build HTML lint for forbidden schema, hreflang, superlatives

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Playwright smoke suite

**Model:** `opus`

**Files:**
- Create: `playwright.config.ts`, `test/e2e/site.spec.ts`
- Modify: `package.json` (`test:e2e`)

- [ ] **Step 1: Install** — `npm install --save-dev @playwright/test@^1.47.0 && npx playwright install chromium`
- [ ] **Step 2: Config** — `webServer: { command: "npm run preview", url: "http://localhost:8787", reuseExistingServer: true, timeout: 300000 }` so the suite runs against the **real Worker build**, not `next dev`.
- [ ] **Step 3: Spec** — for the ten routes in spec §10, with JavaScript disabled where relevant:
  - question text present in HTML,
  - `<html lang>` correct per language,
  - hreflang pair present and reciprocal (fetch the counterpart and assert it points back),
  - canonical is self,
  - `BreadcrumbList` present, forbidden types absent,
  - `/topics/x/y/notes` → 301, `/mock-tests` → 301, `/ssccgl` → 301 to `/exam/ssc-cgl`,
  - `/hi/...` of an English-only set → 404,
  - `/apps` renders without a registry.
- [ ] **Step 4: Run** — `npm run test:e2e` → all green.
- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts test/e2e package.json package-lock.json
git commit -m "test(e2e): Playwright smoke suite against the real Worker build

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Ship

**Model:** `fable`

- [ ] **Step 1: Full local gate**

Run: `npm test && npm run typecheck && npm run build && npm run test:e2e`
Expected: everything green. Do not proceed on a failure.

- [ ] **Step 2: Preview the Worker and check the binding**

```bash
npm run preview &
curl -s http://localhost:8787/api/_health/content
```
Expected: `{"source":"binding",...}`.

- [ ] **Step 3: Deploy**

Run: `npm run deploy`
Then verify live:
```bash
for u in / /hi /exam/rrb-ntpc /topics/history/indus-valley/set-1 /hi/topics/history/indus-valley/set-1 /pyq/rrb-ntpc/set-1 /apps /sitemap.xml /privacy/wbcs /.well-known/assetlinks.json; do
  printf "%-50s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' https://studyvirus.com$u)"
done
curl -s -o /dev/null -w "%{http_code}\n" https://studyvirus.com/ssccgl   # 301
```
Expected: 200s across the board, 301 for `/ssccgl`.

- [ ] **Step 4: Report the numbers**

Print the before/after: sitemap-declared URLs (was 3,581), indexable Hindi URLs (was 0), and the homepage question count (was a self-contradicting 200,000+ / 23K+).

- [ ] **Step 5: Commit any deploy-time fixes and tag**

```bash
git tag -a rebuild-v1 -m "Public site rebuild: bilingual, manifest-driven, free-content-only"
git push origin master --tags
```

---

## Self-review against the spec

- §3 retire portals + keep Play-linked pages → Tasks 1, 3. ✔
- §4.4 `/hi/` routing, `<html lang>`, hreflang → Tasks 3–12 via `buildAlternates`; enforced by Task 14. ✔
- §5.1 exam-first home → Task 4. §5.2 exam hubs incl. bank → Task 5. §5.3 topics + tail redirect + notes/oneliners 301 → Task 7. §5.4 PYQ all 70 → Task 8. §5.5 aptitude two families + method blocks → Task 9. §5.6 English → Task 10. §5.7 set template → Task 6. §5.8 CA monthly compilation → Task 10. §5.9 articles → Task 10. §5.10 apps → Task 11. §5.11 static → Task 12. ✔
- §6 ad/CTA rules → `placement()` used by every page; static pages ad-free (Task 12). ✔
- §7.3 install referrer on every Play link → Task 3 `AppCard` + Tasks 5, 11. ✔
- §8 sitemap index, redirects, robots → Tasks 7, 13. ✔
- §9 design system → Task 2. §10 tests → Tasks 6, 14, 15. §11 rollout → Task 16. ✔

Type consistency: `normaliseQuestion` (Task 6) is the only question adapter and is consumed by Tasks 7–10; `placement` returns the `AdSpot[]`/`InstallCta` union that `AdSlot` and `AppCard` accept; `SitemapData` (Plan A Task 16) is constructed once in Task 13 with exactly the loaders Plan A exports.
