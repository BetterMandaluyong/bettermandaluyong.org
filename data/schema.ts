// Validators for the YAML data files. Each throws an Error that names the
// file and the field, so a broken data file fails the build with a message a
// person can act on. No runtime dependencies.

import {
  NAME_FIELDS,
  displayName,
  type PersonName,
} from "../utils/people/names.ts";
import { ULID } from "../utils/people/ulid.ts";

type Obj = Record<string, unknown>;

function fail(file: string, field: string, problem: string): never {
  throw new Error(`${file}: ${field} ${problem}`);
}

function obj(value: unknown, file: string, field: string): Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(file, field, "must be a mapping");
  }
  return value as Obj;
}

function str(o: Obj, key: string, file: string, path = key): string {
  const v = o[key];
  if (typeof v !== "string" || v.trim() === "") {
    fail(file, path, "must be a non-empty string");
  }
  return v.trim();
}

function optStr(
  o: Obj,
  key: string,
  file: string,
  path = key,
): string | undefined {
  const v = o[key];
  if (v === undefined || v === null) return undefined;
  return str(o, key, file, path);
}

function strList(
  o: Obj,
  key: string,
  file: string,
  path = key,
  { min = 0, max = Infinity }: { min?: number; max?: number } = {},
): string[] {
  const v = o[key];
  if (!Array.isArray(v)) fail(file, path, "must be a list");
  if (v.length < min || v.length > max) {
    fail(file, path, `must have ${min}–${max} items, has ${v.length}`);
  }
  return v.map((item, i) => {
    if (typeof item !== "string" || item.trim() === "") {
      fail(file, `${path}[${i}]`, "must be a non-empty string");
    }
    return item.trim();
  });
}

function url(o: Obj, key: string, file: string, path = key): string {
  const v = str(o, key, file, path);
  if (!v.startsWith("https://")) fail(file, path, "must be an https:// URL");
  return v;
}

/** A council district of the city (not a congressional district). */
export type District = 1 | 2;

function district(o: Obj, file: string): District {
  const v = o.district;
  if (v !== 1 && v !== 2) fail(file, "district", "must be 1 or 2");
  return v;
}

/**
 * A person's id: a ULID, e.g. "01ARZ3NDEKTSV4RRFFQ69G5FAV", following
 * bettergovph/open-congress-data. It names their file in `data/people/`,
 * and offices point at people by it. It never changes.
 */
export const PERSON_ID = ULID;

/**
 * A person's URL slug, e.g. "alex-c-sta-maria" for `/people/alex-c-sta-maria`:
 * lowercase words joined by hyphens. Set once when the person is added and
 * never re-derived from the name, so fixing a name's spelling keeps the URL.
 */
export const PERSON_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const ID_HINT =
  "must be a person id: a ULID like 01ARZ3NDEKTSV4RRFFQ69G5FAV, the name of a file in data/people/";

function personId(o: Obj, key: string, file: string, path = key): string {
  const v = str(o, key, file, path);
  if (!PERSON_ID.test(v)) fail(file, path, `${ID_HINT}, not "${v}"`);
  return v;
}

function personIdList(
  o: Obj,
  key: string,
  file: string,
  path: string,
  range: { min?: number; max?: number },
): string[] {
  const ids = strList(o, key, file, path, range);
  ids.forEach((v, i) => {
    if (!PERSON_ID.test(v))
      fail(file, `${path}[${i}]`, `${ID_HINT}, not "${v}"`);
  });
  return ids;
}

/** How one kind of external record identifies a person. */
export type ExternalIdKindSpec = {
  /** Who keeps the record, e.g. "Wikidata". */
  label: string;
  /** What a valid value looks like. */
  pattern: RegExp;
  /** A valid value, shown in error messages. */
  example: string;
  /** The record's page for a value, if it has one. */
  url?: (value: string) => string;
};

/**
 * The external records a person file may point to under `ids:`, keyed by
 * the name used in the YAML. A key not listed here, or a value that doesn't
 * match its pattern, fails the build. To support a new kind of record, add
 * an entry here (with a test in `schema_test.ts`).
 */
