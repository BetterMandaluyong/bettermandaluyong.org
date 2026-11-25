# bettermandaluyong.org

Launching-soon page, served as static assets from a Cloudflare Worker.

No build step. Edit files in `public/`, and Wrangler serves the folder as-is.

```
public/
  index.html    page markup
  styles.css    styles (light + dark via prefers-color-scheme)
  favicon.svg
wrangler.jsonc  Worker config (assets-only)
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

## Placeholders to replace

- `mailto:hello@bettermandaluyong.org` in `index.html`
- The "Follow updates" link (currently points at facebook.com)
