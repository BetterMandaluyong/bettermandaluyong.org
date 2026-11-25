import type { RunRow } from "./store.ts";

/** Whether the news line is healthy, broken, or has not reported lately. */
export type LineState = "working" | "not-working" | "not-checked";

/** Hours after which the newest run is too old to say anything. */
export const STALE_AFTER_HOURS = 7;

/**
 * Works out the state of a pipeline line from its recent runs.
 * `runs` must be newest first. A stale newest run always wins.
 */
export function lineStatus(
  runs: RunRow[],
  now: Date,
): { state: LineState; lastSuccessAt: string | null } {
  const lastSuccessAt = runs.find((r) => r.ok)?.finishedAt ?? null;
  const newest = runs[0];
  if (!newest) return { state: "not-checked", lastSuccessAt };

  const ageMs = now.getTime() - new Date(newest.finishedAt).getTime();
  if (Number.isNaN(ageMs) || ageMs > STALE_AFTER_HOURS * 3600_000) {
    return { state: "not-checked", lastSuccessAt };
  }
  const failing = runs.length >= 2 && !newest.ok && !runs[1].ok;
  return { state: failing ? "not-working" : "working", lastSuccessAt };
}