export const EXTERNAL_ID_KINDS = {
  wikidata: {
    label: "Wikidata",
    pattern: /^Q[1-9]\d*$/,
    example: "Q42",
    url: (v: string) => `https://www.wikidata.org/wiki/${v}`,
  },
  open_congress: {
    label: "Open Congress Data",
    pattern: ULID,
    example: "01K5ST47FR57HGGQ3D5QR4HP2N",
    url: (v: string) =>
      `https://github.com/bettergovph/open-congress-data/blob/main/data/person/${v}.toml`,
  },
} satisfies Record<string, ExternalIdKindSpec>;

/** A key of `EXTERNAL_ID_KINDS`, e.g. "wikidata" or "open_congress". */
export type ExternalIdKind = keyof typeof EXTERNAL_ID_KINDS;

/** A person's ids in other records, e.g. `{ wikidata: "Q42" }`. */
export type ExternalIds = Partial<Record<ExternalIdKind, string>>;

/** The external id kinds, in the order person pages list them. */
export const EXTERNAL_ID_KEYS = Object.keys(
  EXTERNAL_ID_KINDS,
) as ExternalIdKind[];

/**
 * One person, from `data/people/<id>.yaml`. Offices (barangay files,
 * `city-officials.yaml`) point at people by `id`.
 */
export type PersonRecord = {
  /** A ULID; the file's name without `.yaml`. */
  id: string;
  /** The `/people/<slug>` URL; unique, frozen once set. */
  slug: string;
  /** The name as the site shows it, written out from `nameParts`. */
  name: string;
  /** The name in parts, as the file stores it under `name:`. */
  nameParts: PersonName;
  ids: ExternalIds;
};

