import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

// Same strings as utils/news/schedule.ts, written out here on purpose: importing
// that file from both this config and worker/index.ts breaks `pnpm dev` (the
// Cloudflare Vite plugin cannot serve a module the config loader already
// loaded). utils/news/schedule_test.ts fails if the two drift apart.
const FEED_CRON = "7 */3 * * *";
const ARCHIVE_CRON = "37 */3 * * *";
const REMOVAL_CRON = "37 2 * * *";

// `vinext-cloudflare previews deploy` sets this while it evaluates this config.
// Worker Previews reject any `triggers` ("Preview uploads from Build Output
// don't support the `triggers` field"), and a Preview never runs cron jobs
// anyway, so only production deploys get the schedules.
const isPreviewBuild = process.env.CLOUDFLARE_PREVIEW_BUILD === "true";

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
    // Preview and version URLs live on workers.dev. Without this they follow
    // workersDev, which stays off so production is only on our domain, and
    // Worker Previews come up with "No Preview URL".
    previewUrls: true,
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: "bettermandaluyong-news" }),
    },
    // News jobs (see worker/index.ts), all UTC. None on Preview builds.
    triggers: isPreviewBuild
      ? []
      : [
          triggers.scheduled({ schedule: FEED_CRON }),
          triggers.scheduled({ schedule: ARCHIVE_CRON }),
          triggers.scheduled({ schedule: REMOVAL_CRON }),
        ],
  }),
});
