import type { NewsItem } from "../../data/schema.ts";

/** How many news items one list page shows. */
export const NEWS_PER_PAGE = 20;

const MAX_PAGE = 10000;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/**
 * Reads the page and category from Next.js style search params.
 * A page is a plain positive integer up to 10000, otherwise 1; a category
 * must match one of `categories` exactly, otherwise null.
 */
export function parseListParams(
  sp: Record<string, string | string[] | undefined>,
  categories: string[],
): { page: number; category: string | null } {
  const rawPage = first(sp.page);
  const page =
    rawPage !== undefined && /^[0-9]+$/.test(rawPage) ? Number(rawPage) : 1;
  const rawCategory = first(sp.category);
  return {
    page: page >= 1 && page <= MAX_PAGE ? page : 1,
    category:
      rawCategory !== undefined && categories.includes(rawCategory)
        ? rawCategory
        : null,
  };
}

const dateFormat = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  dateStyle: "long",
});

/** Formats an ISO timestamp as a long date in Manila time, e.g. "October 27, 2026". Returns "" for an invalid date. */
export function formatNewsDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

/** The archived copy of an item, or null when there is none. */
export function archiveLink(row: NewsItem): string | null {
  if (row.archive?.url) return row.archive.url;
  return row.archive?.status === "ok"
    ? `https://web.archive.org/web/${row.url}`
    : null;
}

/** Where an item should link: the archive once it is removed, else the original. */
export function itemLink(row: NewsItem): string {
  if (row.removedAt) return archiveLink(row) ?? row.url;
  return row.url;
}
