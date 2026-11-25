import { Container } from "./Container.tsx";
import { SITE, UNOFFICIAL } from "./content.ts";

/**
 * Full-width band above the header on every page, saying this is not the
 * City Government's site and linking to the official one. Wraps onto two
 * lines on narrow screens.
 */
export function UnofficialBar() {
  return (
    <div className="type-ui border-b border-ed-rule bg-ed-paper-2 text-ed-ink-2">
      <Container className="flex flex-wrap items-center gap-x-4 py-2">
        <p className="m-0">{UNOFFICIAL.text}</p>
        <a
          href={SITE.officialSiteUrl}
          rel="noreferrer"
          className="inline-flex min-h-11 items-center font-medium text-ed-navy"
        >
          {UNOFFICIAL.linkLabel}
        </a>
      </Container>
    </div>
  );
}
