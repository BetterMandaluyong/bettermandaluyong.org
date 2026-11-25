import { Container } from "./Container.tsx";
import { NAV, SITE } from "./content.ts";

/**
 * Top band: seal logo + site name linking home, then the main navigation
 * (`NAV`), over a hairline rule. Nav links are 44px tall.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-ed-rule">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 py-2">
        <a
          href="/"
          className="inline-flex items-center gap-3 py-2 font-display text-lg font-bold text-ed-ink no-underline"
        >
          <img src="/logo-seal.svg" alt="" width={44} height={44} />
          <span>{SITE.name}</span>
        </a>
        <nav aria-label="Main">
          <ul className="m-0 flex list-none flex-wrap gap-x-6 p-0">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center font-sans text-base font-medium text-ed-navy"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
