import type { BidKind, CityNotice, JobKind } from "../../data/schema.ts";
import { parseWpJson } from "../news/wp.ts";
import { toManilaIso } from "../news/text.ts";
import {
  linkKey,
  parseCategoryPage,
  parseWpEntries,
  type WpEntry,
} from "./parse.ts";
import {
  recordPresence,
  upsertNotice,
  type NoticeState,
  type PresenceChange,
} from "./repo.ts";
import {
  BID_CATEGORIES,
  VACANCY_CATEGORY,
  categoryPageUrl,
  documentsUrl,
  pesoJobsUrl,
} from "./sources.ts";

/** Time limit for one request. */
export const FETCH_TIMEOUT_MS = 30_000;
/** Pause between requests, so the city site is not hammered. */
export const REQUEST_DELAY_MS = 250;
/** Archive pages per category a normal run reads; a backfill reads them all. */
export const PAGES_PER_RUN = 2;
/** Most API pages a listing may have, a guard against a runaway loop. */
export const MAX_API_PAGES = 50;
/**
 * A complete listing that holds fewer than this share of the entries we know
 * are live is treated as a city-side fault: the presence check is skipped.
 */
export const MIN_PRESENT_SHARE = 0.5;

/** What the run needs; injected so it runs against fakes in tests. */
export type NoticeDeps = {
  fetch: typeof fetch;
  now: () => Date;
  sleep: (ms: number) => Promise<void>;
};

/** The bids and jobs records the run updates in place. */
export type NoticeRecords = {
  bids: NoticeState<BidKind>;
  jobs: NoticeState<JobKind>;
};

/** Entries that changed, for the commit message. */
export type Changes = {
  added: CityNotice[];
  missing: CityNotice[];
  removed: CityNotice[];
  restored: CityNotice[];
};

/** What one run did, per record, plus anything that went wrong. */
export type NoticeReport = {
  bids: Changes;
  jobs: Changes;
  /** Category-page links the document list doesn't have (not recorded). */
  unmatched: string[];
  /** Problems, e.g. "documents: http_503". Empty when all went well. */
  problems: string[];
  /** False when the document list could not be read at all. */
  ok: boolean;
};

const emptyChanges = (): Changes => ({
  added: [],
  missing: [],
  removed: [],
  restored: [],
});

/** Fetches a URL; returns the response, or throws "http_<code>" or "fetch_failed". */
async function get(deps: NoticeDeps, url: string): Promise<Response> {
  let res: Response;
  try {
    res = await deps.fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new Error("fetch_failed");
  }
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res;
}

const errorCode = (e: unknown): string =>
  e instanceof Error ? e.message : "fetch_failed";

/**
 * Reads every page of a WordPress API listing. `complete` is true only when
 * every page the API announced (X-WP-TotalPages) was read.
 */
async function readListing(
  deps: NoticeDeps,
  urlFor: (page: number) => string,
): Promise<{ entries: WpEntry[]; complete: boolean; error: string | null }> {
  const entries: WpEntry[] = [];
  let total = 1;
  for (let page = 1; page <= total && page <= MAX_API_PAGES; page++) {
    if (page > 1) await deps.sleep(REQUEST_DELAY_MS);
    try {
      const res = await get(deps, urlFor(page));
      if (page === 1) {
        const announced = Number(res.headers.get("x-wp-totalpages"));
        total = Number.isInteger(announced) && announced >= 1 ? announced : 1;
      }
      entries.push(...parseWpEntries(parseWpJson(await res.text())));
    } catch (e) {
      return { entries, complete: false, error: errorCode(e) };
    }
  }
  return { entries, complete: total <= MAX_API_PAGES, error: null };
}

/** Reads a category's archive pages (all of them, or the first `maxPages`) and returns the document links. */
async function readCategory(
  deps: NoticeDeps,
  slug: string,
  maxPages: number,
): Promise<{ urls: string[]; error: string | null }> {
  const urls: string[] = [];
  let last = 1;
  for (let page = 1; page <= Math.min(last, maxPages); page++) {
    await deps.sleep(REQUEST_DELAY_MS);
    try {
      const html = await (await get(deps, categoryPageUrl(slug, page))).text();
      const parsed = parseCategoryPage(html, slug);
      if (page === 1) last = parsed.lastPage;
      urls.push(...parsed.urls);
    } catch (e) {
      return { urls, error: errorCode(e) };
    }
  }
  return { urls, error: null };
}

/**
 * The kind for each document link, from the categories it was seen in: the
 * first specific category in `BID_CATEGORIES` order wins over "other".
 */
export function kindsByLink(
  seen: { slug: string; urls: string[] }[],
): Map<string, BidKind> {
  const order = new Map(BID_CATEGORIES.map((c, i) => [c.slug, i]));
  const best = new Map<string, number>();
  for (const { slug, urls } of seen) {
    const rank = order.get(slug);
    if (rank === undefined) continue;
    for (const url of urls) {
      const current = best.get(url);
      if (current === undefined || rank < current) best.set(url, rank);
    }
  }
  return new Map(
    [...best].map(([url, rank]) => [url, BID_CATEGORIES[rank]!.kind]),
  );
}

function track(
  changes: Changes,
  item: CityNotice | undefined,
  c: PresenceChange,
) {
  if (!item || c === null) return;
  changes[c].push(item);
}

