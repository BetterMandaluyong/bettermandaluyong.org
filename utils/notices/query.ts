import type { CityNotice } from "../../data/schema.ts";

/** Newest published first, then highest id first. */
export function sortNotices<K extends string>(
  items: Iterable<CityNotice<K>>,
): CityNotice<K>[] {
  return [...items].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id,
  );
}

/** How many notices one list page shows. */
export const NOTICES_PER_PAGE = 20;

/**
 * One page of notices, optionally of one kind. `items` must already be
 * newest first.
 */
export function listNotices<K extends string>(
  items: CityNotice<K>[],
  opts: { page: number; perPage: number; kind: K | null },
): { items: CityNotice<K>[]; total: number } {
  const matching =
    opts.kind === null ? items : items.filter((i) => i.kind === opts.kind);
  const start = (opts.page - 1) * opts.perPage;
  return {
    items: matching.slice(start, start + opts.perPage),
    total: matching.length,
  };
}

/** The kinds in use, in the order of `order` (the schema's list). */
export function kindsInUse<K extends string>(
  items: CityNotice<K>[],
  order: readonly K[],
): K[] {
  const used = new Set(items.map((i) => i.kind));
  return order.filter((k) => used.has(k));
}

/**
 * Notices of one kind still on the city site and published on or after
 * `months` months before `now`, newest first. `items` must be newest first.
 */
export function recentNotices<K extends string>(
  items: CityNotice<K>[],
  kind: K,
  months: number,
  now: Date,
): CityNotice<K>[] {
  const since = new Date(now);
  since.setUTCMonth(since.getUTCMonth() - months);
  return items.filter(
    (i) =>
      i.kind === kind &&
      i.removedAt === null &&
      Date.parse(i.publishedAt) >= since.getTime(),
  );
}

/** The newest notice of one kind still on the city site, or null. `items` must be newest first. */
export function newestNotice<K extends string>(
  items: CityNotice<K>[],
  kind: K,
): CityNotice<K> | null {
  return items.find((i) => i.kind === kind && i.removedAt === null) ?? null;
}
