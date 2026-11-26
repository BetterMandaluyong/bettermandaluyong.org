import { describe, expect, it } from "vitest";
import type { NewsItem } from "../../data/schema.ts";
import { latestNews, listCategories, listNews } from "./query.ts";

const item = (id: number, categories: string[]): NewsItem => ({
  id,
  url: `https://mandaluyong.gov.ph/p-${id}/`,
  title: `P${id}`,
  publishedAt: "2026-10-01T08:00:00+08:00",
  categories,
  firstSeenAt: "2026-10-01T09:00:00+08:00",
  archive: null,
  missingSince: null,
  removedAt: null,
});

const items = [
  item(5, ["News"]),
  item(4, ["Health", "News"]),
  item(3, ["Health"]),
  item(2, ["News"]),
  item(1, []),
];

describe("listNews", () => {
  it("pages through everything", () => {
    const p1 = listNews(items, { page: 1, perPage: 2, category: null });
    expect(p1.total).toBe(5);
    expect(p1.items.map((i) => i.id)).toEqual([5, 4]);
    expect(
      listNews(items, { page: 3, perPage: 2, category: null }).items.map(
        (i) => i.id,
      ),
    ).toEqual([1]);
  });

  it("filters by exact category and counts the matches", () => {
    const r = listNews(items, { page: 1, perPage: 10, category: "Health" });
    expect(r.total).toBe(2);
    expect(r.items.map((i) => i.id)).toEqual([4, 3]);
  });

  it("returns nothing past the last page", () => {
    expect(
      listNews(items, { page: 9, perPage: 2, category: null }).items,
    ).toEqual([]);
  });
});

describe("latestNews", () => {
  it("takes the first n", () => {
    expect(latestNews(items, 2).map((i) => i.id)).toEqual([5, 4]);
    expect(latestNews([], 3)).toEqual([]);
  });
});

describe("listCategories", () => {
  it("lists each category once, sorted", () => {
    expect(listCategories(items)).toEqual(["Health", "News"]);
  });
});
