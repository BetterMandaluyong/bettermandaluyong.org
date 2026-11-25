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
import { PageShell } from "../../components/PageShell.tsx";
import { SLUG } from "../../components/content.ts";

export const metadata: Metadata = {
  title: SLUG.metaTitle,
  description: SLUG.metaDescription,
};

export default function SlugPage() {
  return <PageShell>{/* page content */}</PageShell>;
}
```

- Add the page's copy as a new export in `components/content.ts` (like `HOME`).
- Compose from the catalog first (`COMPONENTS.md`). If UI is missing, follow the
  `new-component` flow — component + catalog entry in the same change.
- Unbuilt destinations stay `"#"` placeholders — never invented URLs.

## 3. Verify

`pnpm check` and `pnpm test`; `pnpm dev` → open the new route and check the
title/meta, rendering in light and dark mode, phone width, and the console.