function parseName(raw: unknown, file: string): PersonName {
  const o = obj(raw, file, "name");
  for (const key of Object.keys(o)) {
    if (!(NAME_FIELDS as readonly string[]).includes(key)) {
      fail(
        file,
        `name.${key}`,
        `is not a name part (${NAME_FIELDS.join(", ")})`,
      );
    }
  }
  const part = (key: (typeof NAME_FIELDS)[number]) =>
    optStr(o, key, file, `name.${key}`);
  const nickname = part("nickname");
  if (nickname && /[“”"]/.test(nickname)) {
    fail(file, "name.nickname", "must not include quotes; the site adds them");
  }
  const middle = part("middle_name");
  const suffix = part("suffix");
  return {
    first_name: str(o, "first_name", file, "name.first_name"),
    ...(middle ? { middle_name: middle } : {}),
    last_name: str(o, "last_name", file, "name.last_name"),
    ...(suffix ? { suffix } : {}),
    ...(nickname ? { nickname } : {}),
  };
}

/**
 * Checks one `data/people/<id>.yaml` document. `id` comes from the file
 * name, and the document's own `id:` must match it. `slug:` must be a URL
 * slug (uniqueness is checked across files by `duplicateSlugs`). `name:` is a
 * mapping of parts (`first_name` and `last_name` required; `middle_name`,
 * `suffix`, `nickname` optional). `ids:` is optional;
 * each key must be in `EXTERNAL_ID_KINDS` and each value must match.
 */
export function parsePerson(
  raw: unknown,
  file: string,
  id: string,
): PersonRecord {
  if (!PERSON_ID.test(id)) {
    fail(
      file,
      "file name",
      "must be a ULID, like 01ARZ3NDEKTSV4RRFFQ69G5FAV.yaml",
    );
  }
  const o = obj(raw, file, "document");
  const own = str(o, "id", file);
  if (own !== id) fail(file, "id", `is "${own}" but the file is ${id}.yaml`);
  for (const key of Object.keys(o)) {
    if (!["id", "slug", "name", "ids"].includes(key)) {
      fail(file, key, "is not a person field (id, slug, name, ids)");
    }
  }
  const ids: ExternalIds = {};
  if (o.ids !== undefined && o.ids !== null) {
    const m = obj(o.ids, file, "ids");
    for (const key of Object.keys(m)) {
      if (!(key in EXTERNAL_ID_KINDS)) {
        fail(
          file,
          `ids.${key}`,
          `is not a known id kind (${EXTERNAL_ID_KEYS.join(", ")})`,
        );
      }
      const kind = EXTERNAL_ID_KINDS[key as ExternalIdKind];
      const value = m[key];
      if (typeof value !== "string") {
        fail(
          file,
          `ids.${key}`,
          `must be text in quotes, like "${kind.example}"`,
        );
      }
      if (!kind.pattern.test(value)) {
        fail(
          file,
          `ids.${key}`,
          `must look like ${kind.example}, not "${value}"`,
        );
      }
      ids[key as ExternalIdKind] = value;
    }
  }
  const slug = str(o, "slug", file);
  if (!PERSON_SLUG.test(slug)) {
    fail(
      file,
      "slug",
      `must be lowercase words joined by hyphens, like "juan-dela-cruz"`,
    );
  }
  if (typeof o.name === "string") {
    fail(
      file,
      "name",
      "must be a mapping: first_name, middle_name, last_name, suffix, nickname",
    );
  }
  const nameParts = parseName(o.name, file);
  return { id, slug, name: displayName(nameParts), nameParts, ids };
}

/**
 * Finds a person's name by id; throws naming the file and field when the id
 * has no file in `data/people/`.
 */
export type NameOf = (id: string, file: string, path: string) => string;

/** A `NameOf` over these people. */
export function nameLookup(people: readonly PersonRecord[]): NameOf {
  const names = new Map(people.map((p) => [p.id, p.name]));
  return (id, file, path) => {
    const name = names.get(id);
    if (name === undefined) {
      fail(file, path, `"${id}" has no file in data/people/`);
    }
    return name;
  };
}

/** Slugs used by more than one person, sorted. */
export function duplicateSlugs(people: readonly PersonRecord[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const p of people) {
    if (seen.has(p.slug)) dupes.add(p.slug);
    seen.add(p.slug);
  }
  return [...dupes].sort();
}

/**
 * The people no office lists: each must be listed by a barangay file or
 * `city-officials.yaml`. Returns their ids, sorted.
 */
export function unlistedPeople(
  people: readonly PersonRecord[],
  listed: Iterable<string>,
): string[] {
  const used = new Set(listed);
  return people
    .filter((p) => !used.has(p.id))
    .map((p) => p.id)
    .sort();
}

/**
 * One of Mandaluyong's 27 barangays, with its officials and hall contacts as
 * published on mandaluyong.gov.ph. Loaded from `data/barangays/<slug>.yaml`.
 */
export type Barangay = {
  /** The YAML file's name without `.yaml`; used in URLs. */
  slug: string;
  name: string;
  /** PSGC code, e.g. "1380500014". */
  code: string;
  /** City council district, 1 or 2. */
  district: District;
  /** Approximate ZIP code (PHLPost does not publish a barangay list). */
  zip: string;
  /** Barangay hall address. */
  address: string;
  /** Barangay hall phone numbers, as the city publishes them. */
  phones: string[];
  email?: string;
  /** The barangay captain's name (Punong Barangay). */
  captain: string;
  /** Barangay kagawads' (councilors') names. */
  kagawads: string[];
  /** Sangguniang Kabataan chairperson's name. */
  skChair: string;
  /** SK kagawads' names. */
  skKagawads: string[];
  /** The same officials as person ids (`data/people/<id>.yaml`). */
  officialIds: BarangayOfficialIds;
  /** The city page the data came from, and its last edit date (YYYY-MM-DD). */
  sourceUrl: string;
  sourceModified: string;
  /**
   * When the officials were last checked against the DILG Barangay Officials
   * Directory, and where it lives. Absent if never checked.
   */
  dilg?: { url: string; retrieved: string };
  /** Where the city and DILG disagree; see `BarangayFlag`. */
  flags: BarangayFlag[];
};

/** A barangay's officials as person ids, as its YAML file lists them. */
export type BarangayOfficialIds = {
  captain: string;
  kagawads: string[];
  skChair: string;
  skKagawads: string[];
};

/** A barangay file as written: officials as ids, names not looked up yet. */
export type BarangayRecord = Omit<
  Barangay,
  "captain" | "kagawads" | "skChair" | "skKagawads"
>;

/** The official lists a flag can point at, as written in the YAML. */
export type FlagField =
  "council.captain" | "council.kagawads" | "sk.chair" | "sk.kagawads";

/**
 * How a name in the city's list compares with DILG's:
 * - `changed`: the site now shows DILG's name (`dilg`); the city's is `city`.
 * - `name-differs`: probably the same person, spelled differently; the site
 *   keeps the city's spelling.
 * - `different-person`: the same seat has another person in DILG's list; the
 *   site keeps the city's.
 * - `not-in-dilg`: a name the city lists that DILG doesn't.
 * - `only-in-dilg`: a name DILG lists that the site doesn't show.
 */
export type FlagStatus =
  | "changed"
  | "name-differs"
  | "different-person"
  | "not-in-dilg"
  | "only-in-dilg";

/** One disagreement between the city's officials list and DILG's, to review. */
export type BarangayFlag = {
  field: FlagField;
  status: FlagStatus;
  /** The name as the city lists it (absent for `only-in-dilg`). */
  city?: string;
  /** The name as DILG lists it (absent for `not-in-dilg`). */
  dilg?: string;
  note?: string;
};

const FLAG_FIELDS: readonly FlagField[] = [
  "council.captain",
  "council.kagawads",
  "sk.chair",
  "sk.kagawads",
];
const FLAG_STATUSES: readonly FlagStatus[] = [
  "changed",
  "name-differs",
  "different-person",
  "not-in-dilg",
  "only-in-dilg",
];

function isoDate(o: Obj, key: string, file: string, path: string): string {
  const v = str(o, key, file, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v))
    fail(file, path, "must be a YYYY-MM-DD date");
  return v;
}

