import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { parseBidsFile, type BidKind } from "../../data/schema.ts";
import {
  FILE_HEADER,
  recordPresence,
  serializeByYear,
  upsertNotice,
  type NoticeState,
} from "./repo.ts";
import { sortNotices } from "./query.ts";

const NOW = "2026-11-26T20:00:00+08:00";
const LATER = "2026-11-27T20:00:00+08:00";

const entry = (id: number, over: Record<string, string> = {}) => ({
  id,
  url: `https://mandaluyong.gov.ph/download/doc-${id}/`,
  title: `Doc ${id}`,
  publishedAt: "2026-11-09T10:00:00+08:00",
  ...over,
});

describe("upsertNotice", () => {
  it("adds a new entry with its kind and first-seen time", () => {
    const state: NoticeState<BidKind> = new Map();
    expect(upsertNotice(state, entry(1), "itb", NOW)).toBe("added");
    expect(state.get(1)).toMatchObject({
      kind: "itb",
      firstSeenAt: NOW,
      missingSince: null,
      removedAt: null,
    });
  });

  it("won't add an entry without a kind", () => {
    const state: NoticeState<BidKind> = new Map();
    expect(upsertNotice(state, entry(1), null, NOW)).toBeNull();
    expect(state.size).toBe(0);
  });

  it("refreshes a known entry, keeping its kind and first-seen time when no kind is given", () => {
    const state: NoticeState<BidKind> = new Map();
    upsertNotice(state, entry(1), "itb", NOW);
    expect(upsertNotice(state, entry(1), null, LATER)).toBeNull();
    expect(
      upsertNotice(state, entry(1, { title: "Doc 1 (revised)" }), null, LATER),
    ).toBe("changed");
    expect(upsertNotice(state, entry(1), "bulletin", LATER)).toBe("changed");
    expect(state.get(1)).toMatchObject({
      title: "Doc 1",
      kind: "bulletin",
      firstSeenAt: NOW,
    });
  });
});

describe("recordPresence", () => {
  it("marks missing, then removed, then restored", () => {
    const state: NoticeState<BidKind> = new Map();
    upsertNotice(state, entry(1), "itb", NOW);
    expect(recordPresence(state, 1, true, NOW)).toBeNull();
    expect(recordPresence(state, 1, false, NOW)).toBe("missing");
    expect(recordPresence(state, 1, false, LATER)).toBe("removed");
    expect(recordPresence(state, 1, false, LATER)).toBeNull();
    expect(state.get(1)?.removedAt).toBe(LATER);
    expect(recordPresence(state, 1, true, LATER)).toBe("restored");
    expect(state.get(1)).toMatchObject({ missingSince: null, removedAt: null });
  });

  it("clears a single miss quietly", () => {
    const state: NoticeState<BidKind> = new Map();
    upsertNotice(state, entry(1), "itb", NOW);
    recordPresence(state, 1, false, NOW);
    expect(recordPresence(state, 1, true, LATER)).toBeNull();
    expect(state.get(1)?.missingSince).toBeNull();
  });

  it("ignores unknown ids", () => {
    expect(recordPresence(new Map(), 9, false, NOW)).toBeNull();
  });
});

describe("serializeByYear", () => {
  it("writes one valid file per year, newest first, the same bytes every time", () => {
    const state: NoticeState<BidKind> = new Map();
    upsertNotice(state, entry(1), "itb", NOW);
    upsertNotice(
      state,
      entry(2, { publishedAt: "2026-11-20T10:00:00+08:00" }),
      "noa",
      NOW,
    );
    upsertNotice(
      state,
      entry(3, { publishedAt: "2025-01-02T10:00:00+08:00" }),
      "app",
      NOW,
    );
    recordPresence(state, 1, false, NOW);
    const files = serializeByYear(state, FILE_HEADER.bids);
    expect(Object.keys(files).sort()).toEqual(["2025", "2026"]);
    expect(files["2026"]?.startsWith(FILE_HEADER.bids)).toBe(true);
    const parsed = parseBidsFile(parse(files["2026"]!), "x.yaml", "2026");
    expect(parsed.map((n) => n.id)).toEqual([2, 1]);
    expect(parsed[1]?.missingSince).toBe(NOW);
    expect(serializeByYear(state, FILE_HEADER.bids)).toEqual(files);
  });
});

describe("sortNotices", () => {
  it("puts the newest first, then the higher id", () => {
    const state: NoticeState<BidKind> = new Map();
    upsertNotice(state, entry(1), "itb", NOW);
    upsertNotice(state, entry(2), "itb", NOW);
    upsertNotice(
      state,
      entry(3, { publishedAt: "2026-11-01T10:00:00+08:00" }),
      "itb",
      NOW,
    );
    expect(sortNotices(state.values()).map((n) => n.id)).toEqual([2, 1, 3]);
  });
});
