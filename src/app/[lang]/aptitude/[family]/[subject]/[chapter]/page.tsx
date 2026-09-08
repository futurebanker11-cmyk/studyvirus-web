import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { stripVisualHints } from "@/lib/ui/format";
import { formatCount } from "@/lib/content/stats";
import {
  FAMILIES,
  loadFamily,
  findSubject,
  findAptChapter,
  setsOf,
  subjectSlug,
  chapterSlug,
  typeSlug,
  type AptChapter,
  type AptFamilyInfo,
  type AptSetInfo,
  type AptSubject,
  type AptType,
  type AptitudeFamily,
} from "@/lib/content/aptitude";
import { loadWebMethod, type WebMethod } from "@/lib/content/webMethod";
import { hasHindiCounts } from "@/lib/content/hindi";
import { EXAMS } from "@/lib/exams";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";
import Math from "@/components/site/Math";

/**
 * A chapter — the primary SEO target of the aptitude section.
 *
 * The page a reader searching "profit and loss shortcut tricks" should land
 * on: the method, a worked example, the mistakes that cost marks, then every
 * question type with its practice sets, then where to go next.
 *
 * ── Two H1s, and why the unused one is still real code ──
 *
 * When loadWebMethod() returns an authored note the H1 leads with the method:
 * "{Chapter}: formula, shortcuts & practice questions for {exams}". Otherwise
 * it is the plain "{Chapter} practice questions for {exams}".
 *
 * NO web-method file exists in production today — every one of the 119
 * chapters' keys was checked live on 2026-09-08 and all 404 — so the plain H1
 * is what every real chapter renders right now and the method-first branch is
 * unexercised by live content. It is written and tested anyway (against a
 * fixture, in test/webMethod.test.ts): the notes are authored chapter by
 * chapter as the section grows, and a branch that is only written the day the
 * first file lands is a branch nobody has ever run.
 *
 * ── Why the sets are links, not questions ──
 *
 * A chapter can carry hundreds of sets (bank/quant/number-series alone has 80
 * across four types). Rendering the questions here would make one enormous
 * page and would compete with the set pages that already rank for them. The
 * chapter lists types → sets as links; the set page owns the questions.
 *
 * ── Static ──
 *
 * generateStaticParams enumerates every real chapter of every real subject of
 * both families × both languages — 119 × 2 today, derived live, never written
 * down. Each one is a fixed list of links computed from the content index with
 * no per-set file read, so the build cost is small. Its CHILDREN (the sets)
 * are the opposite case and render on demand.
 *
 * loadWebMethod is one content read per chapter page, and it is the only one:
 * it returns null fast on the miss that is today's normal answer.
 *
 * No headers(), no cookies(), no <html>.
 */

const isFamily = (x: string): x is AptitudeFamily =>
  (FAMILIES as readonly string[]).includes(x);

interface TypeCard {
  type: AptType;
  slug: string;
  sets: AptSetInfo[];
}

interface Ctx {
  info: AptFamilyInfo;
  subject: AptSubject;
  chapter: AptChapter;
  types: TypeCard[];
  sets: number;
  questions: number;
  /** True only when EVERY set in the chapter has Hindi for every question. */
  hasHi: boolean;
}

async function resolve(family: string, subject: string, chapter: string): Promise<Ctx | null> {
  if (!isFamily(family)) return null;
  const info = await loadFamily(family);
  const subj = findSubject(info, subject);
  if (!subj) return null;
  const chap = findAptChapter(subj, chapter);
  if (!chap) return null;

  const types: TypeCard[] = [];
  let sets = 0;
  let questions = 0;
  // hasHindiCounts is the spec §4.5 rule applied per set, then ANDed across
  // the chapter: the chapter's Hindi page is honest only when every set it
  // links has a Hindi page to link to. Aptitude content stores both languages
  // on each question object rather than in {en:[],hi:[]} file-level arrays, so
  // the pre-scanned [enCount, hiCount] pair on AptSetInfo is the right proxy —
  // hasHindiSet() expects the GK/PYQ file shape and must not be used here.
  let hasHi = true;
  for (const ty of chap.types) {
    const list = setsOf(info.family, subj, chap, ty);
    if (list.length === 0) continue;
    types.push({ type: ty, slug: typeSlug(ty), sets: list });
    for (const st of list) {
      sets += 1;
      questions += st.enCount;
      if (!hasHindiCounts(st.enCount, st.hiCount)) hasHi = false;
    }
  }
  if (types.length === 0) return null;

  return { info, subject: subj, chapter: chap, types, sets, questions, hasHi };
}

