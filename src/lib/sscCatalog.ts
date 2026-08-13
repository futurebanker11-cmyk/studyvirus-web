// sscCatalog.ts — server-side loader for the SSC / RRB mock portals.
//
// One portal per exam: /ssccgl, /sscchsl, /ssccpo, /sscmts, /sscgd, /rrbntpc,
// /rrbgroupd, /rrbalp, /rpf. The bank is ONE portal at /bank listing six exams;
// these are separate apps with separate Play listings, so each gets its own
// landing page and its own URL.
//
// ⛔ NOT cdn.studyvirus.com. This site is a Cloudflare Worker and the CDN gate is
// a Worker on the SAME zone — a Worker cannot fetch a same-zone Worker route, so
// that fetch throws and the catalog renders "0 mocks" (the bank hit exactly this
// on 2026-08-08). The API Worker is on *.workers.dev, a DIFFERENT zone, and
// serves the SAME R2 object.
//
// ⛔ A SEPARATE endpoint from /api/mock-manifest, not a ?query on it: that route
// ignores query params entirely (verified — ?app=gk returns the BANK manifest),
// so a query-based split would silently list SBI/IBPS papers on an SSC page.
const MANIFEST_URL =
  "https://studyvirus-api.futurebanker11.workers.dev/api/gk-mock-manifest";

export type SscPaper = {
  id: string;
  name?: { en?: string; hi?: string } | null;
  file: string;
  questions: number;
  durationMin: number;
  maxMarks?: number;
  marking?: { correct: number; wrong: number } | null;
  free?: boolean;
};

export type SscTrack = {
  id: string;
  name?: { en?: string; hi?: string } | null;
  questions?: number;
  durationMin?: number;
  papers: SscPaper[];
};

export type SscExam = {
  dir: string;
  examId?: string;
  name?: { en?: string; hi?: string } | null;
  marking?: { correct: number; wrong: number } | null;
  papers?: SscPaper[];   // full mocks
  tracks?: SscTrack[];   // sectionals
};

export type SscTopic = {
  id: string;
  group?: string;
  name?: { en?: string; hi?: string } | null;
  exams?: string[];      // absent = shared with every exam
  tracks?: SscTrack[];
};

export type SscManifest = {
  exams?: SscExam[];       // ⛔ ARRAY = CBT full mocks
  sectionals?: SscExam[];
  topics?: SscTopic[];
  // `exam` (OBJECT) also exists in this manifest — it is the legacy GK 40Q
  // library the apps read via useMocks(). Deliberately not typed here: nothing
  // on these portals should ever render it as an exam mock.
};

export async function loadSscManifest(): Promise<SscManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as SscManifest;
  } catch {
    return null;
  }
}

// ── the nine portals ────────────────────────────────────────────────────────
// `slug` MUST match webLinking.WEB_SLUGS in the RN app — the app builds its urls
// from that map, and a mismatch means the site serves /ssccgl while the app
// routes to /sscchsl.
// `dir` MUST match the manifest's exams[].dir / sectionals[].dir.
export const SSC_EXAMS = [
  { slug: "ssccgl", dir: "ssc-cgl-t1", label: "SSC CGL", full: "SSC CGL Tier-1", emoji: "📘", family: "ssc" },
  { slug: "sscchsl", dir: "ssc-chsl-t1", label: "SSC CHSL", full: "SSC CHSL Tier-1", emoji: "📗", family: "ssc" },
  { slug: "ssccpo", dir: "ssc-cpo-p1", label: "SSC CPO", full: "SSC CPO Paper-1", emoji: "🚔", family: "ssc" },
  { slug: "sscmts", dir: "ssc-mts-p1", label: "SSC MTS", full: "SSC MTS Paper-1", emoji: "📕", family: "ssc" },
  { slug: "sscgd", dir: "ssc-gd", label: "SSC GD", full: "SSC GD Constable", emoji: "🛡️", family: "ssc" },
  // ⛔ RRB NTPC is sat in TWO stages and the manifest carries both. `dir` stays
  // the PRIMARY stage, so everything keyed off it — sectionals, counts, the
  // entitlement check in SscMockCards — keeps working untouched. `stages` only
  // adds the extra FULL-MOCK dirs, with the label the student sees. CBT-2 is
  // 120Q (50 GA / 35 math / 35 reasoning) against CBT-1's 100Q, sat only after
  // CBT-1 is cleared, so it is LABELLED rather than merged: one flat list of 60
  // would tell a student they are practising the paper they are preparing for
  // when half of them are not.
  {
    slug: "rrbntpc", dir: "rrb-ntpc-cbt1", label: "RRB NTPC", full: "RRB NTPC CBT-1", emoji: "🚆", family: "rrb",
    stages: [
      { dir: "rrb-ntpc-cbt1", label: "CBT-1 · Stage 1" },
      { dir: "rrb-ntpc-cbt2", label: "CBT-2 · Stage 2" },
    ],
  },
  { slug: "rrbgroupd", dir: "rrb-group-d-cbt", label: "RRB Group D", full: "RRB Group D CBT", emoji: "🚂", family: "rrb" },
  { slug: "rrbalp", dir: "rrb-alp-cbt1", label: "RRB ALP", full: "RRB ALP CBT-1", emoji: "🔧", family: "rrb" },
  { slug: "rpf", dir: "rpf-constable-cbt", label: "RPF Constable", full: "RPF Constable CBT", emoji: "👮", family: "rrb" },
] as const;

