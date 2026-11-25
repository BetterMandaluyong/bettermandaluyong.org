---
name: new-component
description:
  Create or extract UI the repo way — reuse ours, then port from the
  BetterGov.ph v2 design system, and only then build new on its tokens, with a
  /storybook specimen and a COMPONENTS.md entry in the same change. Use whenever
  a page needs new UI.
---

# New component

## 1. Reuse before building

1. **Ours first.** Search `COMPONENTS.md` and `components/` — `PageShell`,
   `Container`, `Button`, `ArrowLink`, `Card`, `Flag`, `Eyebrow`,
   `SectionHeader`, … — including variant props that might already cover the new
   case.
2. **Then BetterGov.** Check
   [bettergov.ph/design/components](https://bettergov.ph/design/components) and
   `src/components/v2/` in
   [bettergovph/bettergov](https://github.com/bettergovph/bettergov). Port it
   rather than inventing: copy the file into `components/`, swap `react-router`
   links for `<a>`, `font-*-ed` for `font-display` / `font-sans` / `font-mono`,
   and add the header every ported file has (source path, commit, MIT, what
   changed). Add it to NOTICE.md's BetterGov row.
3. **Only then build new**, following the rules below.

A visual change should stay a one-file edit.

## 2. Pick the kind

- **Server component** → `components/<Name>.tsx` (default; zero client JS). The
  class prop is `className`.
- **Interactive** → `islands/<Name>.tsx`, starting with `"use client"` (React
  hooks for state). Only when the page truly needs interactivity; props must be
  serializable (plus server-rendered `children`).

## 3. Build to the design system (DESIGN.md)

- Colors are `ed-*` tokens (`bg-ed-paper-2`, `text-ed-ink-2`, `border-ed-rule`,
  `bg-ed-navy`) — never hex. `ed-ink-4` and `ed-gold` are never text.
- Text uses the `type-*` utilities (`type-section`, `type-subheading`,
  `type-body`, `type-ui`, `type-label`).
- Square corners, hairline rules, no shadows. Navy is the only interactive
  color; red means urgent.
- Canonical Tailwind v4 class names (`bg-linear-to-b`, not `bg-gradient-to-b`;
  `aspect-4/3`, not `aspect-[4/3]`).
- Accessibility: controls 44px tall, body text ≥ 16px, keep the global focus
  outline, `motion-reduce:` fallbacks for any animation, link text that
  describes the destination.
- Text comes in through props or `components/content.ts`, not hardcoded.
- Give exported components JSDoc: what it renders and the props that matter (see
  `components/Button.tsx`).
- Adapting code from anywhere else? Check its license and add it to `NOTICE.md`
  (rules in AGENTS.md, "Attribution").

## 4. Register it (same change, not later)

- **Specimen** — render it with real props in `app/storybook/page.tsx` so
  `/storybook` shows it.
- **Catalog** — add or extend its `COMPONENTS.md` entry (mark ported ones
  "(BetterGov)").
- **New token?** Add it to DESIGN.md, `app/globals.css`, and
  `components/tokens.ts` (its test checks the token exists).

## 5. Verify

`pnpm check` and `pnpm test`, then look at its `/storybook` specimen and the
page that uses it with `pnpm dev`, at desktop and phone width. Restart
`pnpm dev` if a new file's classes don't show up.
