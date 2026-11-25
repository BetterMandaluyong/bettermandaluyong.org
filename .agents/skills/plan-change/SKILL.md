---
name: plan-change
description:
  Plan any non-trivial change before writing code — read the sources of truth,
  write a scoped plan, get user approval, then implement on a feature branch and
  open a PR. Use for new pages, components, islands, routes, or multi-file
  changes.
---

# Plan a change

The plan step exists so agents don't invent components, tokens, or content that
already exist, and so the human stays in charge of what lands.

## 1. Read the sources of truth

- `AGENTS.md` — commands, conventions, workflow gates.
- `COMPONENTS.md` — the component catalog. Required for any page or component
  work; reuse before building.
- `DESIGN.md` — design tokens (colors light + dark, fonts). Never hardcode.
- `BRAND.md` — voice and copy rules for any user-facing text.
- `DEVELOPMENT.md` — architecture, styling, testing.

## 2. Explore the code

Find what exists first: `app/`, `components/`, `components/content.ts`,
`islands/`. Grep for the pattern before proposing anything new.

## 3. Write the plan

Short and reviewable:

- **Goal** — what changes for the site, in one or two sentences.
- **Files** — each file created or modified and what happens in it.
- **Out of scope** — adjacent work deliberately left alone.
- **Verification** — how it will be proven: `pnpm check`, `pnpm test`, which
  route to look at on the dev server (light and dark).

Get the user's approval before writing code. Approval covers the change's
content — not the merge, and not unrelated edits.

## 4. Implement

- Work on a `feat/…` / `fix/…` / `docs/…` branch. Never commit to `main`; never
  merge a PR.
- Small, conventional commits: `type(scope): summary`, body ending with a
  `Verified: …` line. No AI attribution trailers — the commit-msg hook installed
  by `pnpm setup` enforces this.
- Keep obligations in the same change: new UI → shared component + COMPONENTS.md
  entry; new copy → `components/content.ts`; new logic → tests.

## 5. Verify and hand off

1. `pnpm check` — prettier, oxlint, typecheck.
2. `pnpm test` — unit tests.
3. `pnpm build`, then `pnpm dev` — the affected page renders cleanly in light
   and dark mode, no console errors.
4. Push the branch and open a PR with `gh` for a human to review and merge.
