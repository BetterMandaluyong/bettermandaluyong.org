import type { RunRow } from "./store.ts";

/** Whether the news line is healthy, broken, or has not reported lately. */
export type LineState = "working" | "not-working" | "not-checked";

/** Hours after which the newest run is too old to say anything. */
export const STALE_AFTER_HOURS = 7;

/**
 * Works out the state of a pipeline line from its recent runs.
 * `runs` must be newest first. A stale newest run always wins. With
 * `ignoreIdle`, runs that read nothing (`itemsRead === 0`) say nothing about
 * whether the work succeeds, so they are skipped when counting failures and
 * finding the last success; staleness still uses the newest run of any kind.
 */
export function lineStatus(
  runs: RunRow[],
  now: Date,
  opts: { ignoreIdle?: boolean } = {},
): { state: LineState; lastSuccessAt: string | null } {
  const counted = opts.ignoreIdle ? runs.filter((r) => r.itemsRead > 0) : runs;
  const lastSuccessAt = counted.find((r) => r.ok)?.finishedAt ?? null;
  const newest = runs[0];
  if (!newest) return { state: "not-checked", lastSuccessAt };

  const ageMs = now.getTime() - new Date(newest.finishedAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > STALE_AFTER_HOURS * 3600_000) {
    return { state: "not-checked", lastSuccessAt };
  }
  const [a, b] = counted;
  const failing = a !== undefined && b !== undefined && !a.ok && !b.ok;
  return { state: failing ? "not-working" : "working", lastSuccessAt };
}
