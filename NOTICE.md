# Notices and credits

This site is built on work that other people shared openly. This file records
what we reused, where it came from, and under which license, and it carries the
license texts those licenses require us to include. **Anyone who copies code,
text, images, or data into this repo adds an entry here in the same change**
(see "Attribution" in [AGENTS.md](AGENTS.md)).

## What we use

| Work                                                                                                                                            | By                        | License                                    | What we use                                                                                                                                                                                                                                                                                                                                        | Where it lives here                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [BetterGov.ph v2 design system](https://bettergov.ph/design) ([source](https://github.com/bettergovph/bettergov), commit `5ead8c0`, 2026-11-19) | BetterGov.ph contributors | [MIT](#bettergovph-mit)                    | Ported, not installed: the color tokens and their roles, fonts, page widths, type scale, and layout and accessibility rules (`src/index.css`, `src/pages/design/*`); the `Button`, `ArrowLink`, `Card`, `Container`, `Eyebrow`, `Flag`, and `SectionHeader` components (`src/components/v2/ui/*`), with the changes noted at the top of each file. | `app/globals.css`, those `components/*.tsx`, [DESIGN.md](DESIGN.md) |
| [Imposter Syndrome Disclaimer](https://github.com/adriennefriend/imposter-syndrome-disclaimer)                                                  | Adrienne Lowe             | [MIT](#imposter-syndrome-disclaimer-mit)   | The disclaimer text, verbatim, with a link back.                                                                                                                                                                                                                                                                                                   | [README.md](README.md)                                              |
| Mandaluyong City seal                                                                                                                           | City of Mandaluyong       | n/a (government symbol)                    | Our logo is a flat redraw of the seal's elements, not a copy of the seal artwork.                                                                                                                                                                                                                                                                  | `public/logo-*.svg`, `design/make_logo.py`                          |
| [Figtree](https://github.com/erikdkennedy/figtree)                                                                                              | Erik Kennedy              | [SIL OFL 1.1](https://openfontlicense.org) | Letterforms in the logo, converted to outlines; also loaded from Google Fonts for headings. The font files are not redistributed here.                                                                                                                                                                                                             | `public/logo-seal.svg`, `app/layout.tsx`                            |

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
