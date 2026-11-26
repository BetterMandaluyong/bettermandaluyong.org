import type { NewsArchive, NewsItem } from "../../data/schema.ts";
import type { NewsState } from "./repo.ts";

/** One row of the old D1 `news_items` table, as `cf d1 execute --json` prints it. */
export type D1Row = {
  source_id: string;
  url: string;
  title: string;
  published_at: string;
  categories: string;
  first_seen_at: string;
  removed_at: string | null;
  missing_strikes: number | null;
  wayback_requested_at: string | null;
  wayback_status: string | null;
  wayback_url: string | null;
  wayback_attempts: number | null;
};

/**
 * Finds the rows in a D1 export. Accepts the bare array of rows and the API
 * shapes that wrap it: `[{ results }]`, `{ results }` and `{ result: [{ results }] }`.
 */
export function d1Rows(json: unknown): D1Row[] {
  const isRow = (v: unknown): boolean =>
    typeof v === "object" && v !== null && "source_id" in v;
  const rowsIn = (v: unknown): D1Row[] | null => {
    if (Array.isArray(v) && v.length > 0 && v.every(isRow)) return v as D1Row[];
    return null;
  };
  const candidates: unknown[] = [json];
  if (Array.isArray(json)) candidates.push(...json);
  else if (typeof json === "object" && json !== null) {
    const o = json as { results?: unknown; result?: unknown };
    candidates.push(o.results, o.result);
    if (Array.isArray(o.result)) candidates.push(...o.result);
  }
  for (const c of candidates) {
    const direct = rowsIn(c);
    if (direct) return direct;
    const inner = (c as { results?: unknown } | null)?.results;
    const nested = rowsIn(inner);
    if (nested) return nested;
  }
  throw new Error("not a D1 export: expected rows with source_id");
}

function categoriesOf(json: string): string[] {
  try {
    const v: unknown = JSON.parse(json);
    return Array.isArray(v)
      ? v.filter((c): c is string => typeof c === "string")
      : [];
  } catch {
    return [];
  }
}

function archiveOf(row: D1Row): NewsArchive | null {
  const attempts = row.wayback_attempts ?? 0;
  if (!row.wayback_requested_at && attempts === 0) return null;
  if (!row.wayback_status) return null;
  return {
    status: row.wayback_status,
    url: row.wayback_url,
    requestedAt: row.wayback_requested_at,
    attempts,
  };
}

/**
 * Merges the old D1 history into `state`. D1 wins for what only the live
 * pipeline knew: when a post was first seen, whether it was removed, and its
 * archive result. Posts only D1 has (no longer on WordPress) are added: they
 * are the takedowns this record exists for. Returns how many rows were used
 * and how many were skipped (an id that is not a WordPress post number).
 */
export function mergeD1Rows(
  state: NewsState,
  rows: D1Row[],
): { merged: number; added: number; skipped: number } {
  let merged = 0;
  let added = 0;
  let skipped = 0;
  for (const row of rows) {
    const id = Number(row.source_id);
    if (!Number.isInteger(id) || id < 1) {
      skipped++;
      continue;
    }
    let item: NewsItem | undefined = state.get(id);
    if (!item) {
      item = {
        id,
        url: row.url,
        title: row.title,
        publishedAt: row.published_at,
        categories: categoriesOf(row.categories),
        firstSeenAt: row.first_seen_at,
        archive: null,
        missingSince: null,
        removedAt: null,
      };
      state.set(id, item);
      added++;
    }
    item.firstSeenAt = row.first_seen_at;
    item.removedAt = row.removed_at;
    item.missingSince = null;
    item.archive = archiveOf(row);
    merged++;
  }
  return { merged, added, skipped };
}
