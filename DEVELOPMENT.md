# Development

Everything you need to run, build, and extend bettermandaluyong.org locally.

## Prerequisites

- **Node ≥ 22.12** (24 recommended) — `brew install node@24`.
- **pnpm** — `corepack enable pnpm`; the exact version is pinned by
  `packageManager` in `package.json`.

## Getting started

```sh
pnpm run setup  # deps + git hygiene (commit template, commit-msg hook)
pnpm dev    # start the dev server
```

Open the URL printed in the terminal (typically <http://localhost:5173>).

## Common tasks

| Task                   | Command                          |
| ---------------------- | -------------------------------- |
| One-time setup         | `pnpm run setup`                 |
| Develop                | `pnpm dev`                       |
| Format / lint / types  | `pnpm check`                     |
| Unit tests             | `pnpm test`                      |
| Format code            | `pnpm exec prettier --write .`   |
| Lint                   | `pnpm exec oxlint`               |
| Production build       | `pnpm build`                     |
| Serve production build | `pnpm preview` (runs in workerd) |

`pnpm check` runs `prettier --check . && oxlint && tsc --noEmit`. Run it, plus
`pnpm test` and `pnpm build`, before considering any work done.

## Architecture

This is a [**vinext**](https://github.com/cloudflare/vinext) app: the Next.js
App Router API reimplemented on Vite, with React 19 and Tailwind CSS v4, running
on Cloudflare Workers.

- **File-system routing** — `app/` holds the routes. `app/layout.tsx` is the
  root layout (`<html>`, fonts, skip link); `app/page.tsx` is the home page;
  `app/not-found.tsx` renders unknown URLs.
- **Metadata** — each page exports `metadata` (or `generateMetadata`) instead of
  a `<Head>` block. Redirects live in `next.config.ts`.
- **Server Components by default** — everything renders on the server with zero
  client JS. A file that starts with `"use client"` is hydrated; all of those
  live in `islands/`.
- **Content** — user-facing copy and links live in
  [`components/content.ts`](components/content.ts), not in page markup.

## Styling (BetterGov.ph v2 + Tailwind v4)

The design follows the
[**BetterGov.ph v2 design system**](https://bettergov.ph/design), ported into
this repo (see [DESIGN.md](DESIGN.md) and [NOTICE.md](NOTICE.md)). Tailwind v4
is configured entirely in CSS. **There is no `tailwind.config.js`.**

- The Vite plugin is registered in [`vite.config.ts`](vite.config.ts)
  (`@tailwindcss/vite`).
- Design tokens live in the `@theme` block of
  [`app/globals.css`](app/globals.css): `ed-*` colors (`bg-ed-paper-2`,
  `text-ed-ink-2`, `border-ed-rule`), fonts (`font-display`, `font-sans`,
  `font-mono`), page widths, and the `type-*` utilities.
- Pages are full-width bands, each with a `Container`. Square corners, hairline
  rules, no shadows. Light only.
- **`/storybook`** shows every token and component, live. Check it at desktop
  and phone width after styling changes.

To change a token, update **DESIGN.md** first, then `app/globals.css`.

### Adding a page

Create `app/<slug>/page.tsx`, e.g. `app/about/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PageShell } from "../../components/PageShell.tsx";

export const metadata: Metadata = {
  title: "About — Better Mandaluyong",
};

export default function AboutPage() {
  return <PageShell>{/* … */}</PageShell>;
}
```

A page file exports only `default`, `metadata`/`generateMetadata` and
`generateStaticParams`. Helpers belong in `components/` or `utils/`.

### Adding a component / island

- **First read [COMPONENTS.md](COMPONENTS.md)**: reuse before you build. If
  BetterGov already has the component, port it (see the `new-component` skill).
- **Server component** → `components/Foo.tsx` (imported by pages; no client JS).
  The class prop is `className`.
- **Interactive component (island)** → `islands/Foo.tsx`, first line
  `"use client"`; use React hooks for state. Props must be serializable (plus
  server-rendered `children`).
- New components get a COMPONENTS.md entry and a `/storybook` specimen
  (`app/storybook/page.tsx`) in the same change.

## Testing

`pnpm test` runs `vitest run` with [`vitest.config.ts`](vitest.config.ts). Tests
live next to the code as `*_test.ts` (see
[`components/content_test.ts`](components/content_test.ts)).

- **Pure logic gets tests**: helpers, validation, content invariants. New or
  changed logic ships with passing tests in the same change.
- **Server-rendered markup doesn't**: that's covered by `pnpm check` and a
  visual check in the browser, at desktop and phone width.

## Copy & content

User-facing copy follows [**BRAND.md**](BRAND.md). Canonical strings live in
[`components/content.ts`](components/content.ts). Placeholders still to replace
before launch:

- `SITE.contactEmail` (`hello@bettermandaluyong.org`): confirm the inbox exists.
- `SITE.followUrl`: currently points at facebook.com, not the real page.

## Deployment

Production runs on **Cloudflare Workers** and deploys on every push to `main`,
so a merge to `main` is a deploy. The full flow (previews, manual deploys,
rollback) is in [**DEPLOYMENT.md**](DEPLOYMENT.md).

## AI agents

- **Skills** — `.agents/skills/` (the cross-harness home; `.claude/skills/`
  holds per-skill symlinks for Claude Code) ships repo-level skills:
  `plan-change`, `new-component`, `new-page`.
- **Docs lookup** — `.mcp.json` provides the project-scope `context7` MCP server
  (live vinext/Next.js/React/Tailwind docs). Claude Code picks it up
  automatically; recent OpenCode versions read the same file.
- **Commit hygiene** — `pnpm run setup` wires the `.gitmessage` template and the
  `.githooks/commit-msg` hook (conventional subjects, no AI attribution
  trailers). Both are local to each clone.
- **CI** — every PR runs `pnpm check`, `pnpm test` and `pnpm build`
  (`.github/workflows/check.yml`).

### Repo skills

Each skill is a `SKILL.md` under `.agents/skills/<name>/` with `name` +
`description` frontmatter. OpenCode and ZCode read `.agents/skills/` natively;
Claude Code reads `.claude/skills/`, so each skill also gets a symlink there.
`.opencode/skill` symlinks the whole tree for older OpenCode versions. On
Windows without symlink support, OpenCode and ZCode still see `.agents/skills/`;
only Claude Code loses the pointers.

The `description` is the trigger: harnesses match it against the task at hand.
Phrase it as "do X — use when Y" and keep it in sync with the body.

To add one:

1. Create `.agents/skills/<name>/SKILL.md` (kebab-case name, frontmatter first).
2. `ln -s ../../.agents/skills/<name> .claude/skills/<name>` so Claude Code
   discovers it too.
3. Mention the new skill in [AGENTS.md](AGENTS.md) and in the Skills bullet
   above.
