import Link from "next/link";
import { getVisibleTopics, topicSlug, getTotalChapters, TOPICS } from "@/lib/topics";
import { PYQ_EXAMS } from "@/lib/pyq";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StudyVirus - 200,000+ Free GK Questions for Competitive Exams",
  description:
    "Practice 200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams. Free quizzes, mock tests, PYQ papers & daily current affairs.",
  alternates: { canonical: "https://studyvirus.com" },
};

const EXAM_PILLS = [
  { label: "SSC CGL", href: "/exam/ssc-cgl", color: "bg-blue-600" },
  { label: "SSC GD", href: "/exam/ssc-gd", color: "bg-blue-500" },
  { label: "SSC CHSL", href: "/exam/ssc-chsl", color: "bg-sky-600" },
  { label: "RRB NTPC", href: "/exam/rrb-ntpc", color: "bg-red-600" },
  { label: "RRB Group D", href: "/exam/rrb-group-d", color: "bg-red-500" },
  { label: "Delhi Police", href: "/exam/delhi-police", color: "bg-indigo-600" },
  { label: "UP Police", href: "/exam/up-police", color: "bg-indigo-500" },
  { label: "NDA", href: "/exam/nda", color: "bg-emerald-700" },
  { label: "UPSC", href: "/exam/upsc", color: "bg-amber-700" },
  { label: "Bihar Police", href: "/exam/bihar-police", color: "bg-purple-600" },
];

const TOP_PYQ = PYQ_EXAMS.slice(0, 6);

// Estimate total questions: ~40 per chapter average
function estimateQuestions(chapterCount: number): string {
  const est = chapterCount * 40;
  if (est >= 1000) return `${(est / 1000).toFixed(1)}K`;
  return `${est}+`;
}

