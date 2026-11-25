import type { ReactNode } from "react";
import { BARANGAYS } from "./content.ts";

/**
 * A small credit line under third-party data: "Source: <link>. Last updated
 * by the city on <date>." Pass `href` and `label` for the source link,
 * `updated` (already formatted) for the date, and `children` for any extra
 * credit text (for example the map's data and tile credits). Everything is
 * optional. Server component.
 */
export function SourceNote({
  href,
  label,
  updated,
  children,
}: {
  href?: string;
  label?: string;
  updated?: string;
  children?: ReactNode;
}) {
  return (
    <p className="type-ui m-0 mt-3 text-ed-ink-3">
      {href && (
        <>
          {BARANGAYS.source}{" "}
          <a href={href} rel="noreferrer" className="text-ed-navy">
            {label ?? BARANGAYS.sourceLink}
          </a>
          .{" "}
        </>
      )}
      {updated && <>{BARANGAYS.lastUpdated(updated)} </>}
      {children}
    </p>
  );
}
