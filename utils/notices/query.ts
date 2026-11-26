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

/** How a filtered notice list is ordered. */
export type NoticeSort = "newest" | "oldest" | "title";

/** The sort orders a list offers, the default first. */
export const NOTICE_SORTS: readonly NoticeSort[] = [
  "newest",
  "oldest",
  "title",
];

/** The longest search a list accepts; anything longer is cut. */
export const MAX_NOTICE_QUERY = 100;

/**
 * What a visitor asked a notice list for: a title search, one kind or all,
 * a Manila date range (`YYYY-MM-DD`, either end open), the order, and the
 * page. Built by `parseNoticeFilters`, so every field is already valid.
 */
export type NoticeFilters<K extends string = string> = {
  q: string;
  kind: K | null;
  from: string | null;
  to: string | null;
  sort: NoticeSort;
  page: number;
};

const MAX_PAGE = 10000;

const firstParam = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? "";

/** `value` if it is a real calendar date written `YYYY-MM-DD`, else null. */
function parseDay(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y &&
    date.getUTCMonth() === mo - 1 &&
    date.getUTCDate() === d
    ? value
    : null;
}

/**
 * Reads a notice list's filters from Next.js style search params: `q`,
 * `kind`, `from`, `to`, `sort`, and `page`. Anything invalid falls back to
 * its default (no search, all kinds, open dates, newest first, page 1); the
 * search is trimmed, its spaces collapsed, and cut to `MAX_NOTICE_QUERY`
 * characters; a `from` later than `to` is swapped.
 */
export function parseNoticeFilters<K extends string>(
  sp: Record<string, string | string[] | undefined>,
  kinds: readonly K[],
): NoticeFilters<K> {
  const q = firstParam(sp.q)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NOTICE_QUERY)
    .trim();
  const rawKind = firstParam(sp.kind);
  const kind = (kinds as readonly string[]).includes(rawKind)
    ? (rawKind as K)
    : null;
  let from = parseDay(firstParam(sp.from));
  let to = parseDay(firstParam(sp.to));
  if (from && to && from > to) [from, to] = [to, from];
  const rawSort = firstParam(sp.sort);
  const sort = (NOTICE_SORTS as readonly string[]).includes(rawSort)
    ? (rawSort as NoticeSort)
    : "newest";
  const rawPage = firstParam(sp.page);
  const page = /^[0-9]+$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    q,
    kind,
    from,
    to,
    sort,
    page: page >= 1 && page <= MAX_PAGE ? page : 1,
  };
}

/** True when any filter differs from the default list (the page aside). */
export function hasNoticeFilters(f: NoticeFilters): boolean {
  return (
    f.q !== "" ||
    f.kind !== null ||
    f.from !== null ||
    f.to !== null ||
    f.sort !== "newest"
  );
}

const manilaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The Manila calendar date of an ISO timestamp, `YYYY-MM-DD`; "" if invalid. */
export function noticeDay(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : manilaDay.format(date);
}

/** Lowercase, accents dropped, anything but letters and digits made a space. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const titleOrder = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

/**
 * The notices that match `f`, in its order. Every word of the search must
 * appear somewhere in the title (case, accents, and punctuation don't
 * matter, so "x ray" finds "X-RAY"); the kind must match; the Manila date it
 * was posted must fall inside the range, both ends included. `items` must be
 * newest first, which also breaks ties in the title order. Ignores `f.page`.
 */
export function filterNotices<K extends string>(
  items: CityNotice<K>[],
  f: Omit<NoticeFilters<K>, "page">,
): CityNotice<K>[] {
  const words = fold(f.q).split(" ").filter(Boolean);
  const matching = items.filter((i) => {
    if (f.kind !== null && i.kind !== f.kind) return false;
    if (f.from !== null || f.to !== null) {
      const day = noticeDay(i.publishedAt);
      if (f.from !== null && day < f.from) return false;
      if (f.to !== null && day > f.to) return false;
    }
    if (words.length === 0) return true;
    const title = fold(i.title);
    return words.every((w) => title.includes(w));
  });
  if (f.sort === "oldest") return matching.reverse();
  if (f.sort === "title") {
    return matching
      .map((item, index) => ({ item, index }))
      .sort(
        (a, b) =>
          titleOrder.compare(a.item.title, b.item.title) || a.index - b.index,
      )
      .map((x) => x.item);
  }
  return matching;
}

/**
 * The address of one page of a filtered notice list at `path`, leaving out
 * every default (no search, all kinds, open dates, newest first, page 1), so
 * the unfiltered first page is just `path`.
 */
export function noticesHref(
  path: string,
  f: Omit<NoticeFilters, "page">,
  page: number,
): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.kind) params.set("kind", f.kind);
  if (f.from) params.set("from", f.from);
  if (f.to) params.set("to", f.to);
  if (f.sort !== "newest") params.set("sort", f.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
