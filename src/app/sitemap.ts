import { MetadataRoute } from "next";
import { getVisibleTopics, topicSlug, chapterSlug } from "@/lib/topics";
import { PYQ_EXAMS } from "@/lib/pyq";
import { EXAMS } from "@/lib/exams";
import { ENGLISH_SECTIONS, chapterSlugEn } from "@/lib/english";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://studyvirus.com";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/topics`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/pyq`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/mock-tests`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/articles`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/current-affairs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  // Topic pages
  const topicPages: MetadataRoute.Sitemap = [];
  for (const t of getVisibleTopics()) {
    const tSlug = topicSlug(t.key);
    topicPages.push({
      url: `${base}/topics/${tSlug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const ch of t.chapters) {
      const cSlug = chapterSlug(ch.en);
      // Chapter page (set selector)
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
      // Set pages (estimate 5 sets per chapter — Google discovers actual count via crawling)
      for (let s = 1; s <= 5; s++) {
        topicPages.push({
          url: `${base}/topics/${tSlug}/${cSlug}/set-${s}`,
          lastModified: now,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  // Notes and oneliners pages
  for (const t of getVisibleTopics()) {
    const tSlug = topicSlug(t.key);
    for (const ch of t.chapters) {
      const cSlug = chapterSlug(ch.en);
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}/notes`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
      topicPages.push({
        url: `${base}/topics/${tSlug}/${cSlug}/oneliners`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  // PYQ pages
  const pyqPages: MetadataRoute.Sitemap = [];
  for (const e of PYQ_EXAMS) {
    pyqPages.push({
      url: `${base}/pyq/${e.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
    for (let i = 1; i <= e.sets; i++) {
      pyqPages.push({
        url: `${base}/pyq/${e.slug}/set-${i}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  // Exam pages
  const examPages: MetadataRoute.Sitemap = [];
  examPages.push({ url: `${base}/exam`, lastModified: now, changeFrequency: "weekly", priority: 0.9 });
  for (const e of EXAMS) {
    examPages.push({
      url: `${base}/exam/${e.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // English pages
  const englishPages: MetadataRoute.Sitemap = [];
  englishPages.push({ url: `${base}/english`, lastModified: now, changeFrequency: "weekly", priority: 0.8 });
  for (const s of ENGLISH_SECTIONS) {
    for (const ch of s.chapters) {
      englishPages.push({
        url: `${base}/english/${s.key}/${chapterSlugEn(ch.en)}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    }
  }

  return [...staticPages, ...topicPages, ...pyqPages, ...examPages, ...englishPages];
}
