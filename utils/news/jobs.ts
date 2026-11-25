import { parseCityFeed } from "./rss.ts";
import {
  ensureSchema,
  getState,
  itemsForRemovalCheck,
  pendingArchive,
  recordArchive,
  recordPresence,
  recordRun,
  setState,
  upsertItems,
  type RunRow,
} from "./store.ts";
import { toManilaIso } from "./text.ts";
import type { JobName, SqlDb } from "./types.ts";
import {
  availabilityUrl,
  interpretSave,
  parseAvailability,
  saveRequest,
  type IaKeys,
} from "./wayback.ts";
import {
  parseWpJson,
  parseWpPosts,
  wpCategoriesUrl,
  wpPostsUrl,
} from "./wp.ts";

/** The city's RSS feed. */
export const FEED_URL = "https://mandaluyong.gov.ph/feed/";
/** Most Save Page Now requests one archive run makes. */
export const ARCHIVE_SAVES_PER_RUN = 5;
/** Most pending items (and availability checks) one archive run reads. */
export const AVAILABILITY_CHECKS_PER_RUN = 20;
/** Most pages one removal run checks. */
export const REMOVAL_CHECKS_PER_RUN = 30;
/** D1 queries one run may use; the free plan allows 50 per invocation. */
export const D1_QUERIES_PER_RUN = 45;
/** How far back the removal check looks, in days. */
export const REMOVAL_WINDOW_DAYS = 365;

/** What every job needs; injected so jobs run against fakes in tests. */
export type JobDeps = {
  db: SqlDb;
  fetch: typeof fetch;
  now: () => Date;
  iaKeys: IaKeys | null;
};

type Outcome = Pick<
  RunRow,
  "ok" | "itemsRead" | "newItems" | "archiveRequests" | "errorCode"
>;

const EMPTY: Outcome = {
  ok: false,
  itemsRead: 0,
  newItems: 0,
  archiveRequests: 0,
  errorCode: null,
};

/** Runs a job body, then writes exactly one run row. Never throws. */
async function runJob(
  job: JobName,
  deps: JobDeps,
  body: () => Promise<Outcome>,
): Promise<RunRow> {
  const startedAt = toManilaIso(deps.now());
  let outcome: Outcome;
  try {
    await ensureSchema(deps.db);
    outcome = await body();
  } catch {
    outcome = { ...EMPTY, errorCode: "exception" };
  }
  const run: RunRow = {
    job,
    startedAt,
    finishedAt: toManilaIso(deps.now()),
    ...outcome,
  };
  try {
    await recordRun(deps.db, run);
  } catch {
    // The run log is best effort; a broken database must not escape the job.
  }
  return run;
}

const fetchError = (e: unknown): string =>
  e instanceof Error && e.message.startsWith("http_")
    ? e.message
    : "fetch_failed";

/** Fetches a URL and returns its body text; throws "http_<code>" or "fetch_failed". */
async function getText(deps: JobDeps, url: string): Promise<string> {
  let res: Response;
  try {
    res = await deps.fetch(url);
  } catch {
    throw new Error("fetch_failed");
  }
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.text();
}

/** Fetches one backfill page; returns the new item count. Throws on failure. */
async function backfillOnce(deps: JobDeps, nowIso: string): Promise<number> {
  const page = Number((await getState(deps.db, "wp_backfill_page")) ?? "1");
  const categories = new Map<number, string>();
  const cats = parseWpJson(await getText(deps, wpCategoriesUrl()));
  for (const c of Array.isArray(cats) ? cats : []) {
    const { id, name } = (c ?? {}) as { id?: unknown; name?: unknown };
    if (typeof id === "number" && typeof name === "string") {
      categories.set(id, name);
    }
  }
  let res: Response;
  try {
    res = await deps.fetch(wpPostsUrl(page));
  } catch {
    throw new Error("fetch_failed");
  }
  if (res.status === 400) {
    await setState(deps.db, "wp_backfill_done", "1");
    return 0;
  }
  if (!res.ok) throw new Error(`http_${res.status}`);
  const items = parseWpPosts(parseWpJson(await res.text()), categories);
  if (items.length === 0) {
    await setState(deps.db, "wp_backfill_done", "1");
    return 0;
  }
  const { newCount } = await upsertItems(deps.db, items, nowIso);
  await setState(deps.db, "wp_backfill_page", String(page + 1));
  return newCount;
}

