import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { getText, getJson, __clearMemo, CDN_BASE } from "../src/lib/content/loader";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => null);
  globalThis.fetch = originalFetch;
});

test("uses the bucket binding when present and never calls fetch", async () => {
  let fetched = false;
  globalThis.fetch = (async () => { fetched = true; return new Response("x"); }) as typeof fetch;
  const uploaded = new Date("2026-09-01T00:00:00Z");
  __setBucketResolver(async () => ({
    async get(key: string) {
      assert.equal(key, "gk/topics.json");
      return { text: async () => '{"topics":[]}', uploaded };
    },
  }));
  const res = await getJson<{ topics: unknown[] }>("gk/topics.json");
  assert.deepEqual(res, { topics: [] });
  assert.equal(fetched, false);
  const t = await getText("gk/topics.json");
  assert.equal(t?.lastModified?.toISOString(), uploaded.toISOString());
});

test("falls back to the CDN over HTTPS with an encoded key", async () => {
  let url = "";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    url = String(input);
    return new Response('{"en":[1],"hi":[1]}', { status: 200, headers: { "last-modified": "Tue, 01 Sep 2026 00:00:00 GMT" } });
  }) as typeof fetch;
  const res = await getJson<{ en: number[] }>("gk/1-Indian History/13-Viceroys & Acts.json");
  assert.equal(url, `${CDN_BASE}/gk/1-Indian%20History/13-Viceroys%20%26%20Acts.json`);
  assert.deepEqual(res?.en, [1]);
});

// Regression test for the bug found in Plan B Task 4 review (2026-09-08):
// @opennextjs/cloudflare's own getCloudflareContextAsync synthesizes a real
// but locally-EMPTY miniflare R2 binding during `next build`/`next dev`
// (Node.js runtime), independent of whether initOpenNextCloudflareForDev()
// ran. A bucket-present-but-object-missing result there must fall through to
// the CDN, or every [lang] page prerenders with empty sections and no error.
// In the REAL deployed Worker (edge runtime, NEXT_RUNTIME !== "nodejs") the
// same bucket-miss is authoritative and must NOT fall through, or the loader
// reintroduces the same-zone Worker-to-Worker fetch failure it exists to
// avoid (spec §2).
test("a bucket miss falls through to the CDN under the Node.js runtime (build/dev), not under the edge runtime (the real Worker)", async () => {
  const realRuntime = process.env.NEXT_RUNTIME;
  let fetched = false;
  globalThis.fetch = (async () => {
    fetched = true;
    return new Response('{"topics":["from-cdn"]}', { status: 200 });
  }) as typeof fetch;
  __setBucketResolver(async () => ({ async get() { return null; } })); // present binding, empty store

  try {
    process.env.NEXT_RUNTIME = "nodejs";
    __clearMemo();
    fetched = false;
    const nodeResult = await getJson<{ topics: string[] }>("gk/topics.json");
    assert.deepEqual(nodeResult, { topics: ["from-cdn"] }, "Node.js runtime: bucket miss falls through to the CDN");
    assert.equal(fetched, true);

    process.env.NEXT_RUNTIME = "edge";
    __clearMemo();
    fetched = false;
    const edgeResult = await getJson<{ topics: string[] }>("gk/topics.json");
    assert.equal(edgeResult, null, "edge runtime (the real Worker): bucket miss is authoritative, never falls through");
    assert.equal(fetched, false, "must never attempt the same-zone CDN fetch from inside the real Worker");
  } finally {
    if (realRuntime === undefined) delete process.env.NEXT_RUNTIME;
    else process.env.NEXT_RUNTIME = realRuntime;
  }
});

test("returns null on 404 and on malformed JSON", async () => {
  globalThis.fetch = (async () => new Response("nope", { status: 404 })) as typeof fetch;
  assert.equal(await getJson("gk/missing.json"), null);
  __clearMemo();
  globalThis.fetch = (async () => new Response("{not json", { status: 200 })) as typeof fetch;
  assert.equal(await getJson("gk/bad.json"), null);
});

test("refuses paid keys before touching the network", async () => {
  globalThis.fetch = (async () => { throw new Error("must not fetch"); }) as typeof fetch;
  await assert.rejects(() => getText("gk/mocks-v2/mock-content/rrb-ntpc-cbt1/mock-02.json"), /refusing/);
});

test("memoises a key for the TTL window", async () => {
  let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response("{}", { status: 200 }); }) as typeof fetch;
  await getJson("gk/topics.json");
  await getJson("gk/topics.json");
  assert.equal(calls, 1);
});

test("memo expires after the TTL", async () => {
  let n = 0;
  globalThis.fetch = (async () => new Response(JSON.stringify({ n: ++n }), { status: 200 })) as typeof fetch;
  assert.deepEqual(await getJson("gk/topics.json"), { n: 1 });
  const realNow = Date.now;
  Date.now = () => realNow() + 61_000;
  try { assert.deepEqual(await getJson("gk/topics.json"), { n: 2 }); }
  finally { Date.now = realNow; }
});

// One transient R2/CDN blip must not become a minute of 404s for that key:
// a failed load (throw or non-2xx) is memoised for at most 5 seconds, while a
// successful load keeps the full TTL (see "memo expires after the TTL").
test("memoises a failure for at most 5 seconds, not the full TTL", async () => {
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    if (calls === 1) throw new Error("transient blip");
    if (calls === 2) return new Response("nope", { status: 503 });
    return new Response('{"ok":true}', { status: 200 });
  }) as typeof fetch;
  const realNow = Date.now;
  try {
    assert.equal(await getJson("gk/topics.json"), null);
    assert.equal(await getJson("gk/topics.json"), null, "inside the failure window the null is still served");
    assert.equal(calls, 1);
    Date.now = () => realNow() + 5_500;
    assert.equal(await getJson("gk/topics.json"), null, "a 503 is a failure too");
    assert.equal(calls, 2);
    Date.now = () => realNow() + 11_000;
    assert.deepEqual(await getJson("gk/topics.json"), { ok: true });
    assert.equal(calls, 3);
    Date.now = () => realNow() + 40_000;
    assert.deepEqual(await getJson("gk/topics.json"), { ok: true }, "a success keeps the full TTL");
    assert.equal(calls, 3);
  } finally {
    Date.now = realNow;
  }
});
