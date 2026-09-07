import generated from "@/generated/content-index.json";

export interface ContentTotals {
  topicQuestions: number; topicChapters: number; topicSets: number;
  pyqQuestions: number; pyqPapers: number; pyqExams: number;
  aptitudeQuestions: number; aptitudeSets: number;
  englishQuestions: number; englishChapters: number;
  caQuestions: number; caDays: number;
  articles: number;
  /**
   * Optional: scripts/validate-content.mjs does not populate this yet, so the
   * committed index stays valid without regeneration. siteStats() treats a
   * missing value as 0 until the next regeneration fills it in.
   */
  aptitudeChapters?: number;
}

export interface ContentIndex {
  generatedAt: string;
  files: Record<string, Record<string, [number, number]>>;
  totals: ContentTotals;
}

let index: ContentIndex = generated as unknown as ContentIndex;

export function getIndex(): ContentIndex {
  return index;
}

export function __setIndexForTests(idx: ContentIndex): void {
  index = idx;
}

export function splitKey(key: string): [string, string] {
  const i = key.lastIndexOf("/");
  return i < 0 ? ["", key] : [key.slice(0, i), key.slice(i + 1)];
}

export function hasKey(key: string): boolean {
  const [dir, file] = splitKey(key);
  return Boolean(index.files[dir]?.[file]);
}

export function counts(key: string): [number, number] | null {
  const [dir, file] = splitKey(key);
  return index.files[dir]?.[file] ?? null;
}

export function listDir(dir: string): string[] {
  return Object.keys(index.files[dir] ?? {}).sort();
}

export function totals(): ContentTotals {
  return index.totals;
}