/** Reads the RSS feed and backfills one page of older posts. Never deletes rows. */
export function runFeedJob(deps: JobDeps): Promise<RunRow> {
  return runJob("feed", deps, async () => {
    const nowIso = toManilaIso(deps.now());
    const out: Outcome = { ...EMPTY };
    try {
      const items = parseCityFeed(await getText(deps, FEED_URL));
      out.itemsRead = items.length;
      if (items.length === 0) {
        out.errorCode = "parse_empty";
      } else {
        out.newItems = (await upsertItems(deps.db, items, nowIso)).newCount;
        out.ok = true;
      }
    } catch (e) {
      out.errorCode = fetchError(e);
    }
    if ((await getState(deps.db, "wp_backfill_done")) !== "1") {
      try {
        out.newItems += await backfillOnce(deps, nowIso);
      } catch (e) {
        if (out.ok) out.errorCode = `backfill_${fetchError(e)}`;
      }
    }
    return out;
  });
}

/** Looks for an existing capture of each pending item, then saves a few new ones. */
export function runArchiveJob(deps: JobDeps): Promise<RunRow> {
  return runJob("archive", deps, async () => {
    const pending = await pendingArchive(deps.db, AVAILABILITY_CHECKS_PER_RUN);
    const nowIso = toManilaIso(deps.now());
    let saves = 0;
    let captured = 0;
    let errorCode: string | null = null;
    for (const { id, url } of pending) {
      try {
        let existing: string | null = null;
        const res = await deps.fetch(availabilityUrl(url));
        if (res.status === 429) {
          errorCode = "http_429";
          break;
        }
        if (res.ok) {
          try {
            existing = parseAvailability(await res.json());
          } catch {
            existing = null;
          }
        }
        if (existing) {
          await recordArchive(deps.db, id, {
            status: "ok",
            captureUrl: existing,
            nowIso,
          });
          captured++;
          continue;
        }
        if (saves >= ARCHIVE_SAVES_PER_RUN) continue;
        saves++;
        const saved = interpretSave(
          await deps.fetch(saveRequest(url, deps.iaKeys)),
        );
        if (saved.throttled) {
          errorCode = "http_429";
          break;
        }
        await recordArchive(deps.db, id, {
          status: saved.status,
          captureUrl: saved.captureUrl,
          nowIso,
        });
        if (saved.status === "ok") captured++;
      } catch {
        errorCode = "fetch_failed";
        break;
      }
    }
    const ok = pending.length === 0 || captured > 0;
    return {
      ok,
      itemsRead: pending.length,
      newItems: 0,
      archiveRequests: saves,
      errorCode: errorCode ?? (ok ? null : "archive_failed"),
    };
  });
}

/** Checks whether recent items are still live on the city site; two misses mark one removed. */
export function runRemovalJob(deps: JobDeps): Promise<RunRow> {
  return runJob("removal", deps, async () => {
    const now = deps.now();
    const nowIso = toManilaIso(now);
    const sinceIso = toManilaIso(
      new Date(now.getTime() - REMOVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000),
    );
    const afterId = Number((await getState(deps.db, "removal_cursor")) ?? "0");
    const items = await itemsForRemovalCheck(deps.db, {
      sinceIso,
      afterId,
      limit: REMOVAL_CHECKS_PER_RUN,
    });
    let errors = 0;
    for (const { id, url } of items) {
      let status: number;
      try {
        status = (await deps.fetch(url, { method: "HEAD", redirect: "manual" }))
          .status;
      } catch {
        errors++;
        continue;
      }
      if (status === 0 || (status >= 200 && status < 400)) {
        await recordPresence(deps.db, id, true, nowIso);
      } else if (status === 404 || status === 410) {
        await recordPresence(deps.db, id, false, nowIso);
      }
    }
    const last = items[items.length - 1];
    await setState(
      deps.db,
      "removal_cursor",
      items.length < REMOVAL_CHECKS_PER_RUN || !last ? "0" : String(last.id),
    );
    return {
      ok: items.length === 0 || errors < items.length,
      itemsRead: items.length,
      newItems: 0,
      archiveRequests: 0,
      errorCode:
        errors === items.length && items.length > 0 ? "fetch_failed" : null,
    };
  });
}
