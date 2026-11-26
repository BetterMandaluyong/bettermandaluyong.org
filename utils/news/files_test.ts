import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadNewsState, writeNewsState } from "./files.ts";
import { mergeFeedItems, type NewsState } from "./repo.ts";

const state = (): NewsState => {
  const s: NewsState = new Map();
  mergeFeedItems(
    s,
    [1, 2].map((n) => ({
      source: "city-website" as const,
      sourceId: String(n),
      url: `https://mandaluyong.gov.ph/p-${n}/`,
      title: `P${n}`,
      publishedAt: `2026-1${n}-05T08:00:00+08:00`,
      categories: ["News"],
    })),
    "2026-11-25T08:00:00+08:00",
    { updateExisting: true },
  );
  return s;
};

describe("news files", () => {
  it("writes one file per month and reads them back", () => {
    const dir = mkdtempSync(join(tmpdir(), "news-"));
    expect(writeNewsState(dir, state())).toEqual(["2026-11", "2026-12"]);
    expect(loadNewsState(dir)).toEqual(state());
  });

  it("does not rewrite files that have not changed", () => {
    const dir = mkdtempSync(join(tmpdir(), "news-"));
    writeNewsState(dir, state());
    expect(writeNewsState(dir, state())).toEqual([]);
  });

  it("reads a missing folder as empty", () => {
    expect(loadNewsState(join(tmpdir(), "does-not-exist-news")).size).toBe(0);
  });

  it("names the file when one is invalid", () => {
    const dir = mkdtempSync(join(tmpdir(), "news-"));
    writeFileSync(join(dir, "2026-11.yaml"), "- id: nope\n");
    expect(() => loadNewsState(dir)).toThrow(/data\/news\/2026-11\.yaml/);
  });

  it("rejects a post that appears in two files", () => {
    const dir = mkdtempSync(join(tmpdir(), "news-"));
    writeNewsState(dir, state());
    const text = readFileSync(join(dir, "2026-11.yaml"), "utf8");
    writeFileSync(
      join(dir, "2026-12.yaml"),
      text.replace("2026-11-05", "2026-12-05"),
    );
    expect(() => loadNewsState(dir)).toThrow(/also in another file/);
  });
});
