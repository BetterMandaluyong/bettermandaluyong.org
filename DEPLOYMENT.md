# Deployment

How bettermandaluyong.org ships: **Cloudflare Workers**, built with vinext. The
Worker is `bettermandaluyong-org` (config in
[`cloudflare.config.ts`](cloudflare.config.ts)), deployed with the `cf` CLI
through `vinext-cloudflare deploy`.

## How it builds

- `pnpm build` runs `vite build`: vinext + the Cloudflare Vite plugin emit the
  Worker bundle and the static assets into `.cloudflare/output/` (git-ignored).
- `pnpm run deploy` = `vinext-cloudflare deploy`: builds and uploads that output
  with `cf`. It replaces the live (Production) deployment.
- `pnpm deploy:preview` = `vinext-cloudflare previews deploy`: builds the same
  output and uploads a **Worker Preview** named after the Git branch, a non-live
  version with its own URL, updated by every push to that branch. Production is
  untouched. **Never use `vinext-cloudflare deploy --preview` for previews:**
  `--preview` only selects the Vite mode `preview`; it still deploys to
  Production.
- This is why `main` is never pushed to directly: **a merge to `main` is a
  deploy.**

## Human steps (agents never run these)

Authentication is the human's: `cf auth login` locally, or
`CLOUDFLARE_API_TOKEN` (the **Edit Cloudflare Workers** template) +
`CLOUDFLARE_ACCOUNT_ID` in CI. Keep `accountId` out of `cloudflare.config.ts`.

### One-time: switch Workers Builds to vinext

The site used to be static files deployed with Wrangler. Before merging the
vinext migration:

1. In the Cloudflare dashboard (Workers → `bettermandaluyong-org` → Settings →
   Builds), set these, as
   [vinext's deploy guide](https://github.com/cloudflare/vinext/blob/main/docs/deploying/cloudflare.mdx)
   says:
   - **Build command:** empty (clear it). Workers Builds installs dependencies
     itself, and the deploy and preview commands each build the app; a separate
     build would also skip the preview-specific build.
   - **Deploy command:** `pnpm run deploy`. Not `pnpm deploy`: that runs pnpm's
     own workspace-deploy command instead of our script.
   - **Preview command:** `pnpm run deploy:preview`.
   - **Builds for non-production branches:** on.

   The default `npx wrangler deploy` / `npx wrangler preview` commands need a
   `wrangler.jsonc`, which this project no longer has: its Worker settings live
   in `cloudflare.config.ts`.

2. Check that Workers Builds' injected credentials work for `cf` on the PR's
   preview build. **Fallback if they don't:** add a GitHub Action that runs
   `pnpm run deploy` with repo secrets `CLOUDFLARE_API_TOKEN` +
   `CLOUDFLARE_ACCOUNT_ID` on push to `main`, and disconnect the Workers Builds
   trigger.
3. Merge the PR, confirm the production deploy, and load the site.

### Custom domain

The Worker serves `bettermandaluyong.org` as a custom domain (`domains` in
`cloudflare.config.ts`, applied on production deploys; previews don't touch it).
`www.bettermandaluyong.org` is not attached to the Worker; a Cloudflare Redirect
Rule on the zone sends it to the root domain.

### Rollback

Workers keeps prior versions: Cloudflare dashboard → Workers →
`bettermandaluyong-org` → Deployments → **Rollback** to the previous version
(instant, no rebuild).

## Local production check

```sh
pnpm build
pnpm preview     # serves the build in workerd
```

## Secrets

There are none yet. When the site needs them (form backends, email), they go in
the Cloudflare dashboard or via `cf` secrets, never in git.

## Reference

- [vinext on Cloudflare Workers](https://github.com/cloudflare/vinext/blob/main/docs/deploying/cloudflare.mdx)