function parseFlags(raw: unknown, file: string): BarangayFlag[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) fail(file, "flags", "must be a list");
  return raw.map((entry, i): BarangayFlag => {
    const at = `flags[${i}]`;
    const o = obj(entry, file, at);
    const field = str(o, "field", file, `${at}.field`) as FlagField;
    if (!FLAG_FIELDS.includes(field)) {
      fail(file, `${at}.field`, `must be one of ${FLAG_FIELDS.join(", ")}`);
    }
    const status = str(o, "status", file, `${at}.status`) as FlagStatus;
    if (!FLAG_STATUSES.includes(status)) {
      fail(file, `${at}.status`, `must be one of ${FLAG_STATUSES.join(", ")}`);
    }
    const city = optStr(o, "city", file, `${at}.city`);
    const dilg = optStr(o, "dilg", file, `${at}.dilg`);
    if (status !== "only-in-dilg" && !city) {
      fail(file, `${at}.city`, `is needed when status is ${status}`);
    }
    if (status !== "not-in-dilg" && !dilg) {
      fail(file, `${at}.dilg`, `is needed when status is ${status}`);
    }
    const note = optStr(o, "note", file, `${at}.note`);
    return {
      field,
      status,
      ...(city ? { city } : {}),
      ...(dilg ? { dilg } : {}),
      ...(note ? { note } : {}),
    };
  });
}

/** The names the site shows for one flag field. */
function namesIn(b: Barangay, field: FlagField): string[] {
  if (field === "council.captain") return [b.captain];
  if (field === "council.kagawads") return b.kagawads;
  if (field === "sk.chair") return [b.skChair];
  return b.skKagawads;
}

/**
 * Checks one barangay YAML document and returns it with its officials as
 * person ids. `file` is the path shown in error messages; `slug` comes from
 * the file name. An id listed twice in one barangay fails. Names are added,
 * and DILG flags checked against them, by `resolveBarangay`.
 */
