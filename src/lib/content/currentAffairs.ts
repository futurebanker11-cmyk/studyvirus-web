import { listDir, counts } from "./index";
import { keys } from "./keys";

export const CA_DAILY_DIR = "gk/0-Current Affairs/daily";
const STALE_DAYS = 90;
const DATE_RE = /^(\d{4})_(\d{2})_(\d{2})\.json$/;

export interface CaDay { date: string; month: string; key: string; enCount: number; hiCount: number; iso: string }

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_HI = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];

/**
 * Recomputed on every call, deliberately: listMonths/daysOfMonth/findDay all
 * re-derive from here so __setIndexForTests stays honest (a memo would need
 * invalidation). 146 entries makes the cost irrelevant.
 */
export function listDays(): CaDay[] {
  const out: CaDay[] = [];
  for (const file of listDir(CA_DAILY_DIR)) {
    const m = DATE_RE.exec(file);
    if (!m) continue;
    const date = file.slice(0, -5);
    const key = keys.caDaily(date);
    const c = counts(key);
    if (!c || c[0] === 0) continue;
    out.push({ date, month: `${m[1]}_${m[2]}`, key, enCount: c[0], hiCount: c[1], iso: `${m[1]}-${m[2]}-${m[3]}` });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function listMonths(): { month: string; days: CaDay[] }[] {
  const by = new Map<string, CaDay[]>();
  for (const d of listDays()) {
    if (!by.has(d.month)) by.set(d.month, []);
    by.get(d.month)!.push(d);
  }
  return Array.from(by, ([month, days]) => ({ month, days }));
}

export function daysOfMonth(month: string): CaDay[] {
  return listDays().filter((d) => d.month === month).reverse();
}

export function findDay(date: string): CaDay | undefined {
  return listDays().find((d) => d.date === date);
}

export function isStale(day: CaDay, now: Date = new Date()): boolean {
  const t = Date.parse(`${day.iso}T00:00:00Z`);
  return now.getTime() - t > STALE_DAYS * 86_400_000;
}

export function monthLabel(month: string, lang: "en" | "hi"): string {
  const [y, m] = month.split("_");
  const i = parseInt(m, 10) - 1;
  return `${(lang === "hi" ? MONTHS_HI : MONTHS_EN)[i]} ${y}`;
}
