import { stringify } from "yaml";
import type { NewsItem } from "../../data/schema.ts";
import { sortNews } from "./query.ts";
import type { FeedItem } from "./types.ts";

/** The news record in memory, keyed by WordPress post id. The functions below change it in place. */
export type NewsState = Map<number, NewsItem>;

/** Comment at the top of every generated `data/news/YYYY-MM.yaml`. */
export const FILE_HEADER =
  "# City news links. Written by scripts/news_refresh.ts; see DEPLOYMENT.md.\n";

/** The `YYYY-MM` file an item belongs in: its Manila publication month. */
export function monthOf(item: Pick<NewsItem, "publishedAt">): string {
  return item.publishedAt.slice(0, 7);
}

/** Turns a parsed post into a new record, or null when its id is not a WordPress post number. */
export function newsItemFromFeed(
  feed: FeedItem,
  nowIso: string,
): NewsItem | null {
  const id = Number(feed.sourceId);
  if (!Number.isInteger(id) || id < 1) return null;
  return {
    id,
    url: feed.url,
    title: feed.title,
    publishedAt: feed.publishedAt,
    categories: feed.categories,
    firstSeenAt: nowIso,
    archive: null,
    missingSince: null,
    removedAt: null,
  };
}

/**
 * Adds posts not yet known and returns them. With `updateExisting`, known
 * posts also take the feed's current title, link and categories.
 */
export function mergeFeedItems(
  state: NewsState,
  feed: FeedItem[],
  nowIso: string,
  { updateExisting }: { updateExisting: boolean },
): NewsItem[] {
  const added: NewsItem[] = [];
  for (const f of feed) {
    const fresh = newsItemFromFeed(f, nowIso);
    if (!fresh) continue;
    const known = state.get(fresh.id);
    if (!known) {
      state.set(fresh.id, fresh);
      added.push(fresh);
    } else if (updateExisting) {
      known.title = fresh.title;
      known.url = fresh.url;
      known.categories = fresh.categories;
    }
  }
  return added;
}

/** Posts still waiting for an archive result, newest published first. */
export function pendingArchive(state: NewsState, limit: number): NewsItem[] {
  return sortNews(state.values())
    .filter((i) => i.archive === null || i.archive.requestedAt === null)
    .slice(0, limit);
}

/** Records a final archive result for one post. */
export function recordArchive(
  state: NewsState,
  id: number,
  r: { status: string; captureUrl: string | null; nowIso: string },
): void {
  const item = state.get(id);
  if (!item) return;
  item.archive = {
    status: r.status,
    url: r.captureUrl,
    requestedAt: r.nowIso,
    attempts: item.archive?.attempts ?? 0,
  };
}

/**
 * Records a transient archive failure. The post stays queued until it has
 * failed `maxAttempts` times; then the last status is kept for good.
 */
export function recordArchiveAttempt(
  state: NewsState,
  id: number,
  r: { status: string; nowIso: string; maxAttempts: number },
): { terminal: boolean } {
  const item = state.get(id);
  if (!item) return { terminal: false };
  const attempts = (item.archive?.attempts ?? 0) + 1;
  const terminal = attempts >= r.maxAttempts;
  item.archive = {
    status: r.status,
    url: null,
    requestedAt: terminal ? r.nowIso : null,
    attempts,
  };
  return { terminal };
}

/** Posts published since `sinceIso`, for the "is it still live?" check. */
export function removalCandidates(
  state: NewsState,
  sinceIso: string,
): NewsItem[] {
  return [...state.values()]
    .filter((i) => i.publishedAt >= sinceIso)
    .sort((a, b) => a.id - b.id);
}

/** What a live check changed for one post. */
export type PresenceChange = "missing" | "removed" | "restored" | null;

/**
 * Records one live check. Two misses in a row mark a post removed; a hit
 * clears both marks. Returns what changed, or null when nothing did.
 */
export function recordPresence(
  state: NewsState,
  id: number,
  present: boolean,
  nowIso: string,
): PresenceChange {
  const item = state.get(id);
  if (!item) return null;
  if (present) {
    if (item.missingSince === null && item.removedAt === null) return null;
    const wasRemoved = item.removedAt !== null;
    item.missingSince = null;
    item.removedAt = null;
    return wasRemoved ? "restored" : null;
  }
  if (item.removedAt !== null) return null;
  if (item.missingSince === null) {
    item.missingSince = nowIso;
    return "missing";
  }
  item.removedAt = nowIso;
  return "removed";
}

/** One post as the plain object written to YAML: snake_case, fixed key order, no empty keys. */
export function toYamlObject(item: NewsItem): Record<string, unknown> {
  const a = item.archive;
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    published_at: item.publishedAt,
    categories: item.categories,
    first_seen_at: item.firstSeenAt,
    ...(a
      ? {
          archive: {
            status: a.status,
            ...(a.url ? { url: a.url } : {}),
            ...(a.requestedAt ? { requested_at: a.requestedAt } : {}),
            attempts: a.attempts,
          },
        }
      : {}),
    ...(item.missingSince ? { missing_since: item.missingSince } : {}),
    ...(item.removedAt ? { removed_at: item.removedAt } : {}),
  };
}

/** The text of one month's file. The same posts always give the same bytes. */
export function serializeMonth(items: NewsItem[]): string {
  return (
    FILE_HEADER + stringify(sortNews(items).map(toYamlObject), { lineWidth: 0 })
  );
}

/** Splits all posts into month files: `{ "2026-11": "<yaml>", ... }`. */
export function serializeAll(state: NewsState): Record<string, string> {
  const byMonth = new Map<string, NewsItem[]>();
  for (const item of state.values()) {
    const month = monthOf(item);
    byMonth.set(month, [...(byMonth.get(month) ?? []), item]);
  }
  return Object.fromEntries(
    [...byMonth].map(([month, items]) => [month, serializeMonth(items)]),
  );
}
