import { Question, MockTest, Article, ArticleContent } from './types';

const BASE_URL = 'https://gkquestionsguru.com/gk-data';

export interface BilingualQuestions {
  en: Question[];
  hi: Question[];
}

export async function fetchQuestions(folder: string, file: string): Promise<Question[]> {
  const { en } = await fetchQuestionsBilingual(folder, file);
  return en;
}

export async function fetchQuestionsBilingual(folder: string, file: string): Promise<BilingualQuestions> {
  try {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { en: [], hi: [] };
    const data = await res.json();
    if (Array.isArray(data)) return { en: data, hi: [] };
    return {
      en: Array.isArray(data.en) ? data.en : [],
      hi: Array.isArray(data.hi) ? data.hi : [],
    };
  } catch {
    return { en: [], hi: [] };
  }
}

export async function fetchMocks(examId: string): Promise<MockTest[]> {
  try {
    const res = await fetch(`${BASE_URL}/config/mocks/${examId}.json`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.mocks || [];
  } catch {
    return [];
  }
}

export async function fetchMockQuestions(file: string): Promise<Question[]> {
  try {
    const res = await fetch(`${BASE_URL}/mock-tests/${encodeURIComponent(file)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.en && Array.isArray(data.en)) return data.en;
    return [];
  } catch {
    return [];
  }
}

export async function fetchArticleIndex(): Promise<Article[]> {
  try {
    const res = await fetch(`${BASE_URL}/articles/index.json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles || [];
  } catch {
    return [];
  }
}

export async function fetchArticleContent(file: string): Promise<ArticleContent | null> {
  try {
    const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(file)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPYQQuestions(file: string): Promise<Question[]> {
  const { en } = await fetchPYQBilingual(file);
  return en;
}

export async function fetchPYQBilingual(file: string): Promise<BilingualQuestions> {
  try {
    const res = await fetch(`${BASE_URL}/24-Previous%20Year%20Papers/${encodeURIComponent(file)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { en: [], hi: [] };
    const data = await res.json();
    if (Array.isArray(data)) return { en: data, hi: [] };
    return {
      en: Array.isArray(data.en) ? data.en : [],
      hi: Array.isArray(data.hi) ? data.hi : [],
    };
  } catch {
    return { en: [], hi: [] };
  }
}

// Notes: structured bilingual content for a chapter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchNotes(folder: string, chapter: string): Promise<any> {
  const name = chapter.replace('.json', '');
  const urls = [
    `${BASE_URL}/notes/${encodeURIComponent(folder)}/${encodeURIComponent(name)}.json`,
    `${BASE_URL}/notes/${encodeURIComponent(folder)}/${encodeURIComponent(name.replace(/ /g, '-'))}.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      return await res.json();
    } catch { continue; }
  }
  return null;
}

// One-liners: array of bilingual fact objects or strings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchOneLiners(folder: string, chapter: string): Promise<any[]> {
  const name = chapter.replace('.json', '');
  const urls = [
    `${BASE_URL}/oneliners/${encodeURIComponent(folder)}/${encodeURIComponent(name)}.json`,
    `${BASE_URL}/oneliners/${encodeURIComponent(folder)}/${encodeURIComponent(name.replace(/ /g, '-'))}.json`,
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return [];
    } catch { continue; }
  }
  return [];
}
