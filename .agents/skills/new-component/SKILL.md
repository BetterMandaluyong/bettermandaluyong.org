---
name: new-component
description:
  Create or extract UI the repo way — reuse first, a shared server component or
  client island built on the design tokens, and a COMPONENTS.md catalog entry,
  all in the same change. Use whenever a page needs new UI.
---

# New component

## 1. Reuse before building

Search `COMPONENTS.md` and `components/` for an existing match — `PageShell`,
`Button`, `Eyebrow`, `PillarList`, … — including variant props that might
already cover the new case. A visual change should stay a one-file edit.

## 2. Pick the kind

- **Server component** → `components/<Name>.tsx` (default; zero client JS). The
  class prop is `className`.
- **Interactive** → `islands/<Name>.tsx`, starting with `"use client"` (React
  hooks for state). Only when the page truly needs interactivity; props must be
  serializable (plus server-rendered `children`).

## 3. Build to the tokens

- Colors and fonts come from `DESIGN.md` tokens via Tailwind utilities
  (`bg-brand`, `text-muted`, `border-line`, `font-display`) — never hardcoded
  hex. Dark mode is automatic; don't add `dark:` color classes.
- Canonical Tailwind v4 class names (`bg-linear-to-b`, not `bg-gradient-to-b`;
  `aspect-4/3`, not `aspect-[4/3]`).
- Accessibility floor: touch targets ≥ 48px (`min-h-12`), body text ≥ 16px with
  ≥ 1.5 line-height, visible `focus-visible` rings, `motion-reduce:` fallbacks
  for any animation.
- Text comes in through props or `components/content.ts`, not hardcoded.
- Give exported components JSDoc: what it renders and the props that matter (see
  `components/Button.tsx`).

## 4. Register it (same change, not later)

Add or extend its `COMPONENTS.md` entry: file, props, a usage snippet.

## 5. Verify

`pnpm check` and `pnpm test`, then look at the page that uses it with
`pnpm dev`, in light and dark mode and at phone width.
