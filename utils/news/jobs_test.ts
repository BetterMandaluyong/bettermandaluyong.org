import { describe, expect, it } from "vitest";
import {
  ARCHIVE_MAX_ATTEMPTS,
  ARCHIVE_SAVES_PER_RUN,
  FEED_URL,
  runArchiveJob,
  runFeedJob,
  runRemovalJob,
  type JobDeps,
} from "./jobs.ts";
import { mergeFeedItems, type NewsState } from "./repo.ts";
import type { FeedItem } from "./types.ts";
import { availabilityUrl } from "./wayback.ts";
import { wpCategoriesUrl, wpRecentUrl } from "./wp.ts";

const NOW = new Date("2026-11-25T00:00:00Z");
const NOW_ISO = "2026-11-25T08:00:00+08:00";

const feedItem = (n: number): FeedItem => ({
  source: "city-website",
  sourceId: String(n),
  url: `https://mandaluyong.gov.ph/post-${n}/`,
  title: `Post ${n}`,
  publishedAt: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T08:00:00+08:00`,
  categories: ["News"],
});

const stateWith = (...ns: number[]): NewsState => {
  const state: NewsState = new Map();
  mergeFeedItems(state, ns.map(feedItem), NOW_ISO, { updateExisting: true });
  return state;
};

const rssItem = (n: number): string => `<item>
<title>Post ${n}</title>
<link>https://mandaluyong.gov.ph/post-${n}/</link>
<pubDate>Tue, 27 Oct 2026 03:08:46 +0000</pubDate>
<category><![CDATA[News]]></category>
<guid isPermaLink="false">https://mandaluyong.gov.ph/?p=${n}</guid>
</item>`;

const rss = (...ns: number[]): string =>
  `<?xml version="1.0"?><rss><channel><title>x</title>${ns.map(rssItem).join("")}</channel></rss>`;

type Reply = Response | Error;

/** A fetch that answers from a table keyed by "METHOD url" or just "url"; anything else is a 404. */
const fakeFetch = (replies: Record<string, Reply>) => {
  const calls: { key: string; signal: boolean }[] = [];
  const impl = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = input instanceof Request ? input : null;
    const url = request ? request.url : String(input);
    const method = request?.method ?? init?.method ?? "GET";
    calls.push({
      key: `${method} ${url}`,
      signal: Boolean(init?.signal ?? request?.signal),
    });
    const reply = replies[`${method} ${url}`] ?? replies[url];
    if (reply instanceof Error) throw reply;
    return reply ? reply.clone() : new Response("not found", { status: 404 });
  };
  return { fetch: impl as typeof fetch, calls };
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

const deps = (f: typeof fetch, over: Partial<JobDeps> = {}): JobDeps => ({
  fetch: f,
  now: () => NOW,
  iaKeys: null,
  sleep: async () => {},
  ...over,
});

const wpPost = (id: number) => ({
  id,
  link: `https://mandaluyong.gov.ph/post-${id}/`,
  title: { rendered: `Post ${id}` },
  date: "2026-10-01T09:00:00",
  categories: [1],
});

const wpReplies = (...ids: number[]): Record<string, Reply> => ({
  [wpCategoriesUrl()]: json([{ id: 1, name: "News" }]),
  [wpRecentUrl()]: json(ids.map(wpPost)),
});

const availableReply = (n: number) =>
  json({
    archived_snapshots: {
      closest: {
        available: true,
        url: `http://web.archive.org/web/2026/post-${n}`,
      },
    },
  });
const noneReply = () => json({ archived_snapshots: {} });
const saveUrl = (n: number) =>
  `https://web.archive.org/save/https://mandaluyong.gov.ph/post-${n}/`;

