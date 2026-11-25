import { readFileSync } from "node:fs";
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

describe("cloudflare.config.ts", () => {
  it("writes out the same cron strings as schedule.ts", () => {
    const config = readFileSync(
      new URL("../../cloudflare.config.ts", import.meta.url),
      "utf8",
    );
    expect(config).toContain(`const FEED_CRON = "${FEED_CRON}";`);
    expect(config).toContain(`const ARCHIVE_CRON = "${ARCHIVE_CRON}";`);
    expect(config).toContain(`const REMOVAL_CRON = "${REMOVAL_CRON}";`);
  });
});
