import { Container } from "./Container.tsx";
import { SITE } from "./content.ts";

/** Top band: seal logo + site name linking home, over a hairline rule. */
export function SiteHeader() {
  return (
    <header className="border-b border-ed-rule">
      <Container className="flex items-center py-4">
        <a
          href="/"
          className="inline-flex items-center gap-3 font-display text-lg font-bold text-ed-ink no-underline"
        >
          <img src="/logo-seal.svg" alt="" width={44} height={44} />
          <span>{SITE.name}</span>
        </a>
      </Container>
    </header>
  );
}
