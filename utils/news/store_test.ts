import { beforeEach, describe, expect, it } from "vitest";
import {
  ensureSchema,
  getState,
  itemsForRemovalCheck,
  latestNews,
  listCategories,
  listNews,
  pendingArchive,
  recentRuns,
  recordArchive,
  recordPresence,
  recordRun,
  safeRead,
  setState,
  upsertItems,
} from "./store.ts";
import { openTestDb } from "./sqlite_d1.ts";
import type { FeedItem, SqlDb } from "./types.ts";

const now = "2026-11-25T00:00:00+08:00";
const later = "2026-11-26T00:00:00+08:00";

const item = (n: number, over: Partial<FeedItem> = {}): FeedItem => ({
  source: "city-website",
  sourceId: `id-${n}`,
  url: `https://mandaluyong.gov.ph/post-${n}/`,
  title: `Post ${n}`,
  publishedAt: `2026-10-${String(n).padStart(2, "0")}T08:00:00+08:00`,
  categories: ["News"],
  ...over,
});

const page1 = { page: 1, perPage: 20, category: null };

describe("news store", () => {
  let db: SqlDb;
  beforeEach(async () => {
    db = openTestDb();
    await ensureSchema(db);
  });

  it("inserts new items and counts them", async () => {
    expect(await upsertItems(db, [item(1), item(2)], now)).toEqual({
      newCount: 2,
    });
    expect(await upsertItems(db, [item(1), item(3)], later)).toEqual({
      newCount: 1,
    });
  });

  it("keeps one row per (source, sourceId) and updates the title", async () => {
    await upsertItems(db, [item(1)], now);
    await upsertItems(db, [item(1, { title: "Edited" })], later);
    const { items, total } = await listNews(db, page1);
    expect(total).toBe(1);
    expect(items[0].title).toBe("Edited");
  });

  it("lists newest first, paginates, and filters by category", async () => {
    const all = Array.from({ length: 25 }, (_, i) =>
      item(i + 1, { categories: i % 5 === 0 ? ["News", "Awards"] : ["News"] }),
    );
    await upsertItems(db, all, now);
    const p1 = await listNews(db, { page: 1, perPage: 20, category: null });
    expect(p1.total).toBe(25);
    expect(p1.items).toHaveLength(20);
    expect(p1.items[0].title).toBe("Post 25");
    const p2 = await listNews(db, { page: 2, perPage: 20, category: null });
    expect(p2.items).toHaveLength(5);
    const awards = await listNews(db, {
      page: 1,
      perPage: 20,
      category: "Awards",
    });
    expect(awards.total).toBe(5);
    expect(awards.items[0].categories).toEqual(["News", "Awards"]);
    expect(
      (await listNews(db, { page: 1, perPage: 20, category: "Awar" })).total,
    ).toBe(0);
    expect((await latestNews(db, 3)).map((r) => r.title)).toEqual([
      "Post 25",
      "Post 24",
      "Post 23",
    ]);
  });

  it("returns categories sorted and de-duplicated", async () => {
    await upsertItems(
      db,
      [
        item(1, { categories: ["News", "Health"] }),
        item(2, { categories: ["Awards", "News"] }),
      ],
      now,
    );
    expect(await listCategories(db)).toEqual(["Awards", "Health", "News"]);
  });

  it("queues only items with no wayback_requested_at, oldest first", async () => {
    await upsertItems(db, [item(3), item(1), item(2)], now);
    let queue = await pendingArchive(db, 10);
    expect(queue.map((q) => q.url)).toEqual([
      "https://mandaluyong.gov.ph/post-1/",
      "https://mandaluyong.gov.ph/post-2/",
      "https://mandaluyong.gov.ph/post-3/",
    ]);
    await recordArchive(db, queue[0].id, {
      status: "ok",
      captureUrl: "https://web.archive.org/web/1/x",
      nowIso: later,
    });
    queue = await pendingArchive(db, 1);
    expect(queue).toHaveLength(1);
    expect(queue[0].url).toBe("https://mandaluyong.gov.ph/post-2/");
    const row = (await latestNews(db, 10)).find((r) => r.title === "Post 1");
    expect(row?.waybackStatus).toBe("ok");
    expect(row?.waybackUrl).toBe("https://web.archive.org/web/1/x");
  });

  it("selects items for the removal check by date and id", async () => {
    await upsertItems(db, [item(1), item(2), item(3)], now);
    const ids = (await pendingArchive(db, 10)).map((r) => r.id);
    const got = await itemsForRemovalCheck(db, {
      sinceIso: "2026-10-02T00:00:00+08:00",
      afterId: ids[1],
      limit: 5,
    });
    expect(got.map((g) => g.id)).toEqual([ids[2]]);
  });

  it("sets removed_at after two misses in a row and clears it when the post returns", async () => {
    await upsertItems(db, [item(1)], now);
    const [{ id }] = await pendingArchive(db, 1);
    const t1 = "2026-11-26T00:00:00+08:00";
    const t2 = "2026-11-27T00:00:00+08:00";
    const t3 = "2026-11-28T00:00:00+08:00";
    await recordPresence(db, id, false, t1);
    expect((await latestNews(db, 1))[0].removedAt).toBeNull();
    await recordPresence(db, id, false, t2);
    expect((await latestNews(db, 1))[0].removedAt).toBe(t2);
    await recordPresence(db, id, false, t3);
    expect((await latestNews(db, 1))[0].removedAt).toBe(t2);
    await recordPresence(db, id, true, t3);
    expect((await latestNews(db, 1))[0].removedAt).toBeNull();
    await recordPresence(db, id, false, t1);
    expect((await latestNews(db, 1))[0].removedAt).toBeNull();
  });

  it("round-trips job_state and runs (newest first)", async () => {
    expect(await getState(db, "cursor")).toBeNull();
    await setState(db, "cursor", "5");
    await setState(db, "cursor", "9");
    expect(await getState(db, "cursor")).toBe("9");
    const run = (startedAt: string, ok: boolean) => ({
      job: "feed" as const,
      startedAt,
      finishedAt: startedAt,
      ok,
      itemsRead: 3,
      newItems: 1,
      archiveRequests: 0,
      errorCode: ok ? null : "http_500",
    });
    await recordRun(db, run("2026-11-25T01:00:00+08:00", true));
    await recordRun(db, run("2026-11-25T02:00:00+08:00", false));
    await recordRun(db, {
      ...run("2026-11-25T03:00:00+08:00", true),
      job: "archive",
    });
    const runs = await recentRuns(db, "feed", 5);
    expect(runs.map((r) => r.startedAt)).toEqual([
      "2026-11-25T02:00:00+08:00",
      "2026-11-25T01:00:00+08:00",
    ]);
    expect(runs[0]).toMatchObject({ ok: false, errorCode: "http_500" });
    expect(runs[1].ok).toBe(true);
  });

  it("safeRead returns the fallback when tables don't exist yet", async () => {
    const empty = openTestDb();
    expect(
      await safeRead(() => listNews(empty, page1), { items: [], total: 0 }),
    ).toEqual({ items: [], total: 0 });
    await expect(
      safeRead(async () => {
        throw new Error("boom");
      }, 1),
    ).rejects.toThrow("boom");
  });
});