/**
 * Marks entries present or missing from a complete listing. Skipped (and
 * reported) when the listing holds fewer than `MIN_PRESENT_SHARE` of the
 * entries we know are live, which points to a fault on the city side.
 */
function checkPresence(
  state: NoticeState,
  ids: Iterable<number>,
  live: Set<number>,
  nowIso: string,
  changes: Changes,
  label: string,
  problems: string[],
): void {
  const known = [...ids];
  const wasLive = known.filter((id) => state.get(id)?.removedAt === null);
  const stillLive = wasLive.filter((id) => live.has(id)).length;
  if (wasLive.length > 0 && stillLive < wasLive.length * MIN_PRESENT_SHARE) {
    problems.push(
      `${label}: only ${stillLive} of ${wasLive.length} known entries listed; presence check skipped`,
    );
    return;
  }
  for (const id of known) {
    track(
      changes,
      state.get(id),
      recordPresence(state, id, live.has(id), nowIso),
    );
  }
}

/**
 * One refresh of both records from the city site:
 *
 * 1. Lists every Download Manager document (id, title, date, link).
 * 2. Reads the bid and vacancy category pages to learn which documents are
 *    bids (and of what kind) or bulletins of vacancies. A normal run reads
 *    the first `PAGES_PER_RUN` pages of each; `backfill` reads them all.
 * 3. Lists every PESO job post.
 * 4. Refreshes known entries from the listings and adds new ones.
 * 5. Marks entries missing from a complete listing (two misses = removed).
 *
 * Never deletes entries. `ok` is false only when the document list failed.
 */
export async function runNoticesJob(
  records: NoticeRecords,
  deps: NoticeDeps,
  { backfill }: { backfill: boolean },
): Promise<NoticeReport> {
  const nowIso = toManilaIso(deps.now());
  const report: NoticeReport = {
    bids: emptyChanges(),
    jobs: emptyChanges(),
    unmatched: [],
    problems: [],
    ok: true,
  };
  const maxPages = backfill ? Infinity : PAGES_PER_RUN;

  const docs = await readListing(deps, documentsUrl);
  if (docs.error) report.problems.push(`documents: ${docs.error}`);
  if (docs.entries.length === 0) {
    report.ok = false;
    return report;
  }
  const docsByLink = new Map(docs.entries.map((e) => [linkKey(e.url), e]));

  const seen: { slug: string; urls: string[] }[] = [];
  for (const { slug } of BID_CATEGORIES) {
    const r = await readCategory(deps, slug, maxPages);
    if (r.error) report.problems.push(`category ${slug}: ${r.error}`);
    seen.push({ slug, urls: r.urls });
  }
  const vacancies = await readCategory(deps, VACANCY_CATEGORY, maxPages);
  if (vacancies.error) {
    report.problems.push(`category ${VACANCY_CATEGORY}: ${vacancies.error}`);
  }

  const add = <K extends string>(
    state: NoticeState<K>,
    entry: WpEntry,
    kind: K | null,
    changes: Changes,
  ) => {
    if (upsertNotice(state, entry, kind, nowIso) === "added") {
      changes.added.push(state.get(entry.id)!);
    }
  };

  // New and re-categorized entries, from the category pages.
  const unmatched = new Set<string>();
  for (const [link, kind] of kindsByLink(seen)) {
    const entry = docsByLink.get(link);
    if (!entry) {
      unmatched.add(link);
      continue;
    }
    // "other" comes from the section's parent category; it never replaces a
    // specific kind already known (that category's page may have failed).
    const known = records.bids.get(entry.id);
    add(
      records.bids,
      entry,
      kind === "other" && known ? null : kind,
      report.bids,
    );
  }
  for (const link of new Set(vacancies.urls)) {
    const entry = docsByLink.get(link);
    if (entry) add(records.jobs, entry, "vacancy", report.jobs);
    else unmatched.add(link);
  }
  report.unmatched = [...unmatched].sort();

  // Known documents keep up with the city's title, link, and date.
  const docIds = new Set(docs.entries.map((e) => e.id));
  for (const e of docs.entries) {
    if (records.bids.has(e.id)) upsertNotice(records.bids, e, null, nowIso);
    if (records.jobs.get(e.id)?.kind === "vacancy") {
      upsertNotice(records.jobs, e, null, nowIso);
    }
  }

  const peso = await readListing(deps, pesoJobsUrl);
  if (peso.error) report.problems.push(`PESO jobs: ${peso.error}`);
  for (const e of peso.entries) add(records.jobs, e, "peso", report.jobs);

  if (docs.complete) {
    checkPresence(
      records.bids,
      records.bids.keys(),
      docIds,
      nowIso,
      report.bids,
      "bids",
      report.problems,
    );
    const vacancyIds = [...records.jobs.values()]
      .filter((j) => j.kind === "vacancy")
      .map((j) => j.id);
    checkPresence(
      records.jobs,
      vacancyIds,
      docIds,
      nowIso,
      report.jobs,
      "vacancies",
      report.problems,
    );
  }
  if (peso.complete) {
    const pesoIds = [...records.jobs.values()]
      .filter((j) => j.kind === "peso")
      .map((j) => j.id);
    checkPresence(
      records.jobs,
      pesoIds,
      new Set(peso.entries.map((e) => e.id)),
      nowIso,
      report.jobs,
      "PESO jobs",
      report.problems,
    );
  }
  return report;
}