/**
 * The exam hubs this family's aptitude is for, at most four.
 *
 * The inverse of the exam hub's own familyFor() (src/app/[lang]/exam/[slug]),
 * which maps EXAMS[].category → aptitude family: bank → "bank", ssc and
 * railway → "ssc-railway". Reusing that one mapping rather than inventing a
 * second keeps the two directions of the cross-link consistent — an exam whose
 * hub links here is an exam this page links back to.
 *
 * A nice-to-have cross-link, not the page's job: it is capped so the section
 * stays a handful of chips rather than a second navigation tree. The cap is
 * taken per category, round-robin, before flattening — EXAMS lists every
 * railway exam before any ssc exam (src/lib/exams.ts), so a plain filter+
 * slice(0,4) on ssc-railway silently returned four railway exams and zero ssc
 * ones, contradicting this family's own H1 ("...for SSC CGL, CHSL, MTS &
 * RRB NTPC, Group D") on all 44 ssc-railway chapter pages (Task 9 review,
 * 2026-09-08). Interleaving keeps both categories of a two-category family
 * represented regardless of EXAMS' internal ordering.
 */
function examLinks(family: AptitudeFamily, lang: Lang) {
  const cats = family === "bank" ? ["bank"] : ["ssc", "railway"];
  const byCategory = cats.map((cat) => EXAMS.filter((e) => e.category === cat));
  const interleaved: typeof EXAMS = [];
  for (let i = 0; interleaved.length < 4 && byCategory.some((list) => i < list.length); i++) {
    for (const list of byCategory) {
      if (list[i]) interleaved.push(list[i]);
    }
  }
  return interleaved.slice(0, 4).map((e) => ({
    href: href(lang, `/exam/${e.slug}`),
    name: lang === "hi" ? e.hi : e.en,
    icon: e.icon,
  }));
}

/** The chapters either side of this one, in manifest (teaching) order. */
function nearbyChapters(subject: AptSubject, chapter: AptChapter): AptChapter[] {
  const i = subject.chapters.findIndex((c) => c.id === chapter.id);
  if (i < 0) return [];
  return [subject.chapters[i - 1], subject.chapters[i + 1]].filter(
    (c): c is AptChapter => Boolean(c),
  );
}

// stripVisualHints: web-method files are hand-authored for this page alone,
// but an author copying a passage from the app question bank could paste a
// 📊 [VISUAL:...] / DATA: line meant for the Android renderer. QuestionList's
// explanation text is stripped via explanationBlocks() before it ever reaches
// <Math>; this is the one other place in the diff that renders free text
// through <Math>, so it needs the same guard applied directly (Task 9 review,
// 2026-09-08).
const methodFormula = (m: WebMethod, lang: Lang) =>
  stripVisualHints(lang === "hi" ? m.formula_hi : m.formula_en);
const methodExample = (m: WebMethod, lang: Lang) =>
  stripVisualHints(lang === "hi" ? m.example_hi : m.example_en);
const methodMistakes = (m: WebMethod, lang: Lang) =>
  (lang === "hi" ? m.mistakes_hi : m.mistakes_en).map(stripVisualHints);

/** The H1, which is also the tab title — one string, computed once. */
function heading(lang: Lang, chapterName: string, exams: string, method: WebMethod | null) {
  return method
    ? format(lang, "aptChapter.h1Method", { chapter: chapterName, exams })
    : format(lang, "aptChapter.h1Plain", { chapter: chapterName, exams });
}

