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
- Redirects live in `next.config.ts`, not here.
