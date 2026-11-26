import { describe, expect, it } from "vitest";
import {
  archiveLink,
  formatNewsDate,
  itemLink,
  NEWS_PER_PAGE,
  parseListParams,
} from "./display.ts";
import type { NewsItem } from "../../data/schema.ts";

const archived = (url: string | null = null, status = "ok") => ({
  status,
  url,
  requestedAt: "2026-10-28T08:00:00+08:00",
  attempts: 0,
});

const row = (over: Partial<NewsItem> = {}): NewsItem => ({
  id: 1,
  url: "https://mandaluyong.gov.ph/a",
  title: "A",
  publishedAt: "2026-10-27T11:08:46+08:00",
  categories: [],
  firstSeenAt: "2026-10-27T12:00:00+08:00",
  archive: null,
  missingSince: null,
  removedAt: null,
  ...over,
});

describe("parseListParams", () => {
  const cats = ["Health", "Education"];

  it("defaults to page 1 and no category", () => {
    expect(parseListParams({}, cats)).toEqual({ page: 1, category: null });
  });

  it.each(["abc", "0", "-3", "1.5", "", "10001", "1e2", " 3"])(
    "treats page %j as 1",
    (page) => {
      expect(parseListParams({ page }, cats).page).toBe(1);
    },
  );

  it("parses a plain integer page", () => {
    expect(parseListParams({ page: "3" }, cats).page).toBe(3);
    expect(parseListParams({ page: "10000" }, cats).page).toBe(10000);
  });

  it("uses the first value of an array", () => {
    expect(parseListParams({ page: ["2", "5"] }, cats).page).toBe(2);
  });

  it("keeps only known categories", () => {
    expect(parseListParams({ category: "Health" }, cats).category).toBe(
      "Health",
    );
    expect(parseListParams({ category: "Nope" }, cats).category).toBeNull();
    expect(parseListParams({ category: ["Education"] }, cats).category).toBe(
      "Education",
    );
  });

  it("has a page size of 20", () => {
    expect(NEWS_PER_PAGE).toBe(20);
  });
});

describe("formatNewsDate", () => {
  it("formats a date", () => {
    expect(formatNewsDate("2026-10-27T11:08:46+08:00")).toBe(
      "October 27, 2026",
    );
  });

  it("uses Manila time, not UTC", () => {
    expect(formatNewsDate("2026-10-31T23:30:00+08:00")).toBe(
      "October 31, 2026",
    );
  });
});

describe("archiveLink and itemLink", () => {
  it("returns the stored wayback URL", () => {
    const r = row({ archive: archived("https://w/1") });
    expect(archiveLink(r)).toBe("https://w/1");
  });

  it("builds a wayback URL when ok but none is stored", () => {
    expect(archiveLink(row({ archive: archived() }))).toBe(
      "https://web.archive.org/web/https://mandaluyong.gov.ph/a",
    );
  });

  it("returns null without an archive", () => {
    expect(archiveLink(row())).toBeNull();
    expect(
      archiveLink(row({ archive: archived(null, "http 403") })),
    ).toBeNull();
  });

  it("links to the archive for removed items that have one", () => {
    const r = row({
      removedAt: "2026-11-01T00:00:00+08:00",
      archive: archived("https://w/1"),
    });
    expect(itemLink(r)).toBe("https://w/1");
  });

  it("links to the original for removed items without an archive", () => {
    expect(itemLink(row({ removedAt: "2026-11-01T00:00:00+08:00" }))).toBe(
      "https://mandaluyong.gov.ph/a",
    );
  });

  it("links to the original for normal items", () => {
    expect(itemLink(row({ archive: archived("https://w/1") }))).toBe(
      "https://mandaluyong.gov.ph/a",
    );
  });
});

describe("invalid dates", () => {
  it("format to an empty string instead of throwing", () => {
    expect(formatNewsDate("garbage")).toBe("");
    expect(formatNewsDate("")).toBe("");
  });
});
