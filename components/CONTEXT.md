# components

Reusable server components and the site's copy. COMPONENTS.md is the catalog:
read it before building UI, and update it in the same change.

- **Server components only.** Nothing here starts with `"use client"`.
  Interactivity goes in `islands/`.
- **Ported BetterGov files say so in their header** (repo, path, commit,
  license, what changed). Keep the header when you edit one. Port BetterGov's
  version before inventing a new component.
- **Every new or changed component** gets a COMPONENTS.md entry and a
  `/storybook` specimen (`app/storybook/page.tsx`) in the same change, plus a
  JSDoc block on each export saying what it renders and which props matter.
- **`content.ts` holds all user-facing copy and links.** Follow BRAND.md:
  section headings in Title Case (`content_test.ts` checks the ones listed
  there, so add new headings to that test), sentence case elsewhere, and no
  invented facts.
- **Styling:** `ed-*` tokens and `type-*` utilities only, square corners,
  hairline rules, no shadows. Join classes with `cx`. It only joins strings and
  doesn't merge conflicting Tailwind classes, so don't rely on a `className`
  prop to override padding or similar. Write class names out in full: Tailwind
  can't see names built at runtime.
- `tokens.ts` lists the tokens `/storybook` shows. `tokens_test.ts` fails if one
  disappears from `app/globals.css`.
