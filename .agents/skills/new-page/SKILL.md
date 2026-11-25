---
name: new-page
description:
  Create a new route/page following the App Router patterns — PageShell layout,
  metadata, copy in content.ts, and the component obligations. Use when adding
  any page under app/.
---

# New page

## 1. Get the content from real sources, not from your head

Copy lives in `components/content.ts`; voice rules are in `BRAND.md`. Never
invent people, quotes, numbers, programs, or partnerships. If the real content
isn't available, use a clearly marked placeholder and say so in the PR.

## 2. Create the route

File-system routing: `app/<slug>/page.tsx`. Page files export only `default`,
`metadata` (or `generateMetadata`), and `generateStaticParams`:

```tsx
import type { Metadata } from "next";
import { Container } from "../../components/Container.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SLUG } from "../../components/content.ts";

export const metadata: Metadata = {
  title: SLUG.metaTitle,
  description: SLUG.metaDescription,
};

export default function SlugPage() {
  return (
    <PageShell>
      {/* Masthead band: one type-display title per page. */}
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14">
          <h1 className="type-display m-0">{SLUG.title}</h1>
          <p className="type-lede m-0 mt-5 max-w-[65ch]">{SLUG.lede}</p>
        </Container>
      </section>
      {/* One band per section, separated by hairline rules. */}
      <section>
        <Container className="py-12">
          <SectionHeader label={SLUG.sectionTitle} />
          {/* … */}
        </Container>
      </section>
    </PageShell>
  );
}
```

- Add the page's copy as a new export in `components/content.ts` (like `HOME`).
- Follow the BetterGov layout (DESIGN.md): full-width bands, a `Container` in
  each, `Container narrow` for reading pages.
- Compose from the catalog first (`COMPONENTS.md`). If UI is missing, follow the
  `new-component` flow — component + `/storybook` specimen + catalog entry in
  the same change.
- Text, data, or images from another source get a visible credit on the page and
  a `NOTICE.md` entry (rules in AGENTS.md, "Attribution").
- Unbuilt destinations stay `"#"` placeholders — never invented URLs.

## 3. Verify

`pnpm check` and `pnpm test`; `pnpm dev` → open the new route and check the
title/meta, rendering at desktop and phone width, and the console.