export function parseBarangay(
  raw: unknown,
  file: string,
  slug: string,
): BarangayRecord {
  const o = obj(raw, file, "document");
  const hall = obj(o.hall, file, "hall");
  const council = obj(o.council, file, "council");
  const sk = obj(o.sk, file, "sk");
  const source = obj(o.source, file, "source");
  const zip = str(o, "zip", file);
  if (!/^155\d$/.test(zip))
    fail(file, "zip", "must be a Mandaluyong ZIP (1550–1559)");
  const code = str(o, "psgc", file);
  if (!/^13805000\d\d$/.test(code))
    fail(file, "psgc", "must be a Mandaluyong PSGC code");
  const updated = str(source, "updated", file, "source.updated");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated)) {
    fail(file, "source.updated", "must be a YYYY-MM-DD date");
  }
  const email = optStr(hall, "email", file, "hall.email");
  const officialIds: BarangayOfficialIds = {
    captain: personId(council, "captain", file, "council.captain"),
    kagawads: personIdList(council, "kagawads", file, "council.kagawads", {
      min: 7,
      max: 7,
    }),
    skChair: personId(sk, "chair", file, "sk.chair"),
    // The city lists fewer SK kagawads where seats are vacant.
    skKagawads: personIdList(sk, "kagawads", file, "sk.kagawads", {
      min: 1,
      max: 7,
    }),
  };
  const seen = new Set<string>();
  for (const id of barangayOfficialIds(officialIds)) {
    if (seen.has(id)) fail(file, "council/sk", `lists "${id}" twice`);
    seen.add(id);
  }
  let dilg: Barangay["dilg"];
  if (o.dilg !== undefined && o.dilg !== null) {
    const d = obj(o.dilg, file, "dilg");
    dilg = {
      url: url(d, "url", file, "dilg.url"),
      retrieved: isoDate(d, "retrieved", file, "dilg.retrieved"),
    };
  }
  const flags = parseFlags(o.flags, file);
  return {
    slug,
    name: str(o, "name", file),
    code,
    district: district(o, file),
    zip,
    address: str(hall, "address", file, "hall.address"),
    phones: strList(hall, "phones", file, "hall.phones", { min: 1 }),
    ...(email ? { email } : {}),
    officialIds,
    sourceUrl: url(source, "url", file, "source.url"),
    sourceModified: updated,
    ...(dilg ? { dilg } : {}),
    flags,
  };
}

/** Every person id a barangay lists: captain, kagawads, SK chair, SK kagawads. */
export function barangayOfficialIds(ids: BarangayOfficialIds): string[] {
  return [ids.captain, ...ids.kagawads, ids.skChair, ...ids.skKagawads];
}

/**
 * Adds the officials' names to a barangay record, then checks each DILG flag
 * against the names the site shows. Throws on an unknown id or a stale flag.
 */
export function resolveBarangay(
  b: BarangayRecord,
  file: string,
  nameOf: NameOf,
): Barangay {
  const ids = b.officialIds;
  const barangay: Barangay = {
    ...b,
    captain: nameOf(ids.captain, file, "council.captain"),
    kagawads: ids.kagawads.map((id, i) =>
      nameOf(id, file, `council.kagawads[${i}]`),
    ),
    skChair: nameOf(ids.skChair, file, "sk.chair"),
    skKagawads: ids.skKagawads.map((id, i) =>
      nameOf(id, file, `sk.kagawads[${i}]`),
    ),
  };
  // Flags name people, so they are checked once the ids have names.
  // A flag must describe what the site shows: a changed name is on the page,
  // a kept city name is on the page, and a DILG-only name isn't.
  for (const [i, f] of b.flags.entries()) {
    const shown = namesIn(barangay, f.field);
    const want = f.status === "changed" ? f.dilg : f.city;
    if (want && !shown.includes(want)) {
      fail(file, `flags[${i}]`, `"${want}" is not in ${f.field}`);
    }
    if (f.status === "changed" && f.city && shown.includes(f.city)) {
      fail(file, `flags[${i}]`, `"${f.city}" is still in ${f.field}`);
    }
    if (f.status === "only-in-dilg" && f.dilg && shown.includes(f.dilg)) {
      fail(file, `flags[${i}]`, `"${f.dilg}" is already in ${f.field}`);
    }
  }
  return barangay;
}

/** Which city office an official holds. */
export type CitySeat = "representative" | "mayor" | "vice-mayor" | "councilor";

/** A city-level elected official and how the city publishes their contacts. */
export type CityOfficial = {
  /** Their person id (`data/people/<id>.yaml`). */
  personId: string;
  /** Their name, from their person file. */
  name: string;
  seat: CitySeat;
  /** "Congresswoman", "Mayor", "Vice Mayor", or "Councilor". */
  role: string;
  /** Council district for councilors; the congresswoman covers the whole city. */
  district?: District;
  office: string;
  /** Phone text as published; split with `parsePhones`. */
  phones: string[];
  emails: string[];
  /** Their page on mandaluyong.gov.ph. */
  sourceUrl: string;
};

