import type { NewsItem } from "../../data/schema.ts";

/** Returns one page of news, optionally limited to an exact category. `items` must already be newest first. */
export function listNews(
  items: NewsItem[],
  opts: { page: number; perPage: number; category: string | null },
): { items: NewsItem[]; total: number } {
  const matching =
    opts.category === null
      ? items
      : items.filter((i) => i.categories.includes(opts.category as string));
  const start = (opts.page - 1) * opts.perPage;
  return {
    items: matching.slice(start, start + opts.perPage),
    total: matching.length,
  };
}

/** Returns the n most recently published items. `items` must already be newest first. */
export function latestNews(items: NewsItem[], n: number): NewsItem[] {
  return items.slice(0, n);
}

/** Returns every category in use, sorted and de-duplicated. */
export function listCategories(items: NewsItem[]): string[] {
  return [...new Set(items.flatMap((i) => i.categories))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Newest published first, then highest id first. */
export function sortNews(items: Iterable<NewsItem>): NewsItem[] {
  return [...items].sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id,
  );
}
