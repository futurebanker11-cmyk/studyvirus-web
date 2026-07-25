import { NextResponse } from "next/server";
import { PLAYER_HTML } from "../playerHtml";

// SPA fallback for the CBT PLAYER — the React-Native app served under
// /bank/mock/*. The catalog (/bank, /bank/<exam>) is real Next.js pages; only
// the player hands off to the RN app:
//   /bank/mock/<paperId>            → instructions
//   /bank/mock/<paperId>/test       → player
//   /bank/mock/<paperId>/analysis   → analysis
//   /bank/mock/<paperId>/solutions  → solutions
//
// Returns the RN player HTML INLINE with 200 so the url stays /bank/mock/<id> —
// the RN Splash parses that url to forward to the right screen. NEVER redirects
// (a redirect drops the paperId → app boots with no deep link → lands on
// MockHub).
//
// ⛔ The HTML is a plain string constant imported from ../playerHtml.ts (which is
// generated from public/bank/player.html by the export/copy step). Earlier
// attempts all failed in the OpenNext Cloudflare Worker: readFile/readFileSync of
// process.cwd()/public has no fs at runtime; fetch('/bank/player.html') hit
// OpenNext's .html→extensionless 307 and threw 500. A bundled string has none of
// those hazards. ⚠ MUST regenerate playerHtml.ts after every RN web export so the
// hashed bundle filename inside it stays current.

export const dynamic = "force-static";

export async function GET() {
  return new NextResponse(PLAYER_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-frame-options": "DENY",
    },
  });
}
