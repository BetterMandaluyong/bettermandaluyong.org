import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter.tsx";
import { SiteHeader } from "./SiteHeader.tsx";
import { UnofficialBar } from "./UnofficialBar.tsx";
import { VolunteerBand } from "./VolunteerBand.tsx";

/**
 * The page frame every route uses: full-width bands (BetterGov layout) with
 * the unofficial-site bar and the header on top, the volunteer band and the
 * footer at the bottom, and `<main
 * id="main-content">` (the skip link's target) in between. Put each section
 * in its own band and wrap its content in `<Container>`.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <UnofficialBar />
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <VolunteerBand />
      <SiteFooter />
    </div>
  );
}
