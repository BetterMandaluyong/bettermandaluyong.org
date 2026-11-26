import { describe, expect, it } from "vitest";
import { d1Rows, mergeD1Rows, type D1Row } from "./importer.ts";
import { mergeFeedItems, type NewsState } from "./repo.ts";

const row = (n: number, over: Partial<D1Row> = {}): D1Row => ({
  source_id: String(n),
  url: `https://mandaluyong.gov.ph/p-${n}/`,
  title: `P${n}`,
  published_at: "2026-10-05T08:00:00+08:00",
  categories: '["News"]',
  first_seen_at: "2026-10-05T09:07:00+08:00",
  removed_at: null,
  missing_strikes: 0,
  wayback_requested_at: null,
  wayback_status: null,
  wayback_url: null,
  wayback_attempts: 0,
  ...over,
});

const wpState = (...ns: number[]): NewsState => {
  const s: NewsState = new Map();
  mergeFeedItems(
    s,
    ns.map((n) => ({
      source: "city-website" as const,
      sourceId: String(n),
      url: `https://mandaluyong.gov.ph/p-${n}/`,
      title: `P${n}`,
      publishedAt: "2026-10-05T08:00:00+08:00",
      categories: ["News"],
    })),
    "2026-11-26T10:00:00+08:00",
    { updateExisting: true },
  );
  return s;
};

describe("d1Rows", () => {
  it("reads the cf wrapper and a bare array", () => {
    expect(d1Rows([{ results: [row(1)], success: true }])).toHaveLength(1);
    expect(d1Rows([row(1), row(2)])).toHaveLength(2);
    expect(d1Rows({ results: [row(1)] })).toHaveLength(1);
    expect(d1Rows({ result: [{ results: [row(1), row(2)] }] })).toHaveLength(2);
  });

  it("rejects anything else", () => {
    expect(() => d1Rows({})).toThrow(/not a D1 export/);
    expect(() => d1Rows([{ nope: 1 }])).toThrow(/not a D1 export/);
  });
});

describe("mergeD1Rows", () => {
  it("lets D1 set first-seen, removal and archive on a known post", () => {
    const state = wpState(1);
    const r = mergeD1Rows(state, [
      row(1, {
        removed_at: "2026-11-01T06:00:00+08:00",
        wayback_requested_at: "2026-10-06T09:37:00+08:00",
        wayback_status: "ok",
        wayback_url: "https://web.archive.org/web/1/x",
      }),
    ]);
    expect(r).toEqual({ merged: 1, added: 0, skipped: 0 });
    expect(state.get(1)).toMatchObject({
      firstSeenAt: "2026-10-05T09:07:00+08:00",
      removedAt: "2026-11-01T06:00:00+08:00",
      archive: { status: "ok", url: "https://web.archive.org/web/1/x" },
    });
  });

  it("adds posts that WordPress no longer has", () => {
    const state = wpState();
    expect(mergeD1Rows(state, [row(9)])).toMatchObject({ added: 1 });
    expect(state.get(9)).toMatchObject({ title: "P9", categories: ["News"] });
  });

  it("keeps a queued post queued, with its failed attempts", () => {
    const state = wpState(1);
    mergeD1Rows(state, [
      row(1, { wayback_status: "http 503", wayback_attempts: 2 }),
    ]);
    expect(state.get(1)?.archive).toEqual({
      status: "http 503",
      url: null,
      requestedAt: null,
      attempts: 2,
    });
  });

  it("leaves a post without archive data unarchived", () => {
    const state = wpState(1);
    mergeD1Rows(state, [row(1)]);
    expect(state.get(1)?.archive).toBeNull();
  });

  it("skips ids that are not post numbers", () => {
    const state = wpState();
    expect(mergeD1Rows(state, [row(1, { source_id: "https://x/" })])).toEqual({
      merged: 0,
      added: 0,
      skipped: 1,
    });
  });
});
