// Ported from bettergovph/bettergov src/components/v2/ui/Button.tsx at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: renders <a> when given href (instead of an
// `as` prop), and defaults to type="button".

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { cx } from "./cx.ts";

type Variant = "solid" | "ghost";
type Size = "md" | "sm";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-2.5 font-sans font-medium no-underline transition-colors";

// Fixed heights (not padding) so buttons line up exactly with inputs and
// selects placed beside them: md matches a 44px control row, sm a 36px one.
const sizeClasses: Record<Size, string> = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-3.5 text-xs",
};

const variantClasses: Record<Variant, string> = {
  solid:
    "border border-ed-navy bg-ed-navy text-white hover:border-ed-navy-2 hover:bg-ed-navy-2",
  ghost:
    "border border-ed-navy bg-transparent text-ed-navy hover:bg-ed-navy hover:text-white",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
};

type Props =
  | (CommonProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
        href: string;
      })
  | (CommonProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
        href?: undefined;
      });

/**
 * The primary action control: square, navy, 44px tall (`size="sm"`: 36px).
 * `variant="solid"` (default) for the main action, `"ghost"` (outlined) for
 * a secondary one. Pass `href` to render a link; otherwise it's a
 * `<button type="button">`.
 */
export function Button(props: Props) {
  const { variant = "solid", size = "md", className, ...rest } = props;
  const classes = cx(
    base,
    sizeClasses[size],
    variantClasses[variant],
    className,
  );
  if (rest.href !== undefined) {
    return (
      <a
        className={classes}
        {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  }
  return (
    <button
      type="button"
      className={classes}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  );
}
