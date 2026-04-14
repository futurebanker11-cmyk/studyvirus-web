import Link from "next/link";
import { getVisibleTopics, topicSlug, getTotalChapters, TOPICS } from "@/lib/topics";
import { PYQ_EXAMS } from "@/lib/pyq";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "200,000+ Free GK Questions & Mock Tests | StudyVirus",
  description:
    "Practice 200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams. Free quizzes, mock tests, PYQ papers & daily current affairs.",
  alternates: { canonical: "https://studyvirus.com" },
};

const EXAM_PILLS = [
  { label: "SSC CGL",     href: "/exam/ssc-cgl" },
  { label: "SSC GD",      href: "/exam/ssc-gd" },
  { label: "SSC CHSL",    href: "/exam/ssc-chsl" },
  { label: "RRB NTPC",    href: "/exam/rrb-ntpc" },
  { label: "RRB Group D", href: "/exam/rrb-group-d" },
  { label: "Delhi Police",href: "/exam/delhi-police" },
  { label: "UP Police",   href: "/exam/up-police" },
  { label: "NDA",         href: "/exam/nda" },
  { label: "UPSC",        href: "/exam/upsc" },
  { label: "Bihar Police",href: "/exam/bihar-police" },
];

const EXAM_GROUPS = [
  {
    cat: "Railway", icon: "🚆",
    gradient: "from-[#b91c1c] to-[#dc2626]",
    exams: [
      { name: "RRB NTPC",    href: "/exam/rrb-ntpc" },
      { name: "RRB Group D", href: "/exam/rrb-group-d" },
      { name: "RRB ALP",     href: "/exam/rrb-alp" },
      { name: "RPF",         href: "/exam/rpf" },
    ],
  },
  {
    cat: "SSC", icon: "📋",
    gradient: "from-[#1d4ed8] to-[#3b82f6]",
    exams: [
      { name: "SSC CGL",  href: "/exam/ssc-cgl" },
      { name: "SSC CHSL", href: "/exam/ssc-chsl" },
      { name: "SSC GD",   href: "/exam/ssc-gd" },
      { name: "SSC MTS",  href: "/exam/ssc-mts" },
      { name: "SSC CPO",  href: "/exam/ssc-cpo" },
    ],
  },
  {
    cat: "Police", icon: "👮",
    gradient: "from-[#5b21b6] to-[#7c3aed]",
    exams: [
      { name: "Delhi Police", href: "/exam/delhi-police" },
      { name: "UP Police",    href: "/exam/up-police" },
      { name: "Bihar Police", href: "/exam/bihar-police" },
    ],
  },
  {
    cat: "Defence & UPSC", icon: "🎖️",
    gradient: "from-[#065f46] to-[#059669]",
    exams: [
      { name: "NDA",  href: "/exam/nda" },
      { name: "UPSC", href: "/exam/upsc" },
      { name: "CDS",  href: "/exam/cds" },
    ],
  },
];

const TOP_PYQ = PYQ_EXAMS.slice(0, 6);

function estimateQuestions(chapterCount: number): string {
  const est = chapterCount * 40;
  if (est >= 1000) return `${(est / 1000).toFixed(1)}K`;
  return `${est}+`;
}

