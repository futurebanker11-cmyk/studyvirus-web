#!/usr/bin/env node
// deploy-ssc-web.mjs — the SSC/RRB web-portal deploy ritual, per exam.
//
//   node scripts/deploy-ssc-web.mjs ssccgl            (export + stage)
//   node scripts/deploy-ssc-web.mjs ssccgl --deploy   (…and deploy the site)
//   node scripts/deploy-ssc-web.mjs --stage-only ssccgl
//
// Mirrors scripts/deploy-bank-web.mjs, which exists because the ritual has two
// landmines that were each hit in production:
//   1. public/<slug>/index.html left in place SHADOWS the App Router landing
//      page — the RN app would render instead of the SEO page.
//   2. playerHtml.ts is a build-time INLINE COPY of player.html. Forget to
//      regenerate it and the deploy silently ships the PREVIOUS bundle hash
//      while the new bundle sits unused in _expo/.
//
// ⛔ The RN export reads APP_CONFIG.examId to choose its slug, so the rrb-ntpc-gk
// checkout must already be configured for the exam you pass. This script
// verifies that rather than trusting it — building SSC CGL and staging it as
// /rrbntpc would serve the wrong paper set under the wrong name.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RN_APP = 'C:/Users/manme/Desktop/rrb-ntpc-gk';
const DIST = path.join(RN_APP, 'dist-web');

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const DO_DEPLOY = args.includes('--deploy');

const KNOWN = ['ssccgl', 'sscchsl', 'ssccpo', 'sscmts', 'sscgd',
  'rrbntpc', 'rrbgroupd', 'rrbalp', 'rpf'];
if (!slug || !KNOWN.includes(slug)) {
  console.error('Usage: node scripts/deploy-ssc-web.mjs <slug> [--deploy]');
  console.error('  slugs: ' + KNOWN.join(', '));
  process.exit(1);
}

const DST = path.join(WEB, 'public', slug);
const ROUTE_DIR = path.join(WEB, 'src', 'app', slug, 'mock');

// npm on Windows is a .cmd shim that recent Node refuses to spawn without a
// shell; invoke npm-cli.js with the current node binary instead (no shell, so
// nothing here can be command-injected).
const NPM_CLI = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const run = (a, cwd) => (fs.existsSync(NPM_CLI)
  ? execFileSync(process.execPath, [NPM_CLI, ...a], { cwd, stdio: 'inherit', env: process.env })
  : execFileSync('npm', a, { cwd, stdio: 'inherit', env: process.env, shell: true }));

// ── 0. the RN checkout must be configured for THIS exam ─────────────────────
const cfg = fs.readFileSync(path.join(RN_APP, 'config/appConfig.js'), 'utf8');
const examId = (cfg.match(/examId\s*:\s*"([^"]+)"/) || [])[1];
const linkSrc = fs.readFileSync(path.join(RN_APP, 'src/navigation/webLinking.js'), 'utf8');
const mapBody = linkSrc.slice(linkSrc.indexOf('export const WEB_SLUGS'),
  linkSrc.indexOf('};', linkSrc.indexOf('export const WEB_SLUGS')));
const SLUGS = {};
for (const m of mapBody.matchAll(/(\w+)\s*:\s*'([^']+)'/g)) SLUGS[m[1]] = m[2];

if (SLUGS[examId] !== slug) {
  console.error(`\n⛔ The RN checkout is configured as "${examId}" (slug ${SLUGS[examId] || 'none'}),`);
  console.error(`   but you asked to stage "${slug}".`);
  console.error(`   Point rrb-ntpc-gk/config/appConfig.js at the right exam first —`);
  console.error(`   staging the wrong build serves the wrong paper set under the wrong name.`);
  process.exit(1);
}
console.log(`app ${examId} → /${slug}`);

console.log('1/5 expo export …');
run(['run', 'export:web'], RN_APP);

