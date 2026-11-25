// Ported from bettergovph/bettergov src/components/v2/ui/Eyebrow.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: uses the type-label utility.

import type { HTMLAttributes } from "react";
import { cx } from "./cx.ts";

type Tone = "default" | "onDark" | "navy" | "red";

const toneClasses: Record<Tone, string> = {
  default: "text-ed-ink-3",
  onDark: "text-white/70",
  navy: "text-ed-navy",
  red: "text-ed-red",
};

/**
 * A small mono uppercase label above a title or on a card. A label, not a
 * sentence. `tone` picks the color (`onDark` for navy bands).
 */
export function Eyebrow({
  tone = "default",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cx("type-label", toneClasses[tone], className)}
      {...rest}
    />
  );
}
