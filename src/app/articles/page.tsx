import Link from "next/link";
import { fetchArticleIndex } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study Articles - Tips, Strategies & Guides for Competitive Exams",
  description:
    "Read free study articles with tips, strategies, syllabus guides & abbreviation lists for SSC, Railway, UPSC & all competitive exams.",
  alternates: { canonical: "https://studyvirus.com/articles" },
};

export default async function ArticlesPage() {
  const articles = await fetchArticleIndex();

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Articles" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">Study Articles</h1>
      <p className="text-slate-500 mb-8">Tips, strategies & study guides for exam preparation</p>

      <AdSlot slot="inArticle1" />

      {articles.length === 0 ? (
        <p className="text-slate-400 py-8 text-center">Articles coming soon!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.id}`}
              className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md hover:border-blue-200 transition"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">{a.category}</span>
              <h2 className="font-bold text-primary mt-1">{a.en}</h2>
              <p className="text-sm text-slate-400 mt-1">{a.hi}</p>
            </Link>
          ))}
        </div>
      )}

      <AdSlot slot="inArticle2" className="mt-6" />
    </>
  );
}
