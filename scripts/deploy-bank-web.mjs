#!/usr/bin/env node
// deploy-bank-web.mjs — the WHOLE bank-web deploy ritual in one command.
//
//   node scripts/deploy-bank-web.mjs          (from studyvirus-web/)
//
// Exists because the ritual has two landmines that were each hit in production
// on 2026-08-02 (twice for the second one):
//   1. public/bank/index.html left in place SHADOWS the App Router catalog.
//   2. src/app/bank/mock/playerHtml.ts is a build-time INLINE COPY of
//      player.html — forget to regenerate it and the deploy silently ships the
//      PREVIOUS bundle hash while the new bundle sits unused in _expo/.
// Steps: expo export (bank-apps) → copy into public/bank → drop _redirects →
// rename index.html→player.html → regenerate playerHtml.ts → verify hashes
// match → opennextjs deploy.
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const CMS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANK_APPS = 'C:/Users/manme/Desktop/bank-apps';
const DIST = path.join(BANK_APPS, 'dist-web');
const DST = path.join(CMS, 'public', 'bank');
// execFileSync with an ARGUMENT ARRAY (no shell string interpolation, so nothing
// here can be command-injected). On Windows npm is a .cmd shim, which recent Node
// refuses to spawn without a shell (spawnSync npm.cmd EINVAL) — so invoke the
// node-side npm-cli.js directly with the current node binary, which needs no shell
// on any platform.
const NPM_CLI = path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const run = (args, cwd) => (fs.existsSync(NPM_CLI)
  ? execFileSync(process.execPath, [NPM_CLI, ...args], { cwd, stdio: 'inherit', env: process.env })
  : execFileSync('npm', args, { cwd, stdio: 'inherit', env: process.env, shell: true }));

console.log('1/5 expo export (EXPO_WEB_BASE=/bank)…');
run(['run', 'export:web'], BANK_APPS); // cross-env handles the base url

console.log('2/5 copy → public/bank …');
fs.cpSync(DIST, DST, { recursive: true, force: true });
const redirects = path.join(DST, '_redirects');
if (fs.existsSync(redirects)) fs.rmSync(redirects);
const idx = path.join(DST, 'index.html');
if (fs.existsSync(idx)) fs.renameSync(idx, path.join(DST, 'player.html')); // ⛔ shadowing trap

console.log('3/5 regenerate playerHtml.ts …');
const html = fs.readFileSync(path.join(DST, 'player.html'), 'utf8');
fs.writeFileSync(path.join(CMS, 'src/app/bank/mock/playerHtml.ts'),
  '// AUTO-GENERATED from public/bank/player.html - do NOT edit by hand.\n' +
  '// Regenerate after every RN web export (scripts/deploy-bank-web.mjs does this).\n' +
  'export const PLAYER_HTML = ' + JSON.stringify(html) + ';\n');

console.log('4/5 verify hash agreement …');
const hash = (html.match(/index-[a-f0-9]+\.js/) || [])[0];
if (!hash) throw new Error('no bundle hash found in player.html');
if (!fs.existsSync(path.join(DST, '_expo/static/js/web', hash)))
  throw new Error(`player.html references ${hash} but the file is not in _expo`);
console.log('   bundle:', hash);

console.log('5/5 opennextjs deploy …');
run(['run', 'deploy'], CMS);
console.log(`\n✅ deployed. Verify: curl the player page and confirm it references ${hash}`);
console.log('   (force-static route sits behind a ~5-min cache — allow rollover before judging)');
