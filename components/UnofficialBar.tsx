import { Container } from "./Container.tsx";
import { SITE, UNOFFICIAL } from "./content.ts";

/**
 * Thin full-width band above the header on every page, saying this is not the
 * City Government's site and linking to the official one. The notice and link
 * flow inline so it stays one line on desktop and wraps in place on phones.
 * The link's vertical padding makes a 44px tap target without thickening the
 * bar.
 */
export function UnofficialBar() {
  return (
    <div className="type-ui border-b border-ed-rule bg-ed-paper-2 text-ed-ink-2">
      <Container className="py-1.5">
        <p className="m-0">
          {UNOFFICIAL.text}{" "}
          <a
            href={SITE.officialSiteUrl}
            rel="noreferrer"
            className="inline-block py-3 text-ed-navy"
          >
            {UNOFFICIAL.linkLabel}
          </a>
        </p>
      </Container>
    </div>
  );
}
