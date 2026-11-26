import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import {
  parseBudget2027,
  parseBudgetGaa,
  type Budget2027,
  type BudgetGaa,
} from "../../data/schema.ts";
import { apiDistrict, apiRow } from "./fixtures.ts";
import { budget2027Yaml, budgetGaaYaml } from "./files.ts";
import { toDistrict, toProject } from "./select.ts";

const snapshot: Budget2027 = {
  fetchedAt: "2026-11-26",
  source: {
    builtAt: "2026-10-26T08:46:14.383Z",
    commit: "abc",
    notice: "Sample notice.",
  },
  disclaimers: [
    { id: "d", title: "T.", body: "Body.", url: "https://example.com/d" },
  ],
  programs: { dpwh: "DPWH", fmr: "FMR", hfep: "HFEP", nia: "NIA" },
  district: toDistrict(apiDistrict()),
  projects: [
    toProject(apiRow()),
    toProject(
      apiRow({ id: "x", nep_php: null, delta_php: null, lat: null, lon: null }),
    ),
  ],
};

describe("budget YAML", () => {
  it("round-trips the 2027 snapshot through the schema", () => {
    const text = budget2027Yaml(snapshot);
    expect(text.startsWith("# Written by scripts/budget_refresh.ts")).toBe(
      true,
    );
    expect(parseBudget2027(parse(text), "fy2027.yaml")).toEqual(snapshot);
  });

  it("round-trips the GAA snapshot, programs sorted by key", () => {
    const gaa: BudgetGaa = {
      fetchedAt: "2026-11-26",
      years: [2025, 2026],
      departments: { "18": "Public Works" },
      programs: [
        { key: "b", department: "18", name: "B", amounts: { "2026": 2 } },
        { key: "a", department: "18", name: "A", amounts: { "2025": 1 } },
      ],
    };
    const back = parseBudgetGaa(parse(budgetGaaYaml(gaa)), "gaa.yaml");
    expect(back.programs.map((p) => p.key)).toEqual(["a", "b"]);
    expect(back.programs[0].amounts).toEqual({ "2025": 1 });
  });
});
