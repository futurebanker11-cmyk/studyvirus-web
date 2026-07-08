// OpenNext adapter config for Cloudflare Workers.
// Default config: prerendered pages are served as free static assets; pages
// beyond the prerendered set render on-demand in the Worker. ISR background
// revalidation is a no-op without an incremental cache — content refreshes on
// each deploy. To enable true ISR later, add R2:
//   import { defineCloudflareConfig } from "@opennextjs/cloudflare";
//   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
//   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
// (plus an R2 bucket binding named NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc)
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
