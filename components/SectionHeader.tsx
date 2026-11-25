// Ported from bettergovph/bettergov src/components/v2/ui/SectionHeader.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: uses the type-section utility.

import type { ReactNode } from "react";
import { cx } from "./cx.ts";

/**
 * Standard section heading: a plain `<h2>` in the display face with no
 * rules. Size and whitespace carry the hierarchy. `meta` (a count or
 * timestamp) sits to the right; `onDark` for navy bands.
 */
export function SectionHeader({
  label,
  meta,
  onDark,
  className,
}: {
  label: ReactNode;
  meta?: ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1 max-md:mb-3",
        className,
      )}
    >
      <h2
        className={cx(
          "type-section m-0 max-md:text-[19px]",
          onDark && "text-white",
        )}
      >
        {label}
      </h2>
      {meta != null && (
        <span
          className={cx(
            "font-sans text-[13px] max-md:w-full max-md:text-xs md:ml-auto",
            onDark ? "text-white/80" : "text-ed-ink-3",
          )}
        >
          {meta}
        </span>
      )}
    </div>
  );
}
