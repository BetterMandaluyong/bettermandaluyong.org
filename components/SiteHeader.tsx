import { SITE } from "./content.ts";

/** Logo mark + organization name, linking home. */
export function SiteHeader() {
  return (
    <header>
      <a
        href="/"
        className="inline-flex items-center gap-3 font-semibold tracking-[-0.01em] text-ink no-underline"
      >
        <img src="/logo-seal.svg" alt="" width={40} height={40} />
        <span>{SITE.name}</span>
      </a>
    </header>
  );
}
