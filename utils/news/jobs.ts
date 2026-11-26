import type { NewsItem } from "../../data/schema.ts";
import { parseCityFeed } from "./rss.ts";
import {
  mergeFeedItems,
  pendingArchive,
  recordArchive,
  recordArchiveAttempt,
  recordPresence,
  removalCandidates,
  type NewsState,
} from "./repo.ts";
import { decodeEntities, toManilaIso } from "./text.ts";
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
  wpRecentUrl,
} from "./wp.ts";

/** The city's RSS feed. */
export const FEED_URL = "https://mandaluyong.gov.ph/feed/";
/** Most Save Page Now requests one archive run makes. */
export const ARCHIVE_SAVES_PER_RUN = 8;
/** Most pending posts (and availability checks) one archive run reads. */
export const AVAILABILITY_CHECKS_PER_RUN = 40;
/** Transient Save Page Now failures a post may have before it is given up on. */
export const ARCHIVE_MAX_ATTEMPTS = 3;
/** Time limit for the RSS, WordPress, availability and HEAD requests. */
export const FETCH_TIMEOUT_MS = 15_000;
/** Time limit for one Save Page Now request, which waits for the capture. */
export const SAVE_TIMEOUT_MS = 90_000;
/** How far back the removal check looks, in days. */
export const REMOVAL_WINDOW_DAYS = 365;
/** Pause between live checks, so the city site is not hammered. */
export const REMOVAL_DELAY_MS = 250;

/** What every job needs; injected so jobs run against fakes in tests. */
export type JobDeps = {
  fetch: typeof fetch;
  now: () => Date;
  iaKeys: IaKeys | null;
  sleep: (ms: number) => Promise<void>;
};

/** Whether a job did its work, and why not when it did not. */
export type JobStatus = { ok: boolean; errorCode: string | null };

const fetchError = (e: unknown): string =>
  e instanceof Error && e.message.startsWith("http_")
    ? e.message
    : "fetch_failed";

/** Fetches a URL and returns its body text; throws "http_<code>" or "fetch_failed". */
async function getText(deps: JobDeps, url: string): Promise<string> {
  let res: Response;
  try {
    res = await deps.fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    throw new Error("fetch_failed");
  }
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.text();
}

/** Posts from the WordPress API's newest page; throws on any failure. */
async function recentWpPosts(deps: JobDeps) {
  const categories = new Map<number, string>();
  const cats = parseWpJson(await getText(deps, wpCategoriesUrl()));
  for (const c of Array.isArray(cats) ? cats : []) {
    const { id, name } = (c ?? {}) as { id?: unknown; name?: unknown };
    if (typeof id === "number" && typeof name === "string") {
      categories.set(id, decodeEntities(name));
    }
  }
  return parseWpPosts(
    parseWpJson(await getText(deps, wpRecentUrl())),
    categories,
  );
}

/** What the feed job found. */
export type FeedResult = JobStatus & { itemsRead: number; added: NewsItem[] };

/**
 * Reads the RSS feed (and refreshes known posts from it), then catches up on
 * any recent post the feed has already dropped, using the WordPress API.
 * Never deletes posts. `ok` means the RSS feed was read.
 */
export async function runFeedJob(
  state: NewsState,
  deps: JobDeps,
): Promise<FeedResult> {
  const nowIso = toManilaIso(deps.now());
  const out: FeedResult = {
    ok: false,
    errorCode: null,
    itemsRead: 0,
    added: [],
  };
  try {
    const items = parseCityFeed(await getText(deps, FEED_URL));
    out.itemsRead = items.length;
    if (items.length === 0) {
      out.errorCode = "parse_empty";
    } else {
      out.added.push(
        ...mergeFeedItems(state, items, nowIso, { updateExisting: true }),
      );
      out.ok = true;
    }
  } catch (e) {
    out.errorCode = fetchError(e);
  }
  try {
    out.added.push(
      ...mergeFeedItems(state, await recentWpPosts(deps), nowIso, {
        updateExisting: false,
      }),
    );
  } catch (e) {
    if (out.ok) out.errorCode = `catchup_${fetchError(e)}`;
  }
  return out;
}

/** What the archive job did. */
export type ArchiveResult = JobStatus & {
  /** Posts that now have a capture or a save request accepted by Save Page Now. */
  archived: NewsItem[];
  /** Posts whose archiving ended without a capture. */
  gaveUp: NewsItem[];
  saveRequests: number;
};

