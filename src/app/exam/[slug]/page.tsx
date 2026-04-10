import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, getExamBySlug } from "@/lib/exams";
import { getTopicsForExam, topicSlug } from "@/lib/topics";
import { PYQ_EXAMS } from "@/lib/pyq";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return EXAMS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = getExamBySlug(slug);
  if (!exam) return {};
  return {
    title: `${exam.en} GK Questions ${new Date().getFullYear()} - Topics, PYQ & Mock Tests`,
    description: `Free ${exam.fullName} (${exam.en}) GK preparation. Practice topic-wise questions, previous year papers & mock tests with answers.`,
    alternates: { canonical: `https://studyvirus.com/exam/${slug}` },
  };
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params;
  const exam = getExamBySlug(slug);
  if (!exam) notFound();

  const { primary: primaryTopics, other: otherTopics } = getTopicsForExam(exam.id);
  const pyqExam = exam.pyqSlug ? PYQ_EXAMS.find(p => p.slug === exam.pyqSlug) : null;
  const totalChapters = primaryTopics.reduce((s, t) => s + t.chapters.length, 0);

  const examFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How many GK topics are important for ${exam.en}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `There are ${primaryTopics.length} important GK topics for ${exam.en} (${exam.fullName}), covering ${totalChapters} chapters with questions and detailed explanations.`,
        },
      },
      {
        "@type": "Question",
        name: `Where can I practice ${exam.en} previous year papers?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: pyqExam
            ? `You can practice ${pyqExam.sets} sets of ${exam.en} previous year GK questions on StudyVirus, with 40 questions per set and detailed answers.`
            : `Previous year papers for ${exam.en} are coming soon on StudyVirus. Meanwhile, practice topic-wise questions.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${exam.en} GK practice free on StudyVirus?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, all ${exam.en} GK questions, notes, one-liners, and previous year papers on StudyVirus are completely free with detailed explanations in English and Hindi.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(examFaqJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Exams", href: "/exam" },
          { label: exam.en },
        ]}
      />

      {/* Hero */}
      <div className="rounded-2xl p-6 md:p-8 mb-8 text-white" style={{ background: `linear-gradient(135deg, ${exam.color}, ${exam.color}dd)` }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{exam.icon}</span>
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{exam.en} GK {new Date().getFullYear()}</h1>
            <p className="text-white/80 text-sm">{exam.fullName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">{primaryTopics.length} Important Topics</span>
          <span className="bg-white/20 px-3 py-1 rounded-full">{totalChapters} Chapters</span>
          {pyqExam && <span className="bg-white/20 px-3 py-1 rounded-full">{pyqExam.sets} PYQ Sets</span>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          href="#topics"
          className="bg-white rounded-xl p-4 border border-slate-100 text-center hover:shadow-md transition card-hover"
        >
          <span className="text-2xl block mb-1">📚</span>
          <p className="font-bold text-sm text-primary">Topics</p>
          <p className="text-xs text-slate-400">{primaryTopics.length} subjects</p>
        </Link>
        {pyqExam ? (
          <Link
            href={`/pyq/${pyqExam.slug}`}
            className="bg-white rounded-xl p-4 border border-slate-100 text-center hover:shadow-md transition card-hover"
          >
            <span className="text-2xl block mb-1">📄</span>
            <p className="font-bold text-sm text-primary">PYQ Papers</p>
            <p className="text-xs text-slate-400">{pyqExam.sets} sets</p>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-4 border border-slate-100 text-center opacity-50">
            <span className="text-2xl block mb-1">📄</span>
            <p className="font-bold text-sm text-primary">PYQ Papers</p>
            <p className="text-xs text-slate-400">Coming soon</p>
          </div>
        )}
      </div>

      <AdSlot slot="inArticle1" />

      {/* Primary Topics */}
      <section id="topics" className="mb-10">
        <h2 className="text-xl font-black text-primary mb-4">
          Important Topics for {exam.en}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {primaryTopics.map((t) => (
            <Link
              key={t.key}
              href={`/topics/${topicSlug(t.key)}`}
              className="rounded-xl p-4 border-2 transition group card-hover"
              style={{
                backgroundColor: `${t.accent}08`,
                borderColor: `${t.accent}20`,
              }}
            >
              <span className="text-2xl block mb-1">{t.emoji}</span>
              <h3 className="font-bold text-sm text-primary group-hover:text-accent transition leading-tight">
                {t.en.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{t.chapters.length} chapters</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PYQ Section */}
      {pyqExam && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-primary">{exam.en} Previous Year Papers</h2>
            <Link href={`/pyq/${pyqExam.slug}`} className="text-accent font-semibold text-sm hover:underline">
              All {pyqExam.sets} Sets &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
            {Array.from({ length: Math.min(12, pyqExam.sets) }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={`/pyq/${pyqExam.slug}/set-${n}`}
                className="bg-white rounded-lg p-3 border border-slate-100 text-center hover:border-blue-200 hover:shadow-sm transition font-semibold text-sm text-primary hover:text-accent"
              >
                Set {n}
              </Link>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="inArticle2" />

      {/* Other GK Topics */}
      {otherTopics.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-primary mb-4">Other GK Topics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {otherTopics.slice(0, 10).map((t) => (
              <Link
                key={t.key}
                href={`/topics/${topicSlug(t.key)}`}
                className="bg-white rounded-xl p-3 border border-slate-100 hover:border-blue-200 transition group card-hover"
              >
                <span className="text-xl mr-2">{t.emoji}</span>
                <span className="font-semibold text-xs text-primary group-hover:text-accent transition">
                  {t.en.name}
                </span>
              </Link>
            ))}
          </div>
          <Link href="/topics" className="text-accent font-semibold text-sm hover:underline mt-3 inline-block">
            View All Topics &rarr;
          </Link>
        </section>
      )}

      {/* SEO text */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="text-lg font-bold text-primary mb-3">About {exam.en} GK Preparation</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Prepare for {exam.fullName} ({exam.en}) with StudyVirus. Practice {primaryTopics.length} important topics including {primaryTopics.slice(0, 5).map(t => t.en.name).join(', ')} and more.
          All questions come with detailed explanations in English and Hindi.
          {pyqExam ? ` Solve ${pyqExam.sets} previous year question sets with ${pyqExam.sets * 40} questions.` : ''}
        </p>
      </section>
    </>
  );
}
