import Link from "next/link";
import { notFound } from "next/navigation";
import { ENGLISH_SECTIONS, chapterSlugEn } from "@/lib/english";
import { fetchQuestionsBilingual } from "@/lib/api";
import { getSetCount, SET_SIZE } from "@/lib/topics";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ section: string; chapter: string }>;
}

export function generateStaticParams() {
  const params: { section: string; chapter: string }[] = [];
  for (const s of ENGLISH_SECTIONS) {
    for (const ch of s.chapters) {
      params.push({ section: s.key, chapter: chapterSlugEn(ch.en) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: sKey, chapter: chSlug } = await params;
  const sec = ENGLISH_SECTIONS.find(s => s.key === sKey);
  if (!sec) return {};
  const ch = sec.chapters.find(c => chapterSlugEn(c.en) === chSlug);
  if (!ch) return {};
  return {
    title: `${ch.en} - English Grammar Questions with Answers`,
    description: `Practice ${ch.en} questions for competitive exams. MCQs with explanations for SSC, Railway, Police & all exams.`,
    alternates: { canonical: `https://studyvirus.com/english/${sKey}/${chSlug}` },
  };
}

export default async function EnglishChapterPage({ params }: Props) {
  const { section: sKey, chapter: chSlug } = await params;
  const sec = ENGLISH_SECTIONS.find(s => s.key === sKey);
  if (!sec) notFound();
  const ch = sec.chapters.find(c => chapterSlugEn(c.en) === chSlug);
  if (!ch) notFound();

  const { en: questions } = await fetchQuestionsBilingual(sec.folder, ch.file);
  const totalSets = getSetCount(questions.length);
  const baseUrl = `/english/${sKey}/${chSlug}`;

  // Adjacent chapter nav
  const chIdx = sec.chapters.findIndex(c => chapterSlugEn(c.en) === chSlug);
  const prevCh = chIdx > 0 ? sec.chapters[chIdx - 1] : null;
  const nextCh = chIdx < sec.chapters.length - 1 ? sec.chapters[chIdx + 1] : null;

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "English", href: "/english" },
          { label: sec.en.name },
          { label: ch.en },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">{ch.en}</h1>
      <p className="text-slate-500 text-sm mb-6">{ch.hi} · {questions.length} questions · {totalSets} sets</p>

      <AdSlot slot="inArticle1" />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: totalSets }, (_, i) => i + 1).map((n) => {
          const startQ = (n - 1) * SET_SIZE + 1;
          const endQ = Math.min(n * SET_SIZE, questions.length);
          return (
            <Link key={n} href={`${baseUrl}/set-${n}`} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition card-hover text-center">
              <p className="text-lg font-bold text-primary">{`Set ${n}`}</p>
              <p className="text-xs text-slate-400 mt-1">Q {startQ}–{endQ}</p>
            </Link>
          );
        })}
      </div>

      {totalSets > 0 && (
        <Link href={`${baseUrl}/set-1`} className="block w-full bg-accent text-white text-center py-3.5 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md mb-6">
          Start Set 1
        </Link>
      )}

      <AdSlot slot="inArticle2" />

      {/* Nav */}
      <div className="flex gap-3 mt-6">
        {prevCh && (
          <Link href={`/english/${sKey}/${chapterSlugEn(prevCh.en)}`} className="flex-1 bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition group">
            <p className="text-xs text-slate-400">Previous</p>
            <p className="font-semibold text-sm text-primary group-hover:text-accent truncate">{prevCh.en}</p>
          </Link>
        )}
        {nextCh && (
          <Link href={`/english/${sKey}/${chapterSlugEn(nextCh.en)}`} className="flex-1 bg-white rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition group text-right">
            <p className="text-xs text-slate-400">Next</p>
            <p className="font-semibold text-sm text-primary group-hover:text-accent truncate">{nextCh.en}</p>
          </Link>
        )}
      </div>
    </>
  );
}
