import { test } from "node:test";
import assert from "node:assert/strict";
import { breadcrumbList, organization, softwareApplication, FORBIDDEN_TYPES } from "../src/lib/seo/jsonld";
import { playUrl } from "../src/lib/seo/referrer";
import { placement } from "../src/lib/seo/monetisation";

test("breadcrumbList positions are 1-based and absolute", () => {
  const b = breadcrumbList([{ name: "Home", url: "https://studyvirus.com" }, { name: "Topics", url: "https://studyvirus.com/topics" }]) as { itemListElement: { position: number; item: string }[] };
  assert.equal(b.itemListElement[1].position, 2);
  assert.equal(b.itemListElement[1].item, "https://studyvirus.com/topics");
});

test("organization carries no superlatives", () => {
  const o = organization() as { description: string; sameAs: string[] };
  assert.doesNotMatch(o.description, /largest|#1|No\.? ?1/i);
  assert.ok(o.sameAs.some((u) => u.includes("play.google.com")));
});

test("softwareApplication omits aggregateRating under 5 ratings", () => {
  const withRating = softwareApplication({ name: "A", description: "d", packageName: "p", url: "u", rating: 4.6, ratingCount: 120 }) as Record<string, unknown>;
  assert.ok(withRating.aggregateRating);
  const few = softwareApplication({ name: "A", description: "d", packageName: "p", url: "u", rating: 5, ratingCount: 3 }) as Record<string, unknown>;
  assert.equal(few.aggregateRating, undefined);
  assert.deepEqual(FORBIDDEN_TYPES, ["FAQPage", "QAPage", "Quiz"]);
});

test("builders never emit a forbidden @type", () => {
  const emitted = [
    breadcrumbList([{ name: "Home", url: "https://studyvirus.com" }]),
    organization(),
    softwareApplication({ name: "A", description: "d", packageName: "p", url: "u" }),
  ].map((o) => (o as { "@type": string })["@type"]);
  for (const t of emitted) assert.ok(!(FORBIDDEN_TYPES as readonly string[]).includes(t), `${t} is forbidden`);
});

test("playUrl carries the install referrer", () => {
  const u = playUrl("com.railwaygk.ntpc", "exam-hub", "rrb-ntpc");
  assert.equal(u, "https://play.google.com/store/apps/details?id=com.railwaygk.ntpc&referrer=utm_source%3Dstudyvirus.com%26utm_medium%3Dweb%26utm_campaign%3Dexam-hub%26utm_content%3Drrb-ntpc");
});

test("placement follows the audit table", () => {
  assert.deepEqual(placement("content"), { ads: ["in-article", "sticky-bottom"], installCta: "end" });
  assert.deepEqual(placement("exam-hub"), { ads: ["footer"], installCta: "hero" });
  assert.deepEqual(placement("apps"), { ads: ["footer"], installCta: "hero" });
  assert.deepEqual(placement("home"), { ads: ["in-article", "footer"], installCta: "strip" });
  assert.deepEqual(placement("static"), { ads: [], installCta: "none" });
});
