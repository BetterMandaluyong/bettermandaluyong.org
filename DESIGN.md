# Design

bettermandaluyong.org follows the **BetterGov.ph v2 design system**
([guidelines](https://bettergov.ph/design): styles, components, patterns,
accessibility), the national standard the BetterLGU sites are adopting. We
**ported** it rather than installing it: the tokens and components were copied
from [bettergovph/bettergov](https://github.com/bettergovph/bettergov) at commit
`5ead8c0` (2026-11-19, MIT) and are now ours to maintain. Credit and license
text are in [NOTICE.md](NOTICE.md).

Tokens live in [`app/globals.css`](app/globals.css). **Change a value here
first, then there.** See every token and component live at `/storybook`.

## The style in one paragraph

Quiet and editorial: near-black ink on paper white, hairline rules, and a single
working navy. Square corners; rules and borders instead of rounded cards or drop
shadows. Pages are full-width horizontal bands (masthead, sections, footer),
each with a centred `Container`. Red means urgent. Sage and gold are rare
accents and never interactive.

## Color

Use them as Tailwind classes: `bg-ed-paper-2`, `text-ed-ink-2`,
`border-ed-rule`, `bg-ed-navy`. Never hex values.

| Token            | Hex       | Use                                                                 |
| ---------------- | --------- | ------------------------------------------------------------------- |
| `ed-ink`         | `#0c1b33` | Headings and primary text                                           |
| `ed-ink-2`       | `#2b3a55` | Body copy (the page default)                                        |
| `ed-ink-3`       | `#252629` | Secondary text and meta                                             |
| `ed-ink-4`       | `#8a95aa` | Disabled states and decorative marks only. **Fails AA: never text** |
| `ed-paper`       | `#ffffff` | Page background                                                     |
| `ed-paper-2`     | `#f4f7fc` | Tinted sections, mastheads                                          |
| `ed-paper-3`     | `#e6ecf5` | Deeper tint, wells                                                  |
| `ed-rule`        | `#dbe3ef` | Default borders and dividers (the default border color)             |
| `ed-rule-strong` | `#9fb2cc` | Emphasised borders                                                  |
| `ed-navy`        | `#0b4fd9` | Links, primary buttons, active states, focus ring                   |
| `ed-navy-2`      | `#0a44bd` | Hero and masthead bands; hover state of navy                        |
| `ed-navy-ink`    | `#08286e` | Darkest navy: emphasis text and hover surfaces                      |
| `ed-navy-tint`   | `#e8efff` | Subtle navy background, hover tint                                  |
| `ed-red`         | `#c8102e` | Urgency: advisories, emergency content, hover accents               |
| `ed-red-ink`     | `#8c0a20` | Red text on light backgrounds                                       |
| `ed-sage`        | `#4a6b5a` | Sparing editorial accent, never interactive                         |
| `ed-gold`        | `#b8893a` | Sparing editorial accent, never interactive, **not for text**       |
| `success-700`    | `#006939` | Success and confirmation; safe under white text                     |
| `warning-500`    | `#ffb900` | Warnings: pair with dark text and an icon                           |
| `error-600`      | `#b42525` | Errors and destructive actions                                      |

The full `success-*`, `warning-*`, and `error-*` scales (50–900) are also
available.

Rules (from BetterGov):

- Text on white uses `ed-ink`, `ed-ink-2`, or `ed-ink-3` only.
- Never use color as the only way to show meaning; pair it with a label or icon.
- Hero and masthead bands use one flat color (`ed-paper-2` or `ed-navy-2`), no
  gradients.
- If everything is red, nothing is.

## Typography

Three typefaces, one job each. Mixing their roles is the fastest way to stop
looking like BetterGov.

| Font                   | Class          | Job                                                                        |
| ---------------------- | -------------- | -------------------------------------------------------------------------- |
| Figtree 600/700        | `font-display` | Page titles, section headings, card titles, stat figures                   |
| Inter 400/500/600      | `font-sans`    | Everything people read and use: body, ledes, nav, buttons, forms (default) |
| JetBrains Mono 400/500 | `font-mono`    | Small structural labels: eyebrows, tags, table headers, metadata           |

The type scale is available as utilities (they set font, size, weight, line
height, and color):

| Utility           | Spec                                    | Use                                     |
| ----------------- | --------------------------------------- | --------------------------------------- |
| `type-display`    | Figtree Bold, clamp(32–56px)            | Page title in a masthead. One per page. |
| `type-section`    | Figtree Semibold, 24px                  | Section titles (`SectionHeader`)        |
| `type-subheading` | Figtree Semibold, 18px                  | Sub-sections and card titles            |
| `type-lede`       | Inter, 18px, ink-2                      | Intro paragraph under a page title      |
| `type-body`       | Inter, 17px, ink-2                      | Long-form reading (the page default)    |
| `type-ui`         | Inter, 14px                             | Buttons, forms, navigation, dense lists |
| `type-label`      | JetBrains Mono, 11px, uppercase, spaced | Eyebrows, tags, metadata                |

Rules: titles are upright, never italic. Never skip heading levels. Keep prose
under about 70 characters per line (`max-w-[65ch]`). The mono label style is for
labels, never sentences.

## Layout

- Wrap every band's content in `<Container>` (1504px), or `<Container narrow>`
  (1040px) for reading pages. Never set a page `max-width` yourself; the widths
  are the `--container-page*` tokens.
- Gutters are 16 / 24 / 32px (mobile / tablet / wide); `Container` handles them.
- Spacing follows a 4px grid. Separate bands with hairline rules
  (`border-ed-rule`).
- Square corners. No rounded cards, no drop shadows.

## Links

Links are navy. Important standalone links use `ArrowLink` (trailing arrow, red
on hover). Link text must describe the destination: never "click here" or "read
more" on its own.

## Accessibility

- Every documented text color meets WCAG 2.1 AA on white; `ed-ink-4` and
  `ed-gold` do not, so never use them for text.
- Controls are 44px tall (`Button` size `md`), 36px for `sm`.
- One focus style everywhere: a 2px `ed-navy` outline with a 2px offset (set in
  `globals.css`; don't remove it).
- Every animation needs a `motion-reduce:` fallback.
- Check pages at phone width on `/storybook` and the page itself.

## Where we differ from BetterGov

- **Font token names.** BetterGov's `font-serif-ed` / `font-sans-ed` /
  `font-mono-ed` are `font-display` / `font-sans` / `font-mono` here (BetterGov
  notes its "serif" name is historical; Figtree isn't a serif).
- **Type scale as utilities** (`type-*`). BetterGov writes the same values as
  inline classes.
- **No legacy palettes.** BetterGov's older `primary-*`, `secondary-*`,
  `accent-*`, and `gray-*` scales aren't ported; the `ed-*` tokens replace them.
- **Light only.** BetterGov v2 has no dark palette, so neither do we.
- **Component changes** are noted at the top of each ported file in
  `components/`.

## Logo

`public/logo-seal.svg` (full seal) and `public/logo-mark.svg` (compact) use the
BetterGov palette and Figtree. They are generated by `design/make_logo.py`; see
the README.
