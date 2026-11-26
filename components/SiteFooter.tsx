// Layout ported from bettergovph/bettergov src/components/v2/layout/Footer.tsx
// and FooterColumn.tsx at commit 5ead8c0 (MIT, Copyright (c) 2025-2026
// BetterGov.ph contributors); see NOTICE.md. Changed: our own columns and copy
// from content.ts, the BetterGov logo shown as "part of" credit rather than as
// our brand, the unofficial-site notice, plain <a> links in the same tab, white
// focus outlines, and the commit hash read at build time and linked to GitHub.

import { COMMIT_SHA, commitUrl, shortSha } from "./build.ts";
import { Container } from "./Container.tsx";
import {
  BETTERGOV,
  FOOTER,
  SITE,
  type FooterColumn as Column,
} from "./content.ts";

/** Link style on the navy footer: white with a white focus outline. */
const footerLink =
  "text-white/80 no-underline hover:text-white hover:underline focus-visible:outline-white";

/** One headed list of footer links. */
function FooterColumn({ heading, links }: Column) {
  return (
    <div>
      <h2 className="type-label m-0 mb-4 text-white">{heading}</h2>
      <ul className="m-0 list-none p-0">
        {links.map((link) => (
          <li key={link.href} className="mb-2.5">
            <a
              href={link.href}
              rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              className={footerLink}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Bottom band on darkest navy: site name and description, the unofficial-site
 * notice with a link to the official site, "Part of the
 * BetterGov.ph initiative" with BetterGov's logo, link columns (contact,
 * Facebook, and Discord; GitHub; BetterGov), then a row with the copyright
 * (year rendered on the server), the content and code licenses, and the commit
 * this build came from. Rendered by `PageShell`.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const sha = shortSha(COMMIT_SHA);
  const shaHref = commitUrl(SITE.repoUrl, COMMIT_SHA);

  return (
    <footer className="bg-ed-navy-ink pt-12 pb-7 text-white/75 md:pt-15">
      <Container className="type-ui">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <a
              href="/"
              className="inline-flex items-center gap-3 font-display text-lg font-bold text-white no-underline focus-visible:outline-white"
            >
              <img src="/logo-seal.svg" alt="" width={40} height={40} />
              <span>{SITE.name}</span>
            </a>
            <p className="m-0 mt-4 max-w-[340px] text-white/70">
              {FOOTER.description}
            </p>
            <p className="m-0 mt-3 max-w-[340px] text-white/70">
              {FOOTER.unofficial.text}{" "}
              <a
                href={SITE.officialSiteUrl}
                rel="noreferrer"
                className={`inline-block py-3 ${footerLink} underline`}
              >
                {FOOTER.unofficial.linkLabel}
              </a>
              .
            </p>

            <p className="type-label m-0 mt-8 text-white/70">{FOOTER.partOf}</p>
            <a
              href={BETTERGOV.url}
              rel="noreferrer"
              className="mt-3 inline-block focus-visible:outline-white"
            >
              <img
                src={BETTERGOV.logoWhiteSrc}
                alt={BETTERGOV.name}
                width={160}
                height={40}
                loading="lazy"
                decoding="async"
                className="block h-10 w-auto"
              />
            </a>
          </div>

          {FOOTER.columns.map((column) => (
            <FooterColumn key={column.heading} {...column} />
          ))}
        </div>

        <div className="type-label flex flex-wrap justify-between gap-x-6 gap-y-2 pt-6 text-white/70">
          <span>
            &copy; {year} {FOOTER.copyright}
          </span>
          <ul className="m-0 flex list-none flex-wrap gap-x-2 p-0">
            {FOOTER.licenses.map((license, i) => (
              <li key={license.href}>
                {i > 0 && <span aria-hidden="true">&middot; </span>}
                <a href={license.href} rel="noreferrer" className={footerLink}>
                  {license.label}
                </a>
              </li>
            ))}
            {sha && (
              <li>
                <span aria-hidden="true">&middot; </span>
                <a
                  href={shaHref}
                  rel="noreferrer"
                  className={footerLink}
                  aria-label={`Source at commit ${sha}`}
                >
                  {sha}
                </a>
              </li>
            )}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
