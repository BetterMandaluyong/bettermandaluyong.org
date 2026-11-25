import { describe, expect, it } from "vitest";
import {
  ARCHIVE_CRON,
  FEED_CRON,
  REMOVAL_CRON,
  jobsForCron,
} from "./schedule.ts";

describe("jobsForCron", () => {
  it("maps both schedules and ignores others", () => {
    expect(jobsForCron(FEED_CRON)).toEqual(["feed"]);
    expect(jobsForCron(ARCHIVE_CRON)).toEqual(["archive"]);
    expect(jobsForCron(REMOVAL_CRON)).toEqual(["removal"]);
    expect(jobsForCron("* * * * *")).toEqual([]);
  });
});
