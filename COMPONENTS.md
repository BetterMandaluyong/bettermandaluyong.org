# Components

The catalog of reusable UI. **Read this before building or changing a page**,
and reuse what's here instead of hand-rolling markup, so a visual change stays a
one-file edit. Every entry has a live specimen at **`/storybook`**
(`app/storybook/page.tsx`).

When you add or change a component, update its entry here **and** its
`/storybook` specimen in the same change.

Components marked **(BetterGov)** are ported from the
[BetterGov.ph v2 design system](https://bettergov.ph/design/components) (MIT;
see NOTICE.md). Each file's header says what we changed. Before building
something new, check whether BetterGov already has it in
[`src/components/v2/`](https://github.com/bettergovph/bettergov/tree/main/src/components/v2):
porting beats inventing (and gets a NOTICE.md line).

All components are server components (no client JS). Copy comes from
[`components/content.ts`](components/content.ts). Extra `className`s are for
spacing and layout; `cx` doesn't merge conflicting Tailwind classes.

## Layout

### `PageShell`

`components/PageShell.tsx`: the frame every page uses. Full-width bands:
`SiteHeader`, `<main id="main-content">` (the skip link's target), `SiteFooter`.

```tsx
<PageShell>
  <section className="border-b border-ed-rule bg-ed-paper-2">
    <Container className="py-14">{/* masthead */}</Container>
  </section>
  <section>
    <Container className="py-12">{/* content */}</Container>
  </section>
</PageShell>
```

### `Container` (BetterGov)

`components/Container.tsx`: centred page width with gutters. `narrow` (1040px)
for reading pages; default 1504px. Every band's content goes in one.

### `SiteHeader` / `SiteFooter`

Rendered by `PageShell`; you don't use them directly. The header is the seal
logo + site name linking home. The footer shows `© <year> Better Mandaluyong`
(year rendered on the server) and the city.

## Actions and links

### `Button` (BetterGov)

`components/Button.tsx`: square navy control.

| Prop        | Type                 | Default   | Notes                                                     |
| ----------- | -------------------- | --------- | --------------------------------------------------------- |
| `href`      | `string`             | —         | Renders an `<a>`; without it, a `<button>`.               |
| `variant`   | `"solid" \| "ghost"` | `"solid"` | Filled for the main action, outlined for a secondary one. |
| `size`      | `"md" \| "sm"`       | `"md"`    | 44px or 36px tall.                                        |
| `className` | `string`             | —         | Spacing and layout.                                       |

Other props pass through to the `<a>` or `<button>`.

```tsx
<Button href={mailto(SITE.contactEmail)}>Get in touch</Button>
<Button variant="ghost" onClick={…}>Show more</Button>
```

### `ArrowLink` (BetterGov)

`components/ArrowLink.tsx`: an important standalone link with a trailing arrow,
red on hover. `external` adds `rel="noreferrer"`. The text must describe the
destination.

```tsx
<ArrowLink href={SITE.followUrl} external>
  Follow updates
</ArrowLink>
```

## Labels

### `Eyebrow` (BetterGov)

`components/Eyebrow.tsx`: small mono uppercase label above a title or on a card.
`tone`: `default`, `navy`, `red`, `onDark`.

### `Flag` (BetterGov)

`components/Flag.tsx`: square status tag (BetterGov uses flags, never rounded
pills). `variant`: `default`, `navy`, `red` (urgency only), `outline`.

```tsx
<Flag variant="navy">Launching soon</Flag>
```

### `SectionHeader` (BetterGov)

`components/SectionHeader.tsx`: a section's `<h2>` in the display face, with an
optional `meta` (count or timestamp) on the right. `onDark` for navy bands.

```tsx
<SectionHeader label="What we care about" meta="3 areas" />
```

## Content

### `Card` (BetterGov)

`components/Card.tsx`: square, hairline-bordered box; the border darkens on
hover. With `href`, the whole card is one link (put no other links inside).

```tsx
<Card href="/services/permits">
  <h3 className="type-subheading m-0">Business permits</h3>
  <p className="type-body m-0 mt-2">Apply, renew, and track.</p>
</Card>
```

### `PillarList`

`components/PillarList.tsx`: focus areas (title + one line each) as a grid of
`Card`s; stacks on phones. Takes `pillars` (`Pillar[]` from `content.ts`) and an
accessible `label`.

## Helpers

- `cx(...classes)` (`components/cx.ts`): join class names, skipping falsy
  values.
- `mailto(address)` (`components/content.ts`): build a `mailto:` href.
- `COLOR_TOKENS`, `TYPE_UTILITIES` (`components/tokens.ts`): what `/storybook`
  shows; `tokens_test.ts` checks each exists in `globals.css`.
