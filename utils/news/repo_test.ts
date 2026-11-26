import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { parseNewsFile, type NewsItem } from "../../data/schema.ts";
import {
  mergeFeedItems,
  monthOf,
  pendingArchive,
  recordArchive,
  recordArchiveAttempt,
  recordPresence,
  removalCandidates,
  serializeAll,
  serializeMonth,
  type NewsState,
} from "./repo.ts";
import { sortNews } from "./query.ts";
import type { FeedItem } from "./types.ts";

const NOW = "2026-11-25T08:00:00+08:00";

const feed = (n: number, over: Partial<FeedItem> = {}): FeedItem => ({
  source: "city-website",
  sourceId: String(n),
  url: `https://mandaluyong.gov.ph/post-${n}/`,
  title: `Post ${n}`,
  publishedAt: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T08:00:00+08:00`,
  categories: ["News"],
  ...over,
});

const stateWith = (...ns: number[]): NewsState => {
  const state: NewsState = new Map();
  mergeFeedItems(
    state,
    ns.map((n) => feed(n)),
    NOW,
    { updateExisting: true },
  );
  return state;
};

describe("mergeFeedItems", () => {
  it("adds new posts and reports only those", () => {
    const state = stateWith(1);
    const added = mergeFeedItems(state, [feed(1), feed(2)], NOW, {
      updateExisting: true,
    });
    expect(added.map((i) => i.id)).toEqual([2]);
    expect(state.size).toBe(2);
    expect(state.get(2)?.firstSeenAt).toBe(NOW);
  });

  it("refreshes title, link and categories of known posts when asked", () => {
    const state = stateWith(1);
    mergeFeedItems(
      state,
      [feed(1, { title: "New", categories: ["Health"] })],
      "later",
      {
        updateExisting: true,
      },
    );
    expect(state.get(1)).toMatchObject({
      title: "New",
      categories: ["Health"],
      firstSeenAt: NOW,
    });
  });

  it("leaves known posts alone otherwise", () => {
    const state = stateWith(1);
    mergeFeedItems(state, [feed(1, { title: "New" })], NOW, {
      updateExisting: false,
    });
    expect(state.get(1)?.title).toBe("Post 1");
  });

  it("skips items whose id is not a post number", () => {
    const state: NewsState = new Map();
    const added = mergeFeedItems(
      state,
      [feed(1, { sourceId: "https://mandaluyong.gov.ph/x/" })],
      NOW,
      { updateExisting: true },
    );
    expect(added).toEqual([]);
    expect(state.size).toBe(0);
  });
});

describe("archive queue", () => {
  it("lists unarchived posts newest published first, up to the limit", () => {
    const state = stateWith(1, 2, 3);
    recordArchive(state, 3, { status: "ok", captureUrl: null, nowIso: NOW });
    expect(pendingArchive(state, 10).map((i) => i.id)).toEqual([2, 1]);
    expect(pendingArchive(state, 1).map((i) => i.id)).toEqual([2]);
  });

  it("keeps a post queued after a transient failure until the last attempt", () => {
    const state = stateWith(1);
    const fail = () =>
      recordArchiveAttempt(state, 1, {
        status: "http 503",
        nowIso: NOW,
        maxAttempts: 3,
      });
    expect(fail().terminal).toBe(false);
    expect(fail().terminal).toBe(false);
    expect(pendingArchive(state, 10)).toHaveLength(1);
    expect(fail().terminal).toBe(true);
    expect(pendingArchive(state, 10)).toHaveLength(0);
    expect(state.get(1)?.archive).toMatchObject({
      status: "http 503",
      attempts: 3,
      requestedAt: NOW,
    });
  });

  it("keeps the attempt count when a later save succeeds", () => {
    const state = stateWith(1);
    recordArchiveAttempt(state, 1, {
      status: "http 503",
      nowIso: NOW,
      maxAttempts: 3,
    });
    recordArchive(state, 1, {
      status: "ok",
      captureUrl: "https://web.archive.org/web/1/x",
      nowIso: NOW,
    });
    expect(state.get(1)?.archive).toEqual({
      status: "ok",
      url: "https://web.archive.org/web/1/x",
      requestedAt: NOW,
      attempts: 1,
    });
  });
});

describe("recordPresence", () => {
  it("marks a post missing, then removed on the second miss", () => {
    const state = stateWith(1);
    expect(recordPresence(state, 1, false, "t1")).toBe("missing");
    expect(state.get(1)).toMatchObject({ missingSince: "t1", removedAt: null });
    expect(recordPresence(state, 1, false, "t2")).toBe("removed");
    expect(state.get(1)).toMatchObject({ missingSince: "t1", removedAt: "t2" });
  });

  it("keeps the first removal date on later misses", () => {
    const state = stateWith(1);
    recordPresence(state, 1, false, "t1");
    recordPresence(state, 1, false, "t2");
    expect(recordPresence(state, 1, false, "t3")).toBeNull();
    expect(state.get(1)?.removedAt).toBe("t2");
  });

  it("clears the marks when the post comes back", () => {
    const state = stateWith(1);
    recordPresence(state, 1, false, "t1");
    expect(recordPresence(state, 1, true, "t2")).toBeNull();
    expect(state.get(1)).toMatchObject({ missingSince: null, removedAt: null });
    recordPresence(state, 1, false, "t3");
    recordPresence(state, 1, false, "t4");
    expect(recordPresence(state, 1, true, "t5")).toBe("restored");
    expect(state.get(1)?.removedAt).toBeNull();
  });

  it("changes nothing for a live post that was live", () => {
    expect(recordPresence(stateWith(1), 1, true, "t")).toBeNull();
  });
});

describe("removalCandidates", () => {
  it("returns recent posts in id order", () => {
    const state: NewsState = new Map();
    mergeFeedItems(
      state,
      [
        feed(5, { publishedAt: "2026-10-05T08:00:00+08:00" }),
        feed(2, { publishedAt: "2026-10-02T08:00:00+08:00" }),
        feed(9, { publishedAt: "2025-01-01T08:00:00+08:00" }),
      ],
      NOW,
      { updateExisting: true },
    );
    expect(
      removalCandidates(state, "2026-01-01T00:00:00+08:00").map((i) => i.id),
    ).toEqual([2, 5]);
  });
});

describe("serialization", () => {
  it("sorts newest published first, then by id", () => {
    const state: NewsState = new Map();
    mergeFeedItems(
      state,
      [
        feed(1, { publishedAt: "2026-10-01T08:00:00+08:00" }),
        feed(2, { publishedAt: "2026-10-03T08:00:00+08:00" }),
        feed(3, { publishedAt: "2026-10-03T08:00:00+08:00" }),
      ],
      NOW,
      { updateExisting: true },
    );
    expect(sortNews(state.values()).map((i) => i.id)).toEqual([3, 2, 1]);
  });

  it("puts each post in the file for its Manila month", () => {
    const state: NewsState = new Map();
    mergeFeedItems(
      state,
      [
        feed(1, { publishedAt: "2026-10-31T23:30:00+08:00" }),
        feed(2, { publishedAt: "2026-11-01T00:30:00+08:00" }),
      ],
      NOW,
      { updateExisting: true },
    );
    expect(Object.keys(serializeAll(state)).sort()).toEqual([
      "2026-10",
      "2026-11",
    ]);
    expect(monthOf(state.get(2)!)).toBe("2026-11");
  });

  it("round-trips through the validator, keeping every field", () => {
    const state = stateWith(1, 2, 3);
    state.get(1)!.title = "Title: with a colon, # a hash, and 'quotes'";
    recordArchive(state, 2, {
      status: "ok",
      captureUrl: "https://web.archive.org/web/2/x",
      nowIso: NOW,
    });
    recordArchiveAttempt(state, 3, {
      status: "http 503",
      nowIso: NOW,
      maxAttempts: 3,
    });
    recordPresence(state, 1, false, "2026-11-26T06:07:00+08:00");
    const files = serializeAll(state);
    const back: NewsItem[] = Object.entries(files).flatMap(([month, text]) =>
      parseNewsFile(parse(text), `${month}.yaml`, month),
    );
    expect(sortNews(back)).toEqual(sortNews(state.values()));
  });

  it("is stable: the same posts always give the same text", () => {
    const state = stateWith(1, 2);
    const first = serializeMonth([...state.values()]);
    const second = serializeMonth([...state.values()].reverse());
    expect(second).toBe(first);
  });

  it("omits empty keys", () => {
    const text = serializeMonth([...stateWith(1).values()]);
    expect(text).not.toMatch(/archive|missing_since|removed_at|null/);
  });
});
