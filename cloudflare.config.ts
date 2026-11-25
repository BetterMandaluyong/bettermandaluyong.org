import { bindings, defineConfig, defineWorker, triggers } from "cf/config";
import {
  ARCHIVE_CRON,
  FEED_CRON,
  REMOVAL_CRON,
} from "./utils/news/schedule.ts";

// Worker config for bettermandaluyong.org. Deployed by `pnpm run deploy`
// (vinext-cloudflare deploy) — see DEPLOYMENT.md. Keep accountId out of here.
export default defineConfig({
  worker: defineWorker({
    name: "bettermandaluyong-org",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-10-30",
    compatibilityFlags: ["nodejs_compat"],
    // www is not attached here: a Cloudflare Redirect Rule on the zone sends
    // it to the root domain.
    domains: ["bettermandaluyong.org"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: "bettermandaluyong-news" }),
    },
    // News jobs (see worker/index.ts), all UTC.
    triggers: [
      triggers.scheduled({ schedule: FEED_CRON }),
      triggers.scheduled({ schedule: ARCHIVE_CRON }),
      triggers.scheduled({ schedule: REMOVAL_CRON }),
    ],
  }),
});
