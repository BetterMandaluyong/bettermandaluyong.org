import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LOADED_CITY_OFFICIALS, LOADED_PEOPLE } from "../../data/load.ts";
import { readCityOfficials, readPeople } from "./files.ts";

const ANA = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const BEN = "01ARZ3NDEKTSV4RRFFQ69G5FAW";

const personYaml = (id: string, slug: string, first: string, last: string) =>
  `id: ${id}\nslug: ${slug}\nname:\n  first_name: ${first}\n  last_name: ${last}\n`;

/** A people dir with Ana, Ben, and a note that isn't data. */
function peopleDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "people-"));
  writeFileSync(
    join(dir, `${ANA}.yaml`),
    personYaml(ANA, "ana-cruz", "Ana", "Cruz"),
  );
  writeFileSync(
    join(dir, `${BEN}.yaml`),
    personYaml(BEN, "ben-uy", "Ben", "Uy"),
  );
  writeFileSync(join(dir, "CONTEXT.md"), "# not a person\n");
  return dir;
}

/** One city official as YAML mapping lines, each starting with `indent`. */
const official = (id: string, role: string, indent = "  ") =>
  [
    `person: ${id}`,
    `role: ${role}`,
    "office: City Hall",
    'phones: ["8532-5001"]',
    "emails: [office@mandaluyong.gov.ph]",
    "source_url: https://mandaluyong.gov.ph/team/x/",
  ]
    .map((line) => `${indent}${line}`)
    .join("\n");

describe("readPeople", () => {
  it("reads only the .yaml files, validated, with display names", () => {
    const people = readPeople(peopleDir());
    expect(people.map((p) => [p.id, p.slug, p.name]).sort()).toEqual([
      [ANA, "ana-cruz", "Ana Cruz"],
      [BEN, "ben-uy", "Ben Uy"],
    ]);
  });

  it("names the file when a person doesn't validate", () => {
    const dir = peopleDir();
    writeFileSync(
      join(dir, `${ANA}.yaml`),
      personYaml(BEN, "ana-cruz", "Ana", "Cruz"),
    );
    expect(() => readPeople(dir)).toThrow(`${ANA}.yaml`);
  });

  it("reads the same people from data/people as the site does", () => {
    const byId = (a: { id: string }, b: { id: string }) =>
      a.id.localeCompare(b.id);
    expect(readPeople().sort(byId)).toEqual(LOADED_PEOPLE);
  });
});

describe("readCityOfficials", () => {
  it("adds names from the people given", () => {
    const dir = peopleDir();
    const file = join(
      mkdtempSync(join(tmpdir(), "city-")),
      "city-officials.yaml",
    );
    writeFileSync(
      file,
      [
        "as_of: 2026-03-12",
        "source_url: https://mandaluyong.gov.ph/government/elected-officials/",
        `representative:\n${official(ANA, "Congresswoman")}`,
        `mayor:\n${official(BEN, "Mayor")}`,
        `vice_mayor:\n${official(ANA, "Vice Mayor")}`,
        `councilors:\n  - district: 1\n${official(BEN, "Councilor", "    ")}`,
      ].join("\n"),
    );
    const c = readCityOfficials(readPeople(dir), file);
    expect(c.asOf).toBe("2026-03-12");
    expect(c.representative.name).toBe("Ana Cruz");
    expect(c.mayor.name).toBe("Ben Uy");
    expect(c.councilors).toHaveLength(1);
    expect(c.councilors[0]).toMatchObject({
      name: "Ben Uy",
      district: 1,
      seat: "councilor",
    });
  });

  it("throws when an official's id has no person file", () => {
    const dir = peopleDir();
    const file = join(
      mkdtempSync(join(tmpdir(), "city-")),
      "city-officials.yaml",
    );
    const ghost = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
    writeFileSync(
      file,
      [
        "as_of: 2026-03-12",
        "source_url: https://mandaluyong.gov.ph/government/elected-officials/",
        `representative:\n${official(ghost, "Congresswoman")}`,
        `mayor:\n${official(BEN, "Mayor")}`,
        `vice_mayor:\n${official(ANA, "Vice Mayor")}`,
        "councilors: []",
      ].join("\n"),
    );
    expect(() => readCityOfficials(readPeople(dir), file)).toThrow(ghost);
  });

  it("reads data/city-officials.yaml the same as the site does", () => {
    expect(readCityOfficials()).toEqual(LOADED_CITY_OFFICIALS);
  });
});
