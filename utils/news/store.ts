import { NEWS_SCHEMA } from "./schema.ts";
import type { FeedItem, JobName, SqlDb } from "./types.ts";

/** A stored news item as the pages see it. */
export type NewsRow = {
  id: number;
  url: string;
  title: string;
  publishedAt: string;
  categories: string[];
  removedAt: string | null;
  waybackStatus: string | null;
  waybackUrl: string | null;
};

/** One recorded run of a pipeline job. */
export type RunRow = {
  job: JobName;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  itemsRead: number;
  newItems: number;
  archiveRequests: number;
  errorCode: string | null;
};

type RawNews = {
  id: number;
  url: string;
  title: string;
  published_at: string;
  categories: string;
  removed_at: string | null;
  wayback_status: string | null;
  wayback_url: string | null;
};

const NEWS_COLUMNS =
  "id, url, title, published_at, categories, removed_at, wayback_status, wayback_url";

const parseCategories = (json: string): string[] => {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
};

const toNewsRow = (r: RawNews): NewsRow => ({
  id: r.id,
  url: r.url,
  title: r.title,
  publishedAt: r.published_at,
  categories: parseCategories(r.categories),
  removedAt: r.removed_at,
  waybackStatus: r.wayback_status,
  waybackUrl: r.wayback_url,
});

/** Creates the news tables and indexes if they do not exist yet. */
export async function ensureSchema(db: SqlDb): Promise<void> {
  await db.batch(NEWS_SCHEMA.map((sql) => db.prepare(sql)));
}

const countItems = async (db: SqlDb): Promise<number> =>
  (
    await db
      .prepare("SELECT COUNT(*) AS n FROM news_items")
      .first<{ n: number }>()
  )?.n ?? 0;

const UPSERT_ROWS = 14;

/** Inserts new items and refreshes title, url and categories of known ones. */
export async function upsertItems(
  db: SqlDb,
  items: FeedItem[],
  nowIso: string,
): Promise<{ newCount: number }> {
  if (items.length === 0) return { newCount: 0 };
  const before = await countItems(db);
  // D1 allows 100 bound values per statement and 50 queries per invocation:
  // 14 rows x 7 values per statement keeps both limits.
  const statements = [];
  for (let start = 0; start < items.length; start += UPSERT_ROWS) {
    const chunk = items.slice(start, start + UPSERT_ROWS);
    const rows = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
    statements.push(
      db
        .prepare(
          `INSERT INTO news_items (source, source_id, url, title, published_at, categories, first_seen_at)
           VALUES ${rows}
           ON CONFLICT(source, source_id) DO UPDATE SET
             title = excluded.title, url = excluded.url, categories = excluded.categories`,
        )
        .bind(
          ...chunk.flatMap((i) => [
            i.source,
            i.sourceId,
            i.url,
            i.title,
            i.publishedAt,
            JSON.stringify(i.categories),
            nowIso,
          ]),
        ),
    );
  }
  await db.batch(statements);
  return { newCount: (await countItems(db)) - before };
}

const CATEGORY_FILTER =
  "EXISTS (SELECT 1 FROM json_each(categories) WHERE value = ?)";

/** Returns one page of news, newest first, optionally limited to an exact category. */
export async function listNews(
  db: SqlDb,
  opts: { page: number; perPage: number; category: string | null },
): Promise<{ items: NewsRow[]; total: number }> {
  const where = opts.category === null ? "" : `WHERE ${CATEGORY_FILTER}`;
  const filter = opts.category === null ? [] : [opts.category];
  const totalRow = await db
    .prepare(`SELECT COUNT(*) AS n FROM news_items ${where}`)
    .bind(...filter)
    .first<{ n: number }>();
  const { results } = await db
    .prepare(
      `SELECT ${NEWS_COLUMNS} FROM news_items ${where}
       ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...filter, opts.perPage, (opts.page - 1) * opts.perPage)
    .all<RawNews>();
  return { items: results.map(toNewsRow), total: totalRow?.n ?? 0 };
}

/** Returns the n most recently published items. */
export async function latestNews(db: SqlDb, n: number): Promise<NewsRow[]> {
  const { results } = await db
    .prepare(
      `SELECT ${NEWS_COLUMNS} FROM news_items
       ORDER BY published_at DESC, id DESC LIMIT ?`,
    )
    .bind(n)
    .all<RawNews>();
  return results.map(toNewsRow);
}

/** Returns every category in use, sorted and de-duplicated. */
export async function listCategories(db: SqlDb): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT j.value AS name FROM news_items, json_each(news_items.categories) AS j
       ORDER BY name`,
    )
    .all<{ name: string }>();
  return results.map((r) => r.name);
}

