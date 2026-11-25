import { decodeEntities, toManilaIso } from "./text.ts";
import type { FeedItem } from "./types.ts";

const ITEM_RE = /<item\b[^>]*>([\s\S]*?)<\/item>/g;
// Article bodies are removed before any field is matched, so they are never read.
const BODY_RE =
  /<(content:encoded|description)\b[^>]*>[\s\S]*?<\/\1>|<(?:content:encoded|description)\b[^>]*\/>/g;

/** Unwrap CDATA sections, then decode entities and trim. */
function clean(raw: string): string {
  return decodeEntities(
    raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(),
  ).trim();
}

/** Text of the first `<tag>` in a block, or undefined when absent or empty. */
function field(block: string, tag: string): string | undefined {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`).exec(block);
  const value = m?.[1] === undefined ? "" : clean(m[1]);
  return value === "" ? undefined : value;
}

/**
 * Parse the city's RSS feed into link-only items. Returns [] for anything that
 * is not a feed with complete items (HTML error page, empty channel, truncated
 * XML). Items missing a title, link or valid pubDate are skipped. Article text
 * (`content:encoded`, `description`) is stripped and never returned.
 */
export function parseCityFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  for (const match of xml.matchAll(ITEM_RE)) {
    const block = (match[1] ?? "").replace(BODY_RE, "");
    const title = field(block, "title");
    const url = field(block, "link");
    const pubDate = field(block, "pubDate");
    if (!title || !url || !pubDate) continue;
    const published = new Date(pubDate);
    if (Number.isNaN(published.getTime())) continue;

    const guid = field(block, "guid");
    const postId = guid === undefined ? null : /[?&]p=(\d+)/.exec(guid)?.[1];
    const categories = [
      ...block.matchAll(/<category\b[^>]*>([\s\S]*?)<\/category>/g),
    ]
      .map((c) => clean(c[1] ?? ""))
      .filter((c) => c !== "");

    items.push({
      source: "city-website",
      sourceId: postId ?? url,
      url,
      title,
      publishedAt: toManilaIso(published),
      categories,
    });
  }
  return items;
}
