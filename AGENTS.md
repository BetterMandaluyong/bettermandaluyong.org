# AGENTS.md

Guidance for AI coding agents working in this repo. Claude Code reads this file
directly — no `CLAUDE.md` needed. Repo-level agent skills (`plan-change`,
`new-component`, `new-page`) live in `.agents/skills/` — the cross-harness home
OpenCode and ZCode read natively; `.claude/skills/` holds per-skill symlinks so
Claude Code sees them too.

## What this is

The website for **Better Mandaluyong**, a community effort for a more livable
Mandaluyong City, Metro Manila, and one of the BetterLGU sites. Right now it is
a single launching-soon page. Built with **vinext (Cloudflare's Vite
reimplementation of the Next.js App Router) + React 19 + Tailwind CSS v4 +
TypeScript**, on Node 24 + pnpm, deployed to Cloudflare Workers. The design
follows the **[BetterGov.ph v2 design system](https://bettergov.ph/design)**,
ported into this repo (not installed).

## Commands

```sh
pnpm run setup      # one-time: deps + commit template + commit-msg hook
pnpm dev            # dev server (URL printed in terminal, typically http://localhost:5173)
pnpm build          # production build -> .cloudflare/output/ (Workers bundle + static assets)
pnpm preview        # serve the production build locally in workerd
pnpm check          # prettier --check + oxlint + cf workers types + tsc --noEmit  (run before claiming done)
pnpm test           # unit tests (vitest run) — run before claiming done
pnpm deploy:preview # Worker Preview for the branch (human step — see DEPLOYMENT.md)
```

## Sources of truth — do not invent

- **[DESIGN.md](DESIGN.md)** — the BetterGov.ph v2 design system as this site
  uses it: `ed-*` color tokens, `type-*` scale, layout, and accessibility rules.
  **Use the tokens, never hardcode hex.** For anything DESIGN.md doesn't cover,
  follow [bettergov.ph/design](https://bettergov.ph/design).
- **[COMPONENTS.md](COMPONENTS.md)** — the component catalog, many ported from
  BetterGov. **Read it before creating or updating any page**: reuse
  `PageShell`, `Container`, `Button`, `ArrowLink`, `Card`, `Flag`,
  `SectionHeader`, … instead of hand-rolling layouts, buttons, or labels, so a
  visual change stays a one-file edit. Missing something? Port BetterGov's
  version before inventing one. New UI gets a component, a `/storybook` specimen
  (`app/storybook/page.tsx`), and a catalog entry in the same change.
- **[BRAND.md](BRAND.md)** — voice and content rules. **Read it before writing
  any user-facing copy.** Copy lives in `components/content.ts` — never invent
  people, quotes, numbers, programs, or partnerships.

When a token changes, update **DESIGN.md** first, then `app/globals.css`. When a
component changes, update **COMPONENTS.md** and its `/storybook` specimen in the
same change.

## Attribution — credit what we reuse

Open source works because people credit each other. Before copying anything
(code, text, images, icons, data) from another project:

1. **Check its license.** No license file means all rights reserved: don't copy
   it. Link to it, or ask the author.
2. **Copyleft (GPL, AGPL, CC BY-SA) needs a maintainer's OK first**: it would
   change the license terms of this repo.
3. **In the same change, add a row to [NOTICE.md](NOTICE.md)**: the work, its
   authors, its license, what we took, and where it lives here.
4. **Meet the license's terms:**
   - MIT / BSD / Apache-2.0: put the copyright and license text in NOTICE.md
     (keep any existing header). At the top of each copied code file, say where
     it came from (repo, path, commit), its license, and what you changed, like
     the ported files in `components/`.
   - CC BY: credit the author, link the license, and say what changed, both in
     NOTICE.md and next to the content where people see it.
   - CC0 / public domain: no legal duty, but credit it in NOTICE.md anyway.
5. **Record the source precisely** (repo and commit) so the port can be compared
   with upstream later.

Third-party content on pages (photos, quotes, data) also needs a visible credit
line on the page itself.

## Conventions

- **No automatic git commands.** Do not run `git add`, `git commit`, `git push`,
  or other state-changing git commands unless explicitly asked. Read-only
  inspection (`git status`, `git diff`, `git log`) is fine.
- **Feature branches only — never land on main yourself.** Every change is made
  on a branch other than `main` (`feat/…`, `fix/…`, `docs/…`, …): create the
  branch first, then stage and commit the work there. Never stage, commit, or
  push anything directly on `main`, and never merge a PR — not even small docs
  changes, and not because a plan said "commit"; plan approval covers the
  change's content, not the merge. `main` deploys, so the only way work reaches
  it is a branch pushed and opened as a PR for a human to review and merge.
- **Never run deploys or log in to Cloudflare.** `pnpm run deploy`,
  `pnpm deploy:preview`, `cf auth login`, and dashboard changes are human steps
  (see [DEPLOYMENT.md](DEPLOYMENT.md)).
- **App Router file conventions.** `app/layout.tsx` is the root layout (fonts,
  skip link), `app/page.tsx` is the home page, `app/<slug>/page.tsx` adds a
  route. Per-page `<title>`/meta go through `export const metadata` /
  `generateMetadata` — there is no `<Head>`. Redirects live in `next.config.ts`;
  404s use `notFound()` + `app/not-found.tsx`.
- **React, not Preact.** Import from `react`; use `className` (also as the
  component prop name), `htmlFor`, camelCase SVG attributes.
- **Server Components by default; `"use client"` = island.** Only files in
  `islands/` start with `"use client"` and ship client JS. Keep everything else
  server-rendered unless interactivity is required. Islands take serializable
  props (plus server-rendered `children`).
- **Tailwind v4, CSS config — no `tailwind.config.js`.** The design tokens live
  in the `@theme` block of `app/globals.css`: colors as `bg-ed-paper-2`,
  `text-ed-ink-2`, `border-ed-rule`, `bg-ed-navy`; text as the `type-*`
  utilities (`type-display`, `type-section`, `type-body`, `type-label`, …);
  fonts as `font-display` (Figtree), `font-sans` (Inter), `font-mono` (JetBrains
  Mono). Prefer canonical v4 class names (e.g. `bg-linear-to-b`, not
  `bg-gradient-to-b`; `aspect-4/3`, not `aspect-[4/3]`).
- **BetterGov look:** square corners, hairline rules, no shadows or gradients.
  Pages are full-width bands with a `Container` inside. Navy is the only
  interactive color; red means urgent; `ed-ink-4` and `ed-gold` are never text.
- **Light only.** BetterGov v2 has no dark palette; don't add `dark:` classes.
- **Accessibility:** controls 44px tall (`Button`), body text ≥ 16px, the global
  navy focus outline stays, link text describes the destination, and every
  animation gets `motion-reduce:` handling.
- **Docstrings on exports.** Every exported component/function/type gets a brief
  JSDoc block: what it renders or returns and the props that matter (see
  `components/Button.tsx`).

## Workflow

- **Plan before code.** Non-trivial changes start with a short written plan the
  user approves (scope, files touched, verification) — the `plan-change` skill.
  Approval covers the change's content — not the merge, and not unrelated edits.
- **Commit format.** Conventional commits: `type(scope): imperative summary` —
  type is one of `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`; scope
  is the area (`page`, `tokens`, `components`, `deploy`, …). The body explains
  the why and ends with a verification line, e.g.
  `Verified: pnpm check clean; pnpm test 3 passed.` The `.gitmessage` template
  and the `commit-msg` hook installed by `pnpm run setup` enforce this locally.
- **No AI attribution trailers.** Never add `Co-Authored-By: …` or "Generated
  with …" trailers to commits or PRs. Commits are attributed to the human author
  only.

## Tooling

Agents work with what's already installed and **ask before installing anything**
— propose the exact command, then wait for the user to run or approve it. Never
install silently.

| Tool             | Needed for     | Note                                                                                    |
| ---------------- | -------------- | --------------------------------------------------------------------------------------- |
| `node` (≥ 22.12) | everything     | Required; Node 24 recommended (`brew install node@24`).                                 |
| `pnpm`           | everything     | `corepack enable pnpm` — the version is pinned by `packageManager` in `package.json`.   |
| `gh`             | branches → PRs | PRs are the only way work lands; check with `command -v gh`.                            |
| `cf`             | deploys        | A project dev-dependency (`pnpm run deploy` / `deploy:preview`); never `cf auth login`. |

- **Missing tool?** Say so, give the copy-pasteable install command (prefer
  `brew install …` on macOS), and wait for approval.
- **MCP:** `.mcp.json` ships the project-scope `context7` server — use it for
  live docs instead of guessing APIs. Library IDs: `/cloudflare/vinext`,
  `/vercel/next.js`, `/facebook/react`, `/tailwindlabs/tailwindcss`. For the
  design system, read [bettergov.ph/design](https://bettergov.ph/design) and its
  source in [bettergovph/bettergov](https://github.com/bettergovph/bettergov)
  (`src/pages/design/`, `src/components/v2/`).
- **User-level skills/plugins** live outside this repo. If a task would benefit
  from one, propose the install command and wait — don't set them up unprompted.

## Testing

- `pnpm test` runs `vitest run`. It must pass before claiming done.
- Tests live next to the code as `*_test.ts` (e.g. `components/content_test.ts`)
  and run with `vitest.config.ts`, which skips the Cloudflare plugins.
  `components/tokens_test.ts` fails if a token shown on `/storybook` is renamed
  or deleted in `globals.css`.
- **What needs tests:** pure logic — helpers, validation, content invariants,
  island state math. New or changed logic ships with passing tests in the same
  change.
- **What doesn't:** server-rendered components and page markup. Those are
  covered by `pnpm check` plus a visual pass on `/storybook` (desktop and phone
  width).

## Where things live

```
app/          Pages (App Router). layout.tsx = root layout; page.tsx = home;
              not-found.tsx = 404; storybook/ = component catalog (noindex);
              globals.css = design tokens (ported from BetterGov.ph v2).
components/   Reusable server components — see COMPONENTS.md for the catalog.
              Ported BetterGov files say so in their header.
components/content.ts  All user-facing copy and links (SITE, HOME, FOOTER, …).
components/build.ts    Build commit SHA for the footer (set in vite.config.ts).
components/tokens.ts   Token list for /storybook (and its test).
islands/      Client-hydrated components ("use client"): FacebookFeed, BarangayMap.
data/         Barangay and city-official data. barangays.json is generated by
              scripts/import_barangays.ts from the city's pages (rerun it, don't
              hand-edit); city-officials.ts is hand-kept with a source per person.
public/       Assets served as-is: logo-seal.svg (logo + favicon),
              logo-mark.svg, png/. Generated by design/ — don't hand-edit.
design/       make_logo.py + export_png.cjs (see README "Logo").
scripts/      setup.ts (pnpm run setup).
next.config.ts        Redirects.
cloudflare.config.ts  Worker config (name, compat date, assets).
vite.config.ts        vinext + Tailwind + Cloudflare plugins.
vitest.config.ts      Unit test config (*_test.ts).
.agents/skills/  Repo-level agent skills (real home); .claude/skills/ and
                .opencode/skill symlink in for Claude Code / older OpenCode.
.githooks/    commit-msg enforcement — activate with `pnpm run setup`.
NOTICE.md     Credits and license texts for everything we reuse.
docs/         Untracked local scratch (agent plans, notes); never in git.
```

## Gotchas

- Never register `rsc()` (`@vitejs/plugin-rsc`) in `vite.config.ts` — vinext
  does it; a second one fails with "Duplicate @vitejs/plugin-rsc".
- `compatibilityDate` in `cloudflare.config.ts` can't be newer than the bundled
  workerd supports — dev and tests fail with "requires compatibility date …".
- Worker types land in `.cloudflare/types` (generated by dev/build; included in
  `tsconfig.json`).
- A page file may only export `default`, `metadata`/`generateMetadata`,
  `generateStaticParams` — put helpers in `components/` or `utils/`.
- The dev server port is printed in the terminal — don't assume one. Test
  hydration against `pnpm preview`, not `pnpm dev`.
- Tailwind only outputs a theme variable some class uses, unless the block is
  `@theme static` (ours is). Keep it static so `var(--color-…)` always works.
- New files' Tailwind classes sometimes don't appear in `pnpm dev` until the dev
  server restarts. `pnpm build` always picks them up.
- `setup` and `deploy` share their names with pnpm's own commands, which win:
  `pnpm setup` configures pnpm itself (and edits shell profiles), and
  `pnpm deploy` deploys a workspace package. Always write `pnpm run setup` and
  `pnpm run deploy`. Other scripts (`pnpm dev`, `pnpm check`, …) are fine.
- Previews are `vinext-cloudflare previews deploy` (`pnpm deploy:preview`).
  Never `deploy --preview`/`--env …` for a preview: it only picks a Vite mode
  and still overwrites Production.

## Before claiming work is done

1. `pnpm check` passes (prettier + oxlint + typecheck).
2. `pnpm test` passes (new/changed logic ships with tests).
3. `pnpm build` succeeds, and `pnpm dev` renders the page and `/storybook` with
   no console errors, at desktop and phone width.
4. Anything copied from elsewhere has its NOTICE.md entry.
5. State any scope you deliberately left for later.
