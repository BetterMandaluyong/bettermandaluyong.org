import { describe, expect, it } from "vitest";
import { apiDistrict, apiRow, gaaRow } from "./fixtures.ts";
import {
  namesPlace,
  pick2027,
  pickGaa,
  toDistrict,
  toProject,
} from "./select.ts";

describe("namesPlace", () => {
  it("matches the place as a whole word, ignoring case and accents", () => {
    expect(namesPlace("Mandaluyong", "Hulo, MANDALUYONG City")).toBe(true);
    expect(namesPlace("Mandaluyong", "Makati-Mandaluyong Bridge")).toBe(true);
    expect(namesPlace("Los Banos", "Los Baños, Laguna")).toBe(true);
  });

  it("rejects the place inside a longer word", () => {
    expect(namesPlace("Taytay", "Taytayan Road")).toBe(false);
    expect(namesPlace("Taytay", "Puntataytay")).toBe(false);
  });

  it("needs every word of the place", () => {
    expect(namesPlace("Carmen Bohol", "Carmen, Cebu")).toBe(false);
    expect(namesPlace("Carmen Bohol", "Carmen, Bohol")).toBe(true);
  });
});

describe("toProject", () => {
  it("keys the line by program and id and prefers the third-reading PDF", () => {
    const p = toProject(apiRow());
    expect(p.key).toBe("dpwh:row:1");
    expect(p.housePdf).toBe("https://example.com/h3.pdf#page=3");
  });

  it("falls back to the second-reading PDF and keeps a missing NEP line as null", () => {
    const p = toProject(
      apiRow({
        nep_php: null,
        delta_php: null,
        pdf_url: {
          nep: null,
          hgab2: "https://example.com/h2.pdf",
          hgab3: null,
        },
      }),
    );
    expect(p.housePdf).toBe("https://example.com/h2.pdf");
    expect(p.nep).toBeNull();
    expect(p.nepPdf).toBeNull();
  });
});

describe("pick2027", () => {
  it("keeps whole-word lines in the region or with no region, once each", () => {
    const rows = [
      apiRow({ id: "a" }),
      apiRow({ id: "a" }),
      apiRow({ id: "b", region_key: null }),
      apiRow({ id: "c", title: "Mandaluyongan Road" }),
      apiRow({ id: "d", region_key: "VII" }),
    ];
    const r = pick2027(rows, "Mandaluyong", "NCR", new Set());
    expect(r.kept.map((p) => p.key)).toEqual(["dpwh:a", "dpwh:b"]);
    expect(r.insideWords).toBe(1);
    expect(r.otherRegion).toBe(1);
  });

  it("leaves out excluded lines and reports them", () => {
    const r = pick2027(
      [apiRow({ id: "a" }), apiRow({ id: "b" })],
      "Mandaluyong",
      "NCR",
      new Set(["dpwh:b"]),
    );
    expect(r.kept.map((p) => p.key)).toEqual(["dpwh:a"]);
    expect(r.excluded).toEqual(["dpwh:b"]);
  });
});

describe("pickGaa", () => {
  it("keeps only years above zero and drops programs never funded", () => {
    const r = pickGaa(
      [
        gaaRow("Drainage, Mandaluyong City", { "2024": 5, "2026": 7 }),
        gaaRow("Carried line, Mandaluyong", {}),
        gaaRow("Mandaluyongan creek", { "2025": 9 }),
      ],
      "Mandaluyong",
      new Set(),
    );
    expect(r.kept).toHaveLength(1);
    expect(r.kept[0].amounts).toEqual({ "2024": 5, "2026": 7 });
    expect(r.unfunded).toBe(1);
    expect(r.insideWords).toBe(1);
  });

  it("merges rows with the same family key and honours exclusions", () => {
    const a = gaaRow("Road, Mandaluyong", { "2024": 5 });
    const b = gaaRow("Road, Mandaluyong", { "2024": 1, "2025": 2 });
    const c = gaaRow("Other, Mandaluyong", { "2026": 3 });
    const r = pickGaa([a, b, c], "Mandaluyong", new Set([`gaa:${c.fam_key}`]));
    expect(r.kept).toHaveLength(1);
    expect(r.kept[0].amounts).toEqual({ "2024": 6, "2025": 2 });
    expect(r.excluded).toEqual([`gaa:${c.fam_key}`]);
  });
});

describe("toDistrict", () => {
  it("names the other districts an office serves, leaving this one out", () => {
    const d = toDistrict(apiDistrict());
    expect(d.offices[0].coServed).toEqual([
      "Other City, Lone District",
      "leg:unknown:lone",
    ]);
    expect(d.headline).toEqual({ gaa2026: 300, nep2027: 100, house2027: 150 });
    expect(d.vsProposal).toEqual({ nep: 90, house: 150, delta: 60 });
  });
});