export default function HomePage() {
  const topics = getVisibleTopics();
  const totalChapters = getTotalChapters();
  const totalQuestions = TOPICS.reduce((s, t) => s + t.chapters.length * 40, 0);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "StudyVirus",
            url: "https://studyvirus.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://studyvirus.com/topics?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      {/* ─── HERO ─── */}
      <section className="relative text-center pt-10 pb-8 md:pt-16 md:pb-12">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-primary mb-4 leading-tight">
          Crack Your Exam with{" "}
          <span className="text-gradient">200,000+ Questions</span>
        </h1>
        <p className="text-base md:text-lg text-slate-500 mb-6 max-w-2xl mx-auto">
          Free GK practice for SSC, Railway, UPSC, Police & 50+ exams.
          With answers & explanations in English and Hindi.
        </p>

        {/* Exam pills — visible immediately */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xl mx-auto">
          {EXAM_PILLS.map((e) => (
            <Link
              key={e.label}
              href={e.href}
              className={`${e.color} text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-sm`}
            >
              {e.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/topics"
            className="bg-accent text-white px-7 py-3 rounded-full font-bold text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl"
          >
            Start Practicing
          </Link>
          <Link
            href="/pyq"
            className="bg-white text-primary px-7 py-3 rounded-full font-bold text-base border-2 border-slate-200 hover:border-accent hover:text-accent transition-all"
          >
            PYQ Papers
          </Link>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="bg-white rounded-2xl p-5 md:p-6 grid grid-cols-4 gap-2 md:gap-4 mb-10">
        {[
          { num: `${Math.round(totalQuestions / 1000)}K+`, label: "Questions", icon: "📝" },
          { num: `${topics.length}`, label: "Topics", icon: "📚" },
          { num: `${totalChapters}+`, label: "Chapters", icon: "📖" },
          { num: "10L+", label: "Students", icon: "👨‍🎓" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl md:rounded-2xl p-3 md:p-5 text-center shadow-sm border border-slate-100 card-hover">
            <span className="text-xl md:text-2xl block mb-1">{s.icon}</span>
            <p className="text-lg md:text-2xl font-black text-primary">{s.num}</p>
            <p className="text-[10px] md:text-sm text-slate-400">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="mb-10">
        <h2 className="text-xl md:text-2xl font-black text-primary mb-5 text-center">How It Works</h2>
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
          {[
            { step: "1", icon: "🎯", title: "Pick a Topic", desc: "Choose from 35+ subjects" },
            { step: "2", icon: "✍️", title: "Solve Sets", desc: "10 MCQs per set with answers" },
            { step: "3", icon: "📊", title: "See Score", desc: "Instant results & explanations" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-2xl md:text-3xl mx-auto mb-3 shadow-sm border border-accent/10">
                {s.icon}
              </div>
              <h3 className="font-bold text-sm md:text-base text-primary">{s.title}</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slot="inArticle1" />

      {/* ─── PICK YOUR EXAM ─── */}
      <div className="bg-white rounded-2xl p-5 md:p-6 mb-10">
      <section>
        <h2 className="text-xl md:text-2xl font-black text-primary mb-5">Pick Your Exam</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { cat: "Railway", color: "from-red-500 to-rose-600", icon: "🚆",
              exams: [
                { name: "RRB NTPC", href: "/exam/rrb-ntpc" },
                { name: "RRB Group D", href: "/exam/rrb-group-d" },
                { name: "RRB ALP", href: "/exam/rrb-alp" },
                { name: "RPF", href: "/exam/rpf" },
              ]},
            { cat: "SSC", color: "from-blue-500 to-indigo-600", icon: "📋",
              exams: [
                { name: "SSC CGL", href: "/exam/ssc-cgl" },
                { name: "SSC CHSL", href: "/exam/ssc-chsl" },
                { name: "SSC GD", href: "/exam/ssc-gd" },
                { name: "SSC MTS", href: "/exam/ssc-mts" },
                { name: "SSC CPO", href: "/exam/ssc-cpo" },
              ]},
            { cat: "Police", color: "from-indigo-600 to-purple-700", icon: "👮",
              exams: [
                { name: "Delhi Police", href: "/exam/delhi-police" },
                { name: "UP Police", href: "/exam/up-police" },
                { name: "Bihar Police", href: "/exam/bihar-police" },
              ]},
            { cat: "Defence & UPSC", color: "from-emerald-600 to-teal-700", icon: "🎖️",
              exams: [
                { name: "NDA", href: "/exam/nda" },
                { name: "UPSC", href: "/exam/upsc" },
                { name: "CDS", href: "/exam/cds" },
              ]},
          ].map((g) => (
            <div key={g.cat} className={`bg-gradient-to-br ${g.color} rounded-2xl p-5 text-white`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{g.icon}</span>
                <h3 className="font-bold text-lg">{g.cat}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {g.exams.map((e) => (
                  <Link
                    key={e.name}
                    href={e.href}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    {e.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* ─── TOPICS GRID ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black text-primary">Popular Topics</h2>
          <Link href="/topics" className="text-accent font-semibold text-sm hover:underline">
            All {topics.length} Topics &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {topics.slice(0, 15).map((t) => (
            <Link
              key={t.key}
              href={`/topics/${topicSlug(t.key)}`}
              className="rounded-2xl p-4 border-2 transition group card-hover"
              style={{
                backgroundColor: `${t.accent}08`,
                borderColor: `${t.accent}20`,
              }}
            >
              <span className="text-2xl md:text-3xl block mb-2">{t.emoji}</span>
              <h3 className="font-bold text-sm text-primary group-hover:text-accent transition leading-tight">
                {t.en.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.chapters.length} chapters · {estimateQuestions(t.chapters.length)} Qs
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── PYQ SECTION ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-black text-primary">Previous Year Papers</h2>
          <Link href="/pyq" className="text-accent font-semibold text-sm hover:underline">
            All 13 Exams &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TOP_PYQ.map((e) => (
            <Link
              key={e.id}
              href={`/pyq/${e.slug}`}
              className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition card-hover"
            >
              <h3 className="font-bold text-primary text-sm md:text-base">{e.en}</h3>
              <p className="text-xs text-slate-400 mt-1">{e.sets} sets · {e.sets * 40} questions</p>
              <div className="mt-2 text-xs text-accent font-semibold">Practice &rarr;</div>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="inArticle2" />

      {/* ─── FEATURES (replaces generic Quick Links) ─── */}
      <div className="bg-white rounded-2xl p-5 md:p-6 mb-10">
      <section>
        <h2 className="text-xl md:text-2xl font-black text-primary mb-5">Everything You Need</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "📝", title: "Topic Quizzes", desc: `${topics.length} topics, ${totalChapters}+ chapters`, href: "/topics", color: "from-blue-500 to-blue-600" },
            { icon: "📄", title: "PYQ Papers", desc: "13 exams, 389 sets", href: "/pyq", color: "from-purple-500 to-purple-600" },
            { icon: "🔤", title: "English", desc: "Basic + Advanced grammar", href: "/english", color: "from-amber-500 to-orange-600" },
            { icon: "📰", title: "Current Affairs", desc: "Daily & monthly updates", href: "/current-affairs", color: "from-emerald-500 to-green-600" },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={`bg-gradient-to-br ${f.color} text-white rounded-2xl p-4 md:p-5 hover:shadow-lg transition card-hover`}
            >
              <span className="text-2xl md:text-3xl block mb-2">{f.icon}</span>
              <h3 className="font-bold text-sm md:text-base mb-1">{f.title}</h3>
              <p className="text-white/70 text-xs md:text-sm">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>
      </div>

      {/* ─── APP DOWNLOAD CTA ─── */}
      <section className="mb-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-black mb-2">Get the StudyVirus App</h2>
            <p className="text-slate-300 text-sm mb-1">Flash Cards, 1v1 Battles, Offline Mode, Leaderboard & more</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">⭐ 4.5 Rating</span>
              <span className="flex items-center gap-1">📥 10L+ Downloads</span>
            </div>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=gk.gkinhindi.currentaffairs"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg shrink-0 flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
            Download Free
          </a>
        </div>
      </section>

      {/* ─── SEO TEXT ─── */}
      <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 mb-8">
        <h2 className="text-lg font-bold text-primary mb-3">About StudyVirus</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-2">
          StudyVirus is India&apos;s largest free GK question bank for competitive exam preparation. Whether you&apos;re preparing for SSC CGL, SSC CHSL, SSC MTS, SSC GD, RRB NTPC, RRB Group D, RRB ALP, RPF, Delhi Police, UP Police, Bihar Police, UPSC, NDA, CDS, CTET, or state-level exams — we have the questions you need.
        </p>
        <p className="text-slate-500 text-sm leading-relaxed">
          Our collection covers Indian History, Polity, Geography, Economics, Physics, Chemistry, Biology, Computer Science, Current Affairs, and 25+ more topics — all with detailed explanations in English and Hindi. Practice previous year papers, take mock tests, and read study articles to boost your preparation.
        </p>
      </section>
    </>
  );
}
