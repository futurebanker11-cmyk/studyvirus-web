#!/usr/bin/env node
// deploy-cbt-web.mjs — stage (and optionally deploy) the ONE shared CBT bundle
// that serves every portal (/<slug>/mock/*), replacing the per-exam ritual in
// deploy-ssc-web.mjs (2026-08-18).
//
//   node scripts/deploy-cbt-web.mjs             export + stage
//   node scripts/deploy-cbt-web.mjs --deploy    …and deploy the site
//   node scripts/deploy-cbt-web.mjs --no-export reuse rrb-ntpc-gk/dist-web as-is
//
// Steps: (1) `npm run export:web` in rrb-ntpc-gk (base /cbt)  (2) copy dist-web →
// public/cbt, index.html → player.html  (3) regenerate the ONE playerHtml.ts under
// src/app/[sscexam]/mock  (4) regenerate src/lib/gkApps.ts (slugs, dirs, firebase)
// (5) verify the html references the bundle actually copied  (6) deploy.
//
// The two landmines from the per-exam script still apply: public/cbt/index.html
// would shadow nothing (no page lives at /cbt) but is renamed anyway for parity;
// playerHtml.ts is a build-time INLINE COPY and MUST be regenerated per export.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RN_APP = 'C:/Users/manme/Desktop/rrb-ntpc-gk';
const DIST = path.join(RN_APP, 'dist-web');
const DST = path.join(WEB, 'public', 'cbt');
const ROUTE_DIR = path.join(WEB, 'src', 'app', '[sscexam]', 'mock');
const args = process.argv.slice(2);
const DO_DEPLOY = args.includes('--deploy');
const NO_EXPORT = args.includes('--no-export');

const NPM_CLI = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const run = (a, cwd) => (fs.existsSync(NPM_CLI)
  ? execFileSync(process.execPath, [NPM_CLI, ...a], { cwd, stdio: 'inherit', env: process.env })
  : execFileSync('npm', a, { cwd, stdio: 'inherit', env: process.env, shell: true }));

if (!NO_EXPORT) {
  console.log('1/6 expo export (base /cbt) …');
  run(['run', 'export:web'], RN_APP);
} else {
  console.log('1/6 export skipped (--no-export)');
}
if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('dist-web/index.html missing');

console.log('2/6 copy → public/cbt …');
fs.rmSync(DST, { recursive: true, force: true });
fs.cpSync(DIST, DST, { recursive: true, force: true });
for (const f of ['_redirects']) { const p = path.join(DST, f); if (fs.existsSync(p)) fs.rmSync(p); }
const idx = path.join(DST, 'index.html');
if (fs.existsSync(idx)) fs.renameSync(idx, path.join(DST, 'player.html'));

console.log('3/6 playerHtml.ts …');
const html = fs.readFileSync(path.join(DST, 'player.html'), 'utf8');
fs.mkdirSync(ROUTE_DIR, { recursive: true });
fs.writeFileSync(path.join(ROUTE_DIR, 'playerHtml.ts'),
  '// AUTO-GENERATED from public/cbt/player.html — do NOT edit by hand.\n' +
  '// Regenerate after every RN web export (scripts/deploy-cbt-web.mjs does this).\n' +
  'export const PLAYER_HTML = ' + JSON.stringify(html) + ';\n');

console.log('4/6 gkApps.ts (slugs, manifest dirs, firebase) …');
execFileSync(process.execPath, [path.join(RN_APP, 'scripts', 'gen-web-registry.js'), '--site', path.join(WEB, 'src', 'lib', 'gkApps.ts')],
  { cwd: RN_APP, stdio: 'inherit' });

console.log('5/6 verify …');
const hash = (html.match(/index-[a-f0-9]+\.js/) || [])[0];
if (!hash) throw new Error('no bundle hash found in player.html');
if (!fs.existsSync(path.join(DST, '_expo/static/js/web', hash))) throw new Error(`player.html references ${hash} but that file is not in public/cbt/_expo`);
if (!html.includes('/cbt/')) throw new Error('player.html does not reference /cbt/ — the baseUrl did not bake in');
console.log('   bundle:', hash);

if (!DO_DEPLOY) {
  console.log('\nStaged. public/cbt/ + src/app/[sscexam]/mock/ + src/lib/gkApps.ts are ready.');
  console.log('Re-run with --deploy (or `npm run deploy`) to publish.');
  process.exit(0);
}
console.log('6/6 opennextjs deploy …');
run(['run', 'deploy'], WEB);
console.log(`\n✅ deployed. Verify https://studyvirus.com/<slug>/mock/<paperId> references ${hash}`);