/** A city official as written: `person:` id, name not looked up yet. */
export type CityOfficialRecord = Omit<CityOfficial, "name">;

function parseCityOfficial(
  raw: unknown,
  file: string,
  path: string,
  seat: CitySeat,
): CityOfficialRecord {
  const o = obj(raw, file, path);
  const emails = strList(o, "emails", file, `${path}.emails`, { min: 1 });
  for (const e of emails) {
    if (!/^[^@\s]+@[^@\s]+$/.test(e))
      fail(file, `${path}.emails`, `has an invalid email "${e}"`);
  }
  return {
    personId: personId(o, "person", file, `${path}.person`),
    seat,
    role: str(o, "role", file, `${path}.role`),
    ...(o.district !== undefined ? { district: district(o, file) } : {}),
    office: str(o, "office", file, `${path}.office`),
    phones: strList(o, "phones", file, `${path}.phones`, { min: 1 }),
    emails,
    sourceUrl: url(o, "source_url", file, `${path}.source_url`),
  };
}

/** The whole `data/city-officials.yaml` file, with names looked up. */
export type CityOfficials = {
  /** When the city's directory page was last edited (YYYY-MM-DD). */
  asOf: string;
  sourceUrl: string;
  representative: CityOfficial;
  mayor: CityOfficial;
  viceMayor: CityOfficial;
  councilors: CityOfficial[];
};

/** `data/city-officials.yaml` as written: officials as person ids. */
export type CityOfficialsRecord = {
  asOf: string;
  sourceUrl: string;
  representative: CityOfficialRecord;
  mayor: CityOfficialRecord;
  viceMayor: CityOfficialRecord;
  councilors: CityOfficialRecord[];
};

/**
 * Checks `data/city-officials.yaml` and returns it typed, with each
 * official's `person:` id. Names are added by `resolveCityOfficials`.
 */
export function parseCityOfficials(
  raw: unknown,
  file: string,
): CityOfficialsRecord {
  const o = obj(raw, file, "document");
  const asOf = str(o, "as_of", file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf))
    fail(file, "as_of", "must be a YYYY-MM-DD date");
  const list = o.councilors;
  if (!Array.isArray(list)) fail(file, "councilors", "must be a list");
  const councilors = list.map((c, i) =>
    parseCityOfficial(c, file, `councilors[${i}]`, "councilor"),
  );
  for (const [i, c] of councilors.entries()) {
    if (!c.district) fail(file, `councilors[${i}].district`, "must be 1 or 2");
  }
  return {
    asOf,
    sourceUrl: url(o, "source_url", file),
    representative: parseCityOfficial(
      o.representative,
      file,
      "representative",
      "representative",
    ),
    mayor: parseCityOfficial(o.mayor, file, "mayor", "mayor"),
    viceMayor: parseCityOfficial(
      o.vice_mayor,
      file,
      "vice_mayor",
      "vice-mayor",
    ),
    councilors,
  };
}

/** Adds each city official's name. Throws on an unknown person id. */
export function resolveCityOfficials(
  c: CityOfficialsRecord,
  file: string,
  nameOf: NameOf,
): CityOfficials {
  const named = (o: CityOfficialRecord, path: string): CityOfficial => ({
    ...o,
    name: nameOf(o.personId, file, `${path}.person`),
  });
  return {
    ...c,
    representative: named(c.representative, "representative"),
    mayor: named(c.mayor, "mayor"),
    viceMayor: named(c.viceMayor, "vice_mayor"),
    councilors: c.councilors.map((o, i) => named(o, `councilors[${i}]`)),
  };
}

/** What kind of government place a map marker is. */
export type PlaceKind =
  "barangay-hall" | "city" | "national" | "police" | "fire" | "rail";

/** Every place kind, in the order the map's filters list them. */
export const PLACE_KINDS: readonly PlaceKind[] = [
  "barangay-hall",
  "city",
  "national",
  "police",
  "fire",
  "rail",
];

/**
 * One government place on the map, from `data/places.yaml`. Its location
 * comes from OpenStreetMap (`osm`) or, where OpenStreetMap doesn't have it,
 * from a Google Maps listing (`google`): exactly one of the two. A barangay
 * hall names its barangay and takes its display name from it, so `name` is
 * only set for the other kinds.
 */
