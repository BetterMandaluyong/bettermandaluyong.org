import { describe, expect, it } from "vitest";
import {
  barangayOfficialIds,
  duplicateSlugs,
  nameLookup,
  parseBarangay,
  parseBudget2027,
  parseBudgetGaa,
  parseBudgetScope,
  parseCityOfficials,
  parseFinances,
  parseNewsFile,
  parsePay,
  parsePerson,
  parsePopulation,
  parsePoverty,
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

  it("lists a barangay's ids: captain, kagawads, SK chair, SK kagawads", () => {
    expect(
      barangayOfficialIds({
        captain: id(1),
        kagawads: [id(2), id(3)],
        skChair: id(4),
        skKagawads: [id(5)],
      }),
    ).toEqual([id(1), id(2), id(3), id(4), id(5)]);
  });

  it("names the file and field when an id has no person", () => {
    const nameOf = nameLookup([p(1, "a")]);
    expect(nameOf(id(1), "f.yaml", "captain")).toBe("X Y");
    expect(() => nameOf(id(9), "f.yaml", "kagawads[2]")).toThrow(
      /f\.yaml.*kagawads\[2\].*has no file in data\/people/,
    );
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

describe("budget files", () => {
  const scope = () => ({
    place: "Mandaluyong",
    region: "NCR",
    district: "leg:mandaluyong-city:lone",
    exclude: [{ id: "dpwh:x", reason: "A namesake elsewhere." }],
  });

  it("accepts a scope and needs a reason for every exclusion", () => {
    expect(parseBudgetScope(scope(), "scope.yaml").exclude).toHaveLength(1);
    const noReason = scope();
    noReason.exclude = [{ id: "dpwh:x" } as never];
    expect(() => parseBudgetScope(noReason, "scope.yaml")).toThrow(
      "exclude[0].reason",
    );
    const badId = scope();
    badId.exclude = [{ id: "x", reason: "r" }];
    expect(() => parseBudgetScope(badId, "scope.yaml")).toThrow(
      "exclude[0].id",
    );
  });

  const fy = () => ({
    fetched_at: "2026-11-26",
    source: { built_at: "2026-10-26T00:00:00Z", commit: "abc", notice: "N." },
    disclaimers: [
      { id: "d", title: "T.", body: "B.", url: "https://example.com/d" },
    ],
    programs: { dpwh: "D", fmr: "F", hfep: "H", nia: "N" },
    district: {
      id: "leg:x",
      label: "X",
      url: "https://example.com/x",
      attribution: "B",
      attribution_label: "Shared",
      offices: [],
      headline: { gaa_2026: 3, nep_2027: 1, house_2027: 2 },
      vs_proposal: { nep: 1, house: 2, delta: 1 },
    },
    projects: [
      {
        key: "dpwh:1",
        program: "dpwh",
        title: "T",
        status: "House bill only",
        group: "house_only",
        nep: null,
        house: 5,
        url: "https://example.com/p",
      },
    ],
  });

  it("reads a 2027 snapshot, keeping a missing version as null", () => {
    const b = parseBudget2027(fy(), "fy2027.yaml");
    expect(b.projects[0]).toMatchObject({ nep: null, house: 5, held: false });
  });

  it("rejects a 2027 line with no amount in either version, or a fractional peso", () => {
    const none = fy();
    none.projects[0].house = null as never;
    expect(() => parseBudget2027(none, "fy2027.yaml")).toThrow(
      "at least one version",
    );
    const frac = fy();
    frac.projects[0].house = 1.5;
    expect(() => parseBudget2027(frac, "fy2027.yaml")).toThrow(
      "projects[0].house",
    );
  });

  it("rejects a 2027 snapshot without disclaimers", () => {
    const d = fy();
    d.disclaimers = [];
    expect(() => parseBudget2027(d, "fy2027.yaml")).toThrow("disclaimers");
  });

  it("checks GAA programs against the departments and years", () => {
    const gaa = (amounts: Record<string, number>, department = "18") => ({
      fetched_at: "2026-11-26",
      years: [2025, 2026],
      departments: { "18": "Public Works" },
      programs: [{ key: "k", department, name: "N", amounts }],
    });
    expect(
      parseBudgetGaa(gaa({ "2026": 1 }), "gaa.yaml").programs[0].amounts,
    ).toEqual({ "2026": 1 });
    expect(() => parseBudgetGaa(gaa({ "2020": 1 }), "gaa.yaml")).toThrow(
      "is not one of the years",
    );
    expect(() => parseBudgetGaa(gaa({ "2026": 0 }), "gaa.yaml")).toThrow(
      "positive whole number",
    );
    expect(() => parseBudgetGaa(gaa({ "2026": 1 }, "99"), "gaa.yaml")).toThrow(
      "not in departments",
    );
  });
});

describe("parsePay", () => {
  const cite = { title: "Circular", url: "https://example.com/c.pdf" };
  const office = (grade: number) => ({
    grade,
    schedule: "local",
    basis: "Sample Act",
    url: "https://example.com/act",
  });
  const pay = () => ({
    checked: "2026-11-26",
    law: cite,
    tranches: [
      { year: 2025, national: cite, local: cite, step1: { 10: 100, 30: 300 } },
      { year: 2026, national: cite, local: cite, step1: { 10: 110, 30: 330 } },
    ] as Record<string, unknown>[],
    offices: {
      representative: { ...office(30), schedule: "national" },
      mayor: office(30),
      "vice-mayor": office(30),
      councilor: { ...office(30), note: "unconfirmed" },
      captain: { ...office(10), cap: true },
      kagawad: { ...office(10), cap: true },
      "sk-chair": { ...office(10), cap: true },
      "sk-kagawad": { ...office(10), cap: true },
    } as Record<string, Record<string, unknown>>,
  });

  it("accepts a valid file", () => {
    const p = parsePay(pay(), "pay.yaml");
    expect(p.tranches[1]!.step1[30]).toBe(330);
    expect(p.offices.captain).toMatchObject({ grade: 10, cap: true });
    expect(p.offices.mayor).toMatchObject({ cap: false, unconfirmed: false });
    expect(p.offices.councilor.unconfirmed).toBe(true);
  });
  it("needs every office, and no unknown ones", () => {
    const missing = pay();
    delete missing.offices["sk-kagawad"];
    expect(() => parsePay(missing, "pay.yaml")).toThrow("offices.sk-kagawad");
    const extra = pay();
    extra.offices.governor = office(30);
    expect(() => parsePay(extra, "pay.yaml")).toThrow("offices.governor");
  });
  it("needs each office's grade in every tranche", () => {
    const p = pay();
    p.offices.mayor = office(28);
    expect(() => parsePay(p, "pay.yaml")).toThrow("SG 28 is missing");
  });
  it("needs tranches in order and rates that rise with the grade", () => {
    const order = pay();
    order.tranches.reverse();
    expect(() => parsePay(order, "pay.yaml")).toThrow("tranches[1].year");
    const rates = pay();
    rates.tranches[0]!.step1 = { 10: 300, 30: 100 };
    expect(() => parsePay(rates, "pay.yaml")).toThrow("tranches[0].step1.30");
  });
  it("rejects a bad schedule or note", () => {
    const sched = pay();
    sched.offices.mayor = { ...office(30), schedule: "city" };
    expect(() => parsePay(sched, "pay.yaml")).toThrow("offices.mayor.schedule");
    const note = pay();
    note.offices.mayor = { ...office(30), note: "maybe" };
    expect(() => parsePay(note, "pay.yaml")).toThrow("offices.mayor.note");
  });
});

describe("parsePopulation", () => {
  const cite = { title: "Source", url: "https://example.com/s" };
  const census = (year: number, total: number) => ({
    year,
    date: `${year}-05-01`,
    total,
    proclamation: cite,
    source: cite,
    checked: true,
  });
  const pop = () => ({
    censuses: [census(2020, 30), census(2024, 40)] as Record<string, unknown>[],
    barangays: {
      hulo: { 2020: 10, 2024: 15 },
      burol: { 2020: 20, 2024: 25 },
    } as Record<string, Record<string, number>>,
  });

  it("accepts a valid file", () => {
    const p = parsePopulation(pop(), "population.yaml");
    expect(p.barangays.hulo).toEqual({ 2020: 10, 2024: 15 });
    expect(p.censuses[1]!.total).toBe(40);
  });
  it("needs the barangays to add up to the official total", () => {
    const p = pop();
    p.censuses[1]!.total = 41;
    expect(() => parsePopulation(p, "population.yaml")).toThrow("add up to 40");
  });
  it("needs every barangay in every census, and no other years", () => {
    const missing = pop();
    missing.barangays.hulo = { 2020: 10 };
    expect(() => parsePopulation(missing, "population.yaml")).toThrow(
      "barangays.hulo.2024",
    );
    const extra = pop();
    extra.barangays.hulo = { 2015: 5, 2020: 10, 2024: 15 };
    expect(() => parsePopulation(extra, "population.yaml")).toThrow(
      "barangays.hulo.2015",
    );
  });
  it("needs censuses in order, each saying whether it was checked", () => {
    const order = pop();
    order.censuses.reverse();
    expect(() => parsePopulation(order, "population.yaml")).toThrow(
      "censuses[1].year",
    );
    const checked = pop();
    delete checked.censuses[0]!.checked;
    expect(() => parsePopulation(checked, "population.yaml")).toThrow(
      "censuses[0].checked",
    );
  });
});

describe("parsePoverty", () => {
  const cite = { title: "Source", url: "https://example.com/s" };
  const est = (incidence: number) => ({
    incidence,
    cv: 10,
    low: incidence - 1,
    high: incidence + 1,
    poor: 100,
  });
  const series = (incidence: number, significant: string[] = []) => ({
    2021: est(incidence + 1),
    2023: est(incidence),
    significant,
  });
  const pov = () => ({
    years: [2021, 2023] as unknown[],
    release: cite,
    released: "2024-08-15",
    confidence: 95,
    threshold: { 2021: 32978, 2023: 37711 } as Record<string, number>,
    areas: {
      city: series(1.3),
      ncr: series(2.2, ["2021-2023"]),
      philippines: series(16.7),
    } as Record<string, Record<string, unknown>>,
  });

  it("accepts a valid file", () => {
    const p = parsePoverty(pov(), "poverty.yaml");
    expect(p.areas.city.years[2023]!.incidence).toBe(1.3);
    expect(p.areas.ncr.significant).toEqual(["2021-2023"]);
    expect(p.threshold[2023]).toBe(37711);
  });
  it("needs every year for every area, each inside its interval", () => {
    const missing = pov();
    delete missing.areas.city![2021];
    expect(() => parsePoverty(missing, "poverty.yaml")).toThrow(
      "areas.city.2021",
    );
    const outside = pov();
    outside.areas.city![2023] = { ...est(1.3), high: 1 };
    expect(() => parsePoverty(outside, "poverty.yaml")).toThrow(
      "areas.city.2023.incidence",
    );
    const noThreshold = pov();
    delete noThreshold.threshold[2021];
    expect(() => parsePoverty(noThreshold, "poverty.yaml")).toThrow(
      "threshold.2021",
    );
  });
  it("needs significant changes to name two of the years", () => {
    const p = pov();
    p.areas.ncr!.significant = ["2015-2023"];
    expect(() => parsePoverty(p, "poverty.yaml")).toThrow(
      "areas.ncr.significant[0]",
    );
  });
  it("needs years in order and a known confidence level", () => {
    const order = pov();
    order.years = [2023, 2021];
    expect(() => parsePoverty(order, "poverty.yaml")).toThrow("years[1]");
    const level = pov();
    level.confidence = 80;
    expect(() => parsePoverty(level, "poverty.yaml")).toThrow("confidence");
  });
});

describe("parseFinances", () => {
  const fin = () => ({
    year: 2024,
    preliminary: true,
    extracted: "2025-03-17",
    source: { title: "BLGF", url: "https://example.com/sre.xlsx" },
    page: "https://example.com/",
    income: {
      total: 60,
      lines: {
        "real-property-tax": 10,
        "business-tax": 10,
        "other-taxes": 10,
        "fees-and-charges": 10,
        "national-tax-allotment": 10,
        "other-national": 10,
      } as Record<string, number>,
    },
    spending: {
      total: 80,
      lines: {
        "general-public-services": 10,
        health: 10,
        education: 10,
        "social-welfare": 10,
        housing: 10,
        labor: 10,
        "economic-services": 10,
        interest: 10,
      } as Record<string, number>,
    },
    "capital-outlay": 5,
    "loan-principal": 5,
    "cash-end": 5,
  });

  it("accepts a valid file", () => {
    const f = parseFinances(fin(), "finances.yaml");
    expect(f.income.lines["business-tax"]).toBe(10);
    expect(f.capitalOutlay).toBe(5);
  });
  it("allows a few pesos of rounding, not more", () => {
    const close = fin();
    close.income.total = 62;
    expect(parseFinances(close, "finances.yaml").income.total).toBe(62);
    const off = fin();
    off.income.total = 100;
    expect(() => parseFinances(off, "finances.yaml")).toThrow("income.total");
  });
  it("rejects unknown or missing lines", () => {
    const unknown = fin();
    unknown.spending.lines.parks = 1;
    expect(() => parseFinances(unknown, "finances.yaml")).toThrow(
      "spending.lines.parks",
    );
    const missing = fin();
    delete missing.income.lines["business-tax"];
    expect(() => parseFinances(missing, "finances.yaml")).toThrow(
      "income.lines.business-tax",
    );
  });
});