/** Returns items not yet sent to the web archive, oldest published first. */
export async function pendingArchive(
  db: SqlDb,
  limit: number,
): Promise<{ id: number; url: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT id, url FROM news_items WHERE wayback_requested_at IS NULL
       ORDER BY published_at ASC, id ASC LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: number; url: string }>();
  return results;
}

/** Records the outcome of an archive request for one item. */
export async function recordArchive(
  db: SqlDb,
  id: number,
  r: { status: string; captureUrl: string | null; nowIso: string },
): Promise<void> {
  await db
    .prepare(
      `UPDATE news_items SET wayback_requested_at = ?, wayback_status = ?, wayback_url = ?
       WHERE id = ?`,
    )
    .bind(r.nowIso, r.status, r.captureUrl, id)
    .run();
}

/** Returns recent items past a cursor id, for the removal check. */
export async function itemsForRemovalCheck(
  db: SqlDb,
  opts: { sinceIso: string; afterId: number; limit: number },
): Promise<{ id: number; url: string }[]> {
  const { results } = await db
    .prepare(
      `SELECT id, url FROM news_items WHERE published_at >= ? AND id > ?
       ORDER BY id ASC LIMIT ?`,
    )
    .bind(opts.sinceIso, opts.afterId, opts.limit)
    .all<{ id: number; url: string }>();
  return results;
}

/** Records whether an item's page was still live; two misses in a row mark it removed. */
export async function recordPresence(
  db: SqlDb,
  id: number,
  present: boolean,
  nowIso: string,
): Promise<void> {
  const sql = present
    ? "UPDATE news_items SET missing_strikes = 0, removed_at = NULL WHERE id = ?"
    : `UPDATE news_items SET
         missing_strikes = missing_strikes + 1,
         removed_at = CASE
           WHEN removed_at IS NOT NULL THEN removed_at
           WHEN missing_strikes + 1 >= 2 THEN ?
           ELSE NULL
         END
       WHERE id = ?`;
  const stmt = db.prepare(sql);
  await (present ? stmt.bind(id) : stmt.bind(nowIso, id)).run();
}

/** Reads a job_state value, or null when unset. */
export async function getState(db: SqlDb, key: string): Promise<string | null> {
  const row = await db
    .prepare("SELECT value FROM job_state WHERE key = ?")
    .bind(key)
    .first<{ value: string }>();
  return row?.value ?? null;
}

/** Writes a job_state value, replacing any existing one. */
export async function setState(
  db: SqlDb,
  key: string,
  value: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO job_state (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .bind(key, value)
    .run();
}

/** Appends one job run to the run log. */
export async function recordRun(db: SqlDb, run: RunRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO feed_runs (job, started_at, finished_at, ok, items_read, new_items, archive_requests, error_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      run.job,
      run.startedAt,
      run.finishedAt,
      run.ok ? 1 : 0,
      run.itemsRead,
      run.newItems,
      run.archiveRequests,
      run.errorCode,
    )
    .run();
}

/** Returns the last n runs of a job, newest first. */
export async function recentRuns(
  db: SqlDb,
  job: JobName,
  n: number,
): Promise<RunRow[]> {
  const { results } = await db
    .prepare(
      `SELECT job, started_at, finished_at, ok, items_read, new_items, archive_requests, error_code
       FROM feed_runs WHERE job = ? ORDER BY started_at DESC, id DESC LIMIT ?`,
    )
    .bind(job, n)
    .all<{
      job: JobName;
      started_at: string;
      finished_at: string;
      ok: number;
      items_read: number;
      new_items: number;
      archive_requests: number;
      error_code: string | null;
    }>();
  return results.map((r) => ({
    job: r.job,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    ok: r.ok === 1,
    itemsRead: r.items_read,
    newItems: r.new_items,
    archiveRequests: r.archive_requests,
    errorCode: r.error_code,
  }));
}

/** Runs a read and returns the fallback when the news tables do not exist yet; other errors rethrow. */
export async function safeRead<T>(
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof Error && error.message.includes("no such table")) {
      return fallback;
    }
    throw error;
  }
}
