// Ported from bettergovph/bettergov src/components/v2/ui/Card.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: `href` renders a plain <a> (no react-router).

import type { ReactNode } from "react";
import { cx } from "./cx.ts";

const base =
  "block border border-ed-rule bg-white p-6 text-ed-ink no-underline transition-colors hover:border-ed-ink";

/**
 * A square, hairline-bordered box; the border darkens on hover. Pass `href`
 * to make the whole card one link (keep only one link inside it).
 */
export function Card({
  href,
  children,
  className,
}: {
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  if (href) {
    return (
      <a href={href} className={cx(base, className)}>
        {children}
      </a>
    );
  }
  return <div className={cx(base, className)}>{children}</div>;
}
