import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadAppsRegistry, type AppEntry, type AppsRegistry } from "../src/lib/content/apps";
import { groupApps, synthesise } from "../src/app/[lang]/apps/page";
import { generateStaticParams } from "../src/app/[lang]/apps/[slug]/page";
import { EXAMS } from "../src/lib/exams";
import { appPackageFor } from "../src/lib/content/examFacts";
import { softwareApplication } from "../src/lib/seo/jsonld";

/**
 * The apps directory has two rendering paths and only one of them can be
 * exercised against production, because apps/registry.json does not exist:
 * the CDN returns 404 and the ops job that will write it (spec §7.1) is in a
 * repo that has not been started. So:
 *
 *   - the FALLBACK path is tested against the real EXAMS data, because that
 *     is the path the site actually ships on today;
 *   - the REGISTRY path is tested against a hand-authored fixture through the
 *     same __setBucketResolver seam test/apps.test.ts already uses, because
 *     that is the only way to know it is correct before Plan C ever runs.
 *
 * The three exams with no companion app (aissee_sainik, rsmssb,
 * agriculture_supervisor) are the load-bearing case in the fallback path: an
 * install button with no package behind it is worse than no card at all.
 */

/**
 * A plausible registry, shaped to prove the three things that can only go
 * wrong on the registry path:
 *
 *   ntpc     ratingCount 1200 → the rating is real and must be shown
 *   ssc-gd   ratingCount 3    → below the gate; no rating, no aggregateRating
 *   gk-daily no examId        → a general app; links to /topics, not a hub
 */
const FIXTURE: AppsRegistry = {
  generatedAt: "2026-09-08T00:00:00Z",
  apps: [
    {
      package: "com.railwaygk.ntpc",
      slug: "rrb-ntpc",
      examId: "rrb_ntpc",
      name: "RRB NTPC GK 2026",
      description: "Practice questions for RRB NTPC.",
      rating: 4.6,
      ratingCount: 1200,
      installs: "50,000+",
      icon: "https://cdn.studyvirus.com/apps/com.railwaygk.ntpc/icon.webp",
      screenshots: ["https://cdn.studyvirus.com/apps/com.railwaygk.ntpc/shot-1.webp"],
      category: "railway",
    },
    {
      package: "com.railwaygk.sscgd",
      slug: "ssc-gd",
      examId: "ssc_gd",
      name: "SSC GD Constable GK",
      description: "Practice questions for SSC GD.",
      rating: 5,
      ratingCount: 3,
      screenshots: [],
      category: "ssc",
    },
    {
      package: "com.studyvirus.gkdaily",
      slug: "gk-daily",
      name: "Daily GK Quiz",
      description: "A general knowledge quiz every day.",
      screenshots: [],
    },
  ],
};

const bucketWith = (json: string | null) =>
  __setBucketResolver(async () => ({
    async get(key: string) {
      if (key !== "apps/registry.json" || json === null) return null;
      return { text: async () => json };
    },
  }));

beforeEach(() => {
  __clearMemo();
});

// ── The path production is on today ──────────────────────────────────────────

test("no registry: every rendered app has a real package, and the three app-less exams are dropped", () => {
  const groups = groupApps(null, "en");
  const all = groups.flatMap((g) => g.apps);

  // Nothing is rendered without a package behind it.
  for (const app of all) {
    assert.ok(app.package.length > 0, `${app.slug} has no package`);
  }

  // The three exams with no app appear nowhere at all.
  for (const id of ["aissee_sainik", "rsmssb", "agriculture_supervisor"]) {
    assert.equal(appPackageFor(id), null, `${id} unexpectedly gained a package`);
    assert.equal(
      all.some((a) => a.examId === id),
      false,
      `${id} has no app but was rendered anyway`,
    );
  }

  // And the count is exactly the exams that do have one.
  const expected = EXAMS.filter((e) => appPackageFor(e.id) !== null).length;
  assert.equal(all.length, expected);
  assert.equal(expected, EXAMS.length - 3);
});

test("no registry: a synthesised entry claims no rating, no icon and no screenshots", () => {
  const ntpc = EXAMS.find((e) => e.id === "rrb_ntpc");
  assert.ok(ntpc);
  const entry = synthesise(ntpc, appPackageFor(ntpc.id) as string, "en");

  assert.equal(entry.rating, undefined);
  assert.equal(entry.ratingCount, undefined);
  assert.equal(entry.installs, undefined);
  assert.equal(entry.icon, undefined);
  assert.deepEqual(entry.screenshots, []);

  // The description is built from the exam's own name, not invented copy.
  assert.match(entry.description, /RRB NTPC/);
  assert.equal(entry.examId, "rrb_ntpc");
  assert.equal(entry.slug, "rrb-ntpc");

  // AppCard's own gate: undefined rating → no rating shown, which is why the
  // page never needs a rating check of its own.
  const showRating = typeof entry.rating === "number" && (entry.ratingCount ?? 0) >= 5;
  assert.equal(showRating, false);

  // The same undefineds reaching the JSON-LD builder produce no aggregateRating.
  const ld = softwareApplication({
    name: entry.name,
    description: entry.description,
    packageName: entry.package,
    url: "u",
    rating: entry.rating,
    ratingCount: entry.ratingCount,
  }) as Record<string, unknown>;
  assert.equal(ld.aggregateRating, undefined);
});

