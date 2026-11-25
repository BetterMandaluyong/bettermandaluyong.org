// Ported from bettergovph/bettergov src/components/v2/ui/Flag.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: uses the font-mono token.

import type { HTMLAttributes } from "react";
import { cx } from "./cx.ts";

type Variant = "default" | "red" | "navy" | "outline";

const variantClasses: Record<Variant, string> = {
  default: "border-ed-rule-strong bg-ed-paper-2 text-ed-ink-2",
  red: "border-ed-red bg-ed-red text-white",
  navy: "border-ed-navy bg-ed-navy text-white",
  outline: "border-ed-rule-strong bg-transparent text-ed-ink-2",
};

/**
 * A square status tag (BetterGov uses flags, never rounded pills): tiny
 * mono uppercase text in a bordered box. `red` is for urgency only.
 */
export function Flag({
  variant = "default",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] tracking-[0.14em] whitespace-nowrap uppercase",
        variantClasses[variant],
        className,
      )}
      {...rest}
    />
  );
}
