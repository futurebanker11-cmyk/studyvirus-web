import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format, type T } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  loadArticles,
  findArticle,
  loadArticleBody,
  articleHasHindi,
  type ArticleBody,
  type ArticleMeta,
} from "@/lib/content/articles";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { EXAMS } from "@/lib/exams";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";
import Prose from "@/components/site/Prose";

/**
 * One article — prose, not a question set.
 *
 * ── Why this does not use SetPageShell ──
 *
 * Every part of that shell is about questions: the practice toggle hides
 * answers, the set pager walks sets, ReportError files a mistake against a
 * question. None of it applies to an essay. So this page is its own small
 * content-page shell: breadcrumb, H1, the paragraphs, one app card, and the
 * SAME placement("content") ad density every other content page has, so an
 * article is not a quieter page than a set page by accident.
 *
 * ── The body ──
 *
 * loadArticleBody() gives `paragraphs: {type?, en, hi?}[]`. `type: "heading"`
 * renders as <h2>; everything else as <p>. Verified live across the real
 * files: "heading" and undefined are the only two values present, so the
 * else-branch is a plain paragraph rather than a guess. Prose (Task 2) holds
 * the measure and the vertical rhythm — the h2/p spacing here is its job, not
 * this file's.
 *
 * The first paragraph is usually a heading repeating the title. It is dropped
 * rather than rendered, because an <h2> that restates the <h1> immediately
 * below it is a duplicate heading a crawler reads as a structural mistake.
 *
 * ── Hindi ──
 *
 * articleHasHindi(meta) — file-level, whole-article. The `hi` field is per
 * paragraph, so a partially translated article COULD be rendered half and
 * half; it is not, deliberately, matching the rule everywhere else in this
 * plan. An article missing any Hindi 404s under /hi/ rather than silently
 * dropping into English mid-page. All 127 are fully bilingual today.
 *
 * ── Static ──
 *
 * 127 articles × 2 languages = 254 prerendered routes, each one file read at
 * build time. Well within the plan's "small enough to prerender" line (PYQ's
 * 68 exams, aptitude's 119 chapters), and an article is exactly the kind of
 * page that should be static: it never changes between deploys.
 *
 * ── What is NOT rendered ──
 *
 * `views`. It is a hand-authored string in the index ("18.2K" on all 127),
 * not a computed count — see the /articles index comment. `readTime` is.
 *
 * No headers(), no cookies(), no <html>.
 */

const CATEGORY_LABEL: Record<string, T> = {
  strategy: "artCat.strategy",
  motivation: "artCat.motivation",
  syllabus: "artCat.syllabus",
  tips: "artCat.tips",
  success: "artCat.success",
};

interface Resolved {
  meta: ArticleMeta;
  body: ArticleBody;
}

async function resolve(lang: Lang, id: string): Promise<Resolved | null> {
  const list = await loadArticles();
  const meta = findArticle(list, id);
  if (!meta) return null;

  // Hindi only when the whole article is translated.
  if (lang === "hi" && !articleHasHindi(meta)) return null;

  const body = await loadArticleBody(meta);
  if (!body || !Array.isArray(body.paragraphs) || body.paragraphs.length === 0) return null;

  return { meta, body };
}

/**
 * The install card, when the registry has an app for an exam in this article's
 * tag category.
 *
 * `tag` on an article is an EXAM CATEGORY ("railway", "ssc", "police", …) or
 * the literal "all" — verified live: 98 of 127 are "all", the rest name a
 * category that matches Exam.category exactly. "all" has no one app to point
 * at, so it gets none.
 *
 * loadAppsRegistry() returns null in production today (apps/registry.json
 * 404s — Task 5 verified this, still true 2026-09-08), so the normal outcome
 * is no card at all. That is deliberate: AppCard needs a real AppEntry and
 * fabricating one would mean inventing a name, an icon and a rating.
 */
async function appFor(meta: ArticleMeta): Promise<AppEntry | null> {
  const tag = meta.tag;
  if (!tag || tag === "all") return null;

  const reg = await loadAppsRegistry();
  if (!reg) return null;

  for (const e of EXAMS) {
    if (e.category !== tag) continue;
    const app = appForExam(reg, e.id);
    if (app) return app;
  }
  return null;
}

