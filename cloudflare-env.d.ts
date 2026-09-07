/// <reference types="@cloudflare/workers-types" />
// Bindings declared in wrangler.jsonc. @opennextjs/cloudflare's
// getCloudflareContext() returns env typed as CloudflareEnv when this
// interface exists.
declare global {
  interface CloudflareEnv {
    CONTENT: R2Bucket;
    ASSETS: Fetcher;
  }
}
export {};
