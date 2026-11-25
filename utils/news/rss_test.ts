import { describe, expect, it } from "vitest";
import { parseCityFeed } from "./rss.ts";

const item = (body: string) => `<item>${body}</item>`;
const feed = (...items: string[]) =>
  `<?xml version="1.0"?><rss xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Sample</title>${items.join("")}</channel></rss>`;

const full = item(`
  <title>Sample &#8211; Title</title>
  <link>https://mandaluyong.gov.ph/sample-title/</link>
  <pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>
  <category><![CDATA[News]]></category>
  <category><![CDATA[Awards]]></category>
  <guid isPermaLink="false">https://mandaluyong.gov.ph/?p=58001</guid>
  <description><![CDATA[<p>SUMMARY TEXT</p>]]></description>
  <content:encoded><![CDATA[<p>FULL TEXT</p>]]></content:encoded>
`);
const xml = feed(full);

describe("parseCityFeed", () => {
  it("parses title, link, id, date and categories", () => {
    expect(parseCityFeed(xml)).toEqual([
      {
        source: "city-website",
        sourceId: "58001",
        url: "https://mandaluyong.gov.ph/sample-title/",
        title: "Sample – Title",
        publishedAt: "2026-10-27T11:08:46+08:00",
        categories: ["News", "Awards"],
      },
    ]);
  });

  it("never returns article text", () => {
    const json = JSON.stringify(parseCityFeed(xml));
    expect(json).not.toContain("FULL TEXT");
    expect(json).not.toContain("SUMMARY TEXT");
  });

  it("decodes CDATA titles and numeric/named entities", () => {
    const out = parseCityFeed(
      feed(
        item(
          `<title><![CDATA[Tom &amp; Jerry&#8217;s Day]]></title><link>https://mandaluyong.gov.ph/a/</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>`,
        ),
        item(
          `<title>Fish &amp; Chips &quot;Fest&quot; &#039;26</title><link>https://mandaluyong.gov.ph/b/</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>`,
        ),
      ),
    );
    expect(out.map((i) => i.title)).toEqual([
      "Tom & Jerry’s Day",
      `Fish & Chips "Fest" '26`,
    ]);
  });

  it("falls back to the link as sourceId when guid has no ?p=", () => {
    const out = parseCityFeed(
      feed(
        item(
          `<title>T</title><link>https://mandaluyong.gov.ph/t/</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate><guid isPermaLink="false">abc-123</guid>`,
        ),
      ),
    );
    expect(out[0]?.sourceId).toBe("https://mandaluyong.gov.ph/t/");
  });

  it("strips utm_ tracking parameters from the link", () => {
    const out = parseCityFeed(
      feed(
        item(
          `<title>T</title><link>https://mandaluyong.gov.ph/x/?utm_source=rss&amp;utm_medium=rss&amp;utm_campaign=x</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>`,
        ),
      ),
    );
    expect(out[0]?.url).toBe("https://mandaluyong.gov.ph/x/");
  });

  it("skips items whose link is not an http(s) URL", () => {
    const out = parseCityFeed(
      feed(
        item(
          `<title>T</title><link>javascript:alert(1)</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>`,
        ),
      ),
    );
    expect(out).toEqual([]);
  });

  it("skips items without a title or link", () => {
    const out = parseCityFeed(
      feed(
        item(`<link>https://mandaluyong.gov.ph/x/</link>`),
        item(`<title>No link</title>`),
        full,
      ),
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.sourceId).toBe("58001");
  });

  it("returns [] for an HTML error page, empty channel, or truncated XML", () => {
    expect(
      parseCityFeed("<!DOCTYPE html><html><body>502</body></html>"),
    ).toEqual([]);
    expect(parseCityFeed("<rss><channel></channel></rss>")).toEqual([]);
    expect(parseCityFeed(xml.slice(0, 120))).toEqual([]);
  });

  it("skips items whose link is not on the city site", () => {
    const bad = (link: string) =>
      item(
        `<title>T</title><link>${link}</link><pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>`,
      );
    expect(
      parseCityFeed(
        feed(bad("https://evil.example/x/"), bad("javascript:alert(1)")),
      ),
    ).toEqual([]);
  });
});
