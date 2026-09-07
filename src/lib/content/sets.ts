// Port of rrb-ntpc-gk/src/hooks/useQuestions.js buildSets (2026-08-22).
// The site MUST number sets exactly as the app does (spec §5.3).

export const NORMAL_SET_SIZE = 10;
export const LAST_SET_SIZE = 20;

// The `object &` intersection is required, not decoration. A bare
// { passageGroup?: string } has only optional properties, making it a *weak
// type*: TypeScript rejects any argument sharing no property with it ("no
// properties in common"). Ordinary questions carry id/q/options and no
// passageGroup, so the bare form fails for exactly the chapters this handles.
// `object` defeats weak-type detection without demanding an index signature --
// Record<string, unknown> would also compile for object literals but rejects
// *interface* types (interfaces have no implicit index signature), including
// this repo's own Question in src/lib/types.ts. Inference of T is unaffected.
type HasPassage = object & { passageGroup?: string };

export function buildSets<T extends HasPassage>(questions: T[]): T[][] {
  const list = questions || [];
  if (list.length === 0) return [];

  const grouped = list.filter((q) => q && q.passageGroup);
  if (grouped.length >= list.length * 0.8) {
    const order: string[] = [];
    const byGroup = new Map<string, T[]>();
    for (const q of list) {
      const key = q.passageGroup || `__solo_${order.length}`;
      if (!byGroup.has(key)) {
        byGroup.set(key, []);
        order.push(key);
      }
      byGroup.get(key)!.push(q);
    }
    return order.map((k) => byGroup.get(k)!);
  }

  if (list.length <= LAST_SET_SIZE) return [list];

  const sets: T[][] = [];
  let i = 0;
  while (i < list.length) {
    const remaining = list.length - i;
    // `sets.length > 0` is unreachable-false here (the loop is only entered when
    // list.length > LAST_SET_SIZE, so the first slice always pushes). Kept
    // because it mirrors the app's source exactly -- do not "simplify" it away,
    // divergence from the app would renumber every set.
    if (remaining <= LAST_SET_SIZE && sets.length > 0) {
      sets.push(list.slice(i));
      break;
    }
    sets.push(list.slice(i, i + NORMAL_SET_SIZE));
    i += NORMAL_SET_SIZE;
  }
  return sets;
}

export function setCount<T extends HasPassage>(questions: T[]): number {
  return buildSets(questions).length;
}

export function getSet<T extends HasPassage>(questions: T[], n: number): T[] | null {
  if (!Number.isInteger(n) || n < 1) return null;
  const sets = buildSets(questions);
  return sets[n - 1] ?? null;
}

export function setRange<T extends HasPassage>(questions: T[], n: number): { from: number; to: number } | null {
  if (!Number.isInteger(n) || n < 1) return null;
  const sets = buildSets(questions);
  if (n > sets.length) return null;
  let from = 1;
  for (let i = 0; i < n - 1; i++) from += sets[i].length;
  return { from, to: from + sets[n - 1].length - 1 };
}
