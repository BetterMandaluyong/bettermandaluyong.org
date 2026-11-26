/** One entry in an RSS feed. */
export type FeedItem = {
  title: string;
  /** Where a reader goes when they open the item. */
  link: string;
  /** A stable id for the item; it never changes, even if `link` does. */
  guid: string;
  /** ISO 8601 publish date, with an offset. */
  publishedAt: string;
  categories: string[];
};

/** Everything an RSS feed needs besides its items. */
export type FeedChannel = {
  title: string;
  /** The page the feed mirrors. */
  link: string;
  /** The feed's own address, for the `atom:link rel="self"` element. */
  selfUrl: string;
  description: string;
  /** BCP 47 language tag, e.g. "en-ph". */
  language: string;
};

/** Escapes the five XML special characters. */
export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Formats an ISO 8601 date as the RFC 822 date RSS asks for, e.g.
 * "Wed, 25 Nov 2026 06:00:00 GMT". Returns "" for an unparseable date.
 */
export function rfc822(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toUTCString();
}

/**
 * Builds an RSS 2.0 document. Items appear in the order given (pass them
 * newest first). `lastBuildDate` is the newest item's date, so the same items
 * always give the same document; an empty feed has none.
 */
export function buildRssFeed(channel: FeedChannel, items: FeedItem[]): string {
  const newest = items.reduce<string | null>(
    (max, i) =>
      max === null || Date.parse(i.publishedAt) > Date.parse(max)
        ? i.publishedAt
        : max,
    null,
  );
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(channel.title)}</title>`,
    `<link>${escapeXml(channel.link)}</link>`,
    `<atom:link href="${escapeXml(channel.selfUrl)}" rel="self" type="application/rss+xml"/>`,
    `<description>${escapeXml(channel.description)}</description>`,
    `<language>${escapeXml(channel.language)}</language>`,
  ];
  if (newest) lines.push(`<lastBuildDate>${rfc822(newest)}</lastBuildDate>`);
  for (const item of items) {
    lines.push(
      "<item>",
      `<title>${escapeXml(item.title)}</title>`,
      `<link>${escapeXml(item.link)}</link>`,
      `<guid isPermaLink="false">${escapeXml(item.guid)}</guid>`,
    );
    const date = rfc822(item.publishedAt);
    if (date) lines.push(`<pubDate>${date}</pubDate>`);
    for (const c of item.categories) {
      lines.push(`<category>${escapeXml(c)}</category>`);
    }
    lines.push("</item>");
  }
  lines.push("</channel>", "</rss>", "");
  return lines.join("\n");
}
