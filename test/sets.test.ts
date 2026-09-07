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
  const p = [
    { id: "a1", passageGroup: "P1" }, { id: "a2", passageGroup: "P1" },
    { id: "b1", passageGroup: "P2" }, { id: "b2", passageGroup: "P2" }, { id: "b3", passageGroup: "P2" },
    { id: "solo" },
    { id: "c1", passageGroup: "P3" },
  ];
  const s = buildSets(p);
  assert.deepEqual(s.map((x) => x.map((q) => q.id)), [["a1", "a2"], ["b1", "b2", "b3"], ["solo"], ["c1"]]);
});

test("passage rule only applies when at least 80% carry passageGroup", () => {
  const p = [{ id: "a", passageGroup: "P1" }, ...qs(9)];
  assert.equal(buildSets(p).length, 1); // 10 questions, plain rule
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
