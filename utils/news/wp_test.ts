import { describe, expect, it } from "vitest";
import {
  parseWpJson,
  parseWpPosts,
  wpCategoriesUrl,
  wpPostsUrl,
} from "./wp.ts";

describe("wp urls", () => {
  it("builds the posts url", () => {
    expect(wpPostsUrl(3)).toBe(
      "https://mandaluyong.gov.ph/wp-json/wp/v2/posts?per_page=100&page=3&orderby=id&order=asc&_fields=id,link,title,date,categories",
    );
  });
  it("builds the categories url", () => {
    expect(wpCategoriesUrl()).toBe(
      "https://mandaluyong.gov.ph/wp-json/wp/v2/categories?per_page=100&_fields=id,name",
    );
  });
});

describe("parseWpJson", () => {
  it("skips HTML printed before the JSON", () => {
    expect(parseWpJson('<br/>warning[{"id":1}]')).toEqual([{ id: 1 }]);
  });
});

describe("parseWpPosts", () => {
  const cats = new Map([[5, "News"]]);
  it("maps posts to feed items", () => {
    expect(
      parseWpPosts(
        [
          {
            id: 42,
            link: "https://mandaluyong.gov.ph/x/",
            title: { rendered: "Sample &#8211; Title" },
            date: "2026-07-28T10:52:54",
            categories: [5, 99],
          },
        ],
        cats,
      ),
    ).toEqual([
      {
        source: "city-website",
        sourceId: "42",
        url: "https://mandaluyong.gov.ph/x/",
        title: "Sample – Title",
        publishedAt: "2026-07-28T10:52:54+08:00",
        categories: ["News"],
      },
    ]);
  });
  it("skips incomplete entries and handles empty input", () => {
    expect(parseWpPosts([], cats)).toEqual([]);
    expect(parseWpPosts([{ id: 1 }], cats)).toEqual([]);
  });

  it("skips posts whose date is not a valid date", () => {
    const post = (id: number, date: string) => ({
      id,
      link: `https://mandaluyong.gov.ph/p-${id}/`,
      title: { rendered: "T" },
      date,
      categories: [],
    });
    const items = parseWpPosts(
      [
        post(1, "not-a-date"),
        post(2, "2026-13-45T99:00:00"),
        post(3, "2026-07-28T10:52:54"),
      ],
      cats,
    );
    expect(items.map((i) => i.sourceId)).toEqual(["3"]);
  });
});
