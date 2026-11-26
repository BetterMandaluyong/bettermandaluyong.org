import { describe, expect, it } from "vitest";
import type { Census, Population } from "../../data/schema.ts";
import {
  districtTotals,
  formatChange,
  formatCount,
  formatPercent,
  percentChange,
  populationRows,
} from "./population.ts";

const cite = { title: "t", url: "https://example.com" };
const census = (year: number, total: number): Census => ({
  year,
  date: `${year}-01-01`,
  total,
  proclamation: cite,
  source: cite,
  checked: true,
});

const population: Population = {
  censuses: [census(2020, 300), census(2024, 400)],
  barangays: {
    a: { 2020: 100, 2024: 200 },
    b: { 2020: 150, 2024: 150 },
    c: { 2020: 50, 2024: 50 },
  },
};
const refs = [
  { slug: "a", name: "Alpha", district: 1 as const },
  { slug: "b", name: "Bravo", district: 2 as const },
  { slug: "c", name: "Charlie", district: 2 as const },
];

describe("populationRows", () => {
  it("sorts by the latest count and works out change and share", () => {
    const rows = populationRows(population, refs);
    expect(rows.map((r) => r.slug)).toEqual(["a", "b", "c"]);
    expect(rows[0]).toMatchObject({
      latest: 200,
      previous: 100,
      change: 100,
      share: 50,
    });
    expect(rows[1]!.change).toBe(0);
  });
  it("breaks ties by name", () => {
    const tied: Population = {
      ...population,
      barangays: { ...population.barangays, a: { 2020: 50, 2024: 50 } },
    };
    expect(populationRows(tied, refs).map((r) => r.slug)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
  it("has no change with a single census", () => {
    const one: Population = {
      censuses: [census(2024, 400)],
      barangays: population.barangays,
    };
    expect(populationRows(one, refs)[0]).toMatchObject({
      previous: null,
      change: null,
    });
  });
  it("fails on a barangay without counts", () => {
    expect(() =>
      populationRows(population, [
        ...refs,
        { slug: "d", name: "Delta", district: 1 },
      ]),
    ).toThrow("d");
  });
});

describe("districtTotals", () => {
  it("adds up each district", () => {
    const totals = districtTotals(populationRows(population, refs));
    expect(totals).toEqual([
      { district: 1, barangays: 1, latest: 200, previous: 100, change: 100 },
      { district: 2, barangays: 2, latest: 200, previous: 200, change: 0 },
    ]);
  });
});

describe("formatting", () => {
  it("formats counts, percents, and changes", () => {
    expect(formatCount(465902)).toBe("465,902");
    expect(formatPercent(1.3337)).toBe("1.3%");
    expect(formatChange(9.43)).toBe("+9.4%");
    expect(formatChange(-12)).toBe("−12.0%");
    expect(formatChange(0.01)).toBe("0.0%");
    expect(formatChange(null)).toBe("—");
    expect(percentChange(0, 5)).toBeNull();
  });
});
