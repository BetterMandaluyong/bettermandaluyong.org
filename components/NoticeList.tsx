import type { CityNotice } from "../data/schema.ts";
import { formatNewsDate } from "../utils/news/display.ts";
import { Flag } from "./Flag.tsx";
import { NOTICES } from "./content.ts";

/**
 * A dated list of city bid notices or job posts, newest first. Each row shows
 * the date, the title as an external link to the city's page, the kind as a
 * `Flag` (its text from `labels`, keyed by kind; no flag when `labels` has no
 * entry), and a red flag if the city removed it. Server component.
 */
export function NoticeList({
  items,
  labels = {},
}: {
  items: CityNotice[];
  labels?: Record<string, string>;
}) {
  return (
    <ol className="m-0 list-none border-t border-ed-rule p-0">
      {items.map((row) => {
        const label = labels[row.kind];
        return (
          <li
            key={row.id}
            className="flex flex-col gap-2 border-b border-ed-rule py-4"
          >
            <time
              dateTime={row.publishedAt}
              className="type-label text-ed-ink-3"
            >
              {formatNewsDate(row.publishedAt)}
            </time>
            <a
              href={row.url}
              rel="noreferrer"
              className="type-subheading text-ed-navy no-underline hover:underline"
            >
              {row.title}
            </a>
            {(label || row.removedAt) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {label && <Flag>{label}</Flag>}
                {row.removedAt && <Flag variant="red">{NOTICES.removed}</Flag>}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
