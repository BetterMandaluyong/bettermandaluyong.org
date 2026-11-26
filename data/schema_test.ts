import { describe, expect, it } from "vitest";
import {
  duplicateSlugs,
  nameLookup,
  parseBarangay,
  parseCityOfficials,
  parseNewsFile,
  parsePerson,
  resolveBarangay,
  resolveCityOfficials,
  unlistedPeople,
} from "./schema.ts";

/** A valid ULID per test person: 01ARZ3NDEKTSV4RRFFQ69G5F + two digits. */
const id = (n: number) =>
  `01ARZ3NDEKTSV4RRFFQ69G5F${String(n).padStart(2, "0")}`;

const good = () => ({
  name: "Hulo",
  psgc: "1380500014",
  district: 2,
  zip: "1550",
  hall: { address: "Coronado Street", phones: ["8533-2505"], email: null },
  council: { captain: id(0), kagawads: [1, 2, 3, 4, 5, 6, 7].map(id) },
  sk: { chair: id(8), kagawads: [id(9)] },
  source: { url: "https://mandaluyong.gov.ph/x/", updated: "2026-02-20" },
});

/** Name parts for a test person: the last word is the surname. */
const parts = (name: string) => {
  const words = name.split(" ");
  return {
    first_name: words.slice(0, -1).join(" ") || name,
    last_name: words.at(-1)!,
  };
};

/** The people `good()` lists: captain "A B", kagawads "1"–"7", SK "C D" and "8". */
const PEOPLE = ["A B", "1", "2", "3", "4", "5", "6", "7", "C D", "8"].map(
  (name, n) => ({
    id: id(n),
    slug: `p-${n}`,
    name,
    nameParts: parts(name),
    ids: {},
  }),
);

/** Parses and resolves a barangay file against `PEOPLE`. */
const load = (d: unknown, file = "data/barangays/hulo.yaml") =>
  resolveBarangay(parseBarangay(d, file, "hulo"), file, nameLookup(PEOPLE));

const bad = (change: (d: any) => void, message: RegExp) => {
  const d = good();
  change(d);
  expect(() => load(d)).toThrow(message);
};

describe("parseBarangay", () => {
  it("accepts a good document and flattens it", () => {
    const b = parseBarangay(good(), "hulo.yaml", "hulo");
    expect(b).toMatchObject({
      slug: "hulo",
      code: "1380500014",
      district: 2,
      address: "Coronado Street",
      officialIds: { captain: id(0), skChair: id(8), skKagawads: [id(9)] },
      sourceModified: "2026-02-20",
    });
    expect(b.email).toBeUndefined();
  });

  it("adds names with resolveBarangay", () => {
    const b = load(good(), "hulo.yaml");
    expect(b.captain).toBe("A B");
    expect(b.kagawads[6]).toBe("7");
    expect(b.skChair).toBe("C D");
    expect(b.skKagawads).toEqual(["8"]);
    expect(() =>
      resolveBarangay(
        parseBarangay(good(), "hulo.yaml", "hulo"),
        "hulo.yaml",
        nameLookup(PEOPLE.slice(1)),
      ),
    ).toThrow(
      /hulo\.yaml: council\.captain "01ARZ3NDEKTSV4RRFFQ69G5F00" has no file in data\/people/,
    );
  });

  it("names the file and field when something is wrong", () => {
    bad((d) => (d.district = 3), /hulo\.yaml: district must be 1 or 2/);
    bad((d) => (d.zip = "1000"), /zip must be a Mandaluyong ZIP/);
    bad((d) => (d.psgc = "123"), /psgc must be a Mandaluyong PSGC code/);
    bad((d) => (d.name = ""), /name must be a non-empty string/);
    bad((d) => (d.hall.phones = []), /hall\.phones must have 1/);
    bad((d) => (d.council.kagawads = [id(1)]), /council\.kagawads must have 7/);
    bad((d) => (d.sk.kagawads = []), /sk\.kagawads must have 1/);
    bad(
      (d) => (d.council.kagawads[2] = ""),
      /council\.kagawads\[2\] must be a non-empty string/,
    );
    bad(
      (d) => (d.council.captain = "Joseph Parong Jose"),
      /council\.captain must be a person id: a ULID/,
    );
    bad(
      (d) => (d.council.kagawads[2] = "juan-dela-cruz"),
      /council\.kagawads\[2\] must be a person id/,
    );
    bad(
      (d) => (d.sk.kagawads = [id(1)]),
      /lists "01ARZ3NDEKTSV4RRFFQ69G5F01" twice/,
    );
    bad((d) => (d.source.url = "http://x"), /source\.url must be an https/);
    bad(
      (d) => (d.source.updated = "yesterday"),
      /source\.updated must be a YYYY-MM-DD/,
    );
    bad((d) => delete d.hall, /hall must be a mapping/);
  });

  it("reads the DILG check and flags", () => {
    const d: any = good();
    d.dilg = { url: "https://dilg.gov.ph/x", retrieved: "2026-11-26" };
    d.flags = [
      {
        field: "council.captain",
        status: "name-differs",
        city: "A B",
        dilg: "A. Bee",
      },
      { field: "sk.kagawads", status: "only-in-dilg", dilg: "New Person" },
    ];
    const b = parseBarangay(d, "hulo.yaml", "hulo");
    expect(b.dilg).toEqual({
      url: "https://dilg.gov.ph/x",
      retrieved: "2026-11-26",
    });
    expect(b.flags).toHaveLength(2);
    expect(parseBarangay(good(), "hulo.yaml", "hulo").flags).toEqual([]);
  });

  it("rejects flags that don't match the officials shown", () => {
    const flag = (f: object) => (d: any) => (d.flags = [f]);
    bad(
      flag({
        field: "council.mayor",
        status: "changed",
        city: "X",
        dilg: "A B",
      }),
      /flags\[0\]\.field must be one of/,
    );
    bad(
      flag({
        field: "council.captain",
        status: "maybe",
        city: "A B",
        dilg: "X",
      }),
      /flags\[0\]\.status must be one of/,
    );
    bad(
      flag({ field: "council.captain", status: "name-differs", dilg: "X" }),
      /flags\[0\]\.city is needed/,
    );
    bad(
      flag({ field: "council.captain", status: "not-in-dilg", city: "Nobody" }),
      /flags\[0\] "Nobody" is not in council\.captain/,
    );
    bad(
      flag({
        field: "council.captain",
        status: "changed",
        city: "A B",
        dilg: "A B",
      }),
      /flags\[0\] "A B" is still in council\.captain/,
    );
    bad(
      flag({ field: "council.kagawads", status: "only-in-dilg", dilg: "1" }),
      /flags\[0\] "1" is already in council\.kagawads/,
    );
    bad(
      (d) => (d.dilg = { url: "https://dilg.gov.ph/x", retrieved: "today" }),
      /dilg\.retrieved must be a YYYY-MM-DD date/,
    );
  });
});

