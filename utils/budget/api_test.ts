import { describe, expect, it } from "vitest";
import {
  BUDGET_API,
  BUDGET_USER_AGENT,
  PROJECT_CAP,
  allGaaPrograms,
  allProjects,
  gaaMatchedAmount,
  getJson,
  type FetchLike,
} from "./api.ts";
import { apiRow, gaaRow } from "./fixtures.ts";

/** A fake fetch answering from a map of path → body, recording what was asked. */
function fakeFetch(pages: Record<string, unknown>) {
  const asked: { path: string; ua?: string }[] = [];
  const fetchFn: FetchLike = async (input, init) => {
    const path = input.slice(BUDGET_API.length);
    asked.push({ path, ua: init?.headers?.["User-Agent"] });
    if (!(path in pages))
      return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => pages[path] };
  };
  return { fetchFn, asked };
}

describe("getJson", () => {
  it("identifies itself and throws with the path on an error", async () => {
    const { fetchFn, asked } = fakeFetch({ "/ok": { a: 1 } });
    expect(await getJson(fetchFn, "/ok")).toEqual({ a: 1 });
    expect(asked[0].ua).toBe(BUDGET_USER_AGENT);
    await expect(getJson(fetchFn, "/missing")).rejects.toThrow(
      "/missing: HTTP 404",
    );
  });
});

describe("allProjects", () => {
  it("follows next_offset to the last page", async () => {
    const base = "/hgab/2027/datasets/dpwh/projects?q=Mandaluyong&limit=200";
    const { fetchFn } = fakeFetch({
      [`${base}&offset=0`]: {
        data: { rows: [apiRow({ id: "a" })], next_offset: 200 },
      },
      [`${base}&offset=200`]: {
        data: { rows: [apiRow({ id: "b" })], next_offset: null },
      },
    });
    const rows = await allProjects(fetchFn, "dpwh", "Mandaluyong");
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("stops past the cap instead of paging forever", async () => {
    const rows = Array.from({ length: 200 }, (_, i) =>
      apiRow({ id: String(i) }),
    );
    const fetchFn: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: { rows, next_offset: 1 } }),
    });
    await expect(allProjects(fetchFn, "dpwh", "X")).rejects.toThrow(
      String(PROJECT_CAP),
    );
  });
});

describe("allGaaPrograms and gaaMatchedAmount", () => {
  it("follows next_cursor and reads the API's own total", async () => {
    const base = "/gaa/departments/18/programs?q=Mandaluyong&limit=500";
    const { fetchFn } = fakeFetch({
      [base]: { data: [gaaRow("A, Mandaluyong", {})], next_cursor: "c 1" },
      [`${base}&cursor=c%201`]: {
        data: [gaaRow("B, Mandaluyong", {})],
        next_cursor: null,
      },
      "/gaa/departments/18/programs?q=Mandaluyong&year=2026&limit=1": {
        meta: { matched_amount: 42 },
      },
    });
    const rows = await allGaaPrograms(fetchFn, "18", "Mandaluyong");
    expect(rows.map((r) => r.name)).toEqual([
      "A, Mandaluyong",
      "B, Mandaluyong",
    ]);
    expect(await gaaMatchedAmount(fetchFn, "18", "Mandaluyong", 2026)).toBe(42);
  });
});
