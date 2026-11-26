// Sample API rows for the budget tests. Not real budget lines.
import type { ApiDistrict, ApiGaaProgram, ApiProjectRow } from "./api.ts";

/** A 2027 row with sensible defaults; override what a test needs. */
export function apiRow(over: Partial<ApiProjectRow> = {}): ApiProjectRow {
  return {
    id: "row:1",
    dataset: "dpwh",
    title: "Sample covered court, Barangay Hulo, Mandaluyong City",
    program: "Sample program",
    region_key: "NCR",
    office: "Sample District Engineering Office",
    status_label: "Same amount in both",
    bridge_group: "unchanged",
    held: false,
    nep_php: 1000000,
    house_php: 1000000,
    delta_php: 0,
    pdf_url: {
      nep: "https://example.com/nep.pdf#page=1",
      hgab2: "https://example.com/h2.pdf#page=2",
      hgab3: "https://example.com/h3.pdf#page=3",
    },
    lat: 14.58,
    lon: 121.03,
    url: "https://example.com/p/row-1",
    ...over,
  };
}

/** A GAA program family with amounts in the given years (others zero). */
export function gaaRow(
  name: string,
  amounts: Record<string, number>,
  over: Partial<ApiGaaProgram> = {},
): ApiGaaProgram {
  const years: ApiGaaProgram["years"] = {};
  for (let y = 2020; y <= 2026; y++) {
    const amount = amounts[String(y)] ?? 0;
    years[String(y)] = { count: amount ? 1 : 0, amount };
  }
  return {
    department_id: "18",
    fam_key: `18-001|${name.toLowerCase()}`,
    name,
    years,
    ...over,
  };
}

/** A district card served by one shared office. */
export function apiDistrict(): ApiDistrict {
  return {
    id: "leg:sample-city:lone",
    label: "Sample City, Lone District",
    url: "https://example.com/d/sample",
    attribution: { code: "B", label: "Shared · the office total, not split" },
    offices: [
      {
        name: "Sample 1st DEO",
        kind_label: "District engineering office (DEO)",
        tier: "B",
        tier_text: "Shared with 2 other districts, not split",
        district_ids: [
          "leg:sample-city:lone",
          "leg:other-city:lone",
          "leg:unknown:lone",
        ],
      },
    ],
    headline: {
      fy2026_gaa_php: 300,
      fy2027_nep_php: 100,
      fy2027_hgab3_php: 150,
    },
    fy2027_vs_proposal: { nep_php: 90, hgab3_php: 150, delta_php: 60 },
    co_served_districts: [
      { id: "leg:other-city:lone", label: "Other City, Lone District" },
    ],
  };
}