/** The paragraphs to render, in this language, with the title echo dropped. */
function paragraphsOf(body: ArticleBody, meta: ArticleMeta, lang: Lang) {
  const title = lang === "hi" && meta.title_hi ? meta.title_hi : meta.title_en;

  return body.paragraphs
    .map((p) => ({
      heading: p.type === "heading",
      // `hi` is only reached when articleHasHindi already passed, so the
      // fallback is a type guard rather than a silent English leak.
      text: lang === "hi" ? (p.hi ?? p.en) : p.en,
    }))
    .filter((p, i) => {
      if (typeof p.text !== "string" || p.text.trim() === "") return false;
      // Drop a leading heading that just repeats the H1.
      if (i === 0 && p.heading && p.text.trim() === title.trim()) return false;
      return true;
    });
}

export async function generateStaticParams() {
  const list = await loadArticles();
  return LANGS.flatMap((lang) =>
    list
      // A Hindi route is only generated for a fully translated article; the
      // page 404s for the others, so prerendering them would build 404s.
      .filter((a) => lang === "en" || articleHasHindi(a))
      .map((a) => ({ lang, id: a.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang: raw, id } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, id);
  if (!r) return {};
  const { meta, body } = r;

  const title = lang === "hi" && meta.title_hi ? meta.title_hi : meta.title_en;
  const paras = paragraphsOf(body, meta, lang);
  // The article's own opening sentence as the description — the words the
  // writer chose, not a template. Clamped to a length a snippet will show.
  const first = paras.find((p) => !p.heading)?.text ?? "";
  const description = first.length > 300 ? `${first.slice(0, 297).trimEnd()}…` : first;

  return {
    title: `${title} | StudyVirus`,
    description: description || t(lang, "articles.lede"),
    alternates: buildAlternates({
      lang,
      path: `/articles/${meta.id}`,
      hasHi: articleHasHindi(meta),
    }),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: raw, id } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const r = await resolve(lang, id);
  if (!r) notFound();
  const { meta, body } = r;

  const title = lang === "hi" && meta.title_hi ? meta.title_hi : meta.title_en;
  const paras = paragraphsOf(body, meta, lang);
  const hasHi = articleHasHindi(meta);
  const categoryLabel = CATEGORY_LABEL[meta.category] ?? ("artCat.other" as T);
  const app = await appFor(meta);

  const ads = new Set(placement("content").ads);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.articles"), url: abs(href(lang, "/articles")) },
    { name: t(lang, categoryLabel), url: abs(href(lang, `/articles#c-${meta.category}`)) },
    { name: title, url: abs(href(lang, `/articles/${meta.id}`)) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-8 sm:pt-12">
        <nav aria-label={t(lang, "nav.articles")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/articles")} className="no-underline hover:underline">
            {t(lang, "nav.articles")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          {/* The category has no page of its own — /articles groups all five,
              each with an anchor — so the crumb points at that anchor. */}
          <Link
            href={href(lang, `/articles#c-${meta.category}`)}
            className="no-underline hover:underline"
          >
            {t(lang, categoryLabel)}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{title}</span>
        </nav>

        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl" lang={lang}>
          {title}
        </h1>

        {/* readTime only — never `views`; see the file comment. */}
        {meta.readTime ? (
          <p className="ui mt-3 text-sm text-ink-faint">
            {format(lang, "articles.readTime", { minutes: formatCount(meta.readTime, lang) })}
          </p>
        ) : null}

        <div className="ui mt-3">
          <LangLink lang={lang} path={`/articles/${meta.id}`} hasHi={hasHi} />
        </div>
      </Container>

      <Container as="article" width="read" className="pb-6">
        <Prose lang={lang}>
          {paras.map((p, i) =>
            p.heading ? (
              <h2 key={i} className="font-display font-semibold">
                {p.text}
              </h2>
            ) : (
              <p key={i}>{p.text}</p>
            ),
          )}
        </Prose>
      </Container>

      {/* One in-article unit, mid-prose position notwithstanding: this page has
          no per-question breaks to interleave, so the single unit sits after
          the article, ahead of the CTA. Ordinal 0 is required by AdSlot's
          discriminated union and there is only one unit on this page. */}
      {ads.has("in-article") && (
        <Container as="div" width="read">
          <AdSlot placement="in-article" ordinal={0} lang={lang} />
        </Container>
      )}

      <Container as="div" width="read" className="pb-10">
        {app && (
          <div className="mt-4">
            <AppCard app={app} lang={lang} variant="end" />
          </div>
        )}

        <div className="mt-8">
          <Link
            href={href(lang, "/articles")}
            className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
          >
            ← {t(lang, "articles.backToAll")}
          </Link>
        </div>
      </Container>

      {ads.has("sticky-bottom") && <AdSlot placement="sticky-bottom" lang={lang} />}
    </>
  );
}
