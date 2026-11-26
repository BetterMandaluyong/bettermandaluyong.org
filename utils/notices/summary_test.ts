import { describe, expect, it } from "vitest";
import type { CityNotice } from "../../data/schema.ts";
import type { NoticeReport } from "./jobs.ts";
import { summarizeNotices } from "./summary.ts";

const notice = (id: number, kind: string): CityNotice => ({
  id,
  url: `https://mandaluyong.gov.ph/download/doc-${id}/`,
  title: `Doc ${id}`,
  kind,
  publishedAt: "2026-11-09T10:00:00+08:00",
  firstSeenAt: "2026-11-26T20:00:00+08:00",
  missingSince: null,
  removedAt: null,
});

const report = (over: Partial<NoticeReport> = {}): NoticeReport => ({
  bids: { added: [], missing: [], removed: [], restored: [] },
  jobs: { added: [], missing: [], removed: [], restored: [] },
  unmatched: [],
  problems: [],
  ok: true,
  ...over,
});

describe("summarizeNotices", () => {
  it("says only the plain title for a quiet run", () => {
    expect(summarizeNotices(report())).toEqual({
      title: "refresh city bids and jobs",
      body: "",
    });
  });

  it("counts and lists what changed, and the problems", () => {
    const { title, body } = summarizeNotices(
      report({
        bids: {
          added: [notice(1, "itb"), notice(2, "noa")],
          missing: [],
          removed: [notice(3, "rfq")],
          restored: [],
        },
        jobs: {
          added: [notice(4, "peso")],
          missing: [],
          removed: [],
          restored: [],
        },
        unmatched: ["https://mandaluyong.gov.ph/download/ghost/"],
        problems: ["category noa: http_502"],
      }),
    );
    expect(title).toBe(
      "refresh city bids and jobs (2 new bids, 1 new jobs, 1 removed)",
    );
    expect(body).toContain("**New bids** (2)");
    expect(body).toContain(
      "- [Doc 1](https://mandaluyong.gov.ph/download/doc-1/) (itb)",
    );
    expect(body).toContain("**bids removed from the city site** (1)");
    expect(body).toContain("**New jobs** (1)");
    expect(body).toContain("- https://mandaluyong.gov.ph/download/ghost/");
    expect(body).toContain("- category noa: http_502");
  });
});
