# app

Routes, via the App Router (vinext). Each `page.tsx` is a Server Component: it
reads data from `data/*.ts`, copy from `components/content.ts`, and lays the
page out with shared components.

- **A page file may only export** `default`, `metadata` / `generateMetadata`,
  and `generateStaticParams`. Put helpers in `components/` or `utils/`.
- **Dynamic routes are prebuilt.** `barangays/[slug]` and `people/[slug]` list
  every slug in `generateStaticParams` and call `notFound()` for anything else.
- **Every page is `PageShell`, then full-width bands** (`<section>` with
  `border-b border-ed-rule`), each with a `Container` (`py-8 md:py-12`) inside.
  The first band is `PageMasthead`, which holds the page's one `<h1>`; don't
  hand-roll a masthead.
- **Third-party data needs a visible credit:** a `SourceNote` under it.
- **`storybook/`** is the component catalog (noindex). New or changed UI gets a
  specimen there in the same change, with obviously sample data, never real
  people.
- `globals.css` holds the design tokens. Change DESIGN.md first, then here.
- **Metadata goes through `pageMetadata()`** (`components/metadata.ts`): it sets
  the title, description, canonical URL, and complete Open Graph and X/Twitter
  tags. Metadata merges shallowly, so a page that writes its own `openGraph`
  loses the site name and share image.
- **New routes join the sitemap.** A new main section goes in `MAIN_PAGES`
  (`components/metadata.ts`), which feeds `sitemap.ts` and `/llms.txt`; new
  dynamic routes are added to `sitemap.ts` directly.
- **Machine-readable files are route handlers here**, not files in `public/`:
  `robots.ts`, `sitemap.ts`, `llms.txt/route.ts`, `humans.txt/route.ts`, and
  `news/feed.xml/route.ts`. Their copy lives in `content.ts`; the formatting is
  in `utils/site/`.
- Redirects live in `next.config.ts`, not here.
