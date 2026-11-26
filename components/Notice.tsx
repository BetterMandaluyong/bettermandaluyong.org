// Ported from bettergovph/bettergov src/components/v2/ui/Notice.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: named export, our Eyebrow and cx, and the title uses the
// font-display token.

import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow.tsx";
import { cx } from "./cx.ts";

/**
 * A calm notice panel: a navy rule on the paper background, never an alarming
 * red. `tag` is the small label above the `title`; `children` is the body and
 * any links. `role` is `note` for a standing notice (default) or `status` when
 * it replaces content that failed to load, so screen readers announce it.
 */
export function Notice({
  tag,
  title,
  children,
  role = "note",
  className,
}: {
  tag: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  role?: "status" | "note";
  className?: string;
}) {
  return (
    <div
      role={role}
      className={cx(
        "border-l-4 border-ed-navy bg-ed-paper-2 p-6 max-md:p-5",
        className,
      )}
    >
      <Eyebrow tone="navy">{tag}</Eyebrow>
      <p className="m-0 mt-2 font-display text-[22px] leading-snug font-semibold text-ed-ink max-md:text-lg">
        {title}
      </p>
      {children}
    </div>
  );
}
