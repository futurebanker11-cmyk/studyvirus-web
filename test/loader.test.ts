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