console.log(`2/5 copy → public/${slug} …`);
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(DIST, DST, { recursive: true, force: true });
const redirects = path.join(DST, '_redirects');
if (fs.existsSync(redirects)) fs.rmSync(redirects);
// ⛔ SHADOWING TRAP: public/<slug>/index.html is served in preference to the
// App Router page, so the RN app would replace the SEO landing page.
const idx = path.join(DST, 'index.html');
if (fs.existsSync(idx)) fs.renameSync(idx, path.join(DST, 'player.html'));

console.log('3/5 generate the player route + playerHtml.ts …');
const html = fs.readFileSync(path.join(DST, 'player.html'), 'utf8');
fs.mkdirSync(path.join(ROUTE_DIR, '[[...rest]]'), { recursive: true });
fs.writeFileSync(path.join(ROUTE_DIR, 'playerHtml.ts'),
  `// AUTO-GENERATED from public/${slug}/player.html — do NOT edit by hand.\n` +
  `// Regenerate after every RN web export (scripts/deploy-ssc-web.mjs does this).\n` +
  'export const PLAYER_HTML = ' + JSON.stringify(html) + ';\n');

fs.writeFileSync(path.join(ROUTE_DIR, '[[...rest]]', 'route.ts'),
  `import { NextResponse } from "next/server";\n` +
  `import { PLAYER_HTML } from "../playerHtml";\n\n` +
  `// SPA fallback for the CBT PLAYER — the React-Native app under /${slug}/mock/*.\n` +
  `// The landing page (/${slug}) is a real Next.js page; only the player hands off\n` +
  `// to the RN app:\n` +
  `//   /${slug}/mock/<paperId>        → instructions\n` +
  `//   /${slug}/mock/<paperId>/test   → player\n` +
  `//\n` +
  `// Returns the RN html INLINE with 200 so the url stays /${slug}/mock/<id> — the\n` +
  `// RN Splash parses that url to reach the right screen. NEVER redirects: a\n` +
  `// redirect drops the paperId and the app boots with no deep link.\n` +
  `//\n` +
  `// ⛔ The html is a bundled STRING, not a file read. In the OpenNext Cloudflare\n` +
  `// Worker there is no fs at runtime (readFile of process.cwd()/public fails) and\n` +
  `// fetch('/${slug}/player.html') hits OpenNext's .html→extensionless 307 and 500s.\n` +
  `// A bundled string has neither hazard — but it MUST be regenerated after every\n` +
  `// export or it serves the previous bundle hash.\n` +
  `export const dynamic = "force-static";\n\n` +
  `export async function GET() {\n` +
  `  return new NextResponse(PLAYER_HTML, {\n` +
  `    status: 200,\n` +
  `    headers: {\n` +
  `      "content-type": "text/html; charset=utf-8",\n` +
  `      "cache-control": "public, max-age=300",\n` +
  `    },\n` +
  `  });\n` +
  `}\n`);

console.log('4/5 verify hash agreement …');
const hash = (html.match(/index-[a-f0-9]+\.js/) || [])[0];
if (!hash) throw new Error('no bundle hash found in player.html');
if (!fs.existsSync(path.join(DST, '_expo/static/js/web', hash))) {
  throw new Error(`player.html references ${hash} but that file is not in _expo`);
}
// The exported html must also carry THIS slug's base path.
if (!html.includes(`/${slug}/`)) {
  throw new Error(`player.html does not reference /${slug}/ — the baseUrl did not bake in`);
}
console.log('   bundle:', hash);

if (!DO_DEPLOY) {
  console.log(`\nStaged. public/${slug}/ + src/app/${slug}/mock/ are ready.`);
  console.log('Re-run with --deploy (or run `npm run deploy`) to publish.');
  process.exit(0);
}

console.log('5/5 opennextjs deploy …');
run(['run', 'deploy'], WEB);
console.log(`\n✅ deployed. Verify https://studyvirus.com/${slug} and confirm the player references ${hash}`);
console.log('   (force-static sits behind a ~5-min cache — allow rollover before judging)');