export async function generateStaticParams() {
  const infos = await Promise.all(FAMILIES.map((f) => loadFamily(f)));
  return LANGS.flatMap((lang) =>
    infos.flatMap((info) =>
      info.subjects.flatMap((s) =>
        s.chapters.map((c) => ({
          lang,
          family: info.slug,
          subject: subjectSlug(s),
          chapter: chapterSlug(c),
        })),
      ),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; family: string; subject: string; chapter: string }>;
}): Promise<Metadata> {
  const { lang: raw, family, subject, chapter } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const ctx = await resolve(family, subject, chapter);
  if (!ctx) return {};

  const method = await loadWebMethod(ctx.info.family, ctx.chapter.id);
  const chapterName = lang === "hi" ? ctx.chapter.name.hi : ctx.chapter.name.en;
  const exams = lang === "hi" ? ctx.info.examQualifier.hi : ctx.info.examQualifier.en;

  return {
    title: `${heading(lang, chapterName, exams, method)} | StudyVirus`,
    description: format(lang, "aptChapter.lede", {
      sets: formatCount(ctx.sets, lang),
      questions: formatCount(ctx.questions, lang),
      chapter: chapterName,
    }),
    alternates: buildAlternates({
      lang,
      path: `/aptitude/${family}/${subject}/${chapter}`,
      hasHi: ctx.hasHi,
    }),
  };
}

