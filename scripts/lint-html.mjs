#!/usr/bin/env node
// Post-build HTML lint. Walks every generated page under .next/server/app and
// asserts five audit-driven rules (spec: 2026-09-07 Plan B, Task 14). This only
// runs after `next build` has produced .next/server/app/**/*.html — it is a
// genuine post-build check, not a pre-build one.
//
//   node scripts/lint-html.mjs
//
// On any violation, prints the offending file list (relative paths) per rule
// and exits 1. A linter that only warns defeats the point of wiring it into
// `build`, so every failure here is fatal.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const APP_DIR = join(ROOT, ".next", "server", "app");

const FORBIDDEN_TYPES = ["FAQPage", "QAPage", "Quiz"];
const FORBIDDEN_STRINGS = ["200,000+", "India's #1", "10 Lakh+"];
const SITE = "https://studyvirus.com";

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (entry.endsWith(".html")) out.push(p);
  }
  return out;
}

function rel(p) {
  return relative(ROOT, p).split("\\").join("/");
}

function main() {
  let files;
  try {
    files = walk(APP_DIR);
  } catch (e) {
    console.error(`lint-html: cannot walk ${rel(APP_DIR)} — did \`next build\` run first? (${e.message})`);
    process.exit(1);
  }
  if (files.length === 0) {
    console.error(`lint-html: no HTML files found under ${rel(APP_DIR)} — did \`next build\` run first?`);
    process.exit(1);
  }
  console.log(`lint-html: checking ${files.length} files under ${rel(APP_DIR)} …`);

  // rule -> [relative file paths]
  const violations = {
    forbiddenSchema: [],
    hreflang: [],
    h1Count: [],
    forbiddenStrings: [],
    breadcrumbPosition: [],
  };

  for (const abs of files) {
    const html = readFileSync(abs, "utf8");
    const r = rel(abs);

    // Rule 1: no dead JSON-LD types anywhere.
    for (const type of FORBIDDEN_TYPES) {
      if (html.includes(`"@type":"${type}"`)) {
        violations.forbiddenSchema.push(`${r} (found "@type":"${type}")`);
        break;
      }
    }

    // Rule 2: hreflang completeness + absolute URLs. Next renders the
    // attribute as `hrefLang` (camelCase) in the served HTML, so match
    // case-insensitively rather than the literal lowercase spelling. Parse
    // each matching <link ...> tag's attributes independently rather than
    // assuming a fixed attribute order.
    const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((tag) => /\bhreflang=/i.test(tag));
    if (linkTags.length > 0) {
      const langs = new Map(); // lang -> href
      for (const tag of linkTags) {
        const langMatch = /\bhreflang="([^"]*)"/i.exec(tag);
        const hrefMatch = /\bhref="([^"]*)"/i.exec(tag);
        if (langMatch) langs.set(langMatch[1], hrefMatch ? hrefMatch[1] : "");
      }
      const problems = [];
      if (langs.has("hi-IN")) {
        if (!langs.has("en-IN")) problems.push("missing en-IN");
        if (!langs.has("x-default")) problems.push("missing x-default");
      }
      for (const [lang, href] of langs) {
        if (!href.startsWith(SITE)) problems.push(`${lang} href not absolute (${SITE}...): "${href}"`);
      }
      if (problems.length > 0) violations.hreflang.push(`${r} (${problems.join("; ")})`);
    }

    // Rule 3: exactly one <h1>.
    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count !== 1) violations.h1Count.push(`${r} (found ${h1Count})`);

    // Rule 4: no self-contradicting-numbers superlatives.
    for (const s of FORBIDDEN_STRINGS) {
      if (html.includes(s)) {
        violations.forbiddenStrings.push(`${r} (found "${s}")`);
        break;
      }
    }

    // Rule 5: every BreadcrumbList's first position starts at 1.
    for (const m of html.matchAll(/"@type":"BreadcrumbList"[\s\S]{0,120}?"position":(\d+)/g)) {
      const first = Number(m[1]);
      if (first !== 1) {
        violations.breadcrumbPosition.push(`${r} (first position is ${first})`);
        break;
      }
    }
  }

  const rules = [
    ["1. Forbidden JSON-LD types (FAQPage/QAPage/Quiz)", violations.forbiddenSchema],
    ["2. hreflang completeness / absolute URLs", violations.hreflang],
    ["3. Exactly one <h1> per page", violations.h1Count],
    ["4. Forbidden superlative strings (200,000+ / India's #1 / 10 Lakh+)", violations.forbiddenStrings],
    ["5. BreadcrumbList position starts at 1", violations.breadcrumbPosition],
  ];

  let failed = false;
  for (const [label, list] of rules) {
    if (list.length > 0) {
      failed = true;
      console.error(`\nFAIL — Rule ${label} — ${list.length} file(s):`);
      list.slice(0, 50).forEach((f) => console.error(`  ${f}`));
      if (list.length > 50) console.error(`  … +${list.length - 50} more`);
    } else {
      console.log(`OK — Rule ${label} — 0 violations`);
    }
  }

  if (failed) {
    console.error(`\nlint-html: FAILED (${files.length} files checked)`);
    process.exit(1);
  }
  console.log(`\nlint-html: PASSED (${files.length} files checked)`);
}

main();
