import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withNameComments } from "../utils/people/comments.ts";
import { BARANGAYS } from "./barangays.ts";
import { CITY_OFFICIALS, COUNCILORS } from "./city-officials.ts";
import {
  PEOPLE,
  POSITION_CATEGORIES,
  getPerson,
  getPersonById,
  officeholders,
  personHref,
} from "./people.ts";

describe("PEOPLE", () => {
  it("has one person per file in data/people/", () => {
    const files = readdirSync("data/people").filter((f) => f.endsWith(".yaml"));
    expect(PEOPLE).toHaveLength(files.length);
    for (const f of files) {
      expect(getPersonById(f.replace(".yaml", "")), f).toBeDefined();
    }
  });

  it("gives every city, barangay, and SK office a holder", () => {
    const barangaySeats = BARANGAYS.reduce(
      (n, b) => n + 1 + b.kagawads.length + 1 + b.skKagawads.length,
      0,
    );
    const positions = PEOPLE.flatMap((p) => p.positions);
    expect(positions).toHaveLength(CITY_OFFICIALS.length + barangaySeats);
    for (const p of PEOPLE)
      expect(p.positions.length, p.slug).toBeGreaterThan(0);
  });

  it("gives everyone a unique, URL-safe slug", () => {
    const slugs = PEOPLE.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("finds every person by slug and by id", () => {
    for (const p of PEOPLE) {
      expect(getPerson(p.slug)).toBe(p);
      expect(getPersonById(p.id)).toBe(p);
    }
    expect(getPerson("not-a-person")).toBeUndefined();
  });

  it("links every official on every barangay to a person", () => {
    for (const b of BARANGAYS) {
      expect(
        personHref(b.captain, "Barangay Captain", b.slug),
        b.slug,
      ).toBeTruthy();
      for (const k of b.kagawads) {
        expect(personHref(k, "Barangay Kagawad", b.slug), k).toBeTruthy();
      }
      expect(personHref(b.skChair, "SK Chairperson", b.slug)).toBeTruthy();
      for (const k of b.skKagawads) {
        expect(personHref(k, "SK Kagawad", b.slug), k).toBeTruthy();
      }
    }
  });

  it("links every city official to a person", () => {
    for (const o of CITY_OFFICIALS) {
      expect(personHref(o.name, o.role), o.name).toBeTruthy();
    }
  });

  it("keeps the mayor's URL", () => {
    expect(personHref(CITY_OFFICIALS[1].name, "Mayor")).toBe(
      "/people/carmelita-menchie-aguilar-abalos",
    );
  });
});

describe("officeholders", () => {
  it("fills every category", () => {
    for (const c of POSITION_CATEGORIES) {
      expect(officeholders(c).length, c).toBeGreaterThan(0);
    }
  });

  it("puts each city seat in its category", () => {
    expect(officeholders("house").map((h) => h.position.role)).toEqual([
      "Congresswoman",
    ]);
    expect(officeholders("executive").map((h) => h.position.role)).toEqual([
      "Mayor",
    ]);
    const council = officeholders("council");
    expect(council[0]?.position.role).toBe("Vice Mayor");
    expect(council).toHaveLength(1 + COUNCILORS.length);
  });

  it("has one captain and one SK chair per barangay", () => {
    expect(officeholders("captain")).toHaveLength(BARANGAYS.length);
    expect(officeholders("sk-chair")).toHaveLength(BARANGAYS.length);
    expect(officeholders("kagawad")).toHaveLength(BARANGAYS.length * 7);
  });
});

describe("office files", () => {
  const files = [
    "data/city-officials.yaml",
    ...readdirSync("data/barangays")
      .filter((f) => f.endsWith(".yaml"))
      .map((f) => `data/barangays/${f}`),
  ];
  const nameOf = (id: string) => getPersonById(id)?.name;

  it.each(files)("%s names each person id in a comment", (file) => {
    const text = readFileSync(file, "utf8");
    // If this fails, the "# Name" after an id is missing or stale: copy the
    // name from data/people/<id>.yaml.
    expect(text).toBe(withNameComments(text, nameOf));
  });
});
