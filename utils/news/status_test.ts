import { describe, expect, it } from "vitest";
import { lineStatus, STALE_AFTER_HOURS } from "./status.ts";
import type { RunRow } from "./store.ts";

const NOW = new Date("2026-10-27T12:00:00+08:00");

const run = (hoursAgo: number, ok: boolean): RunRow => ({
  job: "feed",
  startedAt: new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString(),
  finishedAt: new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString(),
  ok,
  itemsRead: 0,
  newItems: 0,
  archiveRequests: 0,
  errorCode: ok ? null : "boom",
});

describe("lineStatus", () => {
  it("uses a 7 hour staleness window", () => {
    expect(STALE_AFTER_HOURS).toBe(7);
  });

  it("is working after a single failure following a success", () => {
    const runs = [run(1, false), run(2, true)];
    expect(lineStatus(runs, NOW)).toEqual({
      state: "working",
      lastSuccessAt: runs[1].finishedAt,
    });
  });

  it("is not-working after two failures in a row", () => {
    const runs = [run(1, false), run(2, false), run(3, true)];
    expect(lineStatus(runs, NOW)).toEqual({
      state: "not-working",
      lastSuccessAt: runs[2].finishedAt,
    });
  });

  it("is not-checked with no runs", () => {
    expect(lineStatus([], NOW)).toEqual({
      state: "not-checked",
      lastSuccessAt: null,
    });
  });

  it("is not-checked when the newest run is 8 hours old", () => {
    const runs = [run(8, true)];
    expect(lineStatus(runs, NOW).state).toBe("not-checked");
  });

  it("lets stale win over two failures", () => {
    const runs = [run(8, false), run(9, false)];
    expect(lineStatus(runs, NOW)).toEqual({
      state: "not-checked",
      lastSuccessAt: null,
    });
  });

  it("is working with a single failed run and nothing else", () => {
    expect(lineStatus([run(1, false)], NOW).state).toBe("working");
  });

  it("picks the newest ok run as lastSuccessAt", () => {
    const runs = [run(1, true), run(2, true), run(3, false)];
    expect(lineStatus(runs, NOW).lastSuccessAt).toBe(runs[0].finishedAt);
  });

  describe("ignoreIdle", () => {
    const idle = (hoursAgo: number): RunRow => ({
      ...run(hoursAgo, true),
      itemsRead: 0,
    });
    const busy = (hoursAgo: number, ok: boolean): RunRow => ({
      ...run(hoursAgo, ok),
      itemsRead: 5,
    });

    it("idle ok runs between two failures do not reset the count", () => {
      const runs = [busy(1, false), idle(2), idle(3), busy(4, false)];
      expect(lineStatus(runs, NOW).state).toBe("working");
      expect(lineStatus(runs, NOW, { ignoreIdle: true }).state).toBe(
        "not-working",
      );
    });

    it("lastSuccessAt skips idle runs", () => {
      const runs = [idle(1), busy(2, false), busy(3, true)];
      expect(lineStatus(runs, NOW, { ignoreIdle: true }).lastSuccessAt).toBe(
        runs[2].finishedAt,
      );
    });

    it("staleness comes from the newest run of any kind", () => {
      const runs = [idle(8), busy(9, false), busy(10, false)];
      expect(lineStatus(runs, NOW, { ignoreIdle: true }).state).toBe(
        "not-checked",
      );
    });

    it("a fresh idle run keeps a stale failing line from going not-checked", () => {
      const runs = [idle(1), busy(9, false), busy(10, false)];
      expect(lineStatus(runs, NOW, { ignoreIdle: true }).state).toBe(
        "not-working",
      );
    });
  });
});
