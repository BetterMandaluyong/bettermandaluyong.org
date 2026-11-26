---
name: plan-change
description:
  Plan any non-trivial change before writing code — read the sources of truth,
  write a scoped plan (including any borrowed work and its license), get user
  approval, then implement on a feature branch and open a PR. Use for new pages,
  components, islands, routes, or multi-file changes.
---

# Plan a change

The plan step exists so agents don't invent components, tokens, or content that
already exist, don't copy other people's work without credit, and so the human
stays in charge of what lands.

## 1. Read the sources of truth

- `AGENTS.md` — commands, conventions, workflow gates, attribution rules.
- `COMPONENTS.md` — the component catalog (ours, many ported from BetterGov).
  Required for any page or component work; reuse before building.
- `DESIGN.md` — the BetterGov.ph v2 design system as we use it: tokens, type,
  layout, accessibility. Never hardcode colors.
- `BRAND.md` — voice and copy rules for any user-facing text.
- `NOTICE.md` — what we already reuse, and under which license.
- `DEVELOPMENT.md` — architecture, styling, testing.

## 2. Explore the code

Find what exists first: `app/`, `components/`, `components/content.ts`, and
`/storybook` on the dev server. For new UI, also check
[bettergov.ph/design](https://bettergov.ph/design). Grep for the pattern before
proposing anything new.

## 3. Write the plan

Short and reviewable:

- **Goal** — what changes for the site, in one or two sentences.
- **Files** — each file created or modified and what happens in it.
- **Borrowed work** — anything to be copied from another project, its license,
  and the NOTICE.md entry it will get. Say "none" if nothing is borrowed.
- **Out of scope** — adjacent work deliberately left alone.
- **Verification** — how it will be proven: `pnpm check`, `pnpm test`, which
  route and `/storybook` specimen to look at (desktop and phone width).

Get the user's approval before writing code. Approval covers the change's
content — not the merge, and not unrelated edits.

## 4. Implement

- Work on a branch (any name). Never commit to `main`; never merge a PR.
- `main` requires a linear history and PRs land only by "Rebase and merge"
  (never squash), so every commit must stand on its own. To catch up with `main`
  or fix a conflict, `git rebase origin/main` (after `git fetch origin main`)
  and `git push --force-with-lease`. Never merge `main` into the branch: GitHub
  then can't "Rebase and merge" it. See "Linear history" in AGENTS.md.
- Small, conventional commits: `type(scope): summary`, body ending with a
  `Verified: …` line. No AI attribution trailers — the commit-msg hook installed
  by `pnpm run setup` enforces this.
- Keep obligations in the same change: new UI → shared component + COMPONENTS.md
  entry + `/storybook` specimen; new copy → `components/content.ts`; new logic →
  tests; copied work → NOTICE.md.

## 5. Verify and hand off

1. `pnpm check` — prettier, oxlint, typecheck.
2. `pnpm test` — unit tests.
3. `pnpm build`, then `pnpm dev` — the affected page and `/storybook` render
   cleanly at desktop and phone width, no console errors.
4. Push the branch and open a PR with `gh` for a human to review and merge. If
   `main` moves on or the PR shows a conflict, rebase it on `origin/main` (step
   4), never merge `main` in.
