import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ARCHIVE_SAVES_PER_RUN,
  AVAILABILITY_CHECKS_PER_RUN,
  D1_QUERIES_PER_RUN,
  FEED_URL,
  REMOVAL_CHECKS_PER_RUN,
  runArchiveJob,
  runFeedJob,
  runRemovalJob,
  type JobDeps,
} from "./jobs.ts";
import { countingDb, openTestDb } from "./sqlite_d1.ts";
import {
  ensureSchema,
  getState,
  listNews,
  pendingArchive,
  recentRuns,
  setState,
  upsertItems,
} from "./store.ts";
import { availabilityUrl } from "./wayback.ts";
import { wpCategoriesUrl, wpPostsUrl } from "./wp.ts";
import type { FeedItem, SqlDb } from "./types.ts";

const NOW = new Date("2026-11-25T00:00:00Z");
const NOW_ISO = "2026-11-25T08:00:00+08:00";

const item = (n: number, over: Partial<FeedItem> = {}): FeedItem => ({
  source: "city-website",
  sourceId: String(n),
  url: `https://mandaluyong.gov.ph/post-${n}/`,
  title: `Post ${n}`,
  publishedAt: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T08:00:00+08:00`,
  categories: ["News"],
  ...over,
});

const rssItem = (n: number): string => `<item>
<title>Post ${n}</title>
<link>https://mandaluyong.gov.ph/post-${n}/</link>
<pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>
<category><![CDATA[News]]></category>
<guid isPermaLink="false">https://mandaluyong.gov.ph/?p=${n}</guid>
</item>`;

const rss = (count: number, from = 1): string =>
  `<?xml version="1.0"?><rss><channel><title>x</title>${Array.from(
    { length: count },
    (_, i) => rssItem(from + i),
  ).join("")}</channel></rss>`;

type Reply = Response | Error;

const fakeFetch = (
  replies: Record<string, Reply>,
): { fetch: typeof fetch; calls: string[] } => {
  const calls: string[] = [];
  const impl = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = input instanceof Request ? input : null;
    const url = request ? request.url : String(input);
    const method = request?.method ?? init?.method ?? "GET";
    calls.push(`${method} ${url}`);
    const reply = replies[`${method} ${url}`] ?? replies[url];
    if (reply instanceof Error) throw reply;
    return reply ? reply.clone() : new Response("not found", { status: 404 });
  };
  return { fetch: impl as typeof fetch, calls };
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

const wpPost = (id: number) => ({
  id,
  link: `https://mandaluyong.gov.ph/post-${id}/`,
  title: { rendered: `Post ${id}` },
  date: "2026-10-01T09:00:00",
  categories: [1],
});

const categoriesReply = json([{ id: 1, name: "News" }]);

