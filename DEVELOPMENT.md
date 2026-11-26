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

`pnpm check` runs
`prettier --check . && oxlint && cf workers types && tsc --noEmit`
(`cf workers types` writes the Worker binding types to `.cloudflare/types`, so a
fresh checkout type-checks without running `pnpm dev` first). Run it, plus
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

## Editing site data

Barangay and city-official data live in YAML under `data/`
(`data/barangays/<slug>.yaml`, `data/city-officials.yaml`). Edit the file, then
run `pnpm test`: `data/schema.ts` checks every field and the build fails with
the file and field name if something is wrong. Phone numbers are lists, one
entry per number, written as the city publishes them. To refresh all barangays
from a new snapshot of mandaluyong.gov.ph, see `scripts/import_barangays.ts` (it
overwrites the barangay files, except their `dilg` and `flags` sections, and
adds person files for new people).

Each barangay file also records when its officials were checked against the
[DILG Barangay Officials Directory](https://dilg.gov.ph/barangay-officials-directory)
(`dilg`) and every place the two lists disagree (`flags`). A flag names the list
(`council.captain`, `council.kagawads`, `sk.chair`, `sk.kagawads`), a `status`,
and the `city` and/or `dilg` spelling:

- `changed`: the site shows DILG's name (used only where DILG marks the seat as
  filled by appointment); the city's is kept for reference.
- `different-person`: another person holds the seat in DILG's list.
- `name-differs`: probably the same person, spelled differently.
- `not-in-dilg` / `only-in-dilg`: a name only one list has.

Except for `changed`, the site keeps the city's name. Flags hold names, not
person ids. To settle a flag, fix the name if needed (in the person's file in
`data/people/`, and the `# Name` comments) and delete the flag; `data/schema.ts`
checks that each flag still matches the names shown.

### People

Every elected official has one file, `data/people/<id>.yaml`, named by a
[ULID](https://github.com/ulid/spec), the same convention as
[bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data):

```yaml
id: 01M8AYCW7MHBKQ7069DPW4M70W # must match the file name; never changes
slug: alexandria-queenie-pahati-gonzales # the /people/<slug> URL; never changes
name: Alexandria “Queenie” Pahati-Gonzales
ids: # optional: the same person in other datasets
  open_congress: 01K5ST47FR57HGGQ3D5QR4HP2N
  wikidata: Q66827038
```

Offices point at people by id: a barangay file lists `captain: <id>`, and
`city-officials.yaml` has `person: <id>`. Each id carries the person's name as a
`# Name` comment so diffs stay readable; `data/people_test.ts` fails if a
comment is missing or stale. The build fails if an office lists an id with no
file, if two people share a slug, or if a person file is listed by no office.

- **Add a person:** make a ULID
  (`node -e "import('./utils/people/ulid.ts').then(m => console.log(m.ulidFactory()()))"`),
  create `data/people/<ULID>.yaml` with a new slug (lowercase words joined by
  hyphens), and list the id in their office with a `# Name` comment.
- **Fix a name:** edit `name:` in the person file and the `# Name` comments.
  Leave `slug:` alone so the URL keeps working.
- **Add an external id:** keys under `ids:` must be listed in
  `EXTERNAL_ID_KINDS` (`data/schema.ts`), which checks each value's format and
  builds the link shown under "Records Elsewhere" on the person's page. To
  support a new kind of record, add an entry there with a test in
  `data/schema_test.ts`. Only add an id after checking the record really is this
  person, and credit the dataset in [NOTICE.md](NOTICE.md).
