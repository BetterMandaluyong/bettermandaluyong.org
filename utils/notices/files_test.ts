import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadNoticeRecords, writeNoticeRecords } from "./files.ts";
import { upsertNotice } from "./repo.ts";

const entry = (id: number, publishedAt: string) => ({
  id,
  url: `https://mandaluyong.gov.ph/download/doc-${id}/`,
  title: `Doc ${id}`,
  publishedAt,
});
const NOW = "2026-11-26T20:00:00+08:00";

describe("loadNoticeRecords and writeNoticeRecords", () => {
  it("treats missing folders as empty records", () => {
    const root = mkdtempSync(join(tmpdir(), "notices-"));
    const records = loadNoticeRecords(root);
    expect(records.bids.size + records.jobs.size).toBe(0);
  });

  it("round-trips, and writes only the files that changed", () => {
    const root = mkdtempSync(join(tmpdir(), "notices-"));
    const records = loadNoticeRecords(root);
    upsertNotice(
      records.bids,
      entry(1, "2026-11-09T10:00:00+08:00"),
      "itb",
      NOW,
    );
    upsertNotice(
      records.bids,
      entry(2, "2025-03-01T10:00:00+08:00"),
      "noa",
      NOW,
    );
    upsertNotice(
      records.jobs,
      entry(3, "2026-06-25T10:00:00+08:00"),
      "peso",
      NOW,
    );
    expect(writeNoticeRecords(root, records)).toEqual([
      "bids/2025",
      "bids/2026",
      "jobs/2026",
    ]);
    expect(writeNoticeRecords(root, records)).toEqual([]);

    const again = loadNoticeRecords(root);
    expect(again.bids.get(1)?.kind).toBe("itb");
    expect(again.jobs.get(3)?.kind).toBe("peso");
    upsertNotice(again.bids, entry(4, "2026-11-20T10:00:00+08:00"), "rfq", NOW);
    expect(writeNoticeRecords(root, again)).toEqual(["bids/2026"]);
    expect(readFileSync(join(root, "bids/2026.yaml"), "utf8")).toMatch(
      /^# City bid notices/,
    );
  });

  it("rejects an id that is in two files", () => {
    const root = mkdtempSync(join(tmpdir(), "notices-"));
    mkdirSync(join(root, "bids"));
    const row = (date: string) =>
      `- id: 1\n  url: https://mandaluyong.gov.ph/download/x/\n  title: X\n  kind: itb\n  published_at: ${date}\n  first_seen_at: ${NOW}\n`;
    writeFileSync(
      join(root, "bids/2025.yaml"),
      row("2025-01-01T00:00:00+08:00"),
    );
    writeFileSync(
      join(root, "bids/2026.yaml"),
      row("2026-01-01T00:00:00+08:00"),
    );
    expect(() => loadNoticeRecords(root)).toThrow("is also in another file");
  });
});
