import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// SPA fallback for the CBT PLAYER — the React-Native app served under
// /bank/mock/*. The catalog (/bank, /bank/<exam>) is now real Next.js pages;
// only the player hands off to the RN app:
//   /bank/mock/<paperId>            → instructions
//   /bank/mock/<paperId>/test       → player
//   /bank/mock/<paperId>/analysis   → analysis
//   /bank/mock/<paperId>/solutions  → solutions
// A hard refresh or shared link on any of those must serve the exported
// index.html (react-navigation routes client-side). Static assets under
// /bank/_expo/** and /bank/assets/** are served by the assets layer directly.
//
// Sign-in state is SHARED with the catalog pages automatically: same origin,
// same Firebase project ⇒ the player sees the account the catalog signed in.

export const dynamic = "force-static";

let cachedHtml: string | null = null;

async function loadIndex(): Promise<string | null> {
  if (cachedHtml) return cachedHtml;
  const candidates = [
    path.join(process.cwd(), "public", "bank", "index.html"),
    path.join(process.cwd(), ".open-next", "assets", "bank", "index.html"),
  ];
  for (const p of candidates) {
    try {
      cachedHtml = await readFile(p, "utf8");
      return cachedHtml;
    } catch { /* try next */ }
  }
  return null;
}

export async function GET() {
  const html = await loadIndex();
  if (html) {
    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
        "x-frame-options": "DENY",
      },
    });
  }
  return NextResponse.redirect(new URL("/bank/index.html", "https://studyvirus.com"), 307);
}