/** Looks for an existing capture of each pending post, then saves a few new ones. */
export async function runArchiveJob(
  state: NewsState,
  deps: JobDeps,
): Promise<ArchiveResult> {
  const pending = pendingArchive(state, AVAILABILITY_CHECKS_PER_RUN);
  const nowIso = toManilaIso(deps.now());
  const archived: NewsItem[] = [];
  const gaveUp: NewsItem[] = [];
  let saves = 0;
  let savedOk = 0;
  let transientStreak = 0;
  let errorCode: string | null = null;
  for (const { id, url } of pending) {
    try {
      let existing: string | null = null;
      const res = await deps.fetch(availabilityUrl(url), {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
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
        recordArchive(state, id, {
          status: "ok",
          captureUrl: existing,
          nowIso,
        });
        archived.push(state.get(id)!);
        continue;
      }
      if (saves >= ARCHIVE_SAVES_PER_RUN) continue;
      saves++;
      const saved = interpretSave(
        await deps.fetch(saveRequest(url, deps.iaKeys), {
          signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
        }),
      );
      if (saved.throttled) {
        errorCode = "http_429";
        break;
      }
      // 4xx other than 400/404/410 (403, 408, 425, ...) and 5xx are transient.
      const code = Number(/^http (\d+)$/.exec(saved.status)?.[1] ?? 0);
      const transient =
        saved.status !== "ok" &&
        (code >= 500 || (code >= 400 && ![400, 404, 410].includes(code)));
      if (transient) {
        const { terminal } = recordArchiveAttempt(state, id, {
          status: saved.status,
          nowIso,
          maxAttempts: ARCHIVE_MAX_ATTEMPTS,
        });
        if (terminal) gaveUp.push(state.get(id)!);
        transientStreak++;
        if (transientStreak >= 2) {
          // Two in a row: Save Page Now is probably down. Try again next run.
          errorCode = `http_${code}`;
          break;
        }
        continue;
      }
      transientStreak = 0;
      recordArchive(state, id, {
        status: saved.status,
        captureUrl: saved.captureUrl,
        nowIso,
      });
      if (saved.status === "ok") {
        savedOk++;
        archived.push(state.get(id)!);
      } else {
        gaveUp.push(state.get(id)!);
      }
    } catch {
      errorCode = "fetch_failed";
      break;
    }
  }
  // An availability hit proves nothing about Save Page Now, so only saves count.
  const ok = errorCode === null && (saves === 0 || savedOk > 0);
  return {
    ok,
    errorCode: errorCode ?? (ok ? null : "archive_failed"),
    archived,
    gaveUp,
    saveRequests: saves,
  };
}

/** What the removal check found. */
export type RemovalResult = JobStatus & {
  checked: number;
  missing: NewsItem[];
  removed: NewsItem[];
  restored: NewsItem[];
};

/** Checks whether the last year's posts are still live on the city site; two misses mark one removed. */
export async function runRemovalJob(
  state: NewsState,
  deps: JobDeps,
): Promise<RemovalResult> {
  const now = deps.now();
  const nowIso = toManilaIso(now);
  const sinceIso = toManilaIso(
    new Date(now.getTime() - REMOVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000),
  );
  const items = removalCandidates(state, sinceIso);
  const out: RemovalResult = {
    ok: true,
    errorCode: null,
    checked: 0,
    missing: [],
    removed: [],
    restored: [],
  };
  let errors = 0;
  for (const { id, url } of items) {
    let status: number;
    try {
      status = (
        await deps.fetch(url, {
          method: "HEAD",
          redirect: "manual",
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        })
      ).status;
    } catch {
      errors++;
      continue;
    }
    out.checked++;
    let change: ReturnType<typeof recordPresence> = null;
    if (status === 0 || (status >= 200 && status < 400)) {
      change = recordPresence(state, id, true, nowIso);
    } else if (status === 404 || status === 410) {
      change = recordPresence(state, id, false, nowIso);
    }
    const item = state.get(id)!;
    if (change === "missing") out.missing.push(item);
    else if (change === "removed") out.removed.push(item);
    else if (change === "restored") out.restored.push(item);
    await deps.sleep(REMOVAL_DELAY_MS);
  }
  if (errors === items.length && items.length > 0) {
    out.ok = false;
    out.errorCode = "fetch_failed";
  }
  return out;
}
