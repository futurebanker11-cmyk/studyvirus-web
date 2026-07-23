import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// SPA fallback for the Bank mock app served at studyvirus.com/bank.
//
// The bank app is the React Native app exported for web (expo export, baseUrl
// '/bank'). It is a single-page app: react-navigation routes CLIENT-side, so a
// hard refresh or a shared deep link like /bank/mock/<paperId> must still be
// handed the one index.html — otherwise the host 404s.
//
// Why a route handler and not public/_redirects: this site runs on
// OpenNext/Cloudflare, where (per the /b/[code] route's own comment) a
// next.config rewrite to a public/ asset does NOT resolve through the assets
// layer. A real route handler does. Static assets under /bank/_expo/** and
// /bank/assets/** are served directly by the assets layer and never reach here.
//
// ⛔ /bank must ALSO be in middleware.ts KNOWN_ROUTES, or the middleware 301s it
// to /topics before this handler ever runs.

export const dynamic = "force-static";

// The exported shell is tiny (~1.2 KB) and references the hashed bundle. We read
// it once from public/bank/index.html. `nodejs_compat` is enabled (wrangler.jsonc)
// so node:fs works in the OpenNext Worker runtime; the result is cached per
// isolate so it is a single read, not per-request.
let cachedHtml: string | null = null;

async function loadIndex(): Promise<string | null> {
  if (cachedHtml) return cachedHtml;
  // Try the locations public/ resolves to across `next start` and the OpenNext
  // runtime. First hit wins; if none resolve we fall back to a redirect.
  const candidates = [
    path.join(process.cwd(), "public", "bank", "index.html"),
    path.join(process.cwd(), ".open-next", "assets", "bank", "index.html"),
  ];
  for (const p of candidates) {
    try {
      cachedHtml = await readFile(p, "utf8");
      return cachedHtml;
    } catch {
      /* try next */
    }
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
        // The shell changes only on redeploy; a short cache keeps navigation
        // snappy without pinning a stale build.
        "cache-control": "public, max-age=300",
        "x-frame-options": "DENY",
      },
    });
  }
  // Last resort: send the browser to the static file directly. The assets layer
  // serves /bank/index.html even when this handler cannot read it, so the app
  // still loads — only a client-route deep link would lose its path here, which
  // is an acceptable degradation over a hard failure.
  return NextResponse.redirect(
    new URL("/bank/index.html", "https://studyvirus.com"),
    307
  );
}