export default function HomePage() {
  const topics    = getVisibleTopics();
  const totalChapters   = getTotalChapters();
  const totalQuestions  = TOPICS.reduce((s, t) => s + t.chapters.length * 40, 0);

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
            description: "India's largest free GK question bank with 200,000+ questions, mock tests, PYQ papers and current affairs for SSC, Railway, UPSC, Police and State exams.",
            inLanguage: ["en", "hi"],
            publisher: {
              "@type": "Organization",
              name: "StudyVirus",
              url: "https://studyvirus.com",
              logo: "https://studyvirus.com/og-image.png",
            },
          }),
        }}
      />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden rounded-3xl mb-10 hero-dark px-6 py-12 md:px-10 md:py-16 text-center">
        {/* Ambient glow orbs */}
        <div className="absolute top-0 left-1/4 w-[480px] h-[380px] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[360px] h-[280px] bg-indigo-500/15 rounded-full blur-[70px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[180px] bg-emerald-500/8 rounded-full blur-[60px] pointer-events-none" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 text-blue-300 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 animate-fade-up">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            India&apos;s #1 Free GK Platform · 10 Lakh+ Students
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5 animate-fade-up-delay-1">
            Crack Your Exam with<br />
            <span className="text-gradient-blue">200,000+ Questions</span>
          </h1>

          <p className="text-slate-500 text-base md:text-lg mb-8 max-w-lg mx-auto animate-fade-up-delay-2">
            Free GK for SSC, Railway, UPSC, Police &amp; 50+ exams — answers &amp; explanations in English and हिंदी.
          </p>

          {/* Exam pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xl mx-auto animate-fade-up-delay-2">
            {EXAM_PILLS.map((e) => (
              <Link
                key={e.label}
                href={e.href}
                className="bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white px-3 py-1 rounded-full text-sm font-medium transition-all duration-200"
              >
                {e.label}
              </Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-3 animate-fade-up-delay-3">
            <Link
              href="/topics"
              className="bg-blue-500 hover:bg-blue-400 text-white px-8 py-3.5 rounded-full font-bold text-base transition-all shadow-lg shadow-blue-500/35 hover:shadow-blue-500/55 cursor-pointer"
            >
              Start Practicing →
            </Link>
            <Link
              href="/pyq"
              className="bg-white/10 hover:bg-white/18 border border-white/20 hover:border-white/35 text-white px-8 py-3.5 rounded-full font-bold text-base transition-all backdrop-blur-sm"
            >
              PYQ Papers
            </Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="grid grid-cols-4 gap-2.5 md:gap-4 mb-10">
        {[
          { num: `${Math.round(totalQuestions / 1000)}K+`, label: "Questions",  gradient: "from-blue-500 to-blue-600" },
          { num: `${topics.length}`,                       label: "Topics",     gradient: "from-violet-500 to-indigo-600" },
          { num: `${totalChapters}+`,                      label: "Chapters",   gradient: "from-emerald-500 to-teal-600" },
          { num: "10L+",                                   label: "Students",   gradient: "from-amber-500 to-orange-500" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 md:p-5 text-center shadow-sm border border-slate-100 hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${s.gradient}`} />
            <p className={`text-xl md:text-3xl font-display font-black bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>
              {s.num}
            </p>
            <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 font-semibold uppercase tracking-wide">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="mb-10">
        <h2 className="font-display text-xl md:text-2xl font-black text-primary mb-6 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-2xl mx-auto">
          {[
            { step: "01", icon: "🎯", title: "Pick a Topic",  desc: "Choose from 35+ subjects" },
            { step: "02", icon: "✍️", title: "Solve Sets",    desc: "10 MCQs per set with answers" },
            { step: "03", icon: "📊", title: "See Score",     desc: "Instant results & explanations" },
          ].map((s) => (
            <div key={s.step} className="text-center group">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center text-2xl mx-auto mb-3 border border-accent/10 group-hover:border-accent/30 group-hover:shadow-md transition-all">
                {s.icon}
              </div>
              <div className="text-[10px] text-slate-500 font-bold tracking-widest mb-0.5">STEP {s.step}</div>
              <h3 className="font-display font-bold text-sm md:text-base text-primary">{s.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <AdSlot slot="inArticle1" />

      {/* ─── PICK YOUR EXAM ─── */}
      <section className="mb-10">
        <h2 className="font-display text-xl md:text-2xl font-black text-primary mb-5">Pick Your Exam</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EXAM_GROUPS.map((g) => (
            <div
              key={g.cat}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${g.gradient} p-5 shadow-lg`}
            >
              {/* Subtle grain */}
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  backgroundSize: "128px",
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="text-2xl">{g.icon}</span>
                  <h3 className="font-display font-black text-white text-lg">{g.cat}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {g.exams.map((e) => (
                    <Link
                      key={e.name}
                      href={e.href}
                      className="bg-white/15 hover:bg-white/25 border border-white/15 hover:border-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                    >
                      {e.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TOPICS GRID ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl md:text-2xl font-black text-primary">Popular Topics</h2>
          <Link href="/topics" className="text-accent font-semibold text-sm hover:underline">
            All {topics.length} Topics →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {topics.slice(0, 15).map((t) => (
            <Link
              key={t.key}
              href={`/topics/${topicSlug(t.key)}`}
              className="bg-white rounded-2xl p-4 border-2 transition group card-hover relative overflow-hidden"
              style={{ borderColor: `${t.accent}1a` }}
            >
              <div
                className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl"
                style={{ background: t.accent }}
              />
              <span className="text-2xl md:text-3xl block mb-2">{t.emoji}</span>
              <h3 className="font-display font-bold text-sm text-primary group-hover:text-accent transition leading-tight">
                {t.en.name}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {t.chapters.length} ch · {estimateQuestions(t.chapters.length)} Qs
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── PYQ ─── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl md:text-2xl font-black text-primary">Previous Year Papers</h2>
          <Link href="/pyq" className="text-accent font-semibold text-sm hover:underline">
            All 13 Exams →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TOP_PYQ.map((e) => (
            <Link
              key={e.id}
              href={`/pyq/${e.slug}`}
              className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
            >
              <h3 className="font-display font-bold text-primary text-sm md:text-base group-hover:text-accent transition">
                {e.en}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{e.sets} sets · {e.sets * 40} Qs</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-accent font-bold">
                Practice
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <AdSlot slot="inArticle2" />

      {/* ─── FEATURES ─── */}
      <section className="mb-10">
        <h2 className="font-display text-xl md:text-2xl font-black text-primary mb-5">Everything You Need</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "📝", title: "Topic Quizzes",   desc: `${topics.length} topics, ${totalChapters}+ chapters`, href: "/topics",          gradient: "from-blue-500 to-blue-700",    shadow: "hover:shadow-blue-500/25" },
            { icon: "📄", title: "PYQ Papers",      desc: "13 exams, 389 sets",                                  href: "/pyq",             gradient: "from-violet-500 to-purple-700", shadow: "hover:shadow-purple-500/25" },
            { icon: "🔤", title: "English",          desc: "Basic + Advanced grammar",                            href: "/english",         gradient: "from-amber-500 to-orange-600",  shadow: "hover:shadow-amber-500/25" },
            { icon: "📰", title: "Current Affairs",  desc: "Daily & monthly updates",                             href: "/current-affairs", gradient: "from-emerald-500 to-green-700", shadow: "hover:shadow-emerald-500/25" },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={`relative overflow-hidden bg-gradient-to-br ${f.gradient} text-white rounded-2xl p-5 hover:shadow-xl ${f.shadow} transition-all hover:brightness-110 cursor-pointer group`}
            >
              <span className="text-2xl md:text-3xl block mb-3">{f.icon}</span>
              <h3 className="font-display font-black text-sm md:text-base mb-1">{f.title}</h3>
              <p className="text-white/70 text-xs md:text-sm">{f.desc}</p>
              <span className="absolute bottom-4 right-4 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all text-base">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── APP CTA ─── */}
      <section className="mb-10 relative overflow-hidden hero-dark rounded-3xl p-6 md:p-10">
        <div className="absolute top-0 right-0 w-[320px] h-[320px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-[220px] h-[220px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 text-amber-300 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              ⭐ 4.5 Rating · 10L+ Downloads
            </div>
            <h2 className="font-display text-xl md:text-2xl lg:text-3xl font-black text-white mb-2">
              Study Smarter with the App
            </h2>
            <p className="text-slate-500 text-sm">Flash Cards, 1v1 Battles, Offline Mode, Leaderboard &amp; more.</p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=gk.gkinhindi.currentaffairs"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-white text-primary px-6 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-xl flex items-center gap-2.5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
            </svg>
            Download Free
          </a>
        </div>
      </section>

      {/* ─── SEO TEXT ─── */}
      <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 mb-8">
        <h2 className="font-display text-lg font-bold text-primary mb-3">About StudyVirus</h2>
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
