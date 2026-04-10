import { notFound } from "next/navigation";
import { fetchArticleIndex, fetchArticleContent } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articles = await fetchArticleIndex();
  const article = articles.find((a) => a.id === slug);
  if (!article) return {};
  return {
    title: `${article.en} - Study Article`,
    description: `Read: ${article.en}. Free study material for SSC, Railway, UPSC & competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/articles/${slug}` },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const articles = await fetchArticleIndex();
  const article = articles.find((a) => a.id === slug);
  if (!article) notFound();

  const content = await fetchArticleContent(article.file);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Articles", href: "/articles" },
          { label: article.en },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">{article.en}</h1>
      <p className="text-slate-500 mb-6">{article.hi}</p>

      {/* Article structured data for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.en,
            description: `Read: ${article.en}. Free study material for SSC, Railway, UPSC & competitive exams.`,
            url: `https://studyvirus.com/articles/${slug}`,
            publisher: {
              "@type": "Organization",
              name: "StudyVirus",
              logo: { "@type": "ImageObject", url: "https://studyvirus.com/og-image.png" },
            },
            mainEntityOfPage: `https://studyvirus.com/articles/${slug}`,
          }),
        }}
      />

      <AdSlot slot="inArticle1" />

      {content && content.paragraphs ? (
        <article className="prose prose-slate max-w-none">
          {content.paragraphs.map((p, i) => {
            const el = p.type === "heading"
              ? <h2 key={i} className="text-xl font-bold text-primary mt-8 mb-3">{p.en}</h2>
              : <p key={i} className="text-slate-700 leading-relaxed mb-4">{p.en}</p>;
            return (
              <div key={i}>
                {el}
                {i === Math.floor((content.paragraphs?.length || 0) / 2) && (
                  <AdSlot slot="inArticle2" />
                )}
              </div>
            );
          })}
        </article>
      ) : (
        <p className="text-slate-400">Content loading...</p>
      )}
    </>
  );
}
