# bettermandaluyong.org

Launching-soon page, served as static assets from a Cloudflare Worker.

No build step. Edit files in `public/`, and Wrangler serves the folder as-is.

```
public/
  index.html      page markup
  styles.css      styles (light + dark via prefers-color-scheme)
  logo-seal.svg   site logo and favicon: the full seal
  logo-mark.svg   compact medallion for small sizes and app icons
  png/            both logos at 512, 1024 and 2048 px, transparent background
design/
  make_logo.py    generates both SVG logos
  export_png.cjs  renders the PNGs from the SVGs
wrangler.jsonc    Worker config (assets-only)
```

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:8787
```

## Deploy

```bash
pnpm wrangler login   # once
pnpm deploy
```

Pushes to `main` deploy automatically through Cloudflare Workers Builds; other
branches upload a preview version.

The Worker serves `bettermandaluyong.org` as a custom domain (see `routes` in
`wrangler.jsonc`). `www.bettermandaluyong.org` is not attached to the Worker; a
Cloudflare Redirect Rule on the zone sends it to the root domain.

## Logo

The logo is a flat redraw of the elements of the Mandaluyong city seal, in the
BetterGov palette shared by the other [BetterLGU](https://lgu.bettergov.ph/) sites:
blue `#0032A0`, gold `#F2C91D` and white.

- **27 stars**, one for each barangay
- **Laurel**, for leadership and honour
- **Rising sun** in the style of the Philippine flag, for a new beginning
- **Skyline** around a central tower, for the city's growth
- **Dove** with wings spread, for freedom and peace
- **Blue and gold waves**, for the Pasig River and the rolling land
  (_madaluyong_) the city is named after

`logo-seal.svg` is the full seal, with "BETTER MANDALUYONG" set in Figtree
ExtraBold (the BetterGov typeface). The site uses it as its logo and favicon.
`logo-mark.svg` is the centre of the seal on its own, for places too small for
the ring of text and stars.

The SVGs are generated, so change `design/make_logo.py` rather than editing
them by hand. Lettering is converted to outlines, so the files need no fonts.

### Regenerate

Requires Python with [fontTools](https://github.com/fonttools/fonttools) and
Node. Fetch Figtree (SIL Open Font License) and rebuild the SVGs:

```bash
curl -L -o /tmp/Figtree.ttf "https://github.com/google/fonts/raw/main/ofl/figtree/Figtree%5Bwght%5D.ttf"
```

```bash
python3 design/make_logo.py /tmp/Figtree.ttf public
```

Then re-export the PNGs. The renderer is installed outside the project so it
doesn't become a site dependency:

```bash
npm install --prefix /tmp/resvg @resvg/resvg-js@2.6.2
```

```bash
NODE_PATH=/tmp/resvg/node_modules node design/export_png.cjs public public/png
```

## Placeholders to replace

- `mailto:hello@bettermandaluyong.org` in `index.html`
- The "Follow updates" link (currently points at facebook.com)