test("no registry: a synthesised entry is Hindi in Hindi", () => {
  const ntpc = EXAMS.find((e) => e.id === "rrb_ntpc");
  assert.ok(ntpc);
  const hi = synthesise(ntpc, appPackageFor(ntpc.id) as string, "hi");
  assert.match(hi.description, /[ऀ-ॿ]/);
});

test("no registry: categories keep the home page's order and no group is empty", () => {
  const groups = groupApps(null, "en");
  const order = groups.map((g) => g.category);
  assert.equal(order[0], "railway");
  assert.equal(order[1], "ssc");
  assert.equal(order[2], "police");
  for (const g of groups) assert.ok(g.apps.length > 0, `${g.category} rendered empty`);
  // Every category with at least one app-having exam is present.
  const expected = new Set(
    EXAMS.filter((e) => appPackageFor(e.id) !== null).map((e) => e.category),
  );
  assert.equal(groups.length, expected.size);
});

// ── The path that starts working the day the ops job first runs ──────────────

test("registry present: the loader returns the fixture", async () => {
  bucketWith(JSON.stringify(FIXTURE));
  const reg = await loadAppsRegistry();
  assert.equal(reg?.apps.length, 3);
});

test("registry present: the rating shows at >= 5 ratings and is hidden below it", () => {
  const groups = groupApps(FIXTURE.apps, "en");
  const all = groups.flatMap((g) => g.apps);

  const showRating = (a: AppEntry) =>
    typeof a.rating === "number" && (a.ratingCount ?? 0) >= 5;

  const ntpc = all.find((a) => a.slug === "rrb-ntpc");
  assert.ok(ntpc);
  assert.equal(showRating(ntpc), true, "1200 ratings should show");

  const gd = all.find((a) => a.slug === "ssc-gd");
  assert.ok(gd);
  assert.equal(showRating(gd), false, "3 ratings is a claim the site cannot stand behind");
});

test("registry present: aggregateRating rides only on the app with a real rating", () => {
  const ld = (a: AppEntry) =>
    softwareApplication({
      name: a.name,
      description: a.description,
      packageName: a.package,
      url: "u",
      rating: a.rating,
      ratingCount: a.ratingCount,
    }) as Record<string, unknown>;

  const [ntpc, gd, general] = FIXTURE.apps;
  assert.ok(ld(ntpc).aggregateRating, "4.6 over 1200 ratings is real and belongs in the schema");
  assert.equal(ld(gd).aggregateRating, undefined, "5.0 over 3 ratings must not ship");
  assert.equal(ld(general).aggregateRating, undefined, "no rating at all → no aggregateRating");
});

test("registry present: a general app has no examId, which is what sends it to /topics", () => {
  const groups = groupApps(FIXTURE.apps, "en");
  const all = groups.flatMap((g) => g.apps);

  const general = all.find((a) => a.slug === "gk-daily");
  assert.ok(general, "the general app must still be rendered");
  assert.equal(general.examId, undefined);

  // The page branches on examId: present → /exam/{slug}, absent → /topics.
  const target = (a: AppEntry) => (a.examId ? `/exam/${a.slug}` : "/topics");
  assert.equal(target(general), "/topics");

  const ntpc = all.find((a) => a.slug === "rrb-ntpc");
  assert.ok(ntpc);
  assert.equal(target(ntpc), "/exam/rrb-ntpc");
});

test("registry present: apps group by their own category, then by their exam's, then into other", () => {
  const groups = groupApps(FIXTURE.apps, "en");
  const find = (slug: string) => groups.find((g) => g.apps.some((a) => a.slug === slug));

  assert.equal(find("rrb-ntpc")?.category, "railway");
  assert.equal(find("ssc-gd")?.category, "ssc");
  // No category and no examId → the trailing group, not dropped.
  assert.equal(find("gk-daily")?.category, "other");
  assert.equal(groups[groups.length - 1].category, "other");
});

test("registry present: an app whose category is unknown still lands via its examId", () => {
  const odd: AppEntry[] = [{ ...FIXTURE.apps[0], category: "not-a-real-category" }];
  const groups = groupApps(odd, "en");
  assert.equal(groups.length, 1);
  assert.equal(groups[0].category, "railway");
});

// ── /apps/[slug] is registry-only ────────────────────────────────────────────

test("no registry: /apps/[slug] generates zero pages, and that is the correct result", async () => {
  bucketWith(null);
  assert.equal(await loadAppsRegistry(), null);
  __clearMemo();
  bucketWith(null);
  assert.deepEqual(await generateStaticParams(), []);
});

test("registry present: /apps/[slug] generates every app in both languages", async () => {
  bucketWith(JSON.stringify(FIXTURE));
  const params = await generateStaticParams();
  assert.equal(params.length, FIXTURE.apps.length * 2);
  assert.ok(params.some((p) => p.lang === "en" && p.slug === "rrb-ntpc"));
  assert.ok(params.some((p) => p.lang === "hi" && p.slug === "gk-daily"));
});
