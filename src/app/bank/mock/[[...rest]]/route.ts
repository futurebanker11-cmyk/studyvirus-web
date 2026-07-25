import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SPA fallback for the CBT PLAYER — the React-Native app served under
// /bank/mock/*. The catalog (/bank, /bank/<exam>) is real Next.js pages; only
// the player hands off to the RN app:
//   /bank/mock/<paperId>            → instructions
//   /bank/mock/<paperId>/test       → player
//   /bank/mock/<paperId>/analysis   → analysis
//   /bank/mock/<paperId>/solutions  → solutions
// A hard refresh or shared link on any of those MUST return the RN player HTML
// INLINE so the url stays /bank/mock/<id> — the RN Splash parses that url to
// forward to the right screen. It must NEVER redirect to /bank/player.html:
// that drops the paperId, so the app booted with no deep link and fell through
// to MockHub (seen live: ATTEMPT → /bank/mocks, no player).
//
// ⛔ readFile(process.cwd()/public/...) does NOT work in the OpenNext Cloudflare
// Worker (no Node fs at runtime) — it always hit the redirect fallback. Instead
// FETCH player.html from the assets layer over HTTP (same origin) and return its
// body inline. Assets under /bank/_expo/** and /bank/assets/** are served by the
// assets layer directly and never reach this handler.
//
// Sign-in state is SHARED with the catalog pages automatically: same origin,
// same Firebase project ⇒ the player sees the account the catalog signed in.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Fetch the exported RN player shell from the assets layer (works in the
  // Worker). player.html doesn't map to any catalog route, so it can't be
  // fetched into a redirect loop.
  const assetUrl = new URL("/bank/player.html", request.nextUrl.origin);
  try {
    const res = await fetch(assetUrl.toString(), { headers: { accept: "text/html" } });
    if (res.ok) {
      const html = await res.text();
      return new NextResponse(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-frame-options": "DENY",
        },
      });
    }
  } catch { /* fall through */ }
  // Last resort: rewrite (NOT redirect) so the url is preserved. A 200 with the
  // asset served in place keeps /bank/mock/<id> intact for the RN Splash.
  return NextResponse.rewrite(assetUrl);
}
