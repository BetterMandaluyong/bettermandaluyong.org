import { describe, expect, it } from "vitest";
import { validateData, yamlToModule } from "./yaml.ts";

describe("yamlToModule", () => {
  it("exports parsed YAML as the default export", () => {
    const code = yamlToModule(
      "name: Hulo\ndistrict: 2\nphones: [a, b]\n",
      "x.yaml",
    );
    expect(code).toBe(
      'export default {"name":"Hulo","district":2,"phones":["a","b"]};',
    );
  });

  it("keeps quoted numbers as strings and dates as plain values", () => {
    const code = yamlToModule('zip: "1550"\n', "x.yaml");
    expect(code).toContain('"zip":"1550"');
  });

  it("names the file when the YAML is invalid", () => {
    expect(() => yamlToModule("a: [1, 2\n", "data/barangays/bad.yaml")).toThrow(
      /data\/barangays\/bad\.yaml: invalid YAML/,
    );
  });
});

describe("validateData", () => {
  it("ignores YAML files that are not site data", () => {
    expect(() => validateData("/x/other.yaml", { anything: 1 })).not.toThrow();
  });

  it("rejects a bad barangay file, naming it", () => {
    expect(() =>
      validateData("/repo/data/barangays/hulo.yaml", { district: 3 }),
    ).toThrow(/data\/barangays\/hulo\.yaml/);
  });

  it("rejects bad bid and job files, naming them", () => {
    expect(() =>
      validateData("/repo/data/bids/2026.yaml", [{ id: 1 }]),
    ).toThrow(/data\/bids\/2026\.yaml/);
    expect(() =>
      validateData("/repo/data/jobs/2026.yaml", [{ id: 1 }]),
    ).toThrow(/data\/jobs\/2026\.yaml/);
  });

  it("runs the validator from yamlToModule", () => {
    expect(() =>
      yamlToModule("a: 1\n", "x.yaml", () => {
        throw new Error("x.yaml: nope");
      }),
    ).toThrow(/nope/);
  });
});
