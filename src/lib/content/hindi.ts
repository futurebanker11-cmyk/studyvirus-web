// Spec §4.5: a Hindi page exists only when the source has Hindi for every unit.
export function hasHindiCounts(enCount: number, hiCount: number): boolean {
  return enCount > 0 && hiCount === enCount;
}

export function hasHindiSet(set: { en?: unknown[]; hi?: unknown[] }): boolean {
  const en = Array.isArray(set.en) ? set.en.length : 0;
  const hi = Array.isArray(set.hi) ? set.hi.length : 0;
  return hasHindiCounts(en, hi);
}
