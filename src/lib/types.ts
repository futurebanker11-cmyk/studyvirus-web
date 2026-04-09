export interface Chapter {
  file: string;
  en: string;
  hi: string;
}

export interface Topic {
  key: string;
  folder: string;
  emoji: string;
  en: { name: string; desc: string };
  hi: { name: string; desc: string };
  accent: string;
  chapters: Chapter[];
  badge?: string;
  screen?: string;
  hiddenFromList?: boolean;
  exams?: string[];
}

export interface Question {
  id?: string;
  q: string;
  options: string[];
  answer: string;
  explain: string;
}

export interface QuestionSet {
  en?: Question[];
  hi?: Question[];
  questions?: Question[];
}

export interface PYQExam {
  id: string;
  slug: string;
  en: string;
  hi: string;
  prefix: string;
  sets: number;
  category: string;
}

export interface MockTest {
  id: string;
  file: string;
  en: string;
  hi: string;
  cat: string;
  questions?: number;
}

export interface Article {
  id: string;
  file: string;
  category: string;
  tags: string[];
  en: string;
  hi: string;
}

export interface ArticleContent {
  id: string;
  paragraphs: { type: string; en: string; hi: string }[];
}
