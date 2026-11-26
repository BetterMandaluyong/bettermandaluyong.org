import { stringify } from "yaml";
import type { CityNotice } from "../../data/schema.ts";
import type { WpEntry } from "./parse.ts";
import { sortNotices } from "./query.ts";

/** One record (bids or jobs) in memory, keyed by WordPress id. The functions below change it in place. */
export type NoticeState<K extends string = string> = Map<number, CityNotice<K>>;

/** Comment at the top of every generated file. */
export const FILE_HEADER = {
  bids: "# City bid notices (links only). Written by scripts/notices_refresh.ts; see DEPLOYMENT.md.\n",
  jobs: "# City job posts (links only). Written by scripts/notices_refresh.ts; see DEPLOYMENT.md.\n",
} as const;

/**
 * Adds an entry, or brings a known one up to date with the city's current
 * title, link, date, and (when given) kind. Returns "added", "changed", or
 * null when nothing changed. `kind` may be omitted only for known entries.
 */
export function upsertNotice<K extends string>(
  state: NoticeState<K>,
  entry: WpEntry,
  kind: K | null,
  nowIso: string,
): "added" | "changed" | null {
  const known = state.get(entry.id);
  if (!known) {
    if (kind === null) return null;
    state.set(entry.id, {
      id: entry.id,
      url: entry.url,
      title: entry.title,
      kind,
      publishedAt: entry.publishedAt,
      firstSeenAt: nowIso,
      missingSince: null,
      removedAt: null,
    });
    return "added";
  }
  const next = {
    url: entry.url,
    title: entry.title,
    publishedAt: entry.publishedAt,
    kind: kind ?? known.kind,
  };
  const changed =
    known.url !== next.url ||
    known.title !== next.title ||
    known.publishedAt !== next.publishedAt ||
    known.kind !== next.kind;
  Object.assign(known, next);
  return changed ? "changed" : null;
}

/** What one presence check changed for an entry. */
export type PresenceChange = "missing" | "removed" | "restored" | null;

/**
 * Records whether an entry is still on the city site. Two misses in a row
 * mark it removed; being found again clears both marks.
 */
export function recordPresence(
  state: NoticeState,
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

/** One entry as the plain object written to YAML: snake_case, fixed key order, no empty keys. */
export function toYamlObject(item: CityNotice): Record<string, unknown> {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    kind: item.kind,
    published_at: item.publishedAt,
    first_seen_at: item.firstSeenAt,
    ...(item.missingSince ? { missing_since: item.missingSince } : {}),
    ...(item.removedAt ? { removed_at: item.removedAt } : {}),
  };
}

/** Splits a record into year files: `{ "2026": "<yaml>", ... }`. The same entries always give the same bytes. */
export function serializeByYear(
  state: NoticeState,
  header: string,
): Record<string, string> {
  const byYear = new Map<string, CityNotice[]>();
  for (const item of state.values()) {
    const year = item.publishedAt.slice(0, 4);
    byYear.set(year, [...(byYear.get(year) ?? []), item]);
  }
  return Object.fromEntries(
    [...byYear].map(([year, items]) => [
      year,
      header +
        stringify(sortNotices(items).map(toYamlObject), { lineWidth: 0 }),
    ]),
  );
}
