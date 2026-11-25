import { Container } from "./Container.tsx";
import { FOOTER, SITE, UNOFFICIAL } from "./content.ts";

/**
 * Bottom band: the unofficial-site notice with links to the official site and
 * to follow Better Mandaluyong, then copyright (current year, rendered on the
 * server) and city.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ed-rule bg-ed-paper-2">
      <Container className="type-ui flex flex-col gap-3 py-6 text-ed-ink-3">
        <p className="m-0 flex flex-wrap items-center gap-x-4">
          <span>{UNOFFICIAL.text}</span>
          <a
            href={SITE.officialSiteUrl}
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-ed-navy"
          >
            {UNOFFICIAL.linkLabel}
          </a>
          <a
            href={SITE.followUrl}
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-ed-navy"
          >
            {FOOTER.followLabel}
          </a>
        </p>
        <div className="flex flex-wrap justify-between gap-2">
          <span>
            &copy; {year} {SITE.name}
          </span>
          <span>{SITE.location}</span>
        </div>
      </Container>
    </footer>
  );
}
