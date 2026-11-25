import { decodeEntities } from "./text.ts";
import type { FeedItem } from "./types.ts";

const BASE = "https://mandaluyong.gov.ph/wp-json/wp/v2";

/** Build the URL for one page (100 posts, oldest first) of the city's WordPress posts. */
export function wpPostsUrl(page: number): string {
  return `${BASE}/posts?per_page=100&page=${page}&orderby=id&order=asc&_fields=id,link,title,date,categories`;
}

/** Build the URL for the city's WordPress category list. */
export function wpCategoriesUrl(): string {
  return `${BASE}/categories?per_page=100&_fields=id,name`;
}

/** Parse a WordPress response body, starting at the first "[" because the site sometimes prints HTML before its JSON. */
export function parseWpJson(text: string): unknown {
  const start = text.indexOf("[");
  if (start < 0) throw new Error("no JSON array in WordPress response");
  return JSON.parse(text.slice(start));
}

type WpPost = {
  id?: unknown;
  link?: unknown;
  title?: { rendered?: unknown };
  date?: unknown;
  categories?: unknown;
};

/** Map WordPress posts to link-only feed items. Dates are Manila local time without an offset. */
export function parseWpPosts(
  json: unknown,
  categories: Map<number, string>,
): FeedItem[] {
  if (!Array.isArray(json)) return [];
  const items: FeedItem[] = [];
  for (const post of json as WpPost[]) {
    const title = post?.title?.rendered;
    if (
      typeof post?.id !== "number" ||
      typeof post.link !== "string" ||
      typeof title !== "string" ||
      typeof post.date !== "string"
    ) {
      continue;
    }
    const publishedAt = `${post.date}+08:00`;
    if (Number.isNaN(Date.parse(publishedAt))) continue;
    const ids = Array.isArray(post.categories) ? post.categories : [];
    items.push({
      source: "city-website",
      sourceId: String(post.id),
      url: post.link,
      title: decodeEntities(title),
      publishedAt,
      categories: ids.flatMap((id) => {
        const name = typeof id === "number" ? categories.get(id) : undefined;
        return name ? [name] : [];
      }),
    });
  }
  return items;
}
