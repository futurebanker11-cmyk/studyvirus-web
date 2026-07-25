import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// SPA fallback for the CBT PLAYER — the React-Native app served under
// /bank/mock/*. The catalog (/bank, /bank/<exam>) is real Next.js pages; only
// the player hands off to the RN app:
//   /bank/mock/<paperId>            → instructions
//   /bank/mock/<paperId>/test       → player
//   /bank/mock/<paperId>/analysis   → analysis
//   /bank/mock/<paperId>/solutions  → solutions
//
// This MUST return the RN player HTML INLINE with 200 so the url stays
// /bank/mock/<id> — the RN Splash parses that url to forward to the right
// screen. It must NEVER redirect: a redirect drops the paperId, the app boots
// with no deep link, and lands on MockHub (/bank/mocks) instead of the mock.
//
// ⛔ The HTML is built ONCE AT MODULE-LOAD (during `next build`, where Node fs
// works) into a constant, then served from memory at Worker runtime. Earlier
// attempts failed at runtime: readFile(process.cwd()/...) has no fs in the
// OpenNext Worker → hit a redirect; fetch('/bank/player.html') hit OpenNext's
// .html→extensionless 307 → threw 500. Building the string at compile time
// avoids all runtime fs/fetch/redirect hazards.

export const dynamic = "force-static";

// Resolve the hashed RN bundle filename at build time and inline a minimal shell.
function buildPlayerHtml(): string {
  const PUB = path.join(process.cwd(), "public", "bank");
  // Prefer the exported player.html verbatim if present (keeps expo's reset css).
  for (const name of ["player.html", "index.html"]) {
    try {
      return readFileSync(path.join(PUB, name), "utf8");
    } catch { /* try next */ }
  }
  // Fallback: hand-build the shell, discovering the bundle hash from disk.
  let bundle = "/bank/_expo/static/js/web/index.js";
  try {
    const dir = path.join(PUB, "_expo", "static", "js", "web");
    const js = readdirSync(dir).find((f) => f.startsWith("index-") && f.endsWith(".js"));
    if (js) bundle = `/bank/_expo/static/js/web/${js}`;
  } catch { /* keep default */ }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>` +
    `<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>` +
    `<title>BankPrep Mock Tests</title>` +
    `<style>html,body{height:100%}body{overflow:hidden;margin:0}#root{display:flex;height:100%;flex:1}</style>` +
    `<link rel="icon" href="/bank/favicon.ico"/></head>` +
    `<body><div id="root"></div><script src="${bundle}" defer></script></body></html>`;
}

const PLAYER_HTML = buildPlayerHtml();

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
