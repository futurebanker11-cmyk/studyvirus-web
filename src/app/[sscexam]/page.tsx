// studyvirus.com/<exam> — the SSC / RRB mock portal landing page.
//
// ONE dynamic route serves all nine portals (/ssccgl, /rrbntpc …) rather than
// nine near-identical files. The bank is a single /bank listing six exams; these
// are separate apps with separate Play listings, so each exam gets its own URL,
// its own metadata and its own canonical.
//
// ⛔ generateStaticParams pins this route to the nine known slugs. Without it a
// top-level [sscexam] catch-all would swallow EVERY unmatched path on the site
// (/about, /contact …) — the middleware allowlist and this list must agree.
//
// Server-rendered with live counts from the manifest, so a publish is reflected
// within ~5 minutes with no redeploy, and "SSC CGL mock test" searches land here.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  loadSscManifest, examBySlug, countsFor, patternFor, SSC_EXAMS, stagesOf,
} from "@/lib/sscCatalog";
import { BankAuthProvider, BankBar } from "@/components/bank/BankAuth";
import SscMockCards from "@/components/ssc/SscMockCards";

export const revalidate = 300;

// Only these nine paths are this route's. Everything else falls through to the
// site's real pages.
export function generateStaticParams() {
  return SSC_EXAMS.map((e) => ({ sscexam: e.slug }));
}

const DEV_STORE_URL =
  "https://play.google.com/store/apps/developer?id=Manmeet+Kumar";

export async function generateMetadata(
  { params }: { params: Promise<{ sscexam: string }> },
): Promise<Metadata> {
  const { sscexam } = await params;
  const meta = examBySlug(sscexam);
  if (!meta) return {};
  return {
    title: `${meta.full} Mock Test 2026 — Free Online CBT Mock Test Series`,
    description:
      `Free ${meta.full} mock tests online: full-length exam-pattern CBT with sectional and topic tests, ` +
      `bilingual (English/Hindi), real timing and negative marking, with detailed solutions.`,
    alternates: { canonical: `https://studyvirus.com/${meta.slug}` },
  };
}

