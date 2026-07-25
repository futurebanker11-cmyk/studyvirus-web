// studyvirus.com/bank — Bank Mock Tests landing.
//
// Server-rendered (SEO) with live counts from the mock manifest. Layout per the
// locked product design: account bar with SIGN IN top-right, then the 2×3 exam
// grid —
//   SBI Clerk   SBI PO
//   RRB Clerk   RRB PO
//   IBPS Clerk  IBPS PO
// — then FAQs (also emitted as FAQPage schema for rich results).
// Clicking an exam opens /bank/<exam> with the Prelims/Topic/Sectional/Mains
// tabs. The CBT player itself is the React-Native app served at /bank/mock/*.
import type { Metadata } from "next";
import { loadBankManifest, BANK_EXAMS } from "@/lib/bankCatalog";
import { BankAuthProvider, BankBar } from "@/components/bank/BankAuth";

export const metadata: Metadata = {
  title: "Bank Mock Tests 2026 — SBI, IBPS & RRB Free Online Mock Test Series",
  description:
    "Free full-length bank exam mock tests online: SBI Clerk, SBI PO, IBPS Clerk, IBPS PO, RRB Clerk, RRB PO. Real exam-pattern CBT with sectional & topic tests, bilingual (English/Hindi).",
  alternates: { canonical: "https://studyvirus.com/bank" },
};

export const revalidate = 300;

// Our Play Store developer page — every bank exam's app lives here.
const DEV_STORE_URL = "https://play.google.com/store/apps/developer?id=Manmeet+Kumar";

const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  {
    q: "Are these bank mock tests free?",
    a: "Yes — the first full mock of every exam is completely free, no sign-in needed. The remaining mocks, sectional tests and topic tests unlock with Bank Pro (₹199, one exam) or Bank Pass (₹299, all 6 bank exams).",
  },
  {
    q: "How can I purchase the mock tests?",
    a: "Purchases are made in our Android apps: open our Play Store page, install the app of your exam (SBI Clerk, SBI PO, IBPS Clerk, IBPS PO, RRB Clerk or RRB PO), and buy Bank Pro (₹199) or Bank Pass (₹299) inside the app. Then sign in on this website with the same Google account — all your mocks unlock here and you can start writing them.",
    link: { href: DEV_STORE_URL, label: "Open our Play Store page →" },
  },
  {
    q: "I bought Bank Pro in the app. How do I use it on my laptop?",
    a: "Click Sign in (top right) and use the same Google account you use in the app. Your purchase is linked to your account, so your mocks unlock on this website instantly — no code, no extra payment.",
  },
  {
    q: "Do the mocks follow the real exam pattern?",
    a: "Yes. Each paper mirrors the latest official pattern — SBI/IBPS Prelims run 100 questions in 60 minutes with per-section timing, and IBPS RRB Prelims runs 80 questions in a single 45-minute window, exactly like the real CBT.",
  },
  {
    q: "Are the tests available in Hindi?",
    a: "Every test is fully bilingual — switch between English and हिंदी inside the test at any time.",
  },
  {
    q: "Is there negative marking?",
    a: "Yes, the real exam scheme applies: +1 for a correct answer and −0.25 for a wrong one, with detailed solutions and analysis after every test.",
  },
];

export default async function BankLandingPage() {
  const m = await loadBankManifest();
  const countFor = (dir: string) => {
    const ex = m?.exams.find((e) => e.dir === dir && (e.type || "prelims") === "prelims");
    const free = ex ? ex.papers.filter((p) => p.free).length : 1;
    return { total: ex ? ex.papers.length : 30, free };
  };

  return (
    <BankAuthProvider>
      <BankBar />

      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800">
          Bank Exam Mock Tests <span className="text-blue-600">2026</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Real exam-pattern CBT mocks · Bilingual · Free mock in every exam
        </p>
      </div>

      {/* 3×2 exam grid — 3 across on desktop (6 exams = 2 rows), 2 on tablet,
          1 on mobile. Fills the shell width so edges line up with header/FAQs. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12">
        {BANK_EXAMS.map((e) => {
          const c = countFor(e.dir);
          return (
            <a
              key={e.dir}
              href={`/bank/${e.dir}`}
              className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 hover:shadow-lg hover:border-blue-200 transition text-center"
            >
              <div className="text-4xl mb-3">{e.emoji}</div>
              <div className="font-black text-slate-800 text-lg sm:text-xl">{e.label}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">
                {c.total} mocks · <span className="text-green-600 font-bold">{c.free} free</span>
              </div>
              <div className="mt-4 inline-block bg-blue-50 text-blue-700 text-xs sm:text-sm font-extrabold rounded-full px-4 py-2">
                View tests →
              </div>
            </a>
          );
        })}
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

      {/* FAQ rich-result schema */}
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
