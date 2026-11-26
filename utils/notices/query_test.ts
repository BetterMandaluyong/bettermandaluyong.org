import { describe, expect, it } from "vitest";
import type { CityNotice } from "../../data/schema.ts";
import {
  MAX_NOTICE_QUERY,
  filterNotices,
  hasNoticeFilters,
  kindsInUse,
  listNotices,
  newestNotice,
  noticeDay,
  noticesHref,
  parseNoticeFilters,
  recentNotices,
  sortNotices,
} from "./query.ts";

const n = (
  id: number,
  kind: string,
  publishedAt: string,
  removedAt: string | null = null,
  title = `Doc ${id}`,
): CityNotice => ({
  id,
  url: `https://mandaluyong.gov.ph/download/doc-${id}/`,
  title,
  kind,
  publishedAt,
  firstSeenAt: "2026-11-26T20:00:00+08:00",
  missingSince: null,
  removedAt,
});

const items = sortNotices([
  n(1, "itb", "2026-11-09T10:00:00+08:00"),
  n(2, "noa", "2026-10-01T10:00:00+08:00"),
  n(3, "itb", "2025-03-01T10:00:00+08:00"),
  n(4, "peso", "2026-06-25T14:54:12+08:00"),
  n(5, "peso", "2025-03-28T10:00:00+08:00"),
  n(6, "peso", "2026-08-01T10:00:00+08:00", "2026-11-20T06:00:00+08:00"),
]);

describe("listNotices", () => {
  it("pages all notices or one kind", () => {
    expect(
      listNotices(items, { page: 1, perPage: 2, kind: null }).items.map(
        (i) => i.id,
      ),
    ).toEqual([1, 2]);
    const itb = listNotices(items, { page: 2, perPage: 1, kind: "itb" });
    expect(itb).toMatchObject({ total: 2, items: [{ id: 3 }] });
  });
});

describe("kindsInUse", () => {
  it("keeps the schema's order and drops unused kinds", () => {
    expect(kindsInUse(items, ["rfq", "noa", "itb"])).toEqual(["noa", "itb"]);
  });
});

describe("recentNotices and newestNotice", () => {
  const now = new Date("2026-11-26T12:00:00Z");

  it("keeps live notices of a kind from the last months", () => {
    expect(recentNotices(items, "peso", 12, now).map((i) => i.id)).toEqual([4]);
    expect(recentNotices(items, "peso", 1, now)).toEqual([]);
  });

  it("finds the newest live notice of a kind", () => {
    expect(newestNotice(items, "peso")?.id).toBe(4);
    expect(newestNotice(items, "rfq")).toBeNull();
  });
});

describe("parseNoticeFilters", () => {
  const kinds = ["itb", "noa"] as const;
  const defaults = {
    q: "",
    kind: null,
    from: null,
    to: null,
    sort: "newest",
    page: 1,
  };

  it("defaults when nothing is asked", () => {
    expect(parseNoticeFilters({}, kinds)).toEqual(defaults);
  });

  it("reads every filter", () => {
    expect(
      parseNoticeFilters(
        {
          q: "  x-ray   panel ",
          kind: "noa",
          from: "2026-01-01",
          to: "2026-02-28",
          sort: "title",
          page: "3",
        },
        kinds,
      ),
    ).toEqual({
      q: "x-ray panel",
      kind: "noa",
      from: "2026-01-01",
      to: "2026-02-28",
      sort: "title",
      page: 3,
    });
  });

  it("falls back on anything invalid", () => {
    expect(
      parseNoticeFilters(
        {
          kind: "pmr",
          from: "2026-02-30",
          to: "yesterday",
          sort: "random",
          page: "-1",
        },
        kinds,
      ),
    ).toEqual(defaults);
    expect(parseNoticeFilters({ page: "10001" }, kinds).page).toBe(1);
    expect(parseNoticeFilters({ from: "2026-1-5" }, kinds).from).toBeNull();
  });

  it("takes the first of repeated params", () => {
    expect(parseNoticeFilters({ kind: ["itb", "noa"] }, kinds).kind).toBe(
      "itb",
    );
  });

  it("swaps a backwards date range", () => {
    expect(
      parseNoticeFilters({ from: "2026-05-01", to: "2026-01-01" }, kinds),
    ).toMatchObject({ from: "2026-01-01", to: "2026-05-01" });
  });

  it("cuts a long search", () => {
    const q = parseNoticeFilters({ q: "a".repeat(500) }, kinds).q;
    expect(q).toHaveLength(MAX_NOTICE_QUERY);
  });
});

