import csv from "@/lib/content/assetlinks.csv";
import { parseAssetlinksCsv, assetlinks } from "@/lib/seo/assetlinks";

export const dynamic = "force-static";

export function GET() {
  const body = JSON.stringify(assetlinks(parseAssetlinksCsv(csv)));
  return new Response(body, { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
}
