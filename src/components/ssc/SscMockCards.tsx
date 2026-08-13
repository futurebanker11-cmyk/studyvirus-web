"use client";
// SscMockCards — the three product tabs on an SSC/RRB portal.
//
//   Full Mocks · Sectional Tests · Topic Tests
//
// Everything is read from the manifest the apps and the CBT player read, so the
// site can never advertise a paper the player will not serve. ATTEMPT hands off
// to the RN player at /<slug>/mock/<paperId>.
//
// Access mirrors the app: the first paper of every set is free; the rest need
// the yearly plan, resolved from the SIGNED-IN account (not the device), which
// is what makes a phone purchase unlock here.
import { useState } from "react";
import { useBankAuth } from "@/components/bank/BankAuth";
import type { SscPaper, SscTrack } from "@/lib/sscCatalog";

type Props = {
  slug: string;
  examDir: string;
  /** `stage` is set only for exams sat in more than one (RRB NTPC CBT-1 then
   *  CBT-2); when present the full list is grouped under a heading per stage. */
  full: (SscPaper & { stage?: string })[];
  sectionals: SscTrack[];
  topics: { id: string; group?: string; name?: { en?: string; hi?: string } | null; tracks?: SscTrack[] }[];
};

type Tab = "full" | "sectional" | "topic";

const pick = (n: { en?: string; hi?: string } | null | undefined, fb: string) =>
  (n && (n.en || n.hi)) || fb;

export default function SscMockCards({ slug, examDir, full, sectionals, topics }: Props) {
  const { email, grants, signIn } = useBankAuth();
  // A subscription on this account unlocks everything here. `pass` (the bank's
  // all-exam pass) also unlocks, and `pro` is scoped to the exams it was bought
  // for — the same rule MockCards applies for the bank.
  const unlocked = !!grants && (grants.pass || (grants.pro && (grants.exams || []).includes(examDir)));

  const ALL_TABS: { key: Tab; label: string; n: number }[] = [
    { key: "full", label: "Full Mocks", n: full.length },
    { key: "sectional", label: "Sectional Tests", n: sectionals.reduce((a, t) => a + (t.papers?.length || 0), 0) },
    { key: "topic", label: "Topic Tests", n: topics.reduce((a, t) => a + (t.tracks || []).reduce((b, tr) => b + (tr.papers?.length || 0), 0), 0) },
  ];
  // A tab only exists while the manifest actually carries that product, so an
  // exam with no sectionals yet shows two tabs rather than an empty third.
  const TABS = ALL_TABS.filter((t) => t.n > 0);

  const [tab, setTab] = useState<Tab>(TABS[0]?.key || "full");

  // Group full mocks by stage, preserving manifest order. An exam with no
  // `stage` on its papers collapses to a single unlabelled group, which
  // renders exactly as the flat list did before.
  const fullGroups = full.reduce<{ label: string; items: typeof full }[]>((acc, p) => {
    const label = p.stage || "";
    const g = acc.find((x) => x.label === label);
    if (g) g.items.push(p);
    else acc.push({ label, items: [p] });
    return acc;
  }, []);

  const Row = ({ p, sub }: { p: SscPaper; sub?: string }) => {
    const locked = !p.free && !unlocked;
    const href = `/${slug}/mock/${p.id}`;
    return (
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-sm truncate">{pick(p.name, p.id)}</div>
          <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
            {p.questions}Q · {p.durationMin} min
            {p.maxMarks ? ` · ${p.maxMarks} marks` : ""}
            {sub ? ` · ${sub}` : ""}
          </div>
        </div>
        {p.free ? (
          <span className="text-[10px] font-black bg-green-600 text-white rounded-full px-2.5 py-1">FREE</span>
        ) : null}
        {locked ? (
          <button
            onClick={() => (email ? undefined : signIn())}
            className="text-xs font-extrabold text-slate-500 bg-slate-100 rounded-full px-3.5 py-2 hover:bg-slate-200 transition"
            title={email ? "Buy the yearly plan in the app to unlock" : "Sign in to unlock your purchase"}
          >
            {email ? "Locked" : "Sign in"}
          </button>
        ) : (
          <a
            href={href}
            className="text-xs font-extrabold text-white bg-blue-600 rounded-full px-4 py-2 hover:bg-blue-700 transition"
          >
            Attempt →
          </a>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              "rounded-full px-4 py-2 text-sm font-extrabold transition " +
              (tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300")
            }
          >
            {t.label} <span className="opacity-60">({t.n})</span>
          </button>
        ))}
      </div>

      {/* not signed in → one line explaining how to unlock */}
      {!unlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-900">
          {email
            ? "Buy the yearly plan inside the Android app — it unlocks here instantly on this account."
            : "Already bought the plan in the app? Sign in with the same Google account to unlock every test here."}
        </div>
      )}

      {tab === "full" && (
        <div className="space-y-2">
          {fullGroups.map((g) => (
            <div key={g.label || "_"} className="space-y-2">
              {fullGroups.length > 1 ? (
                <div className="flex items-center gap-2 pt-4 pb-1">
                  <span className="w-1 h-4 rounded bg-blue-600" />
                  <span className="text-xs font-black tracking-wide text-slate-500 uppercase">{g.label}</span>
                  <span className="text-xs font-bold text-slate-400 tabular-nums">{g.items.length} papers</span>
                </div>
              ) : null}
              {g.items.map((p) => <Row key={p.id} p={p} />)}
            </div>
          ))}
        </div>
      )}

      {tab === "sectional" && (
        <div className="space-y-6">
          {sectionals.map((t) => (
            <div key={t.id}>
              <h3 className="font-black text-slate-700 mb-2">
                {pick(t.name, t.id)}
                <span className="text-xs font-normal text-slate-400 ml-2 tabular-nums">
                  {t.questions}Q · {t.durationMin} min
                </span>
              </h3>
              <div className="space-y-2">
                {(t.papers || []).map((p) => <Row key={p.id} p={p} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "topic" && (
        <div className="space-y-6">
          {["quant", "reasoning", "gk"].map((g) => {
            const inGroup = topics.filter((t) => (t.group || "gk") === g);
            if (!inGroup.length) return null;
            const GROUP_LABEL: Record<string, string> = {
              quant: "Quantitative Aptitude", reasoning: "Reasoning", gk: "General Awareness",
            };
            return (
              <div key={g}>
                <h3 className="font-black text-slate-700 mb-3 uppercase text-xs tracking-wider">
                  {GROUP_LABEL[g]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inGroup.map((t) => {
                    const papers = (t.tracks || []).flatMap((tr) => tr.papers || []);
                    const free = papers.filter((p) => p.free).length;
                    return (
                      <details key={t.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 group">
                        <summary className="font-bold text-slate-800 text-sm cursor-pointer list-none flex justify-between items-center">
                          <span>{pick(t.name, t.id)}</span>
                          <span className="text-xs font-normal text-slate-400">
                            {papers.length} sets · {free} free
                          </span>
                        </summary>
                        <div className="space-y-2 mt-3">
                          {papers.map((p) => <Row key={p.id} p={p} />)}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
