// Sitemap index. Next 14's generateSitemaps (src/app/sitemap.ts) serves the
// children at /sitemap/<id>.xml but never writes the <sitemapindex> itself, so
// without this route /sitemap.xml — the URL robots.txt advertises — is a 404.
// The child list comes from the same sitemapIds() the children are served
// from, so the index can never name a child that does not exist.
import { sitemapIds } from "@/lib/seo/sitemaps";
import { sitemapData } from "@/lib/sitemapData";
import { abs } from "@/lib/i18n/alternates";

export const revalidate = 86400;

export async function GET() {
  const d = await sitemapData();
  const lastmod = d.now.toISOString();
  const items = sitemapIds(d)
    .map((i) => `<sitemap><loc>${abs(`/sitemap/${i.id}.xml`)}</loc><lastmod>${lastmod}</lastmod></sitemap>`)
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
  return new Response(body, { headers: { "content-type": "application/xml", "cache-control": "public, max-age=3600" } });
}
