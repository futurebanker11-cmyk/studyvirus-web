"use client";
// MockCards — the exam page's tabbed catalog (client side).
//
// Tabs: Prelims Mocks · Topic Tests · Sectional Tests · Mains — per the locked
// product design. Cards match the familiar coaching-site pattern: title,
// "N Ques • M Mins", a Bilingual chip, and ATTEMPT — which either opens the
// real CBT player (/bank/mock/<id>) or, on a locked paper, the unlock sheet:
// "Purchase Bank Pro or Bank Pass — only in the app".
import React, { useMemo, useState } from "react";
import { useBankAuth } from "./BankAuth";
import type { BankPaper, BankTrack, BankExamMeta } from "@/lib/bankCatalog";

type ExamData = {
  meta: BankExamMeta;
  examTitle: string;
  prelims: BankPaper[];
  mainsTarget: number;
  mains: BankPaper[];
  sectionals: BankTrack[];
  topics: BankTrack[];
};

const TABS = ["Prelims Mocks", "Topic Tests", "Sectional Tests", "Mains"] as const;
type Tab = (typeof TABS)[number];

const minsOf = (p: BankPaper) =>
  p.totalTimeMin || (p.sections ? p.sections.reduce((n, s) => n + (s.timeMin || 0), 0) : p.timeMin || 0);

