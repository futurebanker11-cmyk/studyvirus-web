import { getJson } from "./loader";
import { keys } from "./keys";
import { counts } from "./index";
import { dashed } from "./slugs";

export interface PyqExam { id: string; en: string; hi: string; category: string; prefix: string; sets: number; emoji?: string; paperType?: string }
export interface PyqPaper { exam: PyqExam; n: number; key: string; enCount: number; hiCount: number }

export function papersOf(exam: PyqExam): PyqPaper[] {
  const out: PyqPaper[] = [];
  for (let n = 1; n <= exam.sets; n++) {
    const key = keys.pyqPaper(exam.prefix, n);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ exam, n, key, enCount: c[0], hiCount: c[1] });
  }
  return out;
}

export async function loadPyqExams(): Promise<PyqExam[]> {
  const cfg = await getJson<{ exams: PyqExam[] }>(keys.pyqConfig());
  return (cfg?.exams ?? []).filter((e) => e.sets > 0 && papersOf(e).length > 0);
}

export function pyqSlug(exam: PyqExam, slugOverrides: Record<string, string>): string {
  return slugOverrides[exam.id] ?? dashed(exam.id);
}

export function findPyqBySlug(list: PyqExam[], slug: string, slugOverrides: Record<string, string>): PyqExam | undefined {
  return list.find((e) => pyqSlug(e, slugOverrides) === slug);
}

export function findPaper(exam: PyqExam, n: number): PyqPaper | undefined {
  return papersOf(exam).find((p) => p.n === n);
}
