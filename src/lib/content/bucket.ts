// The only module that knows about @opennextjs/cloudflare. Returns the R2
// binding when running inside the Worker (or `next dev` with
// initOpenNextCloudflareForDev), otherwise null so the loader falls back to
// HTTPS. Same-zone Worker→Worker fetch to cdn.studyvirus.com fails
// (spec §2), which is why the binding exists.

export type BucketObject = { text(): Promise<string>; uploaded?: Date };
export type BucketLike = { get(key: string): Promise<BucketObject | null> };

async function defaultResolver(): Promise<BucketLike | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    const ctx = await mod.getCloudflareContext({ async: true });
    const env = ctx?.env as unknown as { CONTENT?: BucketLike } | undefined;
    return env?.CONTENT ?? null;
  } catch {
    return null;
  }
}

let resolver: () => Promise<BucketLike | null> = defaultResolver;

export function resolveBucket(): Promise<BucketLike | null> {
  return resolver();
}

/** Test seam. */
export function __setBucketResolver(fn: () => Promise<BucketLike | null>): void {
  resolver = fn;
}
