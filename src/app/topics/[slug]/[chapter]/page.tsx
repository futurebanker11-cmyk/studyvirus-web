import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug, topicSlug, chapterSlug, getVisibleTopics, getSetCount, SET_SIZE, getAdjacentChapters } from "@/lib/topics";
import { fetchQuestionsBilingual } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import NavButtons from "@/components/NavButtons";
import StudyTabs from "@/components/StudyTabs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export async function generateStaticParams() {
  const params: { slug: string; chapter: string }[] = [];
  for (const t of getVisibleTopics()) {
    for (const ch of t.chapters) {
      params.push({ slug: topicSlug(t.key), chapter: chapterSlug(ch.en) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter: chapterParam } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  const ch = topic.chapters.find((c) => chapterSlug(c.en) === chapterParam);
  if (!ch) return {};
  return {
    title: `${ch.en} - ${topic.en.name} GK Questions with Answers`,
    description: `Practice ${ch.en} questions from ${topic.en.name}. Multiple sets of 10 MCQs each with detailed explanations for competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/topics/${slug}/${chapterParam}` },
  };
}

export default async function ChapterPage({ params }: Props) {
  const { slug, chapter: chapterParam } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const ch = topic.chapters.find((c) => chapterSlug(c.en) === chapterParam);
  if (!ch) notFound();

  const { en: questions } = await fetchQuestionsBilingual(topic.folder, ch.file);
  const totalSets = getSetCount(questions.length);
  const baseUrl = `/topics/${slug}/${chapterParam}`;

  // Adjacent chapter navigation
  const { prev: prevCh, next: nextCh } = getAdjacentChapters(topic, ch.en);
  const prevNav = prevCh
    ? { href: `/topics/${slug}/${chapterSlug(prevCh.en)}`, label: prevCh.en }
    : null;
  const nextNav = nextCh
    ? { href: `/topics/${slug}/${chapterSlug(nextCh.en)}`, label: nextCh.en }
    : null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Topics", href: "/topics" },
          { label: topic.en.name, href: `/topics/${slug}` },
          { label: ch.en },
        ]}
      />

      <div className="flex items-center gap-3 mb-2">
        <span
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
          style={{ backgroundColor: topic.accent }}
        >
          {topic.emoji}
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-primary">{ch.en}</h1>
          <p className="text-slate-500 text-sm">{ch.hi} · {topic.en.name}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-4 ml-15">
        {questions.length} questions · {totalSets} {totalSets === 1 ? "set" : "sets"}
      </p>

      <StudyTabs baseUrl={baseUrl} active="quiz" />

      <AdSlot slot="inArticle1" />

      {/* Set grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
        {Array.from({ length: totalSets }, (_, i) => i + 1).map((n) => {
          const startQ = (n - 1) * SET_SIZE + 1;
          const endQ = Math.min(n * SET_SIZE, questions.length);
          return (
            <Link
              key={n}
              href={`${baseUrl}/set-${n}`}
              className="bg-white rounded-xl p-3 border-2 border-slate-100 hover:border-accent hover:shadow-lg transition-all group card-hover text-center"
            >
              <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-black text-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: topic.accent }}>
                {n}
              </div>
              <p className="text-xs font-semibold text-primary">Set {n}</p>
              <p className="text-[10px] text-slate-400">{endQ - startQ + 1} Qs</p>
            </Link>
          );
        })}
      </div>

      {totalSets > 0 && (
        <Link
          href={`${baseUrl}/set-1`}
          className="block w-full bg-accent text-white text-center py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 hover:shadow-lg mb-6"
        >
          Start Set 1
        </Link>
      )}

      <AdSlot slot="inArticle2" />

      <NavButtons prev={prevNav} next={nextNav} />
    </>
  );
}
