import { describe, expect, it } from "vitest";
import type { CityNotice } from "../../data/schema.ts";
import {
  kindsInUse,
  listNotices,
  newestNotice,
  recentNotices,
  sortNotices,
} from "./query.ts";

const n = (
  id: number,
  kind: string,
  publishedAt: string,
  removedAt: string | null = null,
): CityNotice => ({
  id,
  url: `https://mandaluyong.gov.ph/download/doc-${id}/`,
  title: `Doc ${id}`,
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
