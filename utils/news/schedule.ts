import type { JobName } from "./types.ts";

/** Cron for the feed job: every 3 hours at minute 7. */
export const FEED_CRON = "7 */3 * * *";
/** Cron for the archive job: every 3 hours at minute 37. */
export const ARCHIVE_CRON = "37 */3 * * *";
/** Cron for the removal check: daily at 02:37 UTC. */
export const REMOVAL_CRON = "37 2 * * *";

/** Maps a Worker cron expression to the jobs it runs; unknown crons run nothing. */
export function jobsForCron(cron: string): JobName[] {
  if (cron === FEED_CRON) return ["feed"];
  if (cron === ARCHIVE_CRON) return ["archive"];
  if (cron === REMOVAL_CRON) return ["removal"];
  return [];
}
