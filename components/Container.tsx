// Ported from bettergovph/bettergov src/components/v2/ui/Container.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Unchanged apart from formatting.

import type { HTMLAttributes } from "react";
import { cx } from "./cx.ts";

/**
 * Standard page container: centred, with 16/24/32px gutters. Widths come
 * from the --container-page tokens in globals.css (1504px, or 1040px with
 * `narrow` for reading pages). Pages never set their own max-width.
 */
export function Container({
  narrow,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { narrow?: boolean }) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 md:px-6 xl:px-8",
        narrow ? "max-w-page-narrow" : "max-w-page",
        className,
      )}
      {...rest}
    />
  );
}
