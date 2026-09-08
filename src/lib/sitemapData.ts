// Assembles SitemapData (spec §10) from the content loaders. Shared by the
// sitemap index route (src/app/sitemap.xml/route.ts) and the per-section
// children (src/app/sitemap.ts) so both are built from the same snapshot shape.
import { loadTopics } from "@/lib/content/topics";
import { loadPyqExams } from "@/lib/content/pyq";
import { loadFamily, FAMILIES } from "@/lib/content/aptitude";
import { loadArticles } from "@/lib/content/articles";
import { loadAppsRegistry } from "@/lib/content/apps";
import { EXAMS } from "@/lib/exams";
import type { SitemapData } from "@/lib/seo/sitemaps";

export async function sitemapData(): Promise<SitemapData> {
  const [topics, pyqExams, articles, reg, ...families] = await Promise.all([
    loadTopics(), loadPyqExams(), loadArticles(), loadAppsRegistry(),
    ...FAMILIES.map((f) => loadFamily(f)),
  ]);
  return { topics, pyqExams, families, articles, exams: EXAMS, apps: reg?.apps ?? [], now: new Date() };
}