export type Place = {
  kind: PlaceKind;
  /** Display name; absent for barangay halls. */
  name?: string;
  /** The barangay's slug, for barangay halls. */
  barangay?: string;
  lat: number;
  lng: number;
  /** The OpenStreetMap element it came from, e.g. "w112549085". */
  osm?: string;
  /** The Google Maps listing it came from: its CID, as a string of digits. */
  google?: string;
};

/** Mandaluyong's bounding box, a little padded: every place must be inside. */
const CITY_BOUNDS = { south: 14.56, north: 14.61, west: 121.01, east: 121.07 };

function coord(
  o: Obj,
  key: string,
  file: string,
  path: string,
  min: number,
  max: number,
): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    fail(file, path, "must be a number");
  }
  if (v < min || v > max) fail(file, path, "is outside Mandaluyong");
  return v;
}

/**
 * Checks `data/places.yaml` (a list of places) and returns it. Every
 * barangay hall must name a barangay in `barangaySlugs`, at most one hall per
 * barangay; other kinds need a `name`; coordinates must fall in Mandaluyong;
 * each place has exactly one source (`osm` or `google`), and no source id is
 * used twice.
 */
export function parsePlaces(
  raw: unknown,
  file: string,
  barangaySlugs: ReadonlySet<string>,
): Place[] {
  if (!Array.isArray(raw)) fail(file, "document", "must be a list of places");
  const seenSource = new Set<string>();
  const seenHall = new Set<string>();
  return raw.map((entry, i): Place => {
    const at = `[${i}]`;
    const o = obj(entry, file, at);
    const kind = str(o, "kind", file, `${at}.kind`) as PlaceKind;
    if (!PLACE_KINDS.includes(kind)) {
      fail(file, `${at}.kind`, `must be one of ${PLACE_KINDS.join(", ")}`);
    }
    const osm = optStr(o, "osm", file, `${at}.osm`);
    const google = optStr(o, "google", file, `${at}.google`);
    if ((osm === undefined) === (google === undefined)) {
      fail(file, at, "needs exactly one of osm or google");
    }
    if (osm !== undefined && !/^[nwr]\d+$/.test(osm)) {
      fail(file, `${at}.osm`, "must be n, w, or r followed by the id");
    }
    if (google !== undefined && !/^\d+$/.test(google)) {
      fail(file, `${at}.google`, "must be a Google Maps CID (digits, quoted)");
    }
    const sourceKey = osm ?? `google:${google}`;
    const sourcePath = osm ? `${at}.osm` : `${at}.google`;
    if (seenSource.has(sourceKey)) {
      fail(file, sourcePath, `${osm ?? google} appears twice`);
    }
    seenSource.add(sourceKey);
    const source = osm ? { osm } : { google };
    const lat = coord(
      o,
      "lat",
      file,
      `${at}.lat`,
      CITY_BOUNDS.south,
      CITY_BOUNDS.north,
    );
    const lng = coord(
      o,
      "lng",
      file,
      `${at}.lng`,
      CITY_BOUNDS.west,
      CITY_BOUNDS.east,
    );
    if (kind === "barangay-hall") {
      const barangay = str(o, "barangay", file, `${at}.barangay`);
      if (!barangaySlugs.has(barangay)) {
        fail(file, `${at}.barangay`, `"${barangay}" is not a barangay`);
      }
      if (seenHall.has(barangay)) {
        fail(file, `${at}.barangay`, `${barangay} already has a hall`);
      }
      seenHall.add(barangay);
      return { kind, barangay, lat, lng, ...source };
    }
    return {
      kind,
      name: str(o, "name", file, `${at}.name`),
      lat,
      lng,
      ...source,
    };
  });
}

/** Where a news post's archived copy stands. */
export type NewsArchive = {
  /** "ok", or "http <code>" for the last failed save request. */
  status: string;
  /** The Wayback Machine capture, once there is one. */
  url: string | null;
  /** When the item left the archive queue; null while it is still queued after a transient failure. */
  requestedAt: string | null;
  /** Transient save failures so far. */
  attempts: number;
};