describe("parseCityOfficials", () => {
  const official = (extra = {}) => ({
    person: id(1),
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

  it("accepts a good document and records each seat", () => {
    const c = parseCityOfficials(doc(), "c.yaml");
    expect(c.councilors).toHaveLength(1);
    expect(c.representative.seat).toBe("representative");
    expect(c.viceMayor.seat).toBe("vice-mayor");
    expect(c.councilors[0]?.seat).toBe("councilor");
  });

  it("adds names with resolveCityOfficials", () => {
    const c = resolveCityOfficials(
      parseCityOfficials(doc(), "c.yaml"),
      "c.yaml",
      nameLookup([
        {
          id: id(1),
          slug: "x",
          name: "Juan",
          nameParts: parts("Juan"),
          ids: {},
        },
      ]),
    );
    expect(c.mayor.name).toBe("Juan");
    expect(c.mayor.personId).toBe(id(1));
  });

  it("wants a person id, not a name", () => {
    const d = doc();
    d.mayor = official({ person: "Juan" });
    expect(() => parseCityOfficials(d, "c.yaml")).toThrow(
      /mayor\.person must be a person id/,
    );
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

describe("parsePerson", () => {
  const file = (i = id(1)) => `data/people/${i}.yaml`;
  const person = (over: Record<string, unknown> = {}) => ({
    id: id(1),
    slug: "juan-dela-cruz",
    name: { first_name: "Juan", last_name: "dela Cruz" },
    ...over,
  });

  it("accepts a person with and without external ids", () => {
    expect(parsePerson(person(), file(), id(1))).toEqual({
      id: id(1),
      slug: "juan-dela-cruz",
      name: "Juan dela Cruz",
      nameParts: { first_name: "Juan", last_name: "dela Cruz" },
      ids: {},
    });
    const ids = {
      wikidata: "Q42",
      open_congress: "01K5ST47FR57HGGQ3D5QR4HP2N",
    };
    expect(parsePerson(person({ ids }), file(), id(1)).ids).toEqual(ids);
  });

  it.each([
    [
      "an id that isn't the file name",
      person({ id: id(2) }),
      /id is "01ARZ3NDEKTSV4RRFFQ69G5F02" but the file is/,
    ],
    [
      "a bad slug",
      person({ slug: "Juan Dela Cruz" }),
      /slug must be lowercase words/,
    ],
    [
      "a name as one string",
      person({ name: "Juan dela Cruz" }),
      /name must be a mapping: first_name/,
    ],
    [
      "no last name",
      person({ name: { first_name: "Juan" } }),
      /name\.last_name must be a non-empty string/,
    ],
    [
      "an unknown name part",
      person({ name: { first_name: "Juan", last_name: "Cruz", given: "J" } }),
      /name\.given is not a name part/,
    ],
    [
      "quotes in a nickname",
      person({
        name: { first_name: "Juan", last_name: "Cruz", nickname: "“JJ”" },
      }),
      /nickname must not include quotes/,
    ],
    [
      "an unknown field",
      person({ role: "Mayor" }),
      /role is not a person field/,
    ],
    [
      "an unknown id kind",
      person({ ids: { facebook: "x" } }),
      /ids\.facebook is not a known id kind \(wikidata, open_congress\)/,
    ],
    [
      "a bad Wikidata id",
      person({ ids: { wikidata: "42" } }),
      /ids\.wikidata must look like Q42, not "42"/,
    ],
    [
      "a number for an id",
      person({ ids: { wikidata: 42 } }),
      /ids\.wikidata must be text in quotes/,
    ],
    [
      "a bad Open Congress id",
      person({ ids: { open_congress: "C014" } }),
      /ids\.open_congress must look like 01K5ST47FR57HGGQ3D5QR4HP2N/,
    ],
  ])("rejects %s", (_name, raw, message) => {
    expect(() => parsePerson(raw, file(), id(1))).toThrow(message);
  });

  it("rejects a file not named by a ULID", () => {
    expect(() =>
      parsePerson(person({ id: "juan" }), "data/people/juan.yaml", "juan"),
    ).toThrow(/file name must be a ULID/);
  });
});

describe("people checks", () => {
  const p = (n: number, slug: string) => ({
    id: id(n),
    slug,
    name: "X Y",
    nameParts: parts("X Y"),
    ids: {},
  });

  it("finds slugs used twice", () => {
    expect(duplicateSlugs([p(1, "a"), p(2, "b"), p(3, "a")])).toEqual(["a"]);
    expect(duplicateSlugs([p(1, "a"), p(2, "b")])).toEqual([]);
  });

  it("finds people no office lists", () => {
    expect(unlistedPeople([p(1, "a"), p(2, "b")], [id(2)])).toEqual([id(1)]);
  });
});

describe("parseNewsFile", () => {
  const post = (over: Record<string, unknown> = {}) => ({
    id: 41237,
    url: "https://mandaluyong.gov.ph/some-post/",
    title: "Some post",
    published_at: "2026-11-25T14:00:00+08:00",
    categories: ["News"],
    first_seen_at: "2026-11-25T17:07:00+08:00",
    ...over,
  });
  const parse = (raw: unknown, month = "2026-11") =>
    parseNewsFile(raw, `data/news/${month}.yaml`, month);

  it("accepts a good file and fills the optional fields with null", () => {
    expect(parse([post()])[0]).toEqual({
      id: 41237,
      url: "https://mandaluyong.gov.ph/some-post/",
      title: "Some post",
      publishedAt: "2026-11-25T14:00:00+08:00",
      categories: ["News"],
      firstSeenAt: "2026-11-25T17:07:00+08:00",
      archive: null,
      missingSince: null,
      removedAt: null,
    });
  });

  it("reads archive and removal fields", () => {
    const [item] = parse([
      post({
        archive: {
          status: "ok",
          url: "https://web.archive.org/web/2026/x",
          requested_at: "2026-11-25T17:37:00+08:00",
          attempts: 1,
        },
        missing_since: "2026-11-26T06:07:00+08:00",
        removed_at: "2026-11-27T06:07:00+08:00",
      }),
    ]);
    expect(item?.archive).toEqual({
      status: "ok",
      url: "https://web.archive.org/web/2026/x",
      requestedAt: "2026-11-25T17:37:00+08:00",
      attempts: 1,
    });
    expect(item?.removedAt).toBe("2026-11-27T06:07:00+08:00");
  });

  it("accepts an empty file", () => {
    expect(parse([])).toEqual([]);
  });

  it.each([
    ["not a list", { id: 1 }, /must be a list/],
    [
      "a bad id",
      [post({ id: "41237" })],
      /\[0\]\.id must be a positive whole number/,
    ],
    ["a duplicate id", [post(), post()], /appears twice/],
    [
      "a link off the city site",
      [post({ url: "https://example.com/x" })],
      /mandaluyong\.gov\.ph/,
    ],
    [
      "a date without the Manila offset",
      [post({ published_at: "2026-11-25T14:00:00Z" })],
      /published_at must be a Manila-time/,
    ],
    [
      "a post in the wrong month",
      [post({ published_at: "2026-10-31T23:00:00+08:00" })],
      /is not in 2026-11/,
    ],
    [
      "an archive link off the archive",
      [post({ archive: { status: "ok", url: "https://example.com/" } })],
      /web\.archive\.org/,
    ],
    [
      "an empty title",
      [post({ title: " " })],
      /title must be a non-empty string/,
    ],
  ])("rejects %s", (_name, raw, message) => {
    expect(() => parse(raw)).toThrow(message);
  });

  it("rejects a bad file name", () => {
    expect(() => parse([], "2026-13")).toThrow(/YYYY-MM/);
  });
});
