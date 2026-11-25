import {
  formatNewsDate,
  archiveLink,
  itemLink,
} from "../utils/news/display.ts";
import type { NewsRow } from "../utils/news/store.ts";
import { Flag } from "./Flag.tsx";
import { NEWS } from "./content.ts";
import { cx } from "./cx.ts";

/**
 * A dated list of city news links, newest first. Each row shows the date,
 * the post title as an external link to the city's page (the archived copy
 * once the post is removed), its categories as flags, an "Archived copy"
 * link when one exists, and a red flag if the city removed the post.
 * `compact` hides the categories, for the home page. Server component.
 */
export function NewsList({
  items,
  compact,
}: {
  items: NewsRow[];
  compact?: boolean;
}) {
  return (
    <ol className="m-0 list-none border-t border-ed-rule p-0">
      {items.map((row) => {
        const archive = archiveLink(row);
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
              href={itemLink(row)}
              rel="noreferrer"
              className="type-subheading text-ed-navy"
            >
              {row.title}
            </a>
            {(!compact && row.categories.length > 0) ||
            archive ||
            row.removedAt ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {!compact &&
                  row.categories.map((c) => <Flag key={c}>{c}</Flag>)}
                {row.removedAt && <Flag variant="red">{NEWS.removed}</Flag>}
                {archive && (
                  <a
                    href={archive}
                    rel="noreferrer"
                    className={cx("type-ui text-ed-navy")}
                  >
                    {NEWS.archived}
                  </a>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