export default async function AptitudeChapterPage({
  params,
}: {
  params: Promise<{ lang: string; family: string; subject: string; chapter: string }>;
}) {
  const { lang: raw, family, subject, chapter } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const ctx = await resolve(family, subject, chapter);
  if (!ctx) notFound();

  const method = await loadWebMethod(ctx.info.family, ctx.chapter.id);

  const chapterName = lang === "hi" ? ctx.chapter.name.hi : ctx.chapter.name.en;
  const subjectName = lang === "hi" ? ctx.subject.name.hi : ctx.subject.name.en;
  const familyName = lang === "hi" ? ctx.info.name.hi : ctx.info.name.en;
  const exams = lang === "hi" ? ctx.info.examQualifier.hi : ctx.info.examQualifier.en;

  const base = `/aptitude/${family}/${subject}`;
  const self = `${base}/${chapter}`;
  const nearby = nearbyChapters(ctx.subject, ctx.chapter);
  const hubs = examLinks(ctx.info.family, lang);

  const mistakes = method ? methodMistakes(method, lang) : [];
  const example = method ? methodExample(method, lang) : "";

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.aptitude"), url: abs(href(lang, "/aptitude")) },
    { name: familyName, url: abs(href(lang, `/aptitude/${family}`)) },
    { name: subjectName, url: abs(href(lang, base)) },
    { name: chapterName, url: abs(href(lang, self)) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.aptitude")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/aptitude")} className="no-underline hover:underline">
            {t(lang, "nav.aptitude")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, `/aptitude/${family}`)} className="no-underline hover:underline">
            {familyName}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, base)} className="no-underline hover:underline">
            {subjectName}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{chapterName}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {ctx.chapter.emoji && (
            <span aria-hidden="true" className="mr-2">
              {ctx.chapter.emoji}
            </span>
          )}
          {heading(lang, chapterName, exams, method)}
        </h1>

        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "aptChapter.lede", {
            sets: formatCount(ctx.sets, lang),
            questions: formatCount(ctx.questions, lang),
            chapter: chapterName,
          })}
        </p>

        {/* LangLink renders nothing when hasHi is false, so the note beside it
            is what tells a reader why there is no Hindi link — an absent
            control with no explanation reads as a bug (Task 7's rule). */}
        <div className="ui mt-4">
          <LangLink lang={lang} path={self} hasHi={ctx.hasHi} />
          {!ctx.hasHi && (
            <span className="text-sm text-ink-faint">{t(lang, "aptChapter.hindiPartial")}</span>
          )}
        </div>
      </Container>

      {/* ── The method ──
          Rendered only when a web-method file is actually authored for this
          chapter. Every section inside is guarded separately: a note may carry
          a formula and no example yet. <Math> renders any $…$ in the authored
          text server-side; it is the only component that imports the KaTeX
          stylesheet, and it is not re-implemented here. */}
      {method && (
        <Container as="section" width="read" aria-labelledby="method" className="pt-10">
          <h2 id="method" className="font-display text-2xl font-semibold">
            {t(lang, "aptChapter.formulaHeading")}
          </h2>
          <div className="mt-3 rounded-lg border border-line bg-surface p-4 text-[1.02rem] leading-relaxed">
            <Math text={methodFormula(method, lang)} />
          </div>

          {example && (
            <>
              <h2 className="mt-8 font-display text-2xl font-semibold">
                {t(lang, "aptChapter.exampleHeading")}
              </h2>
              <div className="mt-3 leading-relaxed">
                <Math text={example} />
              </div>
            </>
          )}

          {mistakes.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-2xl font-semibold">
                {t(lang, "aptChapter.mistakesHeading")}
              </h2>
              <ul className="mt-3 space-y-2">
                {mistakes.map((m, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                    <span aria-hidden="true" className="select-none text-warn">
                      !
                    </span>
                    <Math text={m} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </Container>
      )}

      {/* ── Question types, and the sets under each ──
          Every set, not a first page: each is a real, crawlable page, and a
          chapter that hides set 21 onward hides it from search too. */}
      <Container as="section" aria-labelledby="types" className="pt-12">
        <h2 id="types" className="font-display text-2xl font-semibold">
          {t(lang, "aptChapter.typesHeading")}
        </h2>

        <div className="mt-5 space-y-8">
          {ctx.types.map((ty) => (
            <section key={ty.type.id} aria-labelledby={`ty-${ty.slug}`}>
              <h3 id={`ty-${ty.slug}`} className="font-display text-lg font-semibold">
                {lang === "hi" ? ty.type.name.hi : ty.type.name.en}
              </h3>
              <p className="ui mt-0.5 text-xs text-ink-faint">
                {format(lang, "aptChapter.typeMeta", { sets: formatCount(ty.sets.length, lang) })}
              </p>

              <ul className="ui mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
                {ty.sets.map((st) => (
                  <li key={st.n}>
                    <Link
                      href={href(lang, `${self}/${ty.slug}/set-${st.n}`)}
                      className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-line bg-surface p-3 no-underline hover:border-line-strong"
                    >
                      <span className="font-display text-base font-semibold text-ink group-hover:underline">
                        {t(lang, "common.set")} {formatCount(st.n, lang)}
                      </span>
                      <span className="text-xs text-ink-faint">
                        {formatCount(st.enCount, lang)} {t(lang, "common.questions")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>

      {/* ── Nearby chapters in the same subject ── */}
      {nearby.length > 0 && (
        <Container as="section" aria-labelledby="nearby" className="pt-12">
          <h2 id="nearby" className="font-display text-2xl font-semibold">
            {t(lang, "aptChapter.relatedHeading")}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {nearby.map((c) => (
              <li key={c.id}>
                <Link
                  href={href(lang, `${base}/${chapterSlug(c)}`)}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {lang === "hi" ? c.name.hi : c.name.en}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── The exam hubs this family's aptitude is for ── */}
      {hubs.length > 0 && (
        <Container as="section" aria-labelledby="hubs" className="pt-12">
          <h2 id="hubs" className="font-display text-2xl font-semibold">
            {t(lang, "aptChapter.examsHeading")}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {hubs.map((h) => (
              <li key={h.href}>
                <Link
                  href={h.href}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  <span aria-hidden="true">{h.icon}</span>
                  {h.name}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="pt-10">
        <Link
          href={href(lang, base)}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {subjectName}
        </Link>
      </Container>

      <div className="pb-12" />
    </>
  );
}