export default async function SscPortalPage(
  { params }: { params: Promise<{ sscexam: string }> },
) {
  const { sscexam } = await params;
  const meta = examBySlug(sscexam);
  if (!meta) notFound();

  const m = await loadSscManifest();
  const c = countsFor(m, meta);
  const pattern = patternFor(m, meta);

  // The real lists the tabs render. Topic tests are SHARED, so a topic scoped to
  // the other family (Railways GK is `exams:['rrb']`) must not appear here.
  // Full mocks carry a `stage` label when the exam is sat in more than one
  // (RRB NTPC: CBT-1 then CBT-2), so the list can head each group. A
  // single-stage exam yields one unlabelled group — the previous behaviour.
  const full = stagesOf(meta).flatMap((st) =>
    ((m?.exams || []).find((e) => e.dir === st.dir)?.papers || []).map((p) => ({
      ...p, stage: st.label,
    })),
  );
  const sectionals = (m?.sectionals || []).find((e) => e.dir === meta.dir)?.tracks || [];
  const topics = (m?.topics || []).filter(
    (t) => !Array.isArray(t.exams) || t.exams.includes(meta.family),
  );

  // ⛔ These are STAT cards, not links. They used to point at /<slug>/mocks/full
  // etc., which were never built — every card 404'd (reported live 2026-08-11).
  // The lists live in the tabs directly below, so there is nowhere to navigate.
  const cards = [
    {
      emoji: "📝",
      title: "Full Mocks",
      sub: c.full ? `${c.full} papers · ${c.fullFree} free` : "Coming soon",
      note: pattern
        ? `${pattern.questions}Q · ${pattern.durationMin} min${pattern.maxMarks ? ` · ${pattern.maxMarks} marks` : ""}`
        : "Full exam pattern",
      live: c.full > 0,
    },
    {
      emoji: "🎯",
      title: "Sectional Tests",
      sub: c.sectional ? `${c.sectionalSections} sections · ${c.sectional} tests` : "Coming soon",
      note: "One section at a time, real timing",
      live: c.sectional > 0,
    },
    {
      emoji: "💡",
      title: "Topic Tests",
      sub: c.topic ? `${c.topicTopics} topics · ${c.topic} sets` : "Coming soon",
      note: "25 questions · 25 minutes each",
      live: c.topic > 0,
    },
  ];

  const neg = pattern?.marking ? Math.abs(pattern.marking.wrong) : null;

  const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
    {
      q: `Are these ${meta.label} mock tests free?`,
      a: `The first paper of every set is completely free — no sign-in needed. The remaining full mocks, sectional tests and topic tests unlock with a yearly subscription bought inside the ${meta.label} Android app.`,
    },
    {
      q: "How can I purchase the mock tests?",
      a: `Purchases are made in our Android app: open our Play Store page, install the ${meta.label} app, and buy the yearly plan inside it. Then sign in on this website with the same Google account — all your mocks unlock here and you can start writing them on a bigger screen.`,
      link: { href: DEV_STORE_URL, label: "Open our Play Store page →" },
    },
    {
      q: "I bought the plan in the app. How do I use it on my laptop?",
      a: "Click Sign in (top right) and use the same Google account you use in the app. Your subscription is linked to your account, so your mocks unlock on this website instantly — no code, no extra payment.",
    },
    {
      q: "Do the mocks follow the real exam pattern?",
      a: pattern
        ? `Yes. Each paper mirrors the latest official pattern — ${pattern.questions} questions in ${pattern.durationMin} minutes${pattern.maxMarks ? `, out of ${pattern.maxMarks} marks` : ""}${neg != null ? `, with +${pattern.marking!.correct} for a correct answer and −${neg} for a wrong one` : ""}, exactly like the real CBT.`
        : "Yes. Every paper mirrors the latest official exam pattern, timing and marking scheme.",
    },
    {
      q: "Are the tests available in Hindi?",
      a: "Every test is fully bilingual — switch between English and हिंदी inside the test at any time.",
    },
    {
      q: "Is there negative marking?",
      a: neg != null
        ? `Yes, the real exam scheme applies: +${pattern!.marking!.correct} for a correct answer and −${neg} for a wrong one, with detailed solutions after every test.`
        : "Yes — the real exam's marking scheme applies, with detailed solutions after every test.",
    },
  ];

  return (
    <BankAuthProvider>
      {/* The shared account bar, branded for THIS exam — it read "BankPrep Mock
          Tests" on every SSC portal until the brand became a prop. */}
      <BankBar
        brand={`${meta.label} Mock Tests`}
        emoji={meta.emoji}
        href={`/${meta.slug}`}
      />

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{meta.emoji}</div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          {meta.full} Mock Tests <span className="text-blue-600">2026</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Real exam-pattern CBT · Bilingual · Free paper in every set
        </p>
        {pattern && (
          <div className="mt-4 inline-flex flex-wrap justify-center gap-2">
            {[
              `${pattern.questions} questions`,
              `${pattern.durationMin} minutes`,
              pattern.maxMarks ? `${pattern.maxMarks} marks` : null,
              neg != null ? `+${pattern.marking!.correct} / −${neg}` : null,
            ].filter(Boolean).map((chip) => (
              <span key={chip as string} className="bg-white border border-slate-200 rounded-full px-3 py-1 text-xs font-bold text-slate-600">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* The three products — always three across from `sm` up, so a laptop
          shows one clean row rather than a stacked column. */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
        {cards.map((card) => (
          <div
            key={card.title}
            className={
              "bg-white rounded-2xl border border-slate-100 p-6 sm:p-7 text-center " +
              (card.live ? "" : "opacity-60")
            }
          >
            <div className="text-4xl mb-3">{card.emoji}</div>
            <div className="font-black text-slate-800 text-lg sm:text-xl">{card.title}</div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1 font-semibold">{card.sub}</div>
            <div className="text-[11px] text-slate-400 mt-1">{card.note}</div>
          </div>
        ))}
      </div>

      {/* The actual tests — tabs, so nothing here can 404 */}
      <div className="mb-12">
        <SscMockCards
          slug={meta.slug}
          examDir={meta.dir}
          full={full}
          sectionals={sectionals}
          topics={topics}
        />
      </div>

      {/* Other exams */}
      <div className="mb-12">
        <h2 className="text-lg font-black text-slate-800 mb-3">Other exams</h2>
        <div className="flex flex-wrap gap-2">
          {SSC_EXAMS.filter((e) => e.slug !== meta.slug).map((e) => (
            <a
              key={e.slug}
              href={`/${e.slug}`}
              className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700 transition"
            >
              {e.emoji} {e.label}
            </a>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-3xl mx-auto mb-10">
        <h2 className="text-xl font-black text-slate-800 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="bg-white rounded-2xl border border-slate-100 p-4 group">
              <summary className="font-bold text-slate-700 cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-slate-300 group-open:rotate-180 transition">⌄</span>
              </summary>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{f.a}</p>
              {f.link && (
                <a
                  href={f.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm font-bold text-blue-600 hover:underline"
                >
                  {f.link.label}
                </a>
              )}
            </details>
          ))}
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </BankAuthProvider>
  );
}
