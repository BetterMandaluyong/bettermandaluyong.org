import { describe, expect, it } from "vitest";
import { buildRssFeed, escapeXml, rfc822, type FeedItem } from "./feed.ts";

const channel = {
  title: "City News — Example",
  link: "https://example.org/news",
  selfUrl: "https://example.org/news/feed.xml",
  description: "News & notes",
  language: "en-ph",
};

const item = (over: Partial<FeedItem> = {}): FeedItem => ({
  title: "A post",
  link: "https://city.example/a",
  guid: "https://city.example/a",
  publishedAt: "2026-11-25T14:00:00+08:00",
  categories: [],
  ...over,
});

describe("escapeXml", () => {
  it("escapes the five special characters", () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe(
      "a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;",
    );
  });
});

describe("rfc822", () => {
  it("converts Manila time to GMT", () => {
    expect(rfc822("2026-11-25T14:00:00+08:00")).toBe(
      "Wed, 25 Nov 2026 06:00:00 GMT",
    );
  });

  it("returns an empty string for a bad date", () => {
    expect(rfc822("not a date")).toBe("");
  });
});

describe("buildRssFeed", () => {
  it("writes the channel, escaped", () => {
    const xml = buildRssFeed(channel, []);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss /);
    expect(xml).toContain("<title>City News — Example</title>");
    expect(xml).toContain("<description>News &amp; notes</description>");
    expect(xml).toContain(
      '<atom:link href="https://example.org/news/feed.xml" rel="self" type="application/rss+xml"/>',
    );
    expect(xml).toContain("<language>en-ph</language>");
  });

  it("leaves out lastBuildDate when there are no items", () => {
    expect(buildRssFeed(channel, [])).not.toContain("lastBuildDate");
  });

  it("keeps item order and dates the feed by its newest item", () => {
    const xml = buildRssFeed(channel, [
      item({ title: "Older", publishedAt: "2026-11-01T09:00:00+08:00" }),
      item({ title: "Newer", publishedAt: "2026-11-20T09:00:00+08:00" }),
    ]);
    expect(xml.indexOf("Older")).toBeLessThan(xml.indexOf("Newer"));
    expect(xml).toContain(
      "<lastBuildDate>Fri, 20 Nov 2026 01:00:00 GMT</lastBuildDate>",
    );
  });

  it("writes each item's link, guid, date, and categories", () => {
    const xml = buildRssFeed(channel, [
      item({
        title: "Roads & bridges <update>",
        link: "https://web.archive.org/web/https://city.example/a?x=1&y=2",
        categories: ["News", "Health"],
      }),
    ]);
    expect(xml).toContain("<title>Roads &amp; bridges &lt;update&gt;</title>");
    expect(xml).toContain(
      "<link>https://web.archive.org/web/https://city.example/a?x=1&amp;y=2</link>",
    );
    expect(xml).toContain(
      '<guid isPermaLink="false">https://city.example/a</guid>',
    );
    expect(xml).toContain("<pubDate>Wed, 25 Nov 2026 06:00:00 GMT</pubDate>");
    expect(xml).toContain("<category>News</category>");
    expect(xml).toContain("<category>Health</category>");
  });
});
