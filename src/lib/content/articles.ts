import { getJson } from "./loader";
import { keys } from "./keys";
import { hasKey, counts } from "./index";

export interface ArticleMeta { id: string; title_en: string; title_hi?: string; category: string; tag?: string; readTime?: number; views?: string; file: string }
export interface ArticleBody { id: string; paragraphs: { type?: string; en: string; hi?: string }[] }

export async function loadArticles(): Promise<ArticleMeta[]> {
  const idx = await getJson<{ articles: ArticleMeta[] }>(keys.articlesIndex());
  return (idx?.articles ?? []).filter((a) => hasKey(keys.article(a.file)));
}

export function findArticle(list: ArticleMeta[], id: string): ArticleMeta | undefined {
  return list.find((a) => a.id === id);
}

export function loadArticleBody(meta: ArticleMeta): Promise<ArticleBody | null> {
  return getJson<ArticleBody>(keys.article(meta.file));
}

export function articleHasHindi(meta: ArticleMeta): boolean {
  const c = counts(keys.article(meta.file));
  return Boolean(c && c[0] > 0 && c[1] === c[0]);
}
