import { NextResponse } from "next/server";
import { PLAYER_HTML } from "../playerHtml";
import { PORTAL_SLUGS } from "@/lib/gkApps";

// SPA fallback for the CBT PLAYER — the ONE React-Native web bundle (public/cbt)
// served under EVERY portal's /<slug>/mock/*. The landing page (/<slug>) is a
// real Next.js page; only the player hands off to the RN app:
//   /<slug>/mock/<paperId>        → instructions
//   /<slug>/mock/<paperId>/test   → player
//
// Returns the RN html INLINE with 200 so the url stays /<slug>/mock/<id> — the
// RN Splash parses that url to reach the right screen, and config/webAppOverlay
// reads the <slug> to become the right app. NEVER redirects: a redirect drops
// the paperId and the app boots with no deep link.
//
// ⛔ The html is a bundled STRING (playerHtml.ts, generated from
// public/cbt/player.html by scripts/deploy-cbt-web.mjs). In the OpenNext
// Cloudflare Worker there is no fs at runtime and fetch('/cbt/player.html')
// hits OpenNext's .html→extensionless 307 and 500s. It MUST be regenerated after
// every export or it serves the previous bundle hash.
// ⛔ force-DYNAMIC, not force-static: under the dynamic [sscexam] segment the
// prerendered variant of this handler never materialised on OpenNext/Cloudflare
// (every /<slug>/mock/* answered the site 404 — 2026-08-18). Rendering per
// request costs nothing here (it returns a string) and the cache-control header
// still lets the edge hold it. Unknown slugs 404 so a typo never boots the app.
export const dynamic = "force-dynamic";
const KNOWN = new Set(PORTAL_SLUGS);

export async function GET(_req: Request, ctx: { params: Promise<{ sscexam: string }> }) {
  const { sscexam } = await ctx.params;
  if (!KNOWN.has(sscexam)) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(PLAYER_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
