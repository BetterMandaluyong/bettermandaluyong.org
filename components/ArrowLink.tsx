// Ported from bettergovph/bettergov src/components/v2/ui/ArrowLink.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: plain <a> (no react-router), an inline
// arrow instead of lucide-react, and external links stay in the same tab.

import type { ReactNode } from "react";
import { cx } from "./cx.ts";

/**
 * An important standalone link: navy with an underline rule and a trailing
 * arrow, turning red on hover. The text must describe the destination
 * (never "click here"). `external` adds `rel="noreferrer"`.
 */
export function ArrowLink({
  href,
  children,
  external,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  return (
    <a
      href={href}
      rel={external ? "noreferrer" : undefined}
      className={cx(
        "inline-flex items-center gap-2 border-b border-ed-navy pb-0.5 font-sans text-sm font-medium text-ed-navy no-underline transition-colors hover:border-ed-red hover:text-ed-red",
        className,
      )}
    >
      {children}
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}
