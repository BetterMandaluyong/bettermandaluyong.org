import { describe, expect, it } from "vitest";
import type { LandArea, Population } from "../../data/schema.ts";
import {
  density,
  formatHectares,
  formatSquareKm,
  landDistrictTotals,
  landRows,
} from "./land.ts";

const cite = { title: "Source", url: "https://example.com/s" };
const population: Population = {
  censuses: [
    {
      year: 2020,
      date: "2020-05-01",
      total: 300,
      proclamation: cite,
      source: cite,
      checked: true,
    },
    {
      year: 2024,
      date: "2024-07-01",
      total: 400,
      proclamation: cite,
      source: cite,
      checked: true,
    },
  ],
  barangays: {
    hulo: { 2020: 100, 2024: 150 },
    burol: { 2020: 50, 2024: 50 },
    vergara: { 2020: 150, 2024: 200 },
  },
};
const land: LandArea = {
  source: cite,
  read: "2026-11-26",
  total: 100,
  barangays: { hulo: 30, burol: 20, vergara: 50 },
};
const barangays = [
  { slug: "hulo", name: "Hulo", district: 2 as const },
  { slug: "burol", name: "Burol", district: 2 as const },
  { slug: "vergara", name: "Vergara", district: 1 as const },
];

describe("density", () => {
  it("is people per hectare, and 0 without land", () => {
    expect(density(150, 30)).toBe(5);
    expect(density(150, 0)).toBe(0);
  });
});

describe("landRows", () => {
  it("puts the most land first, with share and density from the latest census", () => {
    const rows = landRows(land, population, barangays);
    expect(rows.map((r) => r.slug)).toEqual(["vergara", "hulo", "burol"]);
    expect(rows[1]).toMatchObject({
      hectares: 30,
      share: 30,
      people: 150,
      density: 5,
    });
  });
  it("breaks ties by name", () => {
    const even = { ...land, barangays: { hulo: 25, burol: 25, vergara: 50 } };
    const rows = landRows(even, population, barangays);
    expect(rows.map((r) => r.slug)).toEqual(["vergara", "burol", "hulo"]);
  });
  it("throws for a barangay with no land area or no counts", () => {
    const extra = [
      ...barangays,
      { slug: "pag-asa", name: "Pag-asa", district: 2 as const },
    ];
    expect(() => landRows(land, population, extra)).toThrow(
      "No land area for barangay pag-asa",
    );
    const noPeople = {
      ...land,
      barangays: { ...land.barangays, "pag-asa": 1 },
    };
    expect(() => landRows(noPeople, population, extra)).toThrow(
      "No population counts for barangay pag-asa",
    );
  });
});

describe("landDistrictTotals", () => {
  it("adds land and people for each district", () => {
    const totals = landDistrictTotals(landRows(land, population, barangays));
    expect(totals).toEqual([
      { district: 1, hectares: 50, people: 200, density: 4 },
      { district: 2, hectares: 50, people: 200, density: 4 },
    ]);
  });
});

describe("formatting", () => {
  it("gives hectares with two decimals and thousands separators", () => {
    expect(formatHectares(1126)).toBe("1,126.00\u00a0ha");
    expect(formatHectares(2.16)).toBe("2.16\u00a0ha");
  });
  it("gives square kilometres from hectares", () => {
    expect(formatSquareKm(1126)).toBe("11.26\u00a0km²");
  });
});
