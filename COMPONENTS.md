# Components

The catalog of reusable UI. **Read this before building or changing a page**,
and reuse what's here instead of hand-rolling markup, so a visual change stays a
one-file edit. When you add or change a component, update its entry here in the
same change.

All components are server components in `components/` (no client JS) unless
noted. Copy comes from [`components/content.ts`](components/content.ts).

## Layout

### `PageShell`

`components/PageShell.tsx` — the frame every page uses: centered 68rem column,
`SiteHeader` on top, `SiteFooter` at the bottom, and `<main id="main-content">`
(the skip link's target) in between.

```tsx
<PageShell>{/* sections */}</PageShell>
```

### `SiteHeader` / `SiteFooter`

Rendered by `PageShell`; you don't use them directly. The header is the logo
mark + site name linking home. The footer shows `© <year> Better Mandaluyong`
(year rendered on the server) and the city.

## Content

### `Button`

`components/Button.tsx` — a link styled as an action.

| Prop        | Type                | Default   | Notes                            |
| ----------- | ------------------- | --------- | -------------------------------- |
| `href`      | `string`            | —         | Required.                        |
| `variant`   | `"solid" \| "link"` | `"solid"` | Brand pill, or underlined link.  |
| `rel`       | `string`            | —         | e.g. `"noopener"` for external.  |
| `className` | `string`            | —         | Extra classes (spacing, mostly). |

```tsx
<Button href={mailto(SITE.contactEmail)}>Get in touch</Button>
<Button href={SITE.followUrl} variant="link" rel="noopener">Follow updates →</Button>
```

### `Eyebrow`

`components/Eyebrow.tsx` — small uppercase label above a headline. `live` adds
the pulsing accent dot.

```tsx
<Eyebrow live>Launching soon</Eyebrow>
```

### `PillarList`

`components/PillarList.tsx` — bordered grid of focus areas (title + one line
each); wraps to one column on phones. Takes `pillars` (`Pillar[]` from
`content.ts`) and an accessible `label`.

```tsx
<PillarList pillars={HOME.pillars} label={HOME.pillarsLabel} />
```

## Helpers

- `cx(...classes)` (`components/cx.ts`) — join class names, skipping falsy
  values.
- `mailto(address)` (`components/content.ts`) — build a `mailto:` href.
