import type { ReactNode } from "react";

/**
 * Small uppercase label above a headline. `live` adds the pulsing accent
 * dot (static when the visitor prefers reduced motion).
 */
export function Eyebrow({
  children,
  live = false,
}: {
  children: ReactNode;
  live?: boolean;
}) {
  return (
    <p className="mb-5 inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.08em] text-muted uppercase">
      {live && (
        <span
          aria-hidden="true"
          className="size-2 animate-pulse-ring rounded-full bg-accent motion-reduce:animate-none"
        />
      )}
      {children}
    </p>
  );
}
