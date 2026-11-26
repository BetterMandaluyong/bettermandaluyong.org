// Ported from bettergovph/bettergov src/components/v2/layout/PageMasthead.tsx
// at commit 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors);
// see NOTICE.md. Changed: the light variant only (no navy `hero` yet); the
// title and lede use our type-display / type-lede utilities and keep their
// size on phones (BetterGov drops to 26px and 15px, under our 16px floor for
// body text); `before` (a back link) and `eyebrow` slots above the title; text
// width capped at max-w-3xl / 65ch.

import type { ReactNode } from "react";
import { Container } from "./Container.tsx";
import { cx } from "./cx.ts";

/**
 * The first band of every page: a flat `ed-paper-2` band with a dark ink rule
 * under it, holding the page's one `type-display` title. Padding is 28px on
 * phones and 64px from `md` up, so pages never set it themselves.
 *
 * - `title`: the heading text.
 * - `lede`: optional intro paragraph under the title (`type-lede`).
 * - `before`: optional content above everything, usually a back `ArrowLink`.
 * - `eyebrow`: optional small label directly above the title.
 * - `children`: anything below the lede: flags, notes, a jump menu.
 * - `titleAs`: `h1` by default; use `h2` or `p` for a demo inside another page
 *   (like `/storybook`), so the page keeps a single `<h1>`.
 */
export function PageMasthead({
  title,
  lede,
  before,
  eyebrow,
  children,
  titleAs: Title = "h1",
}: {
  title: ReactNode;
  lede?: ReactNode;
  before?: ReactNode;
  eyebrow?: ReactNode;
  children?: ReactNode;
  titleAs?: "h1" | "h2" | "p";
}) {
  return (
    <section className="border-b border-ed-ink bg-ed-paper-2 py-7 md:py-16">
      <Container>
        {before && <div className="mb-6">{before}</div>}
        {eyebrow && <div className="mb-3">{eyebrow}</div>}
        <Title className="type-display m-0 max-w-3xl text-balance">
          {title}
        </Title>
        {lede && (
          <p className="type-lede m-0 mt-4 max-w-[65ch] text-pretty">{lede}</p>
        )}
        {children && (
          <div className={cx(lede ? "mt-4 md:mt-6" : "mt-5")}>{children}</div>
        )}
      </Container>
    </section>
  );
}
