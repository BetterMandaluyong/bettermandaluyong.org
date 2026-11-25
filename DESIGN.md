# Design

The source of truth for how the site looks. Tokens defined here are mirrored in
the `@theme` block of [`app/globals.css`](app/globals.css), which turns them
into Tailwind utilities. **Change a value here first, then in `globals.css`.**
Never hardcode a hex value in a component.

## Colors

Each token has a light and a dark value. The dark values apply automatically
when the visitor's OS is in dark mode, so components use one class (e.g.
`bg-brand`) and get both.

| Token      | Utility examples              | Light     | Dark      | Use                                  |
| ---------- | ----------------------------- | --------- | --------- | ------------------------------------ |
| `canvas`   | `bg-canvas`                   | `#f6f3ea` | `#0c1813` | Page background                      |
| `surface`  | `bg-surface`                  | `#fffdf7` | `#12221b` | Cards and raised areas               |
| `ink`      | `text-ink`                    | `#13231c` | `#eef1ea` | Body text and headings               |
| `muted`    | `text-muted`                  | `#4c5d55` | `#a7b5ad` | Secondary text, captions, footer     |
| `line`     | `border-line`, `bg-line`      | `#dcd6c5` | `#24382f` | Borders and dividers                 |
| `brand`    | `bg-brand`, `text-brand`      | `#0f3d2e` | `#f0b429` | Primary buttons, brand mark          |
| `on-brand` | `text-on-brand`               | `#f6f3ea` | `#0c1813` | Text on a `brand` background         |
| `accent`   | `bg-accent`, `outline-accent` | `#e8a317` | `#f0b429` | Status dot, focus rings, highlights  |
| `glow`     | (body background only)        | amber 18% | amber 12% | The soft radial glow behind the page |

Rules:

- `accent` is for small marks and focus rings, never for body text (it fails
  contrast on `canvas`).
- Text on `brand` is always `on-brand`.

## Typography

| Token          | Utility        | Family                  | Use                         |
| -------------- | -------------- | ----------------------- | --------------------------- |
| `font-sans`    | `font-sans`    | Inter 400/500/600       | Body text, UI (the default) |
| `font-display` | `font-display` | Fraunces 500/700 (opsz) | Headlines and card titles   |

- Body text is 17px (`1.0625rem`) with 1.6 line-height; never smaller than 16px
  for paragraphs.
- The home headline scales with `clamp(2.5rem, 7vw, 4.75rem)`, tight leading
  (1.02) and `text-balance`.
- Both fonts load from Google Fonts in `app/layout.tsx`.

## Shape and spacing

- Primary buttons are pills (`rounded-full`); cards and grids use `rounded-2xl`.
- Content width is capped at 68rem (`PageShell`); hero text at 44rem.
- Touch targets are at least 48px tall (`min-h-12`).

## Motion

- `animate-pulse-ring` — the "launching soon" status dot.
- Buttons lift 1px on hover.
- Every animation and transition has a `motion-reduce:` fallback that turns it
  off.
