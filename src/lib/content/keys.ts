// Bucket keys for the studyvirus-content R2 bucket. Keys, never URLs.
// Layout verified live 2026-09-07 (spec §2).

export type AptitudeFamily = "ssc-railway" | "bank";

export const PAID_PREFIXES = [
  "mock-content/",
  "gk/mocks-v2/mock-content/",
  "gk/mocks-v2/sectional-content/",
  "gk/mocks-v2/topic-content/",
] as const;

export const PRO_PREFIXES = [
  "gk/notes/",
  "gk/master-notes/",
  "gk/master-notes-oneliners/",
  "gk/oneliners/",
  "gk/aptitude/content/notes/",
  "gk/0-Current Affairs/capsule/",
  "gk/0-Current Affairs/magazine/",
] as const;

/** Throws if the key is paid or Pro content. Manifests inside paid prefixes are public. */
export function assertPublishable(key: string): void {
  if (key.endsWith("/manifest.json")) return;
  for (const p of [...PAID_PREFIXES, ...PRO_PREFIXES]) {
    if (key.startsWith(p)) throw new Error(`refusing to read non-free content key: ${key}`);
  }
}

/** Percent-encode each path segment; slashes stay slashes. */
export function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Drop "." path segments. Manifest `folder` fields are sometimes "." (2,136
 * bank entries, mostly DI), which would leak a literal "." segment into the
 * key. The CDN resolves both forms, but scripts/validate-content.mjs stores
 * the index normalised and hasKey/counts are pure string lookups, so the read
 * side must build the identical key or the set silently vanishes.
 */
export function normalizeKey(key: string): string {
  return key.split("/").filter((s) => s !== ".").join("/");
}

export const keys = {
  topicsManifest: () => "gk/topics.json",
  chapterFile: (folder: string, file: string) => `gk/${folder}/${file}`,
  pyqConfig: () => "gk/pyq-config.json",
  pyqPaper: (prefix: string, n: number) => `gk/24-Previous Year Papers/${prefix}${pad2(n)}.json`,
  gkAptitudeManifest: () => "gk/aptitude/manifest.json",
  bankManifest: () => "bank/manifest.json",
  aptitudeSet: (
    family: AptitudeFamily,
    subjectFolder: string,
    chapterFolder: string,
    typeFolder: string,
    file: string,
  ) =>
    normalizeKey(
      family === "bank"
        ? `bank/${subjectFolder}/${chapterFolder}/${typeFolder}/${file}`
        : `gk/aptitude/content/${subjectFolder}/${chapterFolder}/${typeFolder}/${file}`,
    ),
  caDaily: (date: string) => `gk/0-Current Affairs/daily/${date}.json`,
  articlesIndex: () => "gk/articles/index.json",
  article: (file: string) => `gk/articles/${file}`,
  appsRegistry: () => "apps/registry.json",
  webMethod: (family: AptitudeFamily, chapterId: string) => `gk/aptitude/web-method/${family}/${chapterId}.json`,
} as const;
