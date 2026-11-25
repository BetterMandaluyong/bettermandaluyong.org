import { describe, expect, it } from "vitest";
import { parseBarangay, parseCityOfficials } from "./schema.ts";

const good = () => ({
  name: "Hulo",
  psgc: "1380500014",
  district: 2,
  zip: "1550",
  hall: { address: "Coronado Street", phones: ["8533-2505"], email: null },
  council: { captain: "A B", kagawads: ["1", "2", "3", "4", "5", "6", "7"] },
  sk: { chair: "C D", kagawads: ["8"] },
  source: { url: "https://mandaluyong.gov.ph/x/", updated: "2026-02-20" },
});

const bad = (change: (d: any) => void, message: RegExp) => {
  const d = good();
  change(d);
  expect(() => parseBarangay(d, "data/barangays/hulo.yaml", "hulo")).toThrow(
    message,
  );
};

describe("parseBarangay", () => {
  it("accepts a good document and flattens it", () => {
    const b = parseBarangay(good(), "hulo.yaml", "hulo");
    expect(b).toMatchObject({
      slug: "hulo",
      code: "1380500014",
      district: 2,
      address: "Coronado Street",
      captain: "A B",
      skChair: "C D",
      sourceModified: "2026-02-20",
    });
    expect(b.email).toBeUndefined();
  });

  it("names the file and field when something is wrong", () => {
    bad((d) => (d.district = 3), /hulo\.yaml: district must be 1 or 2/);
    bad((d) => (d.zip = "1000"), /zip must be a Mandaluyong ZIP/);
    bad((d) => (d.psgc = "123"), /psgc must be a Mandaluyong PSGC code/);
    bad((d) => (d.name = ""), /name must be a non-empty string/);
    bad((d) => (d.hall.phones = []), /hall\.phones must have 1/);
    bad(
      (d) => (d.council.kagawads = ["only one"]),
      /council\.kagawads must have 7/,
    );
    bad((d) => (d.sk.kagawads = []), /sk\.kagawads must have 1/);
    bad(
      (d) => (d.council.kagawads[2] = ""),
      /council\.kagawads\[2\] must be a non-empty string/,
    );
    bad((d) => (d.source.url = "http://x"), /source\.url must be an https/);
    bad(
      (d) => (d.source.updated = "yesterday"),
      /source\.updated must be a YYYY-MM-DD/,
    );
    bad((d) => delete d.hall, /hall must be a mapping/);
  });
});

describe("parseCityOfficials", () => {
  const official = (extra = {}) => ({
    name: "X",
    role: "Mayor",
    office: "Somewhere",
    phones: ["8000-0000"],
    emails: ["x@example.com"],
    source_url: "https://mandaluyong.gov.ph/team/x/",
    ...extra,
  });
  const doc = () => ({
    as_of: "2026-03-12",
    source_url: "https://mandaluyong.gov.ph/government/elected-officials/",
    representative: official(),
    mayor: official(),
    vice_mayor: official(),
    councilors: [official({ district: 1 })],
  });

  it("accepts a good document", () => {
    expect(parseCityOfficials(doc(), "c.yaml").councilors).toHaveLength(1);
  });

  it("requires a district on every councilor", () => {
    const d = doc();
    d.councilors = [official()];
    expect(() => parseCityOfficials(d, "c.yaml")).toThrow(
      /councilors\[0\]\.district/,
    );
  });

  it("rejects a bad email", () => {
    const d = doc();
    d.mayor = official({ emails: ["not an email"] });
    expect(() => parseCityOfficials(d, "c.yaml")).toThrow(
      /mayor\.emails has an invalid email/,
    );
  });
});