describe("hasNoticeFilters", () => {
  it("ignores the page", () => {
    expect(hasNoticeFilters(parseNoticeFilters({ page: "4" }, []))).toBe(false);
    expect(hasNoticeFilters(parseNoticeFilters({ sort: "oldest" }, []))).toBe(
      true,
    );
  });
});

describe("noticeDay", () => {
  it("uses the Manila date", () => {
    expect(noticeDay("2026-03-01T23:30:00+08:00")).toBe("2026-03-01");
    expect(noticeDay("2026-02-28T16:30:00Z")).toBe("2026-03-01");
    expect(noticeDay("not a date")).toBe("");
  });
});

describe("filterNotices", () => {
  const titled = sortNotices([
    n(10, "itb", "2026-03-01T23:30:00+08:00", null, "ITB – X-RAY Flat Panel"),
    n(11, "noa", "2026-02-28T08:00:00+08:00", null, "NOA – Café supplies"),
    n(12, "itb", "2026-01-15T08:00:00+08:00", null, "ITB – 10 laptops"),
    n(13, "itb", "2025-12-31T23:59:00+08:00", null, "ITB – 9 laptops"),
  ]);
  const all = {
    q: "",
    kind: null,
    from: null,
    to: null,
    sort: "newest",
  } as const;
  const ids = (f: Partial<Parameters<typeof filterNotices>[1]>) =>
    filterNotices(titled, { ...all, ...f }).map((i) => i.id);

  it("returns everything, newest first, with no filters", () => {
    expect(ids({})).toEqual([10, 11, 12, 13]);
  });

  it("matches every search word anywhere in the title", () => {
    expect(ids({ q: "x ray" })).toEqual([10]);
    expect(ids({ q: "panel xray" })).toEqual([]);
    expect(ids({ q: "LAPTOPS itb" })).toEqual([12, 13]);
    expect(ids({ q: "cafe" })).toEqual([11]);
    expect(ids({ q: "–" })).toEqual([10, 11, 12, 13]);
  });

  it("filters by kind", () => {
    expect(ids({ kind: "noa" })).toEqual([11]);
  });

  it("includes both ends of the Manila date range", () => {
    expect(ids({ from: "2026-01-15", to: "2026-03-01" })).toEqual([10, 11, 12]);
    expect(ids({ to: "2025-12-31" })).toEqual([13]);
    expect(ids({ from: "2026-03-02" })).toEqual([]);
  });

  it("sorts oldest first or by title", () => {
    expect(ids({ sort: "oldest" })).toEqual([13, 12, 11, 10]);
    expect(ids({ sort: "title", kind: "itb" })).toEqual([13, 12, 10]);
  });

  it("combines filters", () => {
    expect(ids({ q: "laptops", from: "2026-01-01", sort: "oldest" })).toEqual([
      12,
    ]);
  });
});

describe("noticesHref", () => {
  const f = parseNoticeFilters({}, []);

  it("is the bare path for the default first page", () => {
    expect(noticesHref("/bids", f, 1)).toBe("/bids");
  });

  it("keeps every filter and the page", () => {
    expect(
      noticesHref(
        "/bids",
        {
          q: "x-ray & co",
          kind: "itb",
          from: "2026-01-01",
          to: "2026-12-31",
          sort: "oldest",
        },
        2,
      ),
    ).toBe(
      "/bids?q=x-ray+%26+co&kind=itb&from=2026-01-01&to=2026-12-31&sort=oldest&page=2",
    );
  });
});
