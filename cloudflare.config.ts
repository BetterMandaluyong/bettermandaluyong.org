import { bindings, defineConfig, defineWorker } from "cf/config";

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
    },
  }),
});
