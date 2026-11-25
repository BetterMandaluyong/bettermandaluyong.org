// Colors follow bettergovph/bettergov src/components/v2/layout/PhaseBanner.tsx
// at commit 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors);
// see NOTICE.md. Our copy and link; no "Beta" flag.

import { Container } from "./Container.tsx";
import { SITE, UNOFFICIAL } from "./content.ts";

/**
 * Thin navy band above the header on every page (BetterGov's top-banner
 * style), saying this is not the City Government's site and linking to the
 * official one. The notice and link flow inline so it stays one line on
 * desktop and wraps in place on phones. The link's vertical padding makes a
 * 44px tap target without thickening the bar.
 */
export function UnofficialBar() {
  return (
    <div className="type-ui bg-ed-navy-2 text-white">
      <Container className="py-1.5">
        <p className="m-0">
          {UNOFFICIAL.text}{" "}
          <a
            href={SITE.officialSiteUrl}
            rel="noreferrer"
            className="inline-block py-3 font-semibold text-white underline underline-offset-2 hover:no-underline focus-visible:outline-white"
          >
            {UNOFFICIAL.linkLabel}
          </a>
        </p>
      </Container>
    </div>
  );
}
