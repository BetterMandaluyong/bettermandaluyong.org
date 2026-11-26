import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";
import { BID_NOTICES } from "./bids.ts";
import { JOB_NOTICES } from "./jobs.ts";
import type { CityNotice } from "./schema.ts";

const records: [string, CityNotice[]][] = [
  ["bids", BID_NOTICES],
  ["jobs", JOB_NOTICES],
];

describe.each(records)("data/%s", (dir, items) => {
  const files = readdirSync(`data/${dir}`).filter((f) => f.endsWith(".yaml"));

  it("loads every entry from every year file", () => {
    const total = files.reduce((n, f) => {
      const doc = parse(readFileSync(`data/${dir}/${f}`, "utf8")) as unknown;
      return n + (Array.isArray(doc) ? doc.length : 0);
    }, 0);
    expect(files.length).toBeGreaterThan(0);
    expect(items).toHaveLength(total);
  });

  it("is sorted newest published first", () => {
    for (let i = 1; i < items.length; i++) {
      const [a, b] = [items[i - 1]!, items[i]!];
      expect(
        a.publishedAt > b.publishedAt ||
          (a.publishedAt === b.publishedAt && a.id > b.id),
        `${a.id} before ${b.id}`,
      ).toBe(true);
    }
  });

  it("keeps each id and URL once across all years", () => {
    expect(new Set(items.map((n) => n.id)).size).toBe(items.length);
    expect(new Set(items.map((n) => n.url)).size).toBe(items.length);
  });
});

describe("bids and jobs", () => {
  it("never share a document", () => {
    const bidIds = new Set(BID_NOTICES.map((b) => b.id));
    expect(JOB_NOTICES.filter((j) => bidIds.has(j.id))).toEqual([]);
  });
});
