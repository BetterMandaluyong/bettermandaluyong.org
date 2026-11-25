import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BARANGAYS, barangaysInDistrict, getBarangay } from "./barangays.ts";
import {
  COUNCILORS,
  MAYOR,
  REPRESENTATIVE,
  VICE_MAYOR,
  councilorsFor,
} from "./city-officials.ts";
import { parsePhones } from "../utils/barangays/phone.ts";

const geo = JSON.parse(
  readFileSync("public/data/mandaluyong-barangays.geojson", "utf8"),
) as { features: { properties: { slug: string; psgc: string } }[] };

describe("barangays", () => {
  it("has all 27, with unique slugs and PSGC codes", () => {
    expect(BARANGAYS).toHaveLength(27);
    expect(new Set(BARANGAYS.map((b) => b.slug)).size).toBe(27);
    expect(new Set(BARANGAYS.map((b) => b.code)).size).toBe(27);
    for (const b of BARANGAYS) expect(b.code).toMatch(/^13805000\d\d$/);
  });

  it("puts every barangay in district 1 or 2 (14 and 13)", () => {
    for (const b of BARANGAYS) expect([1, 2]).toContain(b.district);
    expect(barangaysInDistrict(1)).toHaveLength(14);
    expect(barangaysInDistrict(2)).toHaveLength(13);
  });

  it("gives every barangay a Mandaluyong ZIP code", () => {
    for (const b of BARANGAYS) expect(b.zip).toMatch(/^155\d$/);
  });

  it("lists a captain, SK chair, seven kagawads, and a phone for each", () => {
    for (const b of BARANGAYS) {
      expect(b.captain.trim(), b.slug).not.toBe("");
      expect(b.skChair.trim(), b.slug).not.toBe("");
      expect(b.kagawads, b.slug).toHaveLength(7);
      // The city lists fewer SK kagawads where seats are vacant.
      expect(b.skKagawads.length, b.slug).toBeGreaterThan(0);
      expect(b.skKagawads.length, b.slug).toBeLessThanOrEqual(7);
      expect(b.phones.flatMap(parsePhones).length, b.slug).toBeGreaterThan(0);
      expect(b.sourceUrl).toMatch(/^https:\/\/mandaluyong\.gov\.ph\//);
    }
  });

  it("leaves no ALL-CAPS names or stray dots", () => {
    const names = BARANGAYS.flatMap((b) => [
      b.captain,
      b.skChair,
      ...b.kagawads,
      ...b.skKagawads,
    ]);
    for (const n of names) {
      expect(n).not.toBe(n.toUpperCase());
      expect(n).not.toMatch(/\s\.\s/);
    }
  });

  it("finds a barangay by slug", () => {
    expect(getBarangay("hulo")?.name).toBe("Hulo");
    expect(getBarangay("not-a-barangay")).toBeUndefined();
  });

  it("has one YAML file per barangay, named by slug", () => {
    const files = readdirSync("data/barangays")
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => f.replace(".yaml", ""))
      .sort();
    expect(files).toEqual(BARANGAYS.map((b) => b.slug).sort());
  });

  it("matches the map's polygons one to one", () => {
    const polygons = geo.features.map((f) => f.properties.slug).sort();
    expect(polygons).toEqual(BARANGAYS.map((b) => b.slug).sort());
    for (const f of geo.features) {
      expect(getBarangay(f.properties.slug)?.code).toBe(f.properties.psgc);
    }
  });
});

describe("city officials", () => {
  it("lists councilors in each council district (the city lists six; the dataset has eight seats)", () => {
    expect(COUNCILORS.length).toBeGreaterThanOrEqual(12);
    expect(councilorsFor(1).length).toBeGreaterThanOrEqual(6);
    expect(councilorsFor(2).length).toBeGreaterThanOrEqual(6);
  });

  it("gives every official an office, a phone, an email, and a city page", () => {
    for (const o of [REPRESENTATIVE, MAYOR, VICE_MAYOR, ...COUNCILORS]) {
      expect(o.office.trim(), o.name).not.toBe("");
      expect(o.phones.length, o.name).toBeGreaterThan(0);
      expect(o.emails.length, o.name).toBeGreaterThan(0);
      for (const e of o.emails) expect(e).toMatch(/^[^@\s]+@[^@\s]+$/);
      expect(o.sourceUrl).toMatch(/^https:\/\/mandaluyong\.gov\.ph\/team\//);
    }
  });
});
