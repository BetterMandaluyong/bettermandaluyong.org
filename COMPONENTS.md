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
`UnofficialBar`, `SiteHeader`, `<main id="main-content">` (the skip link's
target), `SiteFooter`.

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

### `UnofficialBar`

`components/UnofficialBar.tsx`: thin `bg-ed-navy-2` band above the header on
every page (rendered by `PageShell`), in the style of BetterGov's top banner.
Says the site is not run by the City Government and links (external,
`rel="noreferrer"`, white with `focus-visible:outline-white`) to the official
site. Copy is `UNOFFICIAL` and `SITE.officialSiteUrl` in `content.ts`. Thin:
notice and link flow inline (one line on desktop, wrapping in place on phones);
the link's padding gives a 44px tap target without thickening the bar.

### `SiteHeader` / `SiteFooter` (BetterGov)

Rendered by `PageShell`; you don't use them directly.

- **`SiteHeader`**: the seal logo + site name linking home, plus a
  `<nav aria-label="Main">` listing `NAV` from `content.ts` (navy links, 44px
  tall). Add a nav item by adding to `NAV`.
- **`SiteFooter`** (BetterGov's `Footer`): an `ed-navy-ink` band with the site
  name and description, the unofficial-site notice (`FOOTER.unofficial`) linking
  to the official site, "Part of the BetterGov.ph initiative" with BetterGov's
  white logo (from its CDN, unmodified), link columns (`FOOTER.columns`: email,
  our Facebook, and the BetterGov.ph Discord; GitHub; BetterGov.ph, including
  its Facebook), and a bottom row with `© <year> FOOTER.copyright` (year
  rendered on the server), the content and code licenses (`FOOTER.licenses`),
  and the short commit hash linking to that commit on GitHub. The hash comes
  from `components/build.ts`, which `vite.config.ts` fills at build time; it is
  hidden when unknown. On navy surfaces, links set `focus-visible:outline-white`
  so the focus ring stays visible.

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
<SectionHeader label="Barangays" meta="27 barangays" />
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

### `BarangayList`

`components/BarangayList.tsx`: the barangays as a grid of square link tiles
(name, council district, approximate ZIP), each linking to `/barangays/<slug>`;
stacks to one column on phones. Takes `barangays` (`Barangay[]` from
`data/barangays.ts`) and an accessible `label`. `groupByDistrict` gives one
headed list per council district (used on `/barangays`). It is also the keyboard
and no-JavaScript way to reach everything the map shows. Copy is in `BARANGAYS`
(`content.ts`).

```tsx
<BarangayList barangays={BARANGAYS} label="All barangays" groupByDistrict />
```

### `OfficialList`

`components/OfficialList.tsx`: people and their positions. `variant="plain"`
(default) is a ruled list, name on the left and position on the right, for
councils. `columns` (plain only) flows the rows into 2–3 columns.
`variant="card"` is a grid of square cards that also show office, phone numbers
(each a `tel:` link, via `parsePhones`) and emails (each a `mailto:` link); an
optional `href` links the name to the person's `/people/…` page. Takes `items`
(`OfficialItem[]`) and a `label`. `officialItem(official)` turns a
`CityOfficial` from `data/city-officials.ts` into a card item linking to their
`/people/…` page.

```tsx
<OfficialList
  variant="card"
  label="District 1 councilors"
  items={councilorsFor(1).map(officialItem)}
/>
```

### `SourceNote`

`components/SourceNote.tsx`: the small credit line under third-party data:
"Source: <link>. Last updated by the city on <date>." plus any `children` (the
map's boundary and tile credits). All props are optional: `href`, `label`,
`updated` (already formatted; see `formatSourceDate`). AGENTS.md requires a
visible credit like this for third-party content.

```tsx
<SourceNote
  href={barangay.sourceUrl}
  updated={formatSourceDate(barangay.sourceModified)}
/>
```

### `NewsList`

`components/NewsList.tsx`: server component listing city news, newest first, as
an `<ol>` of rows: mono date, the post title as an external link
(`rel="noreferrer"`) to the city's page (the archived copy once removed), the
categories as `Flag`s, an "Archived copy" link when one exists, and a red `Flag`
"Removed from the city site" when the city removed the post. `compact` hides the
categories (for the home page). Takes `items: NewsItem[]` (from
`data/schema.ts`). Copy is in `NEWS` (`content.ts`).

```tsx
<NewsList items={items} compact />
```

## Islands

Interactive pieces live in `islands/` and start with `"use client"`; everything
else stays server-rendered. Islands take serializable props only.

### `FacebookFeed`

`islands/FacebookFeed.tsx`: the first island. Takes `pageUrl` (the Facebook
page). Shows a ghost `Button` "Show Facebook posts" and a note that Facebook may
set cookies; only after the tap does it render the Facebook page-plugin
`<iframe>` (lazy). No Facebook iframe or script exists before the tap. The plain
"See all posts on Facebook" link is always visible.

```tsx
<FacebookFeed pageUrl={SITE.cityPioFacebookUrl} />
```

### `BarangayMap`

`islands/BarangayMap.tsx`: an interactive map of the barangay boundaries, drawn
with Leaflet over CARTO Voyager tiles when `VITE_CARTO_KEY` is set (see
`.env.example`), else OpenStreetMap tiles muted and tinted blue. Each barangay
is shaded by council district (solid for District 1, dashed for District 2, so
color isn't the only cue) and names itself on hover. Props: `geojsonUrl`
(`BOUNDARIES_URL`), `barangays` (`MapBarangay[]`, `MAP_BARANGAYS`), `height`
(`"short"`, `"tall"`, or `"fill"`: fixed on phones, the parent's height on large
screens).

- Without `onSelect`, a click opens a popup (captain, phone, link to its page).
  With `onSelect(slug)`, a click calls it and the parent shows the details.
- View props change what is shown without rebuilding the map: `selected` (a slug
  or `null`) zooms to one barangay and dims the rest; `focus` does the same for
  a fixed barangay; `focusDistrict` (`1 | 2`) zooms to and highlights one
  council district; `matches` (slugs) dims everything else, for search results;
  `hovered` (a slug) highlights one barangay as if the pointer were over it (the
  explorer sets it when you hover a card).
- The scroll wheel doesn't zoom, so the map never traps page scrolling;
  animation is off under `prefers-reduced-motion`. Leaflet loads in the browser
  only. The page must also show the credits (`BARANGAYS.mapCredit` in a
  `SourceNote`) and the barangay list, the accessible equivalent.

```tsx
<BarangayMap
  geojsonUrl={BOUNDARIES_URL}
  barangays={MAP_BARANGAYS}
  focusDistrict={2}
/>
```

### `BarangayExplorer`

`islands/BarangayExplorer.tsx`: the home page's main interface. A `BarangayMap`
on the left (`lg:` two columns; stacked on phones) and on the right a search box
over a scrolling list of barangay cards. Picking a card or a barangay on the map
zooms to it and swaps the panel to its details: hall contacts and the whole
barangay and SK council, each name linking to its `/people/…` page. Search
(`searchBarangays`) matches barangay names, ZIPs, "district 1", and officials'
names, and matching barangays stay bright on the map. The selection is kept in
the address (`/?barangay=hulo`). Cards are ordinary links to
`/barangays/<slug>`, so the list works without JavaScript; with it, a plain
click selects. Props: `barangays`, `hrefs` (person links keyed by `hrefKey`; use
`BARANGAY_PERSON_HREFS`), `geojsonUrl`, `initialSelected`. Built so future
panels and map layers can be added beside the barangay view.

```tsx
<BarangayExplorer
  barangays={BARANGAYS}
  hrefs={BARANGAY_PERSON_HREFS}
  geojsonUrl={BOUNDARIES_URL}
  initialSelected="hulo"
/>
```

## Helpers

- `cx(...classes)` (`components/cx.ts`): join class names, skipping falsy
  values.
- `mailto(address)` (`components/content.ts`): build a `mailto:` href.
- `parsePhones(text)`, `telHref(text)` (`utils/barangays/phone.ts`): split the
  city's phone text into numbers with `tel:` links.
- `searchBarangays(barangays, query)` (`utils/barangays/search.ts`): accent- and
  case-insensitive search over names, ZIPs, districts, and officials.
- `getPerson(slug)`, `personHref(name, role, barangaySlug?)`, `PEOPLE`
  (`data/people.ts`): the `/people/<slug>` directory.
- `formatSourceDate(isoDate)` (`utils/barangays/format.ts`): "February 20,
  2026".
- `COLOR_TOKENS`, `TYPE_UTILITIES` (`components/tokens.ts`): what `/storybook`
  shows; `tokens_test.ts` checks each exists in `globals.css`.
