// Deploy diagnostic: proves which transport the content loader actually used.
//
// In the deployed Worker this MUST report "binding". The site Worker and
// cdn.studyvirus.com sit on the same Cloudflare zone, and a same-zone
// Worker-to-Worker fetch fails — that is what broke the /bank catalog on
// 2026-08-08. If this ever reports "https" in production, the CONTENT R2
// binding is not reaching getCloudflareContext and content reads are running
// on a path that cannot work at the edge.
//
// ⛔ NOT under a folder named `_health`: Next.js treats a leading underscore as
// a private folder and excludes it from routing entirely, so the route silently
// 404s and the middleware's catch-all serves the homepage instead.
import { resolveBucket } from "@/lib/content/bucket";
import { loadTopics } from "@/lib/content/topics";
import { getIndex } from "@/lib/content/index";

export const dynamic = "force-dynamic";

export async function GET() {
  const bucket = await resolveBucket();
  const topics = await loadTopics();
  return Response.json({
    source: bucket ? "binding" : "https",
    topics: topics.length,
    indexGeneratedAt: getIndex().generatedAt,
  });
}
