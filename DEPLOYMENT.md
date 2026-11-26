# Deployment

How bettermandaluyong.org ships: **Cloudflare Workers**, built with vinext. The
Worker is `bettermandaluyong-org` (config in
[`cloudflare.config.ts`](cloudflare.config.ts)), deployed with the `cf` CLI
through `vinext-cloudflare deploy`.

## How it builds

- `pnpm build` runs `vite build`: vinext + the Cloudflare Vite plugin emit the
  Worker bundle (entry: `worker/index.ts`, which serves vinext's fetch handler)
  and the static assets into `.cloudflare/output/` (git-ignored).
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

### News bot

City news is data in the repo, not a database. The `news-data` workflow
([`.github/workflows/news-data.yml`](.github/workflows/news-data.yml)) reads the
city's feed, asks the Wayback Machine to save new posts, and checks whether
recent posts are still live. It commits what changed to `data/news/YYYY-MM.yaml`
on the branch `bot/news-data` and keeps one rolling PR open. One commit is one
run, so `git log data/news` shows when each post appeared, was archived, or was
taken down. The site reads those files at build time, so **a merge to `main`
that changes `data/news/` deploys the new news**.

Schedule (UTC): every 3 hours at :07 gathers new posts and archive captures. At
22:07 (06:07 Manila) the run also does the live check and, if `AUTO_MERGE` is
on, merges the PR. A manual run (Actions → news-data → Run workflow) does the
same as the daily run when you tick "daily".

One-time setup (a human does these; none is in git):

1. **GitHub App.** Org Settings → Developer settings → GitHub Apps → New. No
   webhook. Repository permissions: Contents and Pull requests, read and write
   (Metadata read-only is automatic). Installable on this account only. Create
   it, generate a private key, and install it on this repository only. A bot
   token is needed because pushes and PRs made with the workflow's own
   `GITHUB_TOKEN` do not start the `check` workflow.
2. **Environment `news-bot`** (repo Settings → Environments), limited to the
   `main` branch, with four secrets: `NEWS_BOT_APP_ID`, `NEWS_BOT_PRIVATE_KEY`,
   and the optional Internet Archive keys `IA_ACCESS_KEY` and `IA_SECRET_KEY`
   (from <https://archive.org/account/s3.php>; without them archiving uses the
   slower anonymous rate).
3. **Workers Builds:** exclude `bot/*` from "Builds for non-production
   branches", so the bot branch does not make a Worker Preview on every run.
4. **Auto-merge** (optional; without it a person merges the bot PR). In the
   ruleset "Protect main": require the `check` status check, and add the App to
   the bypass list ("For pull requests only"). Then set the repository variable
   `AUTO_MERGE` to `true` (Settings → Secrets and variables → Actions →
   Variables). The workflow merges only when the PR is the bot's own, comes from
   `bot/news-data`, changes nothing outside `data/news/`, and `check` passed;
   the `data-only-guard` job in `check.yml` enforces the file rule. Set
   `AUTO_MERGE` to anything else to stop it.

If the feed can not be read, the run fails and GitHub emails the people who
watch workflow failures. After two failed runs in a row it opens an issue named
"news-bot failing", and closes it on the next good run.

**Retire D1** (one time, after the first good bot runs). The old pipeline kept
`first_seen_at` dates, takedowns and archive results in a D1 database that the
Worker no longer reads. To keep that history:

1. Export it. This only reads, and writes a file that stays out of git
   (`d1-news.json` is in `.gitignore`):

   ```sh
   npx cf d1 list
   npx cf d1 query <database-id> --sql "SELECT source_id, url, title, published_at, categories, first_seen_at, removed_at, missing_strikes, wayback_requested_at, wayback_status, wayback_url, wayback_attempts FROM news_items" > d1-news.json
   ```

   `<database-id>` is the UUID of `bettermandaluyong-news` from the first
   command. Open `d1-news.json` before the next step: it should be JSON only,
   with one object per post. The importer accepts the usual shapes of D1
   results, but a banner line printed by the CLI would need to be cut out. If
   the export is empty or looks wrong, stop and ask; nothing else depends on it.

2. Merge it into the data: `node scripts/import_news.ts --from-d1 d1-news.json`,
   look at the `git diff data/news`, and commit it on a branch as a PR
   (`chore(data): merge D1 history`). D1 wins for first-seen dates, removals and
   archive results; posts only D1 has are kept.
3. A week later, when the bot is running well, delete the D1 database
   `bettermandaluyong-news` and the two Worker secrets (`IA_ACCESS_KEY`,
   `IA_SECRET_KEY`) in the Cloudflare dashboard. Keep the export file somewhere
   private.

`node scripts/import_news.ts --backfill` rebuilds `data/news/` from the city's
WordPress API; it only adds posts that are not in the files yet.

### Budget snapshot

The `/budget` page reads `data/budget/fy2027.yaml` and `data/budget/gaa.yaml`, a
snapshot of the [BetterGov.ph Budget API](https://budget.bettergov.ph/docs) for
the place, region and district in `data/budget/scope.yaml`. There is no bot yet;
refresh it by hand on a branch when the budget moves (the Senate version, the
enacted 2027 GAA) or the API's data changes:

```sh
node scripts/budget_refresh.ts
```

It needs no keys. It exits non-zero, writing nothing, if a 2020–2026 search
doesn't add up to the API's own total, if a list is suspiciously large, or if
`scope.yaml` excludes a line the API no longer returns. An unchanged snapshot
isn't rewritten. Review the diff (new or dropped lines, changed amounts) and
open a PR like any other change. To leave out a line that isn't Mandaluyong's (a
namesake), add it to `exclude` in `scope.yaml` with a reason, then rerun; the
page publishes the reason.

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

The Worker has none. The news bot's secrets (GitHub App credentials and the
optional Internet Archive keys) live in the GitHub environment `news-bot`, as in
"News bot". Any other secret (form backends, email) goes in the Cloudflare
dashboard or via `cf` secrets, never in git.

## Reference

- [vinext on Cloudflare Workers](https://github.com/cloudflare/vinext/blob/main/docs/deploying/cloudflare.mdx)