describe("news jobs", () => {
  let db: SqlDb;
  const deps = (f: typeof fetch, over: Partial<JobDeps> = {}): JobDeps => ({
    db,
    fetch: f,
    now: () => NOW,
    iaKeys: null,
    ...over,
  });

  beforeEach(async () => {
    db = openTestDb();
    await ensureSchema(db);
    vi.spyOn(console, "error").mockImplementation(() => {});
    return () => vi.restoreAllMocks();
  });

  describe("outbound requests and logging", () => {
    it("every fetch carries an abort signal", async () => {
      await upsertItems(db, [item(1)], NOW_ISO);
      const seen: { url: string; signal: unknown }[] = [];
      const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        seen.push({ url, signal: init?.signal });
        if (url === FEED_URL) return new Response(rss(1));
        if (url.startsWith("https://archive.org/wayback"))
          return json({ archived_snapshots: {} });
        if (url.includes("/save/")) return new Response("", { status: 200 });
        if (url.includes("wp-json")) return json([]);
        return new Response("");
      }) as typeof fetch;
      await runFeedJob(deps(f));
      await runArchiveJob(deps(f));
      await runRemovalJob(deps(f));
      expect(seen.length).toBeGreaterThanOrEqual(5);
      for (const { signal } of seen) expect(signal).toBeInstanceOf(AbortSignal);
    });

    it("a timeout is a network error", async () => {
      const f = (async () => {
        throw new DOMException("timed out", "TimeoutError");
      }) as unknown as typeof fetch;
      await setState(db, "wp_backfill_done", "1");
      expect(await runFeedJob(deps(f))).toMatchObject({
        ok: false,
        errorCode: "fetch_failed",
      });
    });

    it("logs an escaped exception with the job name, not in the run row", async () => {
      const f = (async () => {
        throw new TypeError("secret detail");
      }) as unknown as typeof fetch;
      await upsertItems(db, [item(1)], NOW_ISO);
      const run = await runArchiveJob(deps(f));
      expect(JSON.stringify(run)).not.toContain("secret detail");
      const broken = {
        ...db,
        prepare: () => {
          throw new Error("d1 down");
        },
      } as unknown as SqlDb;
      await runRemovalJob(deps(f, { db: broken }));
      const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
      expect(logged).toContain("removal");
      expect(logged).toContain("d1 down");
    });
  });

  describe("feed", () => {
    beforeEach(async () => {
      await setState(db, "wp_backfill_done", "1");
    });

    it("stores RSS items and records an ok run", async () => {
      const { fetch: f } = fakeFetch({ [FEED_URL]: new Response(rss(2)) });
      const run = await runFeedJob(deps(f));
      expect(run).toMatchObject({
        job: "feed",
        ok: true,
        itemsRead: 2,
        newItems: 2,
        errorCode: null,
      });
      expect(
        (await listNews(db, { page: 1, perPage: 20, category: null })).total,
      ).toBe(2);
      const again = await runFeedJob(deps(f));
      expect(again.newItems).toBe(0);
      expect(await recentRuns(db, "feed", 10)).toHaveLength(2);
    });

    it("HTML error page → ok false, parse_empty, nothing deleted", async () => {
      await upsertItems(db, [item(1)], NOW_ISO);
      const { fetch: f } = fakeFetch({
        [FEED_URL]: new Response("<html>oops</html>"),
      });
      const run = await runFeedJob(deps(f));
      expect(run).toMatchObject({ ok: false, errorCode: "parse_empty" });
      expect(
        (await listNews(db, { page: 1, perPage: 20, category: null })).total,
      ).toBe(1);
    });

    it("HTTP 500 → http_500; fetch throws → fetch_failed", async () => {
      const a = fakeFetch({ [FEED_URL]: new Response("x", { status: 500 }) });
      expect(await runFeedJob(deps(a.fetch))).toMatchObject({
        ok: false,
        errorCode: "http_500",
      });
      const b = fakeFetch({ [FEED_URL]: new Error("boom") });
      expect(await runFeedJob(deps(b.fetch))).toMatchObject({
        ok: false,
        errorCode: "fetch_failed",
      });
      expect(await recentRuns(db, "feed", 10)).toHaveLength(2);
    });

    it("an exception still records one run", async () => {
      const f = (async () => {
        throw new TypeError("x");
      }) as unknown as typeof fetch;
      const run = await runFeedJob(deps(f));
      expect(run.ok).toBe(false);
      expect(await recentRuns(db, "feed", 10)).toHaveLength(1);
    });

    it("backfills one WP page per run, then marks done on an empty page", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const { fetch: f, calls } = fakeFetch({
        [FEED_URL]: new Response(rss(1, 500)),
        [wpCategoriesUrl()]: categoriesReply,
        [wpPostsUrl(1)]: json([wpPost(1), wpPost(2)]),
        [wpPostsUrl(2)]: json([wpPost(3)]),
        [wpPostsUrl(3)]: json([]),
      });
      const r1 = await runFeedJob(deps(f));
      expect(r1.newItems).toBe(3);
      expect(await getState(db, "wp_backfill_page")).toBe("2");
      await runFeedJob(deps(f));
      expect(await getState(db, "wp_backfill_page")).toBe("3");
      const r3 = await runFeedJob(deps(f));
      expect(r3.ok).toBe(true);
      expect(await getState(db, "wp_backfill_done")).toBe("1");
      const before = calls.length;
      await runFeedJob(deps(f));
      expect(calls.length - before).toBe(1);
      expect(
        (await listNews(db, { page: 1, perPage: 20, category: null })).total,
      ).toBe(4);
    });

    it("HTTP 400 on a posts page ends the backfill", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const { fetch: f } = fakeFetch({
        [FEED_URL]: new Response(rss(1)),
        [wpCategoriesUrl()]: categoriesReply,
        [wpPostsUrl(1)]: new Response("", { status: 400 }),
      });
      const run = await runFeedJob(deps(f));
      expect(run.errorCode).toBeNull();
      expect(await getState(db, "wp_backfill_done")).toBe("1");
    });

    it("a backfill failure is recorded but does not fail the run", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const { fetch: f } = fakeFetch({
        [FEED_URL]: new Response(rss(1)),
        [wpCategoriesUrl()]: categoriesReply,
        [wpPostsUrl(1)]: new Response("", { status: 503 }),
      });
      const run = await runFeedJob(deps(f));
      expect(run).toMatchObject({ ok: true, errorCode: "backfill_http_503" });
      expect(await getState(db, "wp_backfill_done")).toBeNull();
    });

    it("decodes entities in WordPress category names", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const { fetch: f } = fakeFetch({
        [FEED_URL]: new Response(rss(1, 900)),
        [wpCategoriesUrl()]: json([{ id: 1, name: "Arts &amp; Culture" }]),
        [wpPostsUrl(1)]: json([wpPost(7)]),
      });
      await runFeedJob(deps(f));
      const { items } = await listNews(db, {
        page: 1,
        perPage: 20,
        category: "Arts & Culture",
      });
      expect(items.map((i) => i.title)).toEqual(["Post 7"]);
    });

    it("a post in both RSS and backfill stays one row", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const { fetch: f } = fakeFetch({
        [FEED_URL]: new Response(rss(1, 7)),
        [wpCategoriesUrl()]: categoriesReply,
        [wpPostsUrl(1)]: json([wpPost(7)]),
      });
      await runFeedJob(deps(f));
      expect(
        (await listNews(db, { page: 1, perPage: 20, category: null })).total,
      ).toBe(1);
    });

    it("stays within the budget with 10 RSS items and a 100-post page", async () => {
      await db.prepare("DELETE FROM job_state").run();
      const counted = countingDb(db);
      const { fetch: f, calls } = fakeFetch({
        [FEED_URL]: new Response(rss(10, 1000)),
        [wpCategoriesUrl()]: categoriesReply,
        [wpPostsUrl(1)]: json(
          Array.from({ length: 100 }, (_, i) => wpPost(i + 1)),
        ),
      });
      const run = await runFeedJob(deps(f, { db: counted.db }));
      expect(run.newItems).toBe(110);
      expect(calls.length).toBeLessThanOrEqual(3);
      expect(counted.count()).toBeLessThanOrEqual(D1_QUERIES_PER_RUN);
    });
  });

  describe("archive", () => {
    const seed = async (n: number) => {
      await upsertItems(
        db,
        Array.from({ length: n }, (_, i) => item(i + 1)),
        NOW_ISO,
      );
    };
    const saveKey = (n: number) =>
      `GET https://web.archive.org/save/https://mandaluyong.gov.ph/post-${n}/`;
    const availKey = (n: number) =>
      availabilityUrl(`https://mandaluyong.gov.ph/post-${n}/`);
    const hit = {
      archived_snapshots: {
        closest: { available: true, url: "https://web.archive.org/web/1/x" },
      },
    };
    const miss = { archived_snapshots: {} };

    it("an existing capture is recorded without calling Save Page Now", async () => {
      await seed(1);
      const { fetch: f, calls } = fakeFetch({ [availKey(1)]: json(hit) });
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({
        ok: true,
        itemsRead: 1,
        archiveRequests: 0,
        newItems: 0,
      });
      expect(calls.some((c) => c.includes("/save/"))).toBe(false);
      expect(await pendingArchive(db, 10)).toEqual([]);
    });

    it("saves at most 5 per run and makes at most 25 requests", async () => {
      await seed(30);
      const replies: Record<string, Reply> = {};
      for (let n = 1; n <= 30; n++) {
        replies[availKey(n)] = json(miss);
        replies[saveKey(n)] = new Response("", {
          status: 200,
          headers: { "Content-Location": `/web/1/${n}` },
        });
      }
      const counted = countingDb(db);
      const { fetch: f, calls } = fakeFetch(replies);
      const run = await runArchiveJob(deps(f, { db: counted.db }));
      expect(run.archiveRequests).toBe(ARCHIVE_SAVES_PER_RUN);
      expect(calls.filter((c) => c.includes("/save/"))).toHaveLength(5);
      expect(calls.length).toBeLessThanOrEqual(
        AVAILABILITY_CHECKS_PER_RUN + ARCHIVE_SAVES_PER_RUN,
      );
      expect(counted.count()).toBeLessThanOrEqual(D1_QUERIES_PER_RUN);
      expect(run.ok).toBe(true);
      expect(await pendingArchive(db, 100)).toHaveLength(25);
    });

    it("stays within the query budget with 20 pending items", async () => {
      await seed(20);
      const replies: Record<string, Reply> = {};
      for (let n = 1; n <= 20; n++) replies[availKey(n)] = json(hit);
      const counted = countingDb(db);
      const { fetch: f, calls } = fakeFetch(replies);
      await runArchiveJob(deps(f, { db: counted.db }));
      expect(calls).toHaveLength(20);
      expect(counted.count()).toBeLessThanOrEqual(D1_QUERIES_PER_RUN);
    });

    const status = (code: number) => new Response("", { status: code });
    const attemptsOf = async (n: number): Promise<number> =>
      (
        await db
          .prepare(
            "SELECT wayback_attempts AS a FROM news_items WHERE source_id = ?",
          )
          .bind(String(n))
          .first<{ a: number }>()
      )?.a ?? -1;

    it("a 429 stops the run and leaves the rest queued", async () => {
      await seed(5);
      const { fetch: f } = fakeFetch({
        [availKey(5)]: json(miss),
        [saveKey(5)]: status(429),
      });
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({ ok: false, errorCode: "http_429" });
      expect(await pendingArchive(db, 10)).toHaveLength(5);
      expect(await attemptsOf(5)).toBe(0);
    });

    it("works the queue newest first", async () => {
      await seed(3);
      const { fetch: f, calls: seen } = fakeFetch({
        [availKey(3)]: json(hit),
        [availKey(2)]: json(hit),
        [availKey(1)]: json(hit),
      });
      await runArchiveJob(deps(f));
      expect(seen).toEqual([
        `GET ${availKey(3)}`,
        `GET ${availKey(2)}`,
        `GET ${availKey(1)}`,
      ]);
    });

    it("a failing item does not block the one behind it", async () => {
      await seed(2);
      const { fetch: f } = fakeFetch({
        [availKey(2)]: json(miss),
        [saveKey(2)]: status(503),
        [availKey(1)]: json(miss),
        [saveKey(1)]: new Response("", {
          status: 200,
          headers: { "Content-Location": "/web/1/1" },
        }),
      });
      const run = await runArchiveJob(deps(f));
      expect(run.archiveRequests).toBe(2);
      expect(await attemptsOf(2)).toBe(1);
      const queue = await pendingArchive(db, 10);
      expect(queue.map((q) => q.url)).toEqual([
        "https://mandaluyong.gov.ph/post-2/",
      ]);
    });

    it("after 3 runs a persistently failing item is terminal", async () => {
      await seed(1);
      const { fetch: f } = fakeFetch({
        [availKey(1)]: json(miss),
        [saveKey(1)]: status(503),
      });
      await runArchiveJob(deps(f));
      await runArchiveJob(deps(f));
      expect(await pendingArchive(db, 10)).toHaveLength(1);
      await runArchiveJob(deps(f));
      expect(await attemptsOf(1)).toBe(3);
      expect(await pendingArchive(db, 10)).toEqual([]);
      const row = (await listNews(db, { page: 1, perPage: 5, category: null }))
        .items[0];
      expect(row.waybackStatus).toBe("http 503");
    });

    it("a 403 is transient, a 404 is terminal at once", async () => {
      await seed(2);
      const { fetch: f } = fakeFetch({
        [availKey(2)]: json(miss),
        [saveKey(2)]: status(403),
        [availKey(1)]: json(miss),
        [saveKey(1)]: status(404),
      });
      await runArchiveJob(deps(f));
      expect(await attemptsOf(2)).toBe(1);
      expect(await pendingArchive(db, 10)).toMatchObject([
        { url: "https://mandaluyong.gov.ph/post-2/" },
      ]);
    });

    it("two transient results in a row stop the run", async () => {
      await seed(4);
      const { fetch: f, calls } = fakeFetch({
        [availKey(4)]: json(miss),
        [saveKey(4)]: status(503),
        [availKey(3)]: json(miss),
        [saveKey(3)]: status(502),
        [availKey(2)]: json(miss),
        [saveKey(2)]: status(200),
      });
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({ ok: false, errorCode: "http_502" });
      expect(calls.filter((c) => c.includes("/save/"))).toHaveLength(2);
      expect(await pendingArchive(db, 10)).toHaveLength(4);
      expect(await attemptsOf(3)).toBe(1);
    });

    it("a success between two transient results resets the streak", async () => {
      await seed(3);
      const { fetch: f, calls } = fakeFetch({
        [availKey(3)]: json(miss),
        [saveKey(3)]: status(503),
        [availKey(2)]: json(miss),
        [saveKey(2)]: status(200),
        [availKey(1)]: json(miss),
        [saveKey(1)]: status(503),
      });
      await runArchiveJob(deps(f));
      expect(calls.filter((c) => c.includes("/save/"))).toHaveLength(3);
    });

    it("stays within the query budget when every save is rejected", async () => {
      await seed(20);
      const replies: Record<string, Reply> = {};
      for (let n = 1; n <= 20; n++) {
        replies[availKey(n)] = json(miss);
        replies[saveKey(n)] = status(404);
      }
      const counted = countingDb(db);
      const { fetch: f } = fakeFetch(replies);
      await runArchiveJob(deps(f, { db: counted.db }));
      expect(counted.count()).toBeLessThanOrEqual(D1_QUERIES_PER_RUN);
    });

    it("is not ok when saves were attempted and none succeeded", async () => {
      await seed(1);
      const { fetch: f } = fakeFetch({
        [availKey(1)]: json(miss),
        [saveKey(1)]: status(503),
      });
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({ ok: false, archiveRequests: 1 });
      expect(run.errorCode).not.toBeNull();
    });

    it("a terminal 404 with no success is not ok either", async () => {
      await seed(1);
      const { fetch: f } = fakeFetch({
        [availKey(1)]: json(miss),
        [saveKey(1)]: status(404),
      });
      expect(await runArchiveJob(deps(f))).toMatchObject({ ok: false });
    });

    it("is ok when availability hits needed no saves, and when one save succeeded", async () => {
      await seed(1);
      const hitOnly = fakeFetch({ [availKey(1)]: json(hit) });
      expect(await runArchiveJob(deps(hitOnly.fetch))).toMatchObject({
        ok: true,
        errorCode: null,
      });
      await seed(0);
      await upsertItems(db, [item(2)], NOW_ISO);
      await upsertItems(db, [item(3)], NOW_ISO);
      const mixed = fakeFetch({
        [availKey(3)]: json(miss),
        [saveKey(3)]: status(503),
        [availKey(2)]: json(miss),
        [saveKey(2)]: new Response("", { status: 200 }),
      });
      expect(await runArchiveJob(deps(mixed.fetch))).toMatchObject({
        ok: true,
      });
    });

    it("a network error stops the run like a 429", async () => {
      await seed(3);
      const { fetch: f, calls } = fakeFetch({
        [availKey(3)]: json(hit),
        [availKey(2)]: new Error("down"),
      });
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({ ok: false, errorCode: "fetch_failed" });
      expect(calls).toHaveLength(2);
      expect(await pendingArchive(db, 10)).toHaveLength(2);
    });

    it("nothing pending → ok true", async () => {
      const { fetch: f, calls } = fakeFetch({});
      const run = await runArchiveJob(deps(f));
      expect(run).toMatchObject({ ok: true, itemsRead: 0 });
      expect(calls).toHaveLength(0);
    });
  });

  describe("removal", () => {
    const seed = async (n: number) => {
      await upsertItems(
        db,
        Array.from({ length: n }, (_, i) =>
          item(i + 1, { publishedAt: "2026-10-01T08:00:00+08:00" }),
        ),
        NOW_ISO,
      );
    };
    const head = (n: number) => `HEAD https://mandaluyong.gov.ph/post-${n}/`;

    it("two 404 runs mark removed; the cursor advances and wraps", async () => {
      await seed(2);
      const { fetch: f, calls } = fakeFetch({
        [head(1)]: new Response("", { status: 404 }),
        [head(2)]: new Response("", { status: 200 }),
      });
      const r1 = await runRemovalJob(deps(f));
      expect(r1).toMatchObject({ ok: true, itemsRead: 2 });
      expect(await getState(db, "removal_cursor")).toBe("0");
      await runRemovalJob(deps(f));
      const { items } = await listNews(db, {
        page: 1,
        perPage: 20,
        category: null,
      });
      expect(items.find((i) => i.title === "Post 1")?.removedAt).not.toBeNull();
      expect(items.find((i) => i.title === "Post 2")?.removedAt).toBeNull();
      expect(calls[0]).toBe(head(1));
    });

    it("the cursor advances past a full batch", async () => {
      await seed(REMOVAL_CHECKS_PER_RUN + 5);
      const { fetch: f } = fakeFetch(
        Object.fromEntries(
          Array.from({ length: 35 }, (_, i) => [head(i + 1), new Response("")]),
        ),
      );
      await runRemovalJob(deps(f));
      expect(await getState(db, "removal_cursor")).toBe("30");
      await runRemovalJob(deps(f));
      expect(await getState(db, "removal_cursor")).toBe("0");
    });

    it("a 503 is skipped without a strike", async () => {
      await seed(1);
      const { fetch: f } = fakeFetch({
        [head(1)]: new Response("", { status: 503 }),
      });
      await runRemovalJob(deps(f));
      await runRemovalJob(deps(f));
      const { items } = await listNews(db, {
        page: 1,
        perPage: 20,
        category: null,
      });
      expect(items[0]?.removedAt).toBeNull();
    });

    it("status 0 counts as present; all errors → ok false", async () => {
      await seed(1);
      const opaque = { status: 0, ok: false } as unknown as Response;
      const a = (async () => opaque) as unknown as typeof fetch;
      expect((await runRemovalJob(deps(a))).ok).toBe(true);
      const b = fakeFetch({ [head(1)]: new Error("down") });
      expect(await runRemovalJob(deps(b.fetch))).toMatchObject({ ok: false });
    });

    it("sends HEAD with redirect manual", async () => {
      await seed(1);
      const seen: RequestInit[] = [];
      const f = (async (_u: unknown, init?: RequestInit) => {
        seen.push(init ?? {});
        return new Response("");
      }) as typeof fetch;
      await runRemovalJob(deps(f));
      expect(seen[0]).toMatchObject({ method: "HEAD", redirect: "manual" });
    });

    it("stays within the query and request budget with 30 items", async () => {
      await seed(30);
      const counted = countingDb(db);
      const { fetch: f, calls } = fakeFetch(
        Object.fromEntries(
          Array.from({ length: 30 }, (_, i) => [
            head(i + 1),
            new Response("", { status: 404 }),
          ]),
        ),
      );
      await runRemovalJob(deps(f, { db: counted.db }));
      expect(calls.length).toBeLessThanOrEqual(REMOVAL_CHECKS_PER_RUN);
      expect(counted.count()).toBeLessThanOrEqual(D1_QUERIES_PER_RUN);
    });
  });
});
