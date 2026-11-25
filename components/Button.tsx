import type { ReactNode } from "react";
import { cx } from "./cx.ts";

/**
 * A link styled as a call to action.
 *
 * - `variant="solid"` (default): the brand-filled pill used for the main
 *   action on a page.
 * - `variant="link"`: an underlined text link for a secondary action.
 *
 * Renders an `<a>`; pass `href` and children. Extra classes go in
 * `className`. Touch target is at least 48px tall.
 */
export function Button({
  href,
  variant = "solid",
  className,
  children,
  rel,
}: {
  href: string;
  variant?: "solid" | "link";
  className?: string;
  children: ReactNode;
  rel?: string;
}) {
  const base =
    "inline-flex min-h-12 items-center font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent";
  const variants = {
    solid:
      "rounded-full bg-brand px-6 text-on-brand transition hover:-translate-y-px hover:shadow-[0_6px_20px_-8px_var(--color-brand)] motion-reduce:transition-none",
    link: "border-b border-line font-medium text-ink hover:border-ink",
  };
  return (
    <a href={href} rel={rel} className={cx(base, variants[variant], className)}>
      {children}
    </a>
  );
}
