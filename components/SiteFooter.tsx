import { SITE } from "./content.ts";

/** Copyright line (current year, rendered on the server) and location. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="flex flex-wrap justify-between gap-2 border-t border-line pt-6 text-sm text-muted">
      <span>
        &copy; {year} {SITE.name}
      </span>
      <span>{SITE.location}</span>
    </footer>
  );
}
