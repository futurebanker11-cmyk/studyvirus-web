// Per-section sitemap children (spec §10): /sitemap/<lang>-<section>-<part>.xml.
// Every URL comes from src/lib/seo/sitemaps.ts, whose generators walk the
// committed content index, so the declared URL count is the real page count
// by construction. Next's generateSitemaps emits only the children — the
// <sitemapindex> at /sitemap.xml is src/app/sitemap.xml/route.ts.
import type { MetadataRoute } from "next";
import { sitemapIds, entriesFor, chunk } from "@/lib/seo/sitemaps";
import { sitemapData } from "@/lib/sitemapData";

export const revalidate = 86400;

export async function generateSitemaps() {
  const ids = sitemapIds(await sitemapData());
  return ids.map((i) => ({ id: i.id }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const d = await sitemapData();
  const meta = sitemapIds(d).find((i) => i.id === id);
  if (!meta) return [];
  return chunk(entriesFor(meta.section, meta.lang, d))[meta.part] ?? [];
}
