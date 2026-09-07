// Manifest-driven topics. Everything a page lists comes from gk/topics.json
// gated by the content index (spec §4.2): a chapter whose file is not in the
// index does not exist as far as the site is concerned, and a topic with no
// such chapter is not listed.
import { getJson } from "./loader";
import { keys } from "./keys";
import { hasKey, counts } from "./index";
import { topicSlug, resolveChapterSlug } from "./slugs";
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

// The three English trees, largest first. `english` (gk/45-English Grammar) is
// live and the biggest of the three; it is not hidden in the manifest, so
// visibleTopics must exclude it by key or English would also list as an
// ordinary subject. scripts/validate-content.mjs mirrors this list.
export const ENGLISH_KEYS = ["english", "english_full", "english_basic"] as const;

const isEnglish = (t: ManifestTopic) => (ENGLISH_KEYS as readonly string[]).includes(t.key);

export async function loadTopics(): Promise<ManifestTopic[]> {
  const m = await getJson<{ topics: ManifestTopic[] }>(keys.topicsManifest());
  return m?.topics ?? [];
}

export function chaptersOf(topic: ManifestTopic): ChapterInfo[] {
  const out: ChapterInfo[] = [];
  const chapters = topic.chapters || [];
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const key = keys.chapterFile(topic.folder, chapter.file);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    // No indexed chapter carries `passageGroup`, so the plain 10/last-20 rule
    // applies and an array of the right length yields the exact set count
    // without reading the chapter file. The elements are empty objects rather
    // than holes only so the array types as `object[]` for setCount.
    out.push({
      topic, chapter, key,
      slug: resolveChapterSlug(chapter.en, chapter.file, i + 1),
      enCount: c[0], hiCount: c[1],
      sets: setCount(Array.from({ length: c[0] }, () => ({}))),
    });
  }
  return out;
}

function hasAnyChapter(t: ManifestTopic): boolean {
  return (t.chapters || []).some((c) => hasKey(keys.chapterFile(t.folder, c.file)));
}

export function visibleTopics(all: ManifestTopic[]): ManifestTopic[] {
  return all.filter((t) => !t.hiddenFromList && t.screen !== "CurrentAffairs" && !isEnglish(t) && hasAnyChapter(t));
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
