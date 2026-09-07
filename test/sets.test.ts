import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSets, setCount, getSet, setRange } from "../src/lib/content/sets";

const qs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `q${i + 1}` }));

test("empty input yields no sets", () => {
  assert.deepEqual(buildSets([]), []);
  assert.equal(setCount([]), 0);
});

test("up to 20 questions is a single set", () => {
  assert.equal(buildSets(qs(5)).length, 1);
  assert.equal(buildSets(qs(20)).length, 1);
  assert.equal(buildSets(qs(20))[0].length, 20);
});

test("21 questions become 10 + 11", () => {
  const s = buildSets(qs(21));
  assert.deepEqual(s.map((x) => x.length), [10, 11]);
});

test("70 questions become five tens and a final twenty (matches the app)", () => {
  const s = buildSets(qs(70));
  assert.deepEqual(s.map((x) => x.length), [10, 10, 10, 10, 10, 20]);
  assert.equal(setCount(qs(70)), 6);
});

test("25 questions become 10 + 15; 40 become 10 + 10 + 20", () => {
  assert.deepEqual(buildSets(qs(25)).map((x) => x.length), [10, 15]);
  assert.deepEqual(buildSets(qs(40)).map((x) => x.length), [10, 10, 20]);
});

test("passage chapters get one set per passage in first-seen order", () => {
  // 8 grouped of 10 == exactly 0.8, so this stays on the passage path even with
  // two solos. (Adding a solo to a smaller fixture drops the ratio below 0.8 and
  // silently falls through to the plain rule.)
  const p = [
    { id: "a1", passageGroup: "P1" }, { id: "a2", passageGroup: "P1" },
    { id: "b1", passageGroup: "P2" }, { id: "b2", passageGroup: "P2" }, { id: "b3", passageGroup: "P2" },
    { id: "solo" },
    { id: "c1", passageGroup: "P3" }, { id: "c2", passageGroup: "P3" },
    { id: "d1", passageGroup: "P4" }, { id: "d2", passageGroup: "P4" },
    { id: "solo2" },
  ];
  const s = buildSets(p);
  // The two solos must stay in SEPARATE sets: each gets a unique `__solo_N` key.
  // A constant `__solo_` key would collide and merge them into one set.
  assert.deepEqual(s.map((x) => x.map((q) => q.id)), [
    ["a1", "a2"], ["b1", "b2", "b3"], ["solo"], ["c1", "c2"], ["d1", "d2"], ["solo2"],
  ]);
});

test("passage rule only applies when at least 80% carry passageGroup", () => {
  const p = [{ id: "a", passageGroup: "P1" }, ...qs(9)];
  assert.equal(buildSets(p).length, 1); // 10 questions, plain rule
});

test("a 0.6 grouped ratio stays on the plain path (pins the threshold above 0.5)", () => {
  // 6 of 10 carry passageGroup. Below 0.8, so the plain rule applies and 10 <= 20
  // gives a single set. A drifted threshold of 0.5 would take the passage path
  // and split this into one set per group instead.
  const p = [
    { id: "g1", passageGroup: "P1" }, { id: "g2", passageGroup: "P1" },
    { id: "g3", passageGroup: "P2" }, { id: "g4", passageGroup: "P2" },
    { id: "g5", passageGroup: "P3" }, { id: "g6", passageGroup: "P3" },
    ...qs(4),
  ];
  assert.equal(buildSets(p).length, 1);
});

test("a ratio of exactly 0.8 takes the passage path (pins >= against >)", () => {
  // 20 of 25 carry passageGroup, in 4 groups of 5, then 5 ungrouped solos.
  // Exactly at the boundary: `>=` takes the passage path (4 groups + 5 solos = 9
  // sets); a stricter `>` would fall through to the plain rule and give [10, 15].
  const grouped = Array.from({ length: 20 }, (_, i) => ({
    id: `g${i + 1}`,
    passageGroup: `P${Math.floor(i / 5) + 1}`,
  }));
  const p = [...grouped, ...qs(5)];
  assert.equal(p.length, 25);
  assert.equal(p.filter((q) => "passageGroup" in q).length, 20); // ratio === 0.8
  const s = buildSets(p);
  assert.deepEqual(s.map((x) => x.length), [5, 5, 5, 5, 1, 1, 1, 1, 1]);
});

test("getSet and setRange are 1-based and null out of range", () => {
  const q = qs(70);
  assert.equal(getSet(q, 1)?.[0].id, "q1");
  assert.equal(getSet(q, 6)?.length, 20);
  assert.equal(getSet(q, 7), null);
  assert.equal(getSet(q, 0), null);
  assert.deepEqual(setRange(q, 6), { from: 51, to: 70 });
  assert.equal(setRange(q, 9), null);
});
