import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { NEWS_ITEMS } from "./news.ts";

const files = readdirSync("data/news").filter((f) => f.endsWith(".yaml"));

describe("NEWS_ITEMS", () => {
  it("has every post from every data/news/*.yaml file", () => {
    const total = files.reduce((n, f) => {
      const doc = parse(readFileSync(`data/news/${f}`, "utf8")) as unknown;
      return n + (Array.isArray(doc) ? doc.length : 0);
    }, 0);
    expect(files.length).toBeGreaterThan(0);
    expect(NEWS_ITEMS).toHaveLength(total);
  });

  it("is sorted newest published first", () => {
    for (let i = 1; i < NEWS_ITEMS.length; i++) {
      const [a, b] = [NEWS_ITEMS[i - 1], NEWS_ITEMS[i]];
      expect(
        a.publishedAt > b.publishedAt ||
          (a.publishedAt === b.publishedAt && a.id > b.id),
        `${a.id} before ${b.id}`,
      ).toBe(true);
    }
  });

  it("keeps each post id and URL once across all months", () => {
    expect(new Set(NEWS_ITEMS.map((n) => n.id)).size).toBe(NEWS_ITEMS.length);
    expect(new Set(NEWS_ITEMS.map((n) => n.url)).size).toBe(NEWS_ITEMS.length);
  });

  it("files each post under its Manila month", () => {
    const months = new Set(files.map((f) => f.replace(/\.yaml$/, "")));
    for (const n of NEWS_ITEMS) {
      expect(months.has(n.publishedAt.slice(0, 7)), String(n.id)).toBe(true);
    }
  });
});
