/** Idempotent D1-compatible statements that create the news tables and indexes. */
export const NEWS_SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS news_items (
    id INTEGER PRIMARY KEY,
    source TEXT NOT NULL,
    source_id TEXT NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    published_at TEXT NOT NULL,
    categories TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,
    removed_at TEXT,
    wayback_requested_at TEXT,
    wayback_status TEXT,
    wayback_url TEXT,
    missing_strikes INTEGER NOT NULL DEFAULT 0,
    UNIQUE(source, source_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items (published_at DESC)`,
  `CREATE TABLE IF NOT EXISTS feed_runs (
    id INTEGER PRIMARY KEY,
    job TEXT NOT NULL,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL,
    ok INTEGER NOT NULL,
    items_read INTEGER NOT NULL,
    new_items INTEGER NOT NULL,
    archive_requests INTEGER NOT NULL,
    error_code TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS job_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];
