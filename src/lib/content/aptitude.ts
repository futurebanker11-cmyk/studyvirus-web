import { getJson } from "./loader";
import { keys, type AptitudeFamily } from "./keys";
import { counts } from "./index";
import { aptitudeChapterSlug, aptitudeSubjectSlug, chapterSlug as nameSlug } from "./slugs";

export type { AptitudeFamily };

export interface AptSetRef { id: string; file: string; tier: number; count: number; name: { en: string; hi: string } }
export interface AptType { id: string; folder: string; name: { en: string; hi: string }; sets: AptSetRef[] }
export interface AptChapter { id: string; folder: string; name: { en: string; hi: string }; emoji?: string; types: AptType[] }
export interface AptSubject { id: string; folder: string; icon?: string; name: { en: string; hi: string }; chapters: AptChapter[] }
export interface AptFamilyInfo {
  family: AptitudeFamily; slug: AptitudeFamily;
  name: { en: string; hi: string }; examQualifier: { en: string; hi: string };
  subjects: AptSubject[];
}
export interface AptSetInfo {
  family: AptitudeFamily; subject: AptSubject; chapter: AptChapter; type: AptType; set: AptSetRef;
  n: number; key: string; enCount: number; hiCount: number;
}

export const FAMILIES: readonly AptitudeFamily[] = ["ssc-railway", "bank"];

const FAMILY_META: Record<AptitudeFamily, { manifest: string; name: { en: string; hi: string }; examQualifier: { en: string; hi: string } }> = {
  "ssc-railway": {
    manifest: keys.gkAptitudeManifest(),
    name: { en: "SSC & Railway", hi: "SSC और रेलवे" },
    examQualifier: { en: "SSC CGL, CHSL, MTS & RRB NTPC, Group D", hi: "SSC CGL, CHSL, MTS और RRB NTPC, ग्रुप D" },
  },
  bank: {
    manifest: keys.bankManifest(),
    name: { en: "Bank", hi: "बैंक" },
    examQualifier: { en: "SBI PO, SBI Clerk, IBPS PO, IBPS Clerk & RRB", hi: "SBI PO, SBI क्लर्क, IBPS PO, IBPS क्लर्क और RRB" },
  },
};

// Only tier 1 is free. Tier 2 is a paid product and must never be listed,
// linked or indexed, so it is dropped here, before anything else sees it.
function tierOne(subjects: AptSubject[]): AptSubject[] {
  return subjects
    .map((s) => ({
      ...s,
      chapters: (s.chapters || [])
        .map((c) => ({ ...c, types: (c.types || []).map((t) => ({ ...t, sets: (t.sets || []).filter((x) => x.tier === 1) })).filter((t) => t.sets.length > 0) }))
        .filter((c) => c.types.length > 0),
    }))
    .filter((s) => s.chapters.length > 0);
}

export async function loadFamily(family: AptitudeFamily): Promise<AptFamilyInfo> {
  const meta = FAMILY_META[family];
  const m = await getJson<{ subjects: AptSubject[] }>(meta.manifest);
  return { family, slug: family, name: meta.name, examQualifier: meta.examQualifier, subjects: tierOne(m?.subjects ?? []) };
}

export const subjectSlug = (s: AptSubject) => aptitudeSubjectSlug(s.id);
export const chapterSlug = (c: AptChapter) => aptitudeChapterSlug(c.id);

// Folder-derived, not name-derived: five live bank/reasoning chapters have two
// or three types all named "Previous Year Questions" (folders "4-Previous Year",
// "4-Previous Year (Arihant)", "5-Previous Year"; 145 tier-1 sets). Folders are
// unique within a chapter, names are not. A folder that slugs to nothing ("." on
// the bank DI types) falls back to the name, and then to the id.
// scripts/validate-content.mjs mirrors this rule and hard-fails the build on a
// per-chapter collision; test/validateContentSlugs.test.ts keeps the two in step.
export const typeSlug = (t: AptType) => nameSlug(t.folder ?? "") || nameSlug(t.name?.en ?? "") || nameSlug(t.id);

export const findSubject = (fam: AptFamilyInfo, slug: string) => fam.subjects.find((s) => subjectSlug(s) === slug);
export const findAptChapter = (s: AptSubject, slug: string) => s.chapters.find((c) => chapterSlug(c) === slug);
export const findType = (c: AptChapter, slug: string) => c.types.find((t) => typeSlug(t) === slug);

export function setsOf(family: AptitudeFamily, subject: AptSubject, chapter: AptChapter, type: AptType): AptSetInfo[] {
  const out: AptSetInfo[] = [];
  for (const set of type.sets) {
    const key = keys.aptitudeSet(family, subject.folder, chapter.folder, type.folder, set.file);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ family, subject, chapter, type, set, n: out.length + 1, key, enCount: c[0], hiCount: c[1] });
  }
  return out;
}

export function findAptSet(family: AptitudeFamily, subject: AptSubject, chapter: AptChapter, type: AptType, n: number): AptSetInfo | undefined {
  return setsOf(family, subject, chapter, type).find((s) => s.n === n);
}
