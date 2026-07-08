# studyvirus.com on Cloudflare — deploy guide (2026-07-08)

Migrated off Vercel (Hobby plan paused: 1.3M/1M edge requests — a hard cap that
Cloudflare doesn't have). Setup: Next.js 14 + `@opennextjs/cloudflare@1.15.0`
(the newest adapter line that supports Next 14; upgrading to the latest adapter
requires Next ≥15).

## What was added to the repo
- `wrangler.jsonc` — Worker config (nodejs_compat, static assets from `.open-next/assets`)
- `open-next.config.ts` — adapter config (default; see ISR note below)
- `package.json` — `cf:build` / `preview` / `deploy` scripts
- `src/app/b/[code]/route.ts` — GK Battle invite landing page as a first-class
  route (a next.config rewrite into `public/` does not resolve through the
  OpenNext assets layer — do NOT convert this back to a rewrite)
- `src/middleware.ts` — `"b"` whitelisted so invites aren't treated as old WP URLs
- `.gitignore` — `.open-next/`, `.wrangler/`

Local test: `npm run preview` → serves the real Worker build on localhost:8787.
Verified 2026-07-08: homepage / SSG topic / dynamic quiz set / ads.txt /
app-ads.txt / sitemap / old-WP redirect / `/b/CODE` invite — all pass.

## One-time setup (~30 min + DNS wait)

### A. Create the Worker from GitHub
1. Sign up (free, no card): https://dash.cloudflare.com/sign-up
2. Sidebar → **Workers & Pages** → **Create** → **Workers** → **Import a repository**.
3. Connect GitHub `futurebanker11-cmyk` → pick **studyvirus-web** (branch `master`).
4. Build settings:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
5. **Save and Deploy** → first build takes several minutes → you get a
   `studyvirus-web.<your-subdomain>.workers.dev` URL. Open it and check the
   homepage + one quiz page before touching DNS.

### B. Move the domain
1. Cloudflare dashboard home → **Add a domain** → `studyvirus.com` → **Free** plan.
2. It scans/imports existing DNS records → Continue. **Delete** any old A /
   CNAME records for `studyvirus.com` / `www` that point at Vercel
   (`76.76.21.21` / `cname.vercel-dns.com`).
3. Cloudflare shows **two nameservers** (like `xxx.ns.cloudflare.com`).
4. At the domain registrar for studyvirus.com → DNS / Nameservers → replace
   the current nameservers with those two. Wait for Cloudflare's
   "site is active" email (minutes to a few hours).
5. Workers & Pages → studyvirus-web → **Settings → Domains & Routes** →
   **Add** → Custom domain → `studyvirus.com`. Add `www.studyvirus.com` the
   same way. Certificates are automatic.

### C. Verify after it's live
- https://studyvirus.com (homepage), one topic quiz page, one PYQ page
- https://studyvirus.com/ads.txt and /app-ads.txt (AdSense)
- https://studyvirus.com/b/ABC123?app=com.railwaygk.ntpc (battle invite page)
- Old WordPress URL redirect, e.g. /category/indian-history → /topics/history
- In Vercel: project Settings → Domains → remove studyvirus.com (cleanup only).

## Day-to-day
`git push` to master → Cloudflare builds and deploys automatically (same
workflow as Vercel). Manual deploy from this machine: `npm run deploy`
(needs `npx wrangler login` once).

## Limits & the ISR note
- Free tier: **unlimited static requests/bandwidth** (all prerendered pages +
  assets), **100k dynamic Worker requests/day** (pages not prerendered at
  build render on demand). Vercel-era usage (~37k dynamic/day) fits.
- ISR (`revalidate: 3600`) is a **no-op** in this setup: prerendered pages stay
  frozen until the next deploy; non-prerendered pages (e.g. new current-affairs
  dates) render fresh on every request. If true background revalidation is
  wanted later, enable R2 (needs a card on file; $0 within the 10 GB free
  allowance) and switch `open-next.config.ts` to the R2 incremental cache —
  the exact snippet is commented in that file.
- If dynamic traffic ever exceeds 100k/day: Workers Paid is $5/month for 10M
  requests/month — still 4× cheaper than Vercel Pro.
