import { MetadataRoute } from "next";
import { getVisibleTopics, topicSlug, chapterSlug } from "@/lib/topics";
import { PYQ_EXAMS } from "@/lib/pyq";
import { EXAMS } from "@/lib/exams";
import { ENGLISH_SECTIONS, chapterSlugEn } from "@/lib/english";
import { fetchArticleIndex } from "@/lib/api";

// Mock-test exam slugs (must match mock-tests/page.tsx)
const MOCK_EXAM_SLUGS = [
  "rrb-ntpc",
  "ssc-cgl",
  "ssc-gd",
  "delhi-police",
  "up-police",
  "bihar-police",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://studyvirus.com";
  const now = new Date();

  // Use a stable "last build" date instead of now() so Google sees meaningful lastmod
  const buildDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: buildDate, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/topics`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pyq`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/mock-tests`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/articles`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/current-affairs`, lastModified: buildDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/english`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.8 },
  ];

  // ── Topic pages ──
  const topicPages: MetadataRoute.Sitemap = [];
  for (const t of getVisibleTopics()) {
    const tSlug = topicSlug(t.key);
    topicPages.push({
      url: `${base}/topics/${tSlug}`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const ch of t.chapters) {
      const cSlug = chapterSlug(ch.en);
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.7,
      });
      // Set pages (estimate 5 sets per chapter)
      for (let s = 1; s <= 5; s++) {
        topicPages.push({
          url: `${base}/topics/${tSlug}/${cSlug}/set-${s}`,
          lastModified: buildDate,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
      // Notes and oneliners
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}/notes`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.5,
      });
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}/oneliners`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  // ── PYQ pages ──
  const pyqPages: MetadataRoute.Sitemap = [];
  for (const e of PYQ_EXAMS) {
    pyqPages.push({
      url: `${base}/pyq/${e.slug}`,
      lastModified: buildDate,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (let i = 1; i <= e.sets; i++) {
      pyqPages.push({
        url: `${base}/pyq/${e.slug}/set-${i}`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // ── Exam pages ──
  const examPages: MetadataRoute.Sitemap = [];
  examPages.push({ url: `${base}/exam`, lastModified: buildDate, changeFrequency: "weekly", priority: 0.9 });
  for (const e of EXAMS) {
    examPages.push({
      url: `${base}/exam/${e.slug}`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // ── English pages (including set pages) ──
  const englishPages: MetadataRoute.Sitemap = [];
  for (const s of ENGLISH_SECTIONS) {
    for (const ch of s.chapters) {
      const cSlug = chapterSlugEn(ch.en);
      englishPages.push({
        url: `${base}/english/${s.key}/${cSlug}`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.7,
      });
      // English set pages (estimate 5 sets per chapter)
      for (let i = 1; i <= 5; i++) {
        englishPages.push({
          url: `${base}/english/${s.key}/${cSlug}/set-${i}`,
          lastModified: buildDate,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  // ── Article pages ──
  const articlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = await fetchArticleIndex();
    for (const a of articles) {
      articlePages.push({
        url: `${base}/articles/${a.id}`,
        lastModified: buildDate,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  } catch {
    // If fetch fails, skip articles — static pages still work
  }

  // ── Mock-test pages ──
  const mockPages: MetadataRoute.Sitemap = [];
  for (const slug of MOCK_EXAM_SLUGS) {
    mockPages.push({
      url: `${base}/mock-tests/${slug}`,
      lastModified: buildDate,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  // ── Current affairs pages ──
  const caPages: MetadataRoute.Sitemap = [];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  // Monthly capsules (Jan to current month)
  for (let m = 0; m <= currentMonth; m++) {
    const mm = String(m + 1).padStart(2, "0");
    caPages.push({
      url: `${base}/current-affairs/monthly/${currentYear}_${mm}`,
      lastModified: buildDate,
      changeFrequency: m === currentMonth ? "daily" : "monthly",
      priority: 0.7,
    });
  }
  // Daily quizzes — last 30 days (April 2026 onwards)
  const caStartDate = new Date(2026, 3, 1); // April 2026 is when daily CA began
  for (let d = 0; d < 30; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    if (date >= caStartDate) {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      caPages.push({
        url: `${base}/current-affairs/daily/${currentYear}_${mm}_${dd}`,
        lastModified: buildDate,
        changeFrequency: "daily",
        priority: 0.6,
      });
    }
  }

  return [
    ...staticPages,
    ...topicPages,
    ...pyqPages,
    ...examPages,
    ...englishPages,
    ...articlePages,
    ...mockPages,
    ...caPages,
  ];
}