describe("runFeedJob", () => {
  it("adds new posts from the feed and refreshes known ones", async () => {
    const state = stateWith(1);
    const { fetch } = fakeFetch({
      [FEED_URL]: new Response(rss(1, 2)),
      ...wpReplies(),
    });
    const r = await runFeedJob(state, deps(fetch));
    expect(r).toMatchObject({ ok: true, errorCode: null, itemsRead: 2 });
    expect(r.added.map((i) => i.id)).toEqual([2]);
    expect(state.size).toBe(2);
  });

  it("catches up on recent posts the feed no longer lists, without touching known ones", async () => {
    const state = stateWith(1);
    state.get(1)!.title = "Edited by hand";
    const { fetch } = fakeFetch({
      [FEED_URL]: new Response(rss(5)),
      ...wpReplies(1, 3, 4),
    });
    const r = await runFeedJob(state, deps(fetch));
    expect(r.added.map((i) => i.id).sort()).toEqual([3, 4, 5]);
    expect(state.get(1)?.title).toBe("Edited by hand");
  });

  it("reports an empty feed and still catches up", async () => {
    const state = stateWith();
    const { fetch } = fakeFetch({
      [FEED_URL]: new Response("<html>oops</html>"),
      ...wpReplies(7),
    });
    const r = await runFeedJob(state, deps(fetch));
    expect(r).toMatchObject({ ok: false, errorCode: "parse_empty" });
    expect(state.has(7)).toBe(true);
  });

  it("reports an HTTP error and a network error", async () => {
    const http = await runFeedJob(
      stateWith(),
      deps(
        fakeFetch({ [FEED_URL]: new Response("no", { status: 403 }) }).fetch,
      ),
    );
    expect(http).toMatchObject({ ok: false, errorCode: "http_403" });
    const net = await runFeedJob(
      stateWith(),
      deps(fakeFetch({ [FEED_URL]: new Error("down") }).fetch),
    );
    expect(net).toMatchObject({ ok: false, errorCode: "fetch_failed" });
  });

  it("stays ok when only the catch-up fails, and says so", async () => {
    const { fetch } = fakeFetch({
      [FEED_URL]: new Response(rss(1)),
      [wpCategoriesUrl()]: new Response("no", { status: 500 }),
    });
    const r = await runFeedJob(stateWith(), deps(fetch));
    expect(r).toMatchObject({ ok: true, errorCode: "catchup_http_500" });
  });

  it("gives every request a timeout signal", async () => {
    const { fetch, calls } = fakeFetch({
      [FEED_URL]: new Response(rss(1)),
      ...wpReplies(),
    });
    await runFeedJob(stateWith(), deps(fetch));
    expect(calls.length).toBeGreaterThan(1);
    expect(calls.every((c) => c.signal)).toBe(true);
  });
});

describe("runArchiveJob", () => {
  it("records an existing capture without saving", async () => {
    const state = stateWith(1);
    const { fetch, calls } = fakeFetch({
      [availabilityUrl("https://mandaluyong.gov.ph/post-1/")]:
        availableReply(1),
    });
    const r = await runArchiveJob(state, deps(fetch));
    expect(state.get(1)?.archive).toMatchObject({
      status: "ok",
      url: "https://web.archive.org/web/2026/post-1",
      requestedAt: NOW_ISO,
    });
    expect(r.saveRequests).toBe(0);
    expect(calls.some((c) => c.key.includes("/save"))).toBe(false);
    expect(r.archived).toHaveLength(1);
  });

  it("saves a post with no capture and records the result", async () => {
    const state = stateWith(1);
    const { fetch } = fakeFetch({
      [availabilityUrl("https://mandaluyong.gov.ph/post-1/")]: noneReply(),
      [saveUrl(1)]: new Response("", {
        status: 200,
        headers: {
          "Content-Location":
            "/web/20261125/https://mandaluyong.gov.ph/post-1/",
        },
      }),
    });
    const r = await runArchiveJob(state, deps(fetch));
    expect(r).toMatchObject({ ok: true, saveRequests: 1 });
    expect(state.get(1)?.archive).toMatchObject({ status: "ok" });
    expect(state.get(1)?.archive?.url).toContain("web.archive.org");
  });

  it("makes at most ARCHIVE_SAVES_PER_RUN saves a run", async () => {
    const ids = Array.from(
      { length: ARCHIVE_SAVES_PER_RUN + 3 },
      (_, i) => i + 1,
    );
    const state = stateWith(...ids);
    const replies: Record<string, Reply> = {};
    for (const n of ids) {
      replies[availabilityUrl(`https://mandaluyong.gov.ph/post-${n}/`)] =
        noneReply();
      replies[saveUrl(n)] = new Response("", { status: 200 });
    }
    const r = await runArchiveJob(state, deps(fakeFetch(replies).fetch));
    expect(r.saveRequests).toBe(ARCHIVE_SAVES_PER_RUN);
  });

  it("stops on a 429 and leaves the post queued", async () => {
    const state = stateWith(1, 2);
    const { fetch } = fakeFetch({
      [availabilityUrl("https://mandaluyong.gov.ph/post-1/")]: new Response(
        "",
        { status: 429 },
      ),
    });
    const r = await runArchiveJob(state, deps(fetch));
    expect(r).toMatchObject({ ok: false, errorCode: "http_429" });
    expect(state.get(1)?.archive).toBeNull();
  });

  it("counts two transient failures in a row as an outage and stops", async () => {
    const state = stateWith(1, 2, 3);
    const replies: Record<string, Reply> = {};
    for (const n of [1, 2, 3]) {
      replies[availabilityUrl(`https://mandaluyong.gov.ph/post-${n}/`)] =
        noneReply();
      replies[saveUrl(n)] = new Response("", { status: 503 });
    }
    const r = await runArchiveJob(state, deps(fakeFetch(replies).fetch));
    expect(r).toMatchObject({
      ok: false,
      errorCode: "http_503",
      saveRequests: 2,
    });
    // Still queued: not enough failures to give up on either post.
    expect(
      [...state.values()].every(
        (i) => i.archive?.requestedAt === null || !i.archive,
      ),
    ).toBe(true);
  });

  it("gives up on a post after ARCHIVE_MAX_ATTEMPTS transient failures", async () => {
    const state = stateWith(1);
    const replies = {
      [availabilityUrl("https://mandaluyong.gov.ph/post-1/")]: noneReply(),
      [saveUrl(1)]: new Response("", { status: 503 }),
    };
    for (let i = 0; i < ARCHIVE_MAX_ATTEMPTS; i++) {
      await runArchiveJob(state, deps(fakeFetch(replies).fetch));
    }
    expect(state.get(1)?.archive).toMatchObject({
      status: "http 503",
      attempts: ARCHIVE_MAX_ATTEMPTS,
      requestedAt: NOW_ISO,
    });
  });

  it("records a permanent refusal and reports it as given up", async () => {
    const state = stateWith(1);
    const { fetch } = fakeFetch({
      [availabilityUrl("https://mandaluyong.gov.ph/post-1/")]: noneReply(),
      [saveUrl(1)]: new Response("", { status: 404 }),
    });
    const r = await runArchiveJob(state, deps(fetch));
    expect(state.get(1)?.archive).toMatchObject({
      status: "http 404",
      requestedAt: NOW_ISO,
    });
    expect(r.gaveUp).toHaveLength(1);
  });

  it("sends the Internet Archive keys when it has them", async () => {
    const state = stateWith(1);
    let auth: string | null = null;
    const f = (async (input: RequestInfo | URL) => {
      if (input instanceof Request) {
        auth = input.headers.get("Authorization");
        return new Response("", { status: 200 });
      }
      return noneReply();
    }) as typeof fetch;
    await runArchiveJob(
      state,
      deps(f, { iaKeys: { access: "a", secret: "s" } }),
    );
    expect(auth).toBe("LOW a:s");
  });

  it("does nothing when nothing is pending", async () => {
    const { fetch, calls } = fakeFetch({});
    const r = await runArchiveJob(stateWith(), deps(fetch));
    expect(r).toMatchObject({ ok: true, saveRequests: 0 });
    expect(calls).toHaveLength(0);
  });
});

