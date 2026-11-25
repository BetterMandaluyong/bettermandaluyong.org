import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter.tsx";
import { SiteHeader } from "./SiteHeader.tsx";

/**
 * The page frame every route uses: centered 68rem column, header on top,
 * footer pinned to the bottom, and `<main id="main-content">` (the skip
 * link's target) in between.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[68rem] flex-col gap-12 px-5 py-8">
      <SiteHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 flex-col gap-12"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
