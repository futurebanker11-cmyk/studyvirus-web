import { assertPublishable, encodeKey } from "./keys";
import { resolveBucket } from "./bucket";

export const CDN_BASE = "https://cdn.studyvirus.com";
const MEMO_TTL_MS = 60_000;

export interface ContentObject {
  text: string;
  lastModified?: Date;
}

const memo = new Map<string, { at: number; value: Promise<ContentObject | null> }>();

export function __clearMemo(): void {
  memo.clear();
}

async function load(key: string): Promise<ContentObject | null> {
  const bucket = await resolveBucket();
  if (bucket) {
    const obj = await bucket.get(key);
    if (!obj) return null;
    return { text: await obj.text(), lastModified: obj.uploaded };
  }
  const res = await fetch(`${CDN_BASE}/${encodeKey(key)}`, {
    // Next.js data-cache hint; ignored outside Next.
    next: { revalidate: 3600 },
  } as RequestInit);
  if (!res.ok) return null;
  const lm = res.headers.get("last-modified");
  return { text: await res.text(), lastModified: lm ? new Date(lm) : undefined };
}

export async function getText(key: string): Promise<ContentObject | null> {
  assertPublishable(key);
  const now = Date.now();
  const hit = memo.get(key);
  if (hit && now - hit.at < MEMO_TTL_MS) return hit.value;
  const value = load(key).catch(() => null);
  memo.set(key, { at: now, value });
  return value;
}

export async function getJson<T>(key: string): Promise<T | null> {
  const obj = await getText(key);
  if (!obj) return null;
  try {
    return JSON.parse(obj.text) as T;
  } catch {
    return null;
  }
}