describe("runRemovalJob", () => {
  const head = (n: number) => `HEAD https://mandaluyong.gov.ph/post-${n}/`;

  it("marks a post missing, then removed, and restores it when it returns", async () => {
    const state = stateWith(1);
    const gone = fakeFetch({
      [head(1)]: new Response("", { status: 404 }),
    }).fetch;
    const first = await runRemovalJob(state, deps(gone));
    expect(first.missing.map((i) => i.id)).toEqual([1]);
    const second = await runRemovalJob(state, deps(gone));
    expect(second.removed.map((i) => i.id)).toEqual([1]);
    expect(state.get(1)?.removedAt).toBe(NOW_ISO);
    const back = await runRemovalJob(
      state,
      deps(fakeFetch({ [head(1)]: new Response("", { status: 200 }) }).fetch),
    );
    expect(back.restored.map((i) => i.id)).toEqual([1]);
    expect(state.get(1)?.removedAt).toBeNull();
  });

  it("treats redirects as live and server errors as no information", async () => {
    const state = stateWith(1, 2);
    const { fetch } = fakeFetch({
      [head(1)]: new Response("", { status: 301 }),
      [head(2)]: new Response("", { status: 503 }),
    });
    const r = await runRemovalJob(state, deps(fetch));
    expect(r.ok).toBe(true);
    expect([...state.values()].every((i) => i.missingSince === null)).toBe(
      true,
    );
  });

  it("fails when every check hits a network error, and changes nothing", async () => {
    const state = stateWith(1, 2);
    const r = await runRemovalJob(
      state,
      deps(
        fakeFetch({ [head(1)]: new Error("x"), [head(2)]: new Error("x") })
          .fetch,
      ),
    );
    expect(r).toMatchObject({
      ok: false,
      errorCode: "fetch_failed",
      checked: 0,
    });
    expect([...state.values()].every((i) => i.missingSince === null)).toBe(
      true,
    );
  });

  it("only checks posts from the last year, without following redirects", async () => {
    const state = stateWith(1);
    state.get(1)!.publishedAt = "2024-01-01T08:00:00+08:00";
    const { fetch, calls } = fakeFetch({});
    const r = await runRemovalJob(state, deps(fetch));
    expect(r.checked).toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("is ok with nothing to check", async () => {
    const r = await runRemovalJob(stateWith(), deps(fakeFetch({}).fetch));
    expect(r).toMatchObject({ ok: true, errorCode: null });
  });
});
