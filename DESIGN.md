# Design

bettermandaluyong.org uses the **BetterGov.ph v2 design system**, the national
standard the BetterLGU sites are adopting. This file is our implementation
notes: which tokens and components we have, what we named them, and the few
decisions that are ours. It is not a copy of the guidelines.

## The guidelines and their licenses

The rules live at [bettergov.ph/design](https://bettergov.ph/design). Read them
there before designing anything new:

- [Overview](https://bettergov.ph/design/overview): principles, and how to use
  the system in your own service.
- [Styles](https://bettergov.ph/design/styles): typography, colour, layout,
  links.
- [Components](https://bettergov.ph/design/components) and
  [Patterns](https://bettergov.ph/design/patterns).
- [Accessibility](https://bettergov.ph/design/accessibility): what the system
  covers and what each team still has to test.
- [Brand guide](https://bettergov.ph/design): the mark, colour, type, voice.

BetterGov.ph publishes two things under two licenses, and we treat them
differently:

| What                                                                                     | License         | What we do                                                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| The code: tokens in `src/index.css`, components in `src/components/v2/`                  | MIT             | Ported at commit `5ead8c0` (2026-11-19) into `app/globals.css` and `components/`. Credit and license text in [NOTICE.md](NOTICE.md).    |
| The written guidelines on bettergov.ph/design                                            | CC BY-NC-ND 4.0 | Linked, not copied or adapted. "No derivatives" means a reworded version needs BetterGov's permission, so this file uses our own words. |
| The BetterGov.ph name, its logo, and the coat of arms of the Republic of the Philippines | Neither         | Name used only to credit them; logo shown unmodified in the footer (see NOTICE.md). We never use the coat of arms.                      |

Tokens live in [`app/globals.css`](app/globals.css). **Change a value here
first, then there.** Every token and component is shown at `/storybook`.

## Color

Use tokens as Tailwind classes (`bg-ed-paper-2`, `text-ed-ink-2`,
`border-ed-rule`, `bg-ed-navy`), never hex values. The values are BetterGov's.

| Token            | Hex       | Where we use it                                     |
| ---------------- | --------- | --------------------------------------------------- |
| `ed-ink`         | `#0c1b33` | Headings, names, strong text                        |
| `ed-ink-2`       | `#2b3a55` | Running text (the `body` default)                   |
| `ed-ink-3`       | `#252629` | Roles, dates, notes, other secondary text           |
| `ed-ink-4`       | `#8a95aa` | Disabled or decorative marks. **Not text: < AA**    |
| `ed-paper`       | `#ffffff` | Page background                                     |
| `ed-paper-2`     | `#f4f7fc` | Masthead band, tinted bands                         |
| `ed-paper-3`     | `#e6ecf5` | Wells inside a tinted band                          |
| `ed-rule`        | `#dbe3ef` | Hairlines between bands and around boxes (default)  |
| `ed-rule-strong` | `#9fb2cc` | Borders that need more weight, like outline flags   |
| `ed-navy`        | `#0b4fd9` | Every link, primary button, active state, and focus |
| `ed-navy-2`      | `#0a44bd` | `UnofficialBar`; hover for navy controls            |
| `ed-navy-ink`    | `#08286e` | Footer band; darkest navy text                      |
| `ed-navy-tint`   | `#e8efff` | Light navy fill or hover tint (unused so far)       |
| `ed-red`         | `#c8102e` | Urgent only: removed news, fire stations on the map |
| `ed-red-ink`     | `#8c0a20` | Red text on a light background                      |
| `ed-sage`        | `#4a6b5a` | Rare accent; never on a control                     |
| `ed-gold`        | `#b8893a` | Rare accent; never on a control, **never text**     |
| `success-700`    | `#006939` | Success states                                      |
| `warning-500`    | `#ffb900` | Warnings, always with dark text and an icon         |
| `error-600`      | `#b42525` | Errors and destructive actions                      |

The full `success-*`, `warning-*`, and `error-*` scales (50–900) are also
available. Navy is the only colour that means "you can click this". Colour never
carries meaning alone: pair it with a word or an icon (the map markers carry a
letter for this reason).

## Typography

| Font                   | Class          | Our use                                                   |
| ---------------------- | -------------- | --------------------------------------------------------- |
| Figtree 600/700        | `font-display` | Page and section titles, card titles, figures             |
| Inter 400/500/600      | `font-sans`    | Everything else people read or operate (the default)      |
| JetBrains Mono 400/500 | `font-mono`    | Short labels only: eyebrows, flags, dates, table headings |

The type scale is a set of utilities (font, size, weight, line height, and
colour in one class):

| Utility           | Spec                                    | Where                                   |
| ----------------- | --------------------------------------- | --------------------------------------- |
| `type-display`    | Figtree Bold, clamp(32–56px)            | The `<h1>` in `PageMasthead`, once      |
| `type-section`    | Figtree Semibold, 24px                  | `SectionHeader` titles                  |
| `type-subheading` | Figtree Semibold, 18px                  | Sub-sections, card and list titles      |
| `type-lede`       | Inter, 18px, ink-2                      | The paragraph under the page title      |
| `type-body`       | Inter, 17px, ink-2                      | Running text (also the `body` default)  |
| `type-ui`         | Inter, 14px                             | Navigation, buttons, dense lists, notes |
| `type-label`      | JetBrains Mono, 11px, uppercase, spaced | Labels; never a full sentence           |

Headings stay upright and in sentence or title case (BRAND.md), never italic or
all caps, and never skip a level. Cap prose at `max-w-[65ch]`. Mono never
appears in the header navigation or a masthead title.

## Layout

- **Bands.** A page is `PageShell` around full-width `<section>` bands separated
  by `border-b border-ed-rule`. Each band's content sits in one `<Container>`.
- **Masthead.** The first band is always `PageMasthead` (light paper-2 band, a
  dark ink rule under it, one `<h1>`). Its padding is 28px on phones and 64px
  from `md` up; don't set it by hand.
- **Section bands.** `py-8 md:py-12` on the `Container` (32px on phones, 48px
  from `md` up).
- **Widths.** `<Container>` is 1504px; `<Container narrow>` is 1040px for
  reading pages. Never set a page `max-width` yourself: the widths are the
  `--container-page*` tokens.
- **Gutters.** 16 / 24 / 32px (phone / tablet / wide), from `Container`.
- **Spacing** is on a 4px grid.
- **Shape.** Square corners and hairline borders. No rounded cards, drop
  shadows, or gradients anywhere, including bands.

## Links

- **Links in a sentence are underlined.** `globals.css` underlines every `<a>`
  (navy, 2px offset), so a link inside running text is visible without colour.
- **Standalone links opt out** with `no-underline` (usually plus
  `hover:underline`): navigation, list and card titles, contact rows. `Button`,
  `ArrowLink`, and `Card` already do.
- **Important standalone links** use `ArrowLink` (trailing arrow, red on hover).
- Link text names the destination. Never "click here" or a bare "read more".

## Accessibility

BetterGov aims for WCAG 2.2 AA and says reusing its components doesn't replace
testing the page. What this site does:

- Text colours on white meet AA; `ed-ink-4` and `ed-gold` don't, so they are
  never text.
- Controls are 44px tall (`Button` size `md`), 36px for `sm`.
- One focus style: a 2px `ed-navy` outline with a 2px offset (`globals.css`;
  white on navy bands). Don't remove it.
- A skip link to `<main id="main-content">` on every page.
- Every animation has a `motion-reduce:` fallback.
- Check each page at phone width and on `/storybook`, by keyboard as well as
  with a mouse.

## Extending the system

When a page needs something the catalog doesn't have, go down this list and stop
at the first step that works:

1. **Reuse** a component from [COMPONENTS.md](COMPONENTS.md).
2. **Compose** it from tokens, type utilities, and existing components. Most
   needs are a heading, a rule, and some spacing.
3. **Port** BetterGov's version from
   [`src/components/v2/`](https://github.com/bettergovph/bettergov/tree/main/src/components/v2)
   (MIT): keep a header naming the source file and commit and what changed, and
   add it to NOTICE.md.
4. **Build** our own with the tokens, only where Mandaluyong's content really
   differs. Add it to COMPONENTS.md and `/storybook`, and note it below under
   "Where we differ".

If the need would recur on other BetterLGU sites, propose it upstream: open an
issue on
[bettergovph/bettergov](https://github.com/bettergovph/bettergov/issues) (the
design pages' "Propose a change" link goes there). New tokens follow the same
order: never add a colour or size to `globals.css` that BetterGov doesn't have
without recording why here.

## Where we differ from BetterGov

- **Font token names.** BetterGov's `font-serif-ed` / `font-sans-ed` /
  `font-mono-ed` are `font-display` / `font-sans` / `font-mono` here.
- **Type scale as utilities** (`type-*`). BetterGov writes the same values as
  inline classes.
- **No legacy palettes.** BetterGov's older `primary-*`, `secondary-*`,
  `accent-*`, and `gray-*` scales aren't ported; the `ed-*` tokens replace them.
- **Light only.** BetterGov v2 has no dark palette, so neither do we.
- **Links underlined by default.** BetterGov underlines inline links per area
  (for example its news body); we do it once in `globals.css` and opt out for
  standalone links.
- **`PageMasthead`** keeps `type-display` and `type-lede` at phone width;
  BetterGov shrinks the title to 26px and the lede to 15px, below our 16px floor
  for body text. It has no navy `hero` variant yet.
- **Gutters** follow BetterGov's `Container` code (16px on phones); its written
  guidelines say 18px.
- **Component changes** are noted at the top of each ported file in
  `components/`.

## Logo

`public/logo-seal.svg` (full seal) and `public/logo-mark.svg` (compact) are our
own: a flat redraw of the Mandaluyong City seal's elements in the BetterGov
palette and Figtree. They are generated by `design/make_logo.py`; see the
README. BetterGov's logo is theirs: we show it only as the "part of" credit in
the footer, unmodified, on the navy band, with clear space around it.
