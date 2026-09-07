// Pure sitemap generators (spec §10). Every URL emitted here comes from a unit
// that is present in the committed content index: topics/chapters via
// chaptersOf, PYQ papers via papersOf, aptitude sets via setsOf, CA days via
// listDays, articles via articleHasHindi/loadArticles. The declared count is
// therefore the real page count by construction — nothing here reads a
// manifest count and trusts it.
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
import { keys } from "@/lib/content/keys";
import { hasKey, listDir, splitKey } from "@/lib/content/index";
import { href, LANGS, type Lang } from "@/lib/i18n/lang";
import { abs } from "@/lib/i18n/alternates";

export interface SitemapEntry { url: string; lastModified?: Date; changeFrequency?: "daily" | "weekly" | "monthly" | "yearly"; priority?: number }
export interface SitemapData { topics: ManifestTopic[]; pyqExams: PyqExam[]; families: AptFamilyInfo[]; articles: ArticleMeta[]; exams: Exam[]; apps: AppEntry[]; now: Date }

export const MAX_PER_SITEMAP = 45_000;
export const SECTIONS = ["static", "exams", "topics", "sets", "pyq", "aptitude", "english", "current-affairs", "articles", "apps"] as const;
export type SitemapSection = (typeof SECTIONS)[number];

const STATIC_PATHS = ["/", "/topics", "/pyq", "/aptitude", "/english", "/current-affairs", "/articles", "/exam", "/apps", "/about", "/contact", "/privacy-policy", "/terms"];

const e = (lang: Lang, path: string, changeFrequency: SitemapEntry["changeFrequency"], priority: number, now: Date): SitemapEntry =>
  ({ url: abs(href(lang, path)), lastModified: now, changeFrequency, priority });

// Hubs (topic, chapter, exam, family, month …) exist in both languages; a unit
// (set, paper, day, article) has a Hindi page only when its Hindi array is
// complete (spec §4.5), so Hindi sitemaps carry fewer units than English.
export function entriesFor(section: SitemapSection, lang: Lang, d: SitemapData): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  const hiOk = (en: number, hi: number) => lang === "en" || hasHindiCounts(en, hi);
  switch (section) {
    case "static":
      for (const p of STATIC_PATHS) out.push(e(lang, p, p === "/" ? "daily" : "weekly", p === "/" ? 1 : 0.6, d.now));
      break;
    case "exams":
      for (const x of d.exams) out.push(e(lang, `/exam/${x.slug}`, "weekly", 0.8, d.now));
      break;
    case "topics":
      out.push(e(lang, "/topics", "weekly", 0.9, d.now));
      for (const t of visibleTopics(d.topics)) {
        out.push(e(lang, `/topics/${topicSlug(t.key)}`, "weekly", 0.8, d.now));
        // c.slug is resolveChapterSlug's output: Devanagari-only names fall
        // back to the file number instead of slugging to "".
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
      // The section segment is the topic KEY (english, english_full,
      // english_basic), not topicSlug(key): those are the URLs already indexed.
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
      // loadArticles already drops unindexed files, but the guarantee must not
      // depend on who built SitemapData: re-check the index here like every
      // other unit does.
      for (const a of d.articles) {
        if (!hasKey(keys.article(a.file))) continue;
        if (lang === "en" || articleHasHindi(a)) out.push(e(lang, `/articles/${a.id}`, "monthly", 0.6, d.now));
      }
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

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Config/index drift check carried over from Task 9. `papersOf` iterates
 * 1..exam.sets, so a paper file the index holds at a HIGHER number exists on
 * the CDN but can never be published or declared until the config's `sets` is
 * raised. One line per such file; empty when the config covers every file.
 * Reporting only — the config stays authoritative for what is released.
 */
export function pyqDriftReport(pyqExams: PyqExam[]): string[] {
  const out: string[] = [];
  for (const exam of pyqExams) {
    // The directory is derived from the same key builder papersOf uses.
    const [dir] = splitKey(keys.pyqPaper(exam.prefix, 1));
    const re = new RegExp(`^${escapeRe(exam.prefix)}(\\d+)\\.json$`);
    for (const file of listDir(dir)) {
      const m = re.exec(file);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (n > exam.sets) out.push(`${exam.id}: ${dir}/${file} is paper ${n} but pyq-config sets=${exam.sets}; it exists but will never be published`);
    }
  }
  return out;
}
