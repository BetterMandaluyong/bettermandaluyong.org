import { describe, expect, it } from "vitest";
import { BARANGAYS } from "./barangays.ts";
import { CITY_OFFICIALS } from "./city-officials.ts";
import {
  PEOPLE,
  assignSlugs,
  getPerson,
  personHref,
  slugifyName,
} from "./people.ts";

describe("slugifyName", () => {
  it("folds case, accents, quotes, and punctuation", () => {
    expect(slugifyName("Dave T. Nuñez")).toBe("dave-t-nunez");
    expect(slugifyName("Alexandria “Queenie” Pahati-Gonzales")).toBe(
      "alexandria-queenie-pahati-gonzales",
    );
    expect(slugifyName("Alex C. Sta. Maria")).toBe("alex-c-sta-maria");
  });
});

describe("assignSlugs", () => {
  const draft = (name: string, barangay?: string) => ({
    name,
    role: "Barangay Kagawad",
    kind: "barangay" as const,
    barangay,
  });

  it("keeps a unique name as its own slug", () => {
    expect(assignSlugs([draft("Ana Cruz", "hulo")]).map((p) => p.slug)).toEqual(
      ["ana-cruz"],
    );
  });

  it("adds the barangay when different people share a name", () => {
    const slugs = assignSlugs([
      draft("Ana Cruz", "hulo"),
      draft("Ana Cruz", "burol"),
    ]).map((p) => p.slug);
    expect(slugs).toEqual(["ana-cruz-hulo", "ana-cruz-burol"]);
  });

  it("numbers what still collides", () => {
    const slugs = assignSlugs([
      draft("Ana Cruz", "hulo"),
      draft("Ana Cruz", "hulo"),
    ]).map((p) => p.slug);
    expect(slugs).toEqual(["ana-cruz-hulo", "ana-cruz-hulo-2"]);
  });
});

describe("PEOPLE", () => {
  it("has every city official and every barangay and SK official", () => {
    const barangayPeople = BARANGAYS.reduce(
      (n, b) => n + 1 + b.kagawads.length + 1 + b.skKagawads.length,
      0,
    );
    expect(PEOPLE).toHaveLength(CITY_OFFICIALS.length + barangayPeople);
  });

  it("gives everyone a unique, URL-safe slug", () => {
    const slugs = PEOPLE.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("finds every person by slug", () => {
    for (const p of PEOPLE) expect(getPerson(p.slug)).toBe(p);
    expect(getPerson("not-a-person")).toBeUndefined();
  });

  it("links every official on every barangay to a person", () => {
    for (const b of BARANGAYS) {
      expect(
        personHref(b.captain, "Punong Barangay", b.slug),
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

  it("uses the plain name for the mayor", () => {
    expect(personHref(CITY_OFFICIALS[1].name, "Mayor")).toBe(
      "/people/carmelita-menchie-aguilar-abalos",
    );
  });
});
