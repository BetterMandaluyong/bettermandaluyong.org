import { Container } from "./Container.tsx";
import { SITE } from "./content.ts";

/** Bottom band: copyright (current year, rendered on the server) and city. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-ed-rule bg-ed-paper-2">
      <Container className="type-ui flex flex-wrap justify-between gap-2 py-6 text-ed-ink-3">
        <span>
          &copy; {year} {SITE.name}
        </span>
        <span>{SITE.location}</span>
      </Container>
    </footer>
  );
}
