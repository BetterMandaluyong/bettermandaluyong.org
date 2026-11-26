import { describe, expect, it } from "vitest";
import type { NewsItem } from "../../data/schema.ts";
import { summarize } from "./summary.ts";

const item = (n: number): NewsItem => ({
  id: n,
  url: `https://mandaluyong.gov.ph/p-${n}/`,
  title: `P${n}`,
  publishedAt: "2026-10-01T08:00:00+08:00",
  categories: [],
  firstSeenAt: "2026-10-01T09:00:00+08:00",
  archive: null,
  missingSince: null,
  removedAt: null,
});
const ok = { ok: true, errorCode: null };

describe("summarize", () => {
  it("counts what changed in the title and lists it in the body", () => {
    const { title, body } = summarize({
      feed: { ...ok, itemsRead: 3, added: [item(1), item(2)] },
      archive: { ...ok, archived: [item(3)], gaveUp: [], saveRequests: 1 },
      removal: {
        ...ok,
        checked: 9,
        missing: [],
        removed: [item(4)],
        restored: [],
      },
    });
    expect(title).toBe("refresh city news (2 new, 1 archived, 1 removed)");
    expect(body).toContain("**New posts** (2)");
    expect(body).toContain("- [P4](https://mandaluyong.gov.ph/p-4/)");
    expect(body).not.toContain("Problems");
  });

  it("gives a plain title and empty body for a quiet run", () => {
    expect(summarize({ feed: { ...ok, itemsRead: 3, added: [] } })).toEqual({
      title: "refresh city news",
      body: "",
    });
  });

  it("lists problems", () => {
    const { body } = summarize({
      feed: { ok: false, errorCode: "http_403", itemsRead: 0, added: [] },
    });
    expect(body).toContain("- feed: http_403");
  });
});
