import { getJson } from "./loader";
import { keys } from "./keys";

export interface AppEntry {
  package: string; slug: string; examId?: string; name: string; description: string;
  rating?: number; ratingCount?: number; installs?: string; icon?: string; screenshots: string[];
  updatedAt?: string; category?: string;
}
export interface AppsRegistry { generatedAt: string; apps: AppEntry[] }

export async function loadAppsRegistry(): Promise<AppsRegistry | null> {
  const r = await getJson<AppsRegistry>(keys.appsRegistry());
  return r && Array.isArray(r.apps) ? r : null;
}

export const appForExam = (reg: AppsRegistry, examId: string) => reg.apps.find((a) => a.examId === examId);
export const appBySlug = (reg: AppsRegistry, slug: string) => reg.apps.find((a) => a.slug === slug);