export type SscExamMeta = (typeof SSC_EXAMS)[number];

/** One full-mock stage of an exam. */
export type SscStage = { dir: string; label: string };

/**
 * Every full-mock stage of an exam, in exam order.
 *
 * Only RRB NTPC declares `stages` today, and SSC_EXAMS is `as const`, so the
 * property does not exist on the other entries' types — this narrowing keeps
 * callers from needing a cast. An exam without stages yields the single
 * primary dir with no label, which is exactly the pre-existing behaviour.
 */
export const stagesOf = (meta: SscExamMeta): SscStage[] => {
  const s = (meta as { stages?: readonly SscStage[] }).stages;
  return s && s.length
    ? s.map((x) => ({ dir: x.dir, label: x.label }))
    : [{ dir: meta.dir, label: "" }];
};

export const examBySlug = (slug: string): SscExamMeta | undefined =>
  SSC_EXAMS.find((e) => e.slug === slug);

// ── counts for a portal ─────────────────────────────────────────────────────
export type SscCounts = {
  full: number; fullFree: number;
  sectional: number; sectionalSections: number; sectionalFree: number;
  topic: number; topicTopics: number; topicFree: number;
  questions: number;
};

const countPapers = (tracks?: SscTrack[]) =>
  (tracks || []).reduce((a, t) => a + (t.papers?.length || 0), 0);
const countFree = (tracks?: SscTrack[]) =>
  (tracks || []).reduce((a, t) => a + (t.papers || []).filter((p) => p.free).length, 0);

export function countsFor(m: SscManifest | null, meta: SscExamMeta): SscCounts {
  const empty: SscCounts = {
    full: 0, fullFree: 0, sectional: 0, sectionalSections: 0, sectionalFree: 0,
    topic: 0, topicTopics: 0, topicFree: 0, questions: 0,
  };
  if (!m) return empty;

  // Full mocks span every STAGE (RRB NTPC: CBT-1 + CBT-2); single-stage exams
  // resolve to just meta.dir. Counted across all of them so the hero card can
  // never claim 30 papers while the list below renders 60.
  // ⛔ Sectionals stay on the PRIMARY dir — the manifest has no CBT-2
  // sectionals, and inventing a lookup for a dir that does not exist would
  // silently zero the count for every other exam.
  const stageDirs = stagesOf(meta).map((s) => s.dir);
  const exs = (m.exams || []).filter((e) => stageDirs.includes(e.dir));
  const sec = (m.sectionals || []).find((e) => e.dir === meta.dir);
  // Topic tests are SHARED; a topic may scope itself to one family
  // (Railways GK is `exams: ['rrb']` and must not appear on an SSC portal).
  const topics = (m.topics || []).filter(
    (t) => !Array.isArray(t.exams) || t.exams.includes(meta.family),
  );

  const fullPapers = exs.flatMap((e) => e.papers || []);
  return {
    full: fullPapers.length,
    fullFree: fullPapers.filter((p) => p.free).length,
    sectional: countPapers(sec?.tracks),
    sectionalSections: (sec?.tracks || []).length,
    sectionalFree: countFree(sec?.tracks),
    topic: topics.reduce((a, t) => a + countPapers(t.tracks), 0),
    topicTopics: topics.length,
    topicFree: topics.reduce((a, t) => a + countFree(t.tracks), 0),
    questions:
      fullPapers.reduce((a, p) => a + (p.questions || 0), 0) +
      (sec?.tracks || []).reduce((a, t) => a + (t.papers || []).reduce((b, p) => b + (p.questions || 0), 0), 0),
  };
}

// The exam's own pattern, read off its first paper so the page can never state a
// shape the player will not actually run.
export function patternFor(m: SscManifest | null, meta: SscExamMeta) {
  const ex = (m?.exams || []).find((e) => e.dir === meta.dir);
  const p = ex?.papers?.[0];
  if (!p) return null;
  return {
    questions: p.questions,
    durationMin: p.durationMin,
    maxMarks: p.maxMarks ?? null,
    marking: p.marking ?? ex?.marking ?? null,
  };
}
