// bankCatalog.ts — server-side loader for the bank mock catalog pages.
//
// Source of truth is the served manifest (same one the apps read). Fetched
// server-side with ISR revalidation, so the catalog pages are fully
// SEO-indexable ("SBI Clerk mock test" searches land here) and a content
// upload + version bump updates the site within minutes — no redeploy.

const MANIFEST_URL = "https://cdn.studyvirus.com/mock-content/manifest.json";

export type BankPaper = {
  id: string;
  n?: number;
  mock?: number;
  questions: number;
  timeMin?: number;
  totalTimeMin?: number | null;
  sections?: { key: string; marks: number; timeMin: number }[];
  free?: boolean;
  releaseAt?: string | null;
};

export type BankTrack = {
  key?: string;
  section?: string;
  name: string;
  questions: number;
  target?: number;
  papers: BankPaper[];
};

export type BankManifest = {
  version: number;
  exams: { exam: string; planKey: string; dir: string; type?: string; target?: number; papers: BankPaper[] }[];
  sectionals: { exam: string; planKey: string; dir: string; tracks: BankTrack[] }[];
  topics: { tier: "clerk" | "po"; exams: string[]; tracks: BankTrack[] }[];
};

// The 2×3 landing grid, in the user's specified order:
//   SBI Clerk   SBI PO
//   RRB Clerk   RRB PO
//   IBPS Clerk  IBPS PO
// `pkg` = that exam's own Play Store app (used by the unlock upsell).
export const BANK_EXAMS = [
  { dir: "sbi-clerk", label: "SBI Clerk", emoji: "🏦", pkg: "com.bankprep.sbiclerk" },
  { dir: "sbi-po", label: "SBI PO", emoji: "🏦", pkg: "com.bankprep.sbipo" },
  { dir: "rrb-clerk", label: "RRB Clerk", emoji: "🌾", pkg: "com.bankprep.ibpsrrbclerk" },
  { dir: "rrb-po", label: "RRB PO", emoji: "🌾", pkg: "com.bankprep.ibpsrrbpo" },
  { dir: "ibps-clerk", label: "IBPS Clerk", emoji: "🏛️", pkg: "com.bankprep.ibpsclerk" },
  { dir: "ibps-po", label: "IBPS PO", emoji: "🏛️", pkg: "com.bankprep.ibpspo" },
] as const;

export type BankExamMeta = (typeof BANK_EXAMS)[number];

export const examByDir = (dir: string): BankExamMeta | undefined =>
  BANK_EXAMS.find((e) => e.dir === dir);

// Which topic-test tier an exam reads (topics are shared per tier).
export const tierForDir = (dir: string): "clerk" | "po" =>
  dir.endsWith("-po") ? "po" : "clerk";

export async function loadBankManifest(): Promise<BankManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as BankManifest;
  } catch {
    return null;
  }
}

// Total minutes for a full mock (composite RRB papers carry totalTimeMin;
// sectional-timed papers sum their sections).
export const mockMinutes = (p: BankPaper): number =>
  p.totalTimeMin ||
  (p.sections ? p.sections.reduce((n, s) => n + (s.timeMin || 0), 0) : p.timeMin || 0);
