import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadAppsRegistry, appForExam, appBySlug } from "../src/lib/content/apps";

const reg = JSON.stringify({ generatedAt: "2026-09-07T00:00:00Z", apps: [
  { package: "com.railwaygk.ntpc", slug: "rrb-ntpc", examId: "rrb_ntpc", name: "RRB NTPC GK 2026", description: "d", rating: 4.6, ratingCount: 1200, screenshots: ["apps/com.railwaygk.ntpc/shot-1.webp"] },
]});

beforeEach(() => { __clearMemo(); });

test("registry absent → null, present → entries", async () => {
  __setBucketResolver(async () => ({ async get() { return null; } }));
  assert.equal(await loadAppsRegistry(), null);
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "apps/registry.json" ? { text: async () => reg } : null; } }));
  const r = await loadAppsRegistry();
  assert.equal(r?.apps.length, 1);
  assert.equal(appForExam(r!, "rrb_ntpc")?.package, "com.railwaygk.ntpc");
  assert.equal(appBySlug(r!, "rrb-ntpc")?.rating, 4.6);
  assert.equal(appBySlug(r!, "nope"), undefined);
});