export default function MockCards({ data }: { data: ExamData }) {
  const [tab, setTab] = useState<Tab>("Prelims Mocks");
  const [upsellOpen, setUpsellOpen] = useState(false);
  const { grants, email, signIn } = useBankAuth();

  // Server-verified access. Pass = every exam. Pro = this exam (topic tests are
  // tier-shared, so Pro covers them too). Free papers are open to everyone.
  const proHere = !!grants && (grants.pass || (grants.pro && grants.exams?.includes(data.meta.dir)));
  const proTier = !!grants && (grants.pass || grants.pro);

  const unlockedFor = (p: BankPaper, kind: "mock" | "sectional" | "topic") =>
    !!p.free || (kind === "topic" ? proTier : proHere);

  const Card = ({ p, title, kind }: { p: BankPaper; title: string; kind: "mock" | "sectional" | "topic" }) => {
    const open = unlockedFor(p, kind);
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 hover:shadow-md hover:border-blue-200 transition">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">Bilingual</span>
            {p.free ? (
              <span className="text-[10px] font-extrabold bg-green-100 text-green-700 rounded px-1.5 py-0.5">FREE</span>
            ) : !open ? (
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">🔒 PRO</span>
            ) : (
              <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">UNLOCKED</span>
            )}
          </div>
          <div className="font-bold text-[15px] text-slate-800 truncate">{title}</div>
          <div className="text-xs text-slate-400 mt-1">
            {p.questions} Ques <span className="mx-1">•</span> {minsOf(p)} Mins
          </div>
        </div>
        {open ? (
          <a
            href={`/bank/mock/${p.id}`}
            className="shrink-0 flex flex-col items-center gap-1 text-blue-600"
          >
            <span className="bg-blue-600 text-white rounded-lg w-9 h-9 flex items-center justify-center font-black">➜</span>
            <span className="text-[10px] font-bold tracking-wide">ATTEMPT</span>
          </a>
        ) : (
          <button
            onClick={() => setUpsellOpen(true)}
            className="shrink-0 flex flex-col items-center gap-1 text-slate-400"
          >
            <span className="bg-slate-200 text-slate-500 rounded-lg w-9 h-9 flex items-center justify-center font-black">🔒</span>
            <span className="text-[10px] font-bold tracking-wide">UNLOCK</span>
          </button>
        )}
      </div>
    );
  };

  // ── Tab bodies ──────────────────────────────────────────────────────────
  const Prelims = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.prelims.map((p, i) => (
        <Card
          key={p.id}
          p={p}
          kind="mock"
          title={`${data.meta.label} Prelims Full Mock Test-${String(p.mock ?? i + 1).padStart(2, "0")}`}
        />
      ))}
    </div>
  );

  const [topicKey, setTopicKey] = useState<string>("");
  const topic = useMemo(
    () => data.topics.find((t) => (t.key || t.name) === topicKey) || data.topics[0],
    [data.topics, topicKey]
  );
  const Topics = () =>
    data.topics.length === 0 ? (
      <Empty text="Topic tests are being prepared." />
    ) : (
      <div>
        <select
          value={topic ? topic.key || topic.name : ""}
          onChange={(e) => setTopicKey(e.target.value)}
          className="mb-4 w-full md:w-96 bg-white border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700"
        >
          {data.topics.map((t) => (
            <option key={t.key || t.name} value={t.key || t.name}>
              {t.name} ({t.papers.length} tests)
            </option>
          ))}
        </select>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(topic?.papers || []).map((p, i) => (
            <Card key={p.id} p={p} kind="topic" title={`${topic!.name} — Test ${String(p.n ?? i + 1).padStart(2, "0")}`} />
          ))}
        </div>
      </div>
    );

  const SECTION_LABEL: Record<string, string> = {
    quant: "Quantitative Aptitude",
    reasoning: "Reasoning Ability",
    english: "English Language",
  };
  const Sectionals = () =>
    data.sectionals.length === 0 ? (
      <Empty text="Sectional tests are being prepared." />
    ) : (
      <div className="space-y-6">
        {data.sectionals.map((t) => (
          <div key={t.section || t.name}>
            <h3 className="font-extrabold text-slate-700 mb-3">
              {SECTION_LABEL[t.section || ""] || t.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {t.papers.map((p, i) => (
                <Card
                  key={p.id}
                  p={p}
                  kind="sectional"
                  title={`${data.meta.label} ${SECTION_LABEL[t.section || ""] || t.name} Sectional-${String(p.n ?? i + 1).padStart(2, "0")}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );

  const Mains = () =>
    data.mains.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.mains.map((p, i) => (
          <Card key={p.id} p={p} kind="mock" title={`${data.meta.label} Mains Full Mock Test-${String(p.mock ?? i + 1).padStart(2, "0")}`} />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: data.mainsTarget }, (_, i) => (
          <div key={i} className="bg-white/60 rounded-2xl border border-dashed border-slate-200 p-4">
            <div className="font-bold text-[15px] text-slate-400">
              {data.meta.label} Mains Full Mock Test-{String(i + 1).padStart(2, "0")}
            </div>
            <div className="text-xs text-slate-300 mt-1">Coming soon</div>
          </div>
        ))}
      </div>
    );

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === t ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Prelims Mocks" && <Prelims />}
      {tab === "Topic Tests" && <Topics />}
      {tab === "Sectional Tests" && <Sectionals />}
      {tab === "Mains" && <Mains />}

      {/* ── Unlock sheet: purchases happen ONLY in the app ── */}
      {upsellOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setUpsellOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="text-lg font-black text-slate-800 mb-1">Unlock all {data.meta.label} mocks</h3>
            <p className="text-sm text-slate-500 mb-4">
              Get <b>Bank Pro (₹199)</b> for every {data.meta.label} test, or <b>Bank Pass (₹299)</b> for
              all 6 bank exams. Purchases are made <b>only in the {data.meta.label} app</b> — then sign in
              here with the same Google account and everything unlocks on this website too.
            </p>
            {/* Each exam has its OWN app — link its Play listing, never a generic app. */}
            <a
              href={`https://play.google.com/store/apps/details?id=${data.meta.pkg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-blue-600 text-white font-extrabold rounded-xl px-4 py-3 mb-2 hover:bg-blue-700"
            >
              Get the {data.meta.label} app on Google Play
            </a>
            {!email && (
              <button
                onClick={() => { setUpsellOpen(false); signIn(); }}
                className="block w-full text-center border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-3 hover:bg-slate-50"
              >
                Already bought? Sign in
              </button>
            )}
            <button onClick={() => setUpsellOpen(false)} className="block mx-auto mt-3 text-xs text-slate-400 hover:text-slate-600">
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="text-center text-slate-400 py-16">{text}</div>;
}
