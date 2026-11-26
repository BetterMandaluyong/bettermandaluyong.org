import { describe, expect, it } from "vitest";
import type { BudgetGaa } from "../../data/schema.ts";
import { apiRow } from "./fixtures.ts";
import { toProject } from "./select.ts";
import {
  NO_LINE,
  projectTitle,
  formatPeso,
  formatPesoShort,
  gaaProgramsFor,
  gaaYearTotals,
  sortProjects,
  statusCounts,
  versionTotal,
} from "./format.ts";

const project = (
  id: string,
  nep: number | null,
  house: number | null,
  status = "S",
) =>
  toProject(
    apiRow({
      id,
      title: `Line ${id}, Mandaluyong`,
      nep_php: nep,
      house_php: house,
      status_label: status,
    }),
  );

describe("formatPeso", () => {
  it("shows exact pesos and a dash, never ₱0, for a missing line", () => {
    expect(formatPeso(200000000)).toBe("₱200,000,000");
    expect(formatPeso(0)).toBe("₱0");
    expect(formatPeso(null)).toBe(NO_LINE);
    expect(formatPeso(-2500000)).toBe("−₱2,500,000");
  });
});

describe("formatPesoShort", () => {
  it("rounds to three significant digits with a word", () => {
    expect(formatPesoShort(1133975000)).toBe("₱1.13 billion");
    expect(formatPesoShort(233975000)).toBe("₱234 million");
    expect(formatPesoShort(6326000000000)).toBe("₱6.33 trillion");
    expect(formatPesoShort(500000)).toBe("₱500,000");
    expect(formatPesoShort(null)).toBe(NO_LINE);
  });
});

describe("versionTotal", () => {
  it("sums each version over the lines that have it, never across versions", () => {
    const ps = [
      project("a", null, 200),
      project("b", 40, 40),
      project("c", 10, null),
    ];
    expect(versionTotal(ps, "nep")).toEqual({ lines: 2, amount: 50 });
    expect(versionTotal(ps, "house")).toEqual({ lines: 2, amount: 240 });
  });

  it("is null when no line has the version", () => {
    expect(versionTotal([project("a", null, 5)], "nep")).toEqual({
      lines: 0,
      amount: null,
    });
  });
});

describe("sortProjects and statusCounts", () => {
  it("orders by House amount, then NEP, then title", () => {
    const ps = [
      project("b", 5, null),
      project("a", 1, 30),
      project("c", 9, 30),
    ];
    expect(sortProjects(ps).map((p) => p.key)).toEqual([
      "dpwh:a",
      "dpwh:c",
      "dpwh:b",
    ]);
  });

  it("counts lines per status", () => {
    const ps = [
      project("a", 1, 1, "X"),
      project("b", 1, 1, "Y"),
      project("c", 1, 1, "X"),
    ];
    expect(statusCounts(ps)).toEqual([
      { status: "X", count: 2 },
      { status: "Y", count: 1 },
    ]);
  });
});

describe("GAA years", () => {
  const gaa: BudgetGaa = {
    fetchedAt: "2026-11-26",
    years: [2024, 2025, 2026],
    departments: { "18": "Public Works" },
    programs: [
      {
        key: "a",
        department: "18",
        name: "B road",
        amounts: { "2024": 5, "2026": 7 },
      },
      { key: "b", department: "18", name: "A road", amounts: { "2026": 7 } },
    ],
  };

  it("totals each year over funded programs only", () => {
    expect(gaaYearTotals(gaa)).toEqual([
      { year: 2024, amount: 5, programs: 1 },
      { year: 2025, amount: 0, programs: 0 },
      { year: 2026, amount: 14, programs: 2 },
    ]);
  });

  it("lists a year's programs largest first, then by name", () => {
    expect(gaaProgramsFor(gaa, 2026).map((p) => p.name)).toEqual([
      "A road",
      "B road",
    ]);
    expect(gaaProgramsFor(gaa, 2025)).toEqual([]);
  });
});

describe("projectTitle", () => {
  it("drops trailing coordinates and keeps everything else", () => {
    expect(
      projectTitle(
        "Covered court, Barangay Hulo, Mandaluyong, 14.58731333, 121.038835",
      ),
    ).toBe("Covered court, Barangay Hulo, Mandaluyong");
    expect(
      projectTitle("Creek, Mandaluyong City (14.595093, 121.026348)"),
    ).toBe("Creek, Mandaluyong City");
    expect(projectTitle("Makati-Mandaluyong Br. (B04891LZ)")).toBe(
      "Makati-Mandaluyong Br. (B04891LZ)",
    );
    expect(projectTitle("Seven (7) Storey, 84 classrooms")).toBe(
      "Seven (7) Storey, 84 classrooms",
    );
  });
});
