import { FEED } from "../../../components/content.ts";
import { absoluteUrl } from "../../../components/metadata.ts";
import { NEWS_ITEMS } from "../../../data/news.ts";
import { itemLink } from "../../../utils/news/display.ts";
import { latestNews } from "../../../utils/news/query.ts";
import { buildRssFeed } from "../../../utils/site/feed.ts";

/**
 * /news/feed.xml: an RSS 2.0 feed of the newest city news links, matching
 * /news. A post the city took down links to its archived copy, as on /news;
 * its guid stays the original URL.
 */
export function GET(): Response {
  const xml = buildRssFeed(
    {
      title: FEED.title,
      link: absoluteUrl("/news"),
      selfUrl: absoluteUrl(FEED.path),
      description: FEED.description,
      language: FEED.language,
    },
    latestNews(NEWS_ITEMS, FEED.size).map((item) => ({
      title: item.title,
      link: itemLink(item),
      guid: item.url,
      publishedAt: item.publishedAt,
      categories: item.categories,
    })),
  );
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
