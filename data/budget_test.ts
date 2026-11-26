import { describe, expect, it } from "vitest";
import { namesPlace } from "../utils/budget/select.ts";
import { BUDGET_2027, BUDGET_GAA, BUDGET_SCOPE } from "./budget.ts";
import { BUDGET_PROGRAMS } from "./schema.ts";

// Invariants the refresh script (scripts/budget_refresh.ts) must keep. A
// failure here means the snapshot and data/budget/scope.yaml disagree: rerun
// the script rather than editing the snapshot by hand.

const excluded = new Set(BUDGET_SCOPE.exclude.map((e) => e.id));

describe("data/budget/fy2027.yaml", () => {
  it("is the district card scope.yaml asks for", () => {
    expect(BUDGET_2027.district.id).toBe(BUDGET_SCOPE.district);
  });

  it("labels every program", () => {
    expect(Object.keys(BUDGET_2027.programs).sort()).toEqual(
      [...BUDGET_PROGRAMS].sort(),
    );
  });

  it("keys each project once, as <program>:<id>", () => {
    const keys = BUDGET_2027.projects.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of BUDGET_2027.projects) {
      expect(p.key.startsWith(`${p.program}:`), p.key).toBe(true);
    }
  });

  it("keeps only lines that name the place and aren't excluded", () => {
    for (const p of BUDGET_2027.projects) {
      expect(namesPlace(BUDGET_SCOPE.place, p.title), p.key).toBe(true);
      expect(excluded.has(p.key), p.key).toBe(false);
    }
  });
});

describe("data/budget/gaa.yaml", () => {
  it("keeps only funded programs that name the place and aren't excluded", () => {
    for (const p of BUDGET_GAA.programs) {
      expect(namesPlace(BUDGET_SCOPE.place, p.name), p.key).toBe(true);
      expect(excluded.has(`gaa:${p.key}`), p.key).toBe(false);
      expect(Object.keys(p.amounts).length, p.key).toBeGreaterThan(0);
      for (const amount of Object.values(p.amounts)) {
        expect(amount, p.key).toBeGreaterThan(0);
      }
    }
  });

  it("names every program's department and stays within its years", () => {
    const years = new Set(BUDGET_GAA.years.map(String));
    for (const p of BUDGET_GAA.programs) {
      expect(BUDGET_GAA.departments[p.department], p.key).toBeDefined();
      for (const y of Object.keys(p.amounts)) {
        expect(years.has(y), `${p.key} ${y}`).toBe(true);
      }
    }
  });

  it("keys each program once", () => {
    const keys = BUDGET_GAA.programs.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
