// OpenNext adapter config for Cloudflare Workers.
// R2 incremental cache so `revalidate` on content pages actually refreshes
// (spec §4.3). Requires the NEXT_INC_CACHE_R2_BUCKET binding in wrangler.jsonc.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
