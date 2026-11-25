# Notices and credits

This site is built on work that other people shared openly. This file records
what we reused, where it came from, and under which license, and it carries the
license texts those licenses require us to include. **Anyone who copies code,
text, images, or data into this repo adds an entry here in the same change**
(see "Attribution" in [AGENTS.md](AGENTS.md)).

## What we use

| Work                                                                                                                                                                                               | By                                                                                                           | License                                                                                                                                                          | What we use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Where it lives here                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [BetterGov.ph v2 design system](https://bettergov.ph/design) ([source](https://github.com/bettergovph/bettergov), commit `5ead8c0`, 2026-11-19)                                                    | BetterGov.ph contributors                                                                                    | [MIT](#bettergovph-mit)                                                                                                                                          | Ported, not installed: the color tokens and their roles, fonts, page widths, type scale, and layout and accessibility rules (`src/index.css`, `src/pages/design/*`); the `Button`, `ArrowLink`, `Card`, `Container`, `Eyebrow`, `Flag`, and `SectionHeader` components (`src/components/v2/ui/*`); the top-banner colors (`src/components/v2/layout/PhaseBanner.tsx`) in `UnofficialBar`, and the footer layout (`Footer.tsx`, `FooterColumn.tsx`) in `SiteFooter`; with the changes noted at the top of each file. | `app/globals.css`, those `components/*.tsx`, [DESIGN.md](DESIGN.md)                |
| [Imposter Syndrome Disclaimer](https://github.com/adriennefriend/imposter-syndrome-disclaimer)                                                                                                     | Adrienne Lowe                                                                                                | [MIT](#imposter-syndrome-disclaimer-mit)                                                                                                                         | The disclaimer text, verbatim, with a link back.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | [README.md](README.md)                                                             |
| [BetterGov.ph logo](https://github.com/bettergovph/logo)                                                                                                                                           | BetterGov.ph                                                                                                 | Not licensed (see below)                                                                                                                                         | The white horizontal logo, unmodified, as a "Part of the BetterGov.ph initiative" credit in the footer. Loaded from BetterGov's CDN (`assets.bettergov.ph`), not copied into this repo.                                                                                                                                                                                                                                                                                                                             | `components/content.ts` (`BETTERGOV`), `components/SiteFooter.tsx`                 |
| Mandaluyong City seal                                                                                                                                                                              | City of Mandaluyong                                                                                          | n/a (government symbol)                                                                                                                                          | Our logo is a flat redraw of the seal's elements, not a copy of the seal artwork.                                                                                                                                                                                                                                                                                                                                                                                                                                   | `public/logo-*.svg`, `design/make_logo.py`                                         |
| [Figtree](https://github.com/erikdkennedy/figtree)                                                                                                                                                 | Erik Kennedy                                                                                                 | [SIL OFL 1.1](https://openfontlicense.org)                                                                                                                       | Letterforms in the logo, converted to outlines; also loaded from Google Fonts for headings. The font files are not redistributed here.                                                                                                                                                                                                                                                                                                                                                                              | `public/logo-seal.svg`, `app/layout.tsx`                                           |
| [Public pages of the City Government of Mandaluyong](https://mandaluyong.gov.ph/government/barangays/)                                                                                             | City Government of Mandaluyong                                                                               | Government publication (Philippine IP Code §176: no copyright in government works; the agency may set conditions for commercial use)                             | Names, positions, office addresses, phone numbers, and emails of barangay and city officials, and each barangay's council district, as published (snapshot of 2026-11-25). Name capitalisation tidied. Credited with a link and last-updated date on each page that shows it.                                                                                                                                                                                                                                       | `data/barangays/*.yaml`, `data/city-officials.yaml`, `scripts/import_barangays.ts` |
| [faeldon/philippines-json-maps](https://github.com/faeldon/philippines-json-maps), commit `680e32e` (2026-11-07), file `latest/geojson/municities/medres/bgysubmuns-municity-1380500000.0.01.json` | James Faeldon (repo, [MIT](#philippines-json-maps-mit)); boundary geometry by NAMRIA and PSA via OCHA COD-AB | Geometry: [CC BY-IGO 3.0](https://creativecommons.org/licenses/by/3.0/igo/)                                                                                      | Mandaluyong's 27 barangay boundaries. We kept the PSGC code, added a URL slug, and rounded coordinates to 5 decimals. Credited under every map: "NAMRIA and PSA, via OCHA COD-AB (CC BY-IGO)".                                                                                                                                                                                                                                                                                                                      | `public/data/mandaluyong-barangays.geojson`, `scripts/import_barangays.ts`         |
| [BetterGov.ph directory data](https://github.com/bettergovph/bettergov/blob/5ead8c0/src/data/directory/house_members.json), commit `5ead8c0`                                                       | BetterGov.ph contributors                                                                                    | [MIT](#bettergovph-mit)                                                                                                                                          | One phone number: the House of Representatives' listing for Mandaluyong's representative ("Lone" district), in `house_members.json`.                                                                                                                                                                                                                                                                                                                                                                                | `data/city-officials.yaml` (`representative`)                                      |
| [List of barangays of Metro Manila](https://en.wikipedia.org/wiki/List_of_barangays_of_Metro_Manila)                                                                                               | Wikipedia contributors                                                                                       | CC BY-SA 4.0 (we copy facts only: which ZIP number goes with which barangay; no prose)                                                                           | The barangay-to-ZIP mapping. PHLPost publishes no barangay list, so the site labels ZIPs "approximate" and links PHLPost's ZIP Code Locator. A maintainer should confirm this facts-only use is acceptable (copyleft rule in AGENTS.md).                                                                                                                                                                                                                                                                            | `scripts/import_barangays.ts` (`ZIP_BY_NAME`), `data/barangays/*.yaml`             |
| [Leaflet](https://leafletjs.com/)                                                                                                                                                                  | Volodymyr Agafonkin and contributors                                                                         | BSD-2-Clause (npm package, not copied)                                                                                                                           | Draws the map. Its own attribution link stays in the map's corner.                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `islands/BarangayMap.tsx`                                                          |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) map tiles                                                                                                                                 | OpenStreetMap contributors                                                                                   | [ODbL](https://opendatacommons.org/licenses/odbl/) (data); tiles served under the [OSMF tile usage policy](https://operations.osmfoundation.org/policies/tiles/) | Street map tiles, loaded from `tile.openstreetmap.org` while the map is open, not stored here. "© OpenStreetMap contributors" shows on the map.                                                                                                                                                                                                                                                                                                                                                                     | `islands/BarangayMap.tsx`                                                          |

The BetterGov.ph name and logos are excluded from BetterGov's MIT and CC
BY-NC-ND licenses, and the
[logo repository](https://github.com/bettergovph/logo) has no license. Its usage
guide asks partners to use the files unmodified from `assets.bettergov.ph`,
which is what we do; we don't copy, recolor, or crop them. Confirm with
BetterGov.ph that Better Mandaluyong may show the logo, and remove it if asked.

Fonts loaded from Google Fonts (Figtree, Inter, JetBrains Mono) are served by
Google under the SIL Open Font License; we don't host or modify them.

### Studied, not copied

We looked at these projects for direction. Nothing has been copied from them; if
that changes, add a row above.

- [Kapwa Design System](https://github.com/bettergovph/kapwa) (CC0 1.0), the
  earlier BetterGov.ph design system.
- [BetterLosBanos/betterlb](https://github.com/BetterLosBanos/betterlb) (CC0
  1.0).
- [iyanski/betterlocalgov](https://github.com/iyanski/betterlocalgov) (CC0 1.0).
- [BetterSolano/bettersolano](https://github.com/BetterSolano/bettersolano) (MIT
  for code, CC BY 4.0 for content: copying its text, images, or data requires
  credit, a link to the license, and a note of what changed).
- [cloudflare/vinext `apps/web`](https://github.com/cloudflare/vinext/tree/main/apps/web)
  (MIT): the worker-entry pattern in `worker/index.ts`.
- [getcebby/cebby](https://github.com/getcebby/cebby) (no license; studied
  only): the idea that a status line shows "working" only after a real read.

- [BetterGov.ph officials network / dynasties](https://dynasties.bettergov.ph/developers)
  ([bettergovph/officials-network-graph](https://github.com/bettergovph/officials-network-graph),
  commit `c076f38`; derived data CC0 1.0). Its election results come from
  [Open Halalan](https://robertrleung.github.io/OpenHalalan/) (Robert Leung and
  others,
  [doi:10.5281/zenodo.17783099](https://doi.org/10.5281/zenodo.17783099), ODbL
  1.0). `scripts/check_dynasties.ts` only compares our city officials with its
  2025 winners; nothing is copied or stored. If we ever show election history,
  it needs its own row, an Open Halalan credit, ODbL terms for that file, and a
  maintainer's OK.

### npm dependencies

Packages installed from npm keep their own license files in `node_modules`. To
list them:

```sh
pnpm licenses list --prod
```

## License texts

MIT requires its copyright and permission notice to travel with any substantial
copy, so the full texts are reproduced here.

### BetterGov.ph (MIT)

```text
MIT License

Copyright (c) 2025-2026 BetterGov.ph contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Imposter Syndrome Disclaimer (MIT)

```text
MIT License

Copyright (c) 2016 Adrienne Lowe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### philippines-json-maps (MIT)

```text
MIT License

Copyright (c) James Faeldon.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
