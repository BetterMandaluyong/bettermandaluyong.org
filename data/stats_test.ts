import { describe, expect, it } from "vitest";
import { BARANGAYS } from "./barangays.ts";
import { FINANCES, LAND_AREA, POPULATION, POVERTY } from "./stats.ts";

describe("data/stats", () => {
  it("counts every barangay, and only those", () => {
    expect(Object.keys(POPULATION.barangays).sort()).toEqual(
      BARANGAYS.map((b) => b.slug).sort(),
    );
  });
  it("keeps the census totals PSA declared official", () => {
    // Proclamation No. 1179 (2020) and No. 973 (2024).
    expect(POPULATION.censuses.map((c) => [c.year, c.total])).toEqual([
      [2020, 425758],
      [2024, 465902],
    ]);
  });
  it("keeps PSA's estimates for the city (Table 2a, 2023 publication)", () => {
    const city = POVERTY.areas.city.years;
    expect(POVERTY.years.map((y) => city[y]!.incidence)).toEqual([
      1.3, 0.7, 0.5,
    ]);
    // PSA marks none of the city's changes as significant.
    expect(POVERTY.areas.city.significant).toEqual([]);
  });
  it("has the 2024 census checked against PSA's own table", () => {
    expect(POPULATION.censuses.every((c) => c.checked)).toBe(true);
  });
  it("gives every barangay, and only those, a land area", () => {
    expect(Object.keys(LAND_AREA.barangays).sort()).toEqual(
      BARANGAYS.map((b) => b.slug).sort(),
    );
  });
  it("keeps the city's Table 4.01 total and largest barangay", () => {
    expect(LAND_AREA.total).toBe(1126);
    expect(LAND_AREA.barangays["wack-wack-greenhills"]).toBe(288.5);
  });
  it("keeps BLGF's 2024 totals", () => {
    expect(FINANCES.income.total).toBe(7942871526);
    expect(FINANCES.spending.total).toBe(7473193739);
  });
});