/**
 * One City Government news post. Link-only: never carries article text.
 * Loaded from `data/news/YYYY-MM.yaml`, where YYYY-MM is the Manila month of
 * `publishedAt`. Written by `scripts/news_refresh.ts`.
 */
export type NewsItem = {
  /** The post's WordPress ID. */
  id: number;
  url: string;
  title: string;
  /** ISO 8601 in Manila time (+08:00). */
  publishedAt: string;
  categories: string[];
  /** When this site first saw the post (Manila time). */
  firstSeenAt: string;
  archive: NewsArchive | null;
  /** First failed "is it still live?" check; null while the post is live. */
  missingSince: string | null;
  /** Set by the second failed check; null while the post is live. */
  removedAt: string | null;
};

const MANILA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/;

function manilaIso(o: Obj, key: string, file: string, path = key): string {
  const v = str(o, key, file, path);
  if (!MANILA_ISO.test(v) || Number.isNaN(Date.parse(v))) {
    fail(
      file,
      path,
      "must be a Manila-time ISO date like 2026-11-25T14:00:00+08:00",
    );
  }
  return v;
}

function optManilaIso(
  o: Obj,
  key: string,
  file: string,
  path = key,
): string | null {
  return o[key] === undefined || o[key] === null
    ? null
    : manilaIso(o, key, file, path);
}

const CITY_URL = /^https:\/\/(www\.)?mandaluyong\.gov\.ph\//;

/**
 * Checks one `data/news/YYYY-MM.yaml` document (a list of posts) and returns
 * the items. `month` is the file's name without `.yaml`; every post must have
 * been published in that Manila month, and ids must be unique.
 */
export function parseNewsFile(
  raw: unknown,
  file: string,
  month: string,
): NewsItem[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    fail(file, "file name", "must be YYYY-MM.yaml");
  }
  if (!Array.isArray(raw)) fail(file, "document", "must be a list of posts");
  const seen = new Set<number>();
  return raw.map((entry, i): NewsItem => {
    const at = `[${i}]`;
    const o = obj(entry, file, at);
    const id = o.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) {
      fail(file, `${at}.id`, "must be a positive whole number");
    }
    if (seen.has(id)) fail(file, `${at}.id`, `${id} appears twice`);
    seen.add(id);
    const link = str(o, "url", file, `${at}.url`);
    if (!CITY_URL.test(link)) {
      fail(file, `${at}.url`, "must be a link on mandaluyong.gov.ph");
    }
    const publishedAt = manilaIso(
      o,
      "published_at",
      file,
      `${at}.published_at`,
    );
    if (!publishedAt.startsWith(month)) {
      fail(file, `${at}.published_at`, `is not in ${month}`);
    }
    let archive: NewsArchive | null = null;
    if (o.archive !== undefined && o.archive !== null) {
      const a = obj(o.archive, file, `${at}.archive`);
      const archiveUrl = optStr(a, "url", file, `${at}.archive.url`) ?? null;
      if (
        archiveUrl !== null &&
        !archiveUrl.startsWith("https://web.archive.org/")
      ) {
        fail(file, `${at}.archive.url`, "must be a web.archive.org link");
      }
      const attempts = a.attempts ?? 0;
      if (
        typeof attempts !== "number" ||
        !Number.isInteger(attempts) ||
        attempts < 0
      ) {
        fail(file, `${at}.archive.attempts`, "must be a whole number");
      }
      archive = {
        status: str(a, "status", file, `${at}.archive.status`),
        url: archiveUrl,
        requestedAt: optManilaIso(
          a,
          "requested_at",
          file,
          `${at}.archive.requested_at`,
        ),
        attempts,
      };
    }
    return {
      id,
      url: link,
      title: str(o, "title", file, `${at}.title`),
      publishedAt,
      categories: strList(o, "categories", file, `${at}.categories`),
      firstSeenAt: manilaIso(o, "first_seen_at", file, `${at}.first_seen_at`),
      archive,
      missingSince: optManilaIso(
        o,
        "missing_since",
        file,
        `${at}.missing_since`,
      ),
      removedAt: optManilaIso(o, "removed_at", file, `${at}.removed_at`),
    };
  });
}
