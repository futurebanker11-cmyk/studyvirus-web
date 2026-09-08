import { defineConfig } from "@playwright/test";

/**
 * Smoke suite for the ten routes in spec §10.
 *
 * ── Why `npm run preview` and not `next dev`/`next start` ──
 *
 * The whole point of this suite is to exercise the REAL Cloudflare Worker
 * build. `next dev` and `next start` run the Node.js runtime, where
 * `process.env.NEXT_RUNTIME === "nodejs"` — and src/lib/content/loader.ts
 * deliberately behaves DIFFERENTLY there: under Node it treats an R2 miss as
 * "nothing seeded locally" and falls back to fetching from cdn.studyvirus.com,
 * whereas in the real Worker a miss is authoritative. Testing against `next
 * start` would therefore verify a code path that never runs in production and
 * would silently hide exactly the class of bug this suite exists to catch.
 *
 * `npm run preview` is `npm run cf:build && opennextjs-cloudflare preview`, so
 * starting the server also re-runs content validation (which checks ~8k files
 * against the CDN) and the post-build HTML lint. That is intentional but slow:
 * hence the 300s timeout, and `reuseExistingServer` so an already-running
 * preview on :8787 is reused instead of paying that cost on every run.
 *
 * ── The local-R2 caveat ──
 *
 * `opennextjs-cloudflare preview` runs wrangler/miniflare with a LOCAL R2
 * simulation. Unless the CONTENT binding is pointed at the real
 * `studyvirus-content` bucket (remote bindings, which need Cloudflare
 * credentials), that local bucket is EMPTY — and because the Worker runtime
 * treats a miss as authoritative, content pages will legitimately 404 rather
 * than falling back to the CDN. The content assertions below are therefore
 * only meaningful against a preview server whose CONTENT binding resolves to
 * real data. See the task 15 report for the specifics.
 */
export default defineConfig({
  testDir: "./test/e2e",
  // These are read-only smoke checks against one shared server; running them
  // in parallel is safe and keeps the suite far cheaper than the build itself.
  fullyParallel: true,
  // A flake here means a real routing/rendering problem, not a timing one —
  // retrying would only mask it.
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8787",
    // Individual tests opt into `javaScriptEnabled: false` where the point is
    // proving server-rendered content is crawlable without JS.
    trace: "off",
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:8787",
    reuseExistingServer: true,
    // `cf:build` validates ~8k content files over the network and then runs a
    // full OpenNext build before the server even starts listening.
    timeout: 300_000,
  },
});
