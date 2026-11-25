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

The first deploy publishes to `bettermandaluyong-org.<your-subdomain>.workers.dev`.
To serve it on the real domain, add the domain to Cloudflare and uncomment the
`routes` block in `wrangler.jsonc`.

## Placeholders to replace

- `mailto:hello@bettermandaluyong.org` in `index.html`
- The "Follow updates" link (currently points at facebook.com)
