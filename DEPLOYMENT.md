# Deployment

How bettermandaluyong.org ships: **Cloudflare Workers**, built with vinext. The
Worker is `bettermandaluyong-org` (config in
[`cloudflare.config.ts`](cloudflare.config.ts)), deployed with the `cf` CLI
through `vinext-cloudflare deploy`.

## How it builds

- `pnpm build` runs `vite build`: vinext + the Cloudflare Vite plugin emit the
  Worker bundle (entry: `worker/index.ts`, which serves vinext's fetch handler
  and runs the news jobs on a schedule) and the static assets into
  `.cloudflare/output/` (git-ignored).
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

### One-time: news database

The news feed keeps its data in a D1 database and fills it from scheduled runs
(all UTC): the feed job at :07 past every third hour, the archive job at :37
past every third hour, and the removal check daily at 02:37.

1. Confirm the D1 database `bettermandaluyong-news` exists after the first
   deploy. If the deploy did not create it, a human creates it: Cloudflare
   dashboard → Storage & databases → D1 → **Create database**, named
   `bettermandaluyong-news`, or `npx cf d1 create bettermandaluyong-news`. Then
   bind it to the Worker as `DB` (as `cloudflare.config.ts` declares) and deploy
   again.
2. Optionally set the Internet Archive keys (from
   <https://archive.org/account/s3.php>), once each. They raise the Save Page
   Now limits; without them archiving still works at the anonymous rate:

   ```sh
   npx cf workers secrets update IA_ACCESS_KEY --worker bettermandaluyong-org --type secret_text
   npx cf workers secrets update IA_SECRET_KEY --worker bettermandaluyong-org --type secret_text
   ```

3. After the deploy, wait for the next run at :07 past a 3-hour mark, then check
   `/status`. The Free-plan CPU limit for these runs has not been measured, so
   check `/status` again after the first few runs.
4. To see what the jobs did, run this in the D1 console:

   ```sql
   SELECT job, started_at, ok, items_read, new_items, archive_requests, error_code FROM feed_runs ORDER BY id DESC LIMIT 20;
   ```

There is no schema or import step: the Worker creates its own tables and
backfills the full history, about 100 posts per feed run.

With Internet Archive keys, an archive run being "ok" means Save Page Now
_accepted_ the job, not that the capture has finished.

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

Two optional ones, `IA_ACCESS_KEY` and `IA_SECRET_KEY` (Internet Archive), set
as in "One-time: news database". They are deliberately not declared in
`cloudflare.config.ts`: a declared secret with no value fails the deploy, and
the Worker reads them only if present. Any other secret (form backends, email)
goes in the Cloudflare dashboard or via `cf` secrets, never in git.

## Reference

- [vinext on Cloudflare Workers](https://github.com/cloudflare/vinext/blob/main/docs/deploying/cloudflare.mdx)
