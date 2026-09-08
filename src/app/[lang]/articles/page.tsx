import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format, type T } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadArticles, articleHasHindi, type ArticleMeta } from "@/lib/content/articles";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * The article index, grouped by category.
 *
 * ── The grouping is derived, not declared ──
 *
 * The categories come from the articles themselves, so a sixth category
 * appearing in gk/articles/index.json shows up here without a code change.
 * What IS declared is the DISPLAY LABEL for each, in strings.ts, because a
 * category needs real words in both languages and "syllabus" is not one —
 * exactly the pattern Task 8 used for pyqCat.*. Five real categories today
 * (verified live 2026-09-08): strategy 23, motivation 15, syllabus 54, tips
 * 31, success 4 — 127 articles.
 *
 * An unlabelled category falls back to artCat.other rather than rendering its
 * raw key at a reader, and ORDER is by article count, so the biggest section
 * is first rather than whatever order the index happened to list.
 *
 * ── What is NOT shown ──
 *
 * `views` ("18.2K" on every one of the 127 entries) is a hand-authored string
 * in the index, not a computed count — nothing increments it and nothing on
 * this site can verify it. The whole point of this rebuild is that every
 * number a reader sees is one they could check by counting the content, so a
 * written-in view count is precisely the defect class being removed and it is
 * not rendered anywhere. `readTime` IS shown: it is a small editorial estimate
 * in minutes, not a claim about live traffic.
 *
 * No headers(), no cookies(), no <html>. Statically generated in both
 * languages.
 */

/** Display label per category. Unknown categories fall back to artCat.other. */
const CATEGORY_LABEL: Record<string, T> = {
  strategy: "artCat.strategy",
  motivation: "artCat.motivation",
  syllabus: "artCat.syllabus",
  tips: "artCat.tips",
  success: "artCat.success",
};

interface Group {
  category: string;
  label: T;
  articles: ArticleMeta[];
}

/** Real articles, bucketed by their own category, biggest group first. */
function group(list: ArticleMeta[]): Group[] {
  const by = new Map<string, ArticleMeta[]>();
  for (const a of list) {
    const key = a.category || "other";
    if (!by.has(key)) by.set(key, []);
    by.get(key)!.push(a);
  }
  return Array.from(by, ([category, articles]) => ({
    category,
    label: CATEGORY_LABEL[category] ?? ("artCat.other" as T),
    articles,
  })).sort((a, b) => b.articles.length - a.articles.length);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const list = await loadArticles();

  return {
    title: `${format(lang, "articles.h1", { articles: formatCount(list.length, lang) })} | StudyVirus`,
    description: t(lang, "articles.lede"),
    alternates: buildAlternates({ lang, path: "/articles", hasHi: true }),
  };
}

export default async function ArticlesIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const all = await loadArticles();
  // On the Hindi index, only articles that actually have Hindi — their pages
  // 404 under /hi/ otherwise, and linking a reader to a 404 is worse than a
  // shorter list. Every one of the 127 qualifies today.
  const list = lang === "hi" ? all.filter((a) => articleHasHindi(a)) : all;
  const groups = group(list);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.articles"), url: abs(href(lang, "/articles")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.articles")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "nav.articles")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "articles.h1", { articles: formatCount(list.length, lang) })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "articles.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/articles" hasHi />
        </div>
      </Container>

      {groups.map((g) => (
        <Container key={g.category} as="section" aria-labelledby={`c-${g.category}`} className="pt-10">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 id={`c-${g.category}`} className="font-display text-2xl font-semibold">
              {t(lang, g.label)}
            </h2>
            <span className="ui text-sm text-ink-faint">
              {format(lang, "articles.categoryMeta", {
                articles: formatCount(g.articles.length, lang),
              })}
            </span>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={href(lang, `/articles/${a.id}`)}
                  className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
                >
                  <span className="font-display text-base font-semibold text-ink group-hover:underline">
                    {lang === "hi" && a.title_hi ? a.title_hi : a.title_en}
                  </span>
                  {/* readTime only. `views` is a hand-written string, not a
                      count — see the file comment. */}
                  {a.readTime ? (
                    <span className="ui mt-2 block text-xs text-ink-faint">
                      {format(lang, "articles.readTime", {
                        minutes: formatCount(a.readTime, lang),
                      })}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      ))}

      <div className="pb-12" />
    </>
  );
}
