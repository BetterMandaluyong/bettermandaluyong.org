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

// ---------------------------------------------------------------------------
// City notices (data/bids/, data/jobs/): link-only records of the documents
// and job posts on mandaluyong.gov.ph. Written by scripts/notices_refresh.ts.

/**
 * What a bid notice is, from the city's Download Manager category:
 * invitation to bid, request for quotation, bid bulletin, notice of award,
 * notice to proceed, contract, procurement monitoring report, annual
 * procurement plan, or another notice in the bids section.
 */
export type BidKind =
  | "itb"
  | "rfq"
  | "bulletin"
  | "noa"
  | "ntp"
  | "contract"
  | "pmr"
  | "app"
  | "other";

export const BID_KINDS: readonly BidKind[] = [
  "itb",
  "rfq",
  "bulletin",
  "noa",
  "ntp",
  "contract",
  "pmr",
  "app",
  "other",
];

/**
 * Where a job comes from: `vacancy` is a City Hall bulletin of vacancies (a
 * document), `peso` is a private employer's opening posted by the city's
 * Public Employment Service Office.
 */
export type JobKind = "vacancy" | "peso";

export const JOB_KINDS: readonly JobKind[] = ["vacancy", "peso"];

/**
 * One bid document or job post on the city site. Link-only: title, date, and
 * kind, never the document or the job text. Loaded from
 * `data/bids/YYYY.yaml` or `data/jobs/YYYY.yaml`, where YYYY is the Manila
 * year of `publishedAt`.
 */
export type CityNotice<K extends string = string> = {
  /** The WordPress post id (a Download Manager package or an AWSM job). */
  id: number;
  url: string;
  title: string;
  kind: K;
  /** ISO 8601 in Manila time (+08:00). */
  publishedAt: string;
  /** When this site first saw it (Manila time). */
  firstSeenAt: string;
  /** First run that didn't find it on the city site; null while it is there. */
  missingSince: string | null;
  /** Set by the second run in a row that didn't find it. */
  removedAt: string | null;
};

/** A bid notice from `data/bids/`. */
export type BidNotice = CityNotice<BidKind>;
/** A job from `data/jobs/`. */
export type JobNotice = CityNotice<JobKind>;

function parseNoticeFile<K extends string>(
  raw: unknown,
  file: string,
  year: string,
  kinds: readonly K[],
): CityNotice<K>[] {
  if (!/^\d{4}$/.test(year)) fail(file, "file name", "must be YYYY.yaml");
  if (!Array.isArray(raw)) fail(file, "document", "must be a list");
  const seen = new Set<number>();
  return raw.map((entry, i): CityNotice<K> => {
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
    const kind = str(o, "kind", file, `${at}.kind`);
    if (!(kinds as readonly string[]).includes(kind)) {
      fail(file, `${at}.kind`, `must be one of ${kinds.join(", ")}`);
    }
    const publishedAt = manilaIso(
      o,
      "published_at",
      file,
      `${at}.published_at`,
    );
    if (!publishedAt.startsWith(year)) {
      fail(file, `${at}.published_at`, `is not in ${year}`);
    }
    return {
      id,
      url: link,
      title: str(o, "title", file, `${at}.title`),
      kind: kind as K,
      publishedAt,
      firstSeenAt: manilaIso(o, "first_seen_at", file, `${at}.first_seen_at`),
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

/**
 * Checks one `data/bids/YYYY.yaml` document (a list of bid notices). `year`
 * is the file's name without `.yaml`; every notice must be published in that
 * Manila year, ids must be unique, and `kind` one of `BID_KINDS`.
 */
export function parseBidsFile(
  raw: unknown,
  file: string,
  year: string,
): BidNotice[] {
  return parseNoticeFile(raw, file, year, BID_KINDS);
}

/** Checks one `data/jobs/YYYY.yaml` document, as `parseBidsFile` does, with `JOB_KINDS`. */
export function parseJobsFile(
  raw: unknown,
  file: string,
  year: string,
): JobNotice[] {
  return parseNoticeFile(raw, file, year, JOB_KINDS);
}

// ---------------------------------------------------------------------------
// National budget (data/budget/). scope.yaml is hand-edited; fy2027.yaml and
// gaa.yaml are written by scripts/budget_refresh.ts from the BetterGov.ph
// Budget API (https://budget.bettergov.ph/docs). Amounts are whole pesos.

/** The 2027 programs whose House bill lists projects one by one. */
export type BudgetProgram = "dpwh" | "fmr" | "hfep" | "nia";

export const BUDGET_PROGRAMS: readonly BudgetProgram[] = [
  "dpwh",
  "fmr",
  "hfep",
  "nia",
];

/** A line left out by hand, and why. Shown on the page. */
export type BudgetExclusion = {
  /** `<program>:<api id>` for a 2027 line, `gaa:<fam_key>` for a 2020–2026 program. */
  id: string;
  reason: string;
};

/** `data/budget/scope.yaml`: what the refresh script asks the API for. */
export type BudgetScope = {
  /** The place name searched in titles, kept only as a whole word. */
  place: string;
  /** API region key; 2027 lines in another region are dropped. */
  region: string;
  /** The API's legislative district id, e.g. "leg:mandaluyong-city:lone". */
  district: string;
  exclude: BudgetExclusion[];
};

/** One disclaimer, word for word as the API sends it. */
export type BudgetDisclaimer = {
  id: string;
  title: string;
  body: string;
  url: string;
};

/** A DPWH office that serves the district, with its whole (unsplit) tier. */
export type BudgetOffice = {
  name: string;
  kind: string;
  tier: string;
  tierText: string;
  /** Labels of the other districts the office serves. */
  coServed: string[];
};

/** The API's card for the city's legislative district. */
export type BudgetDistrict = {
  id: string;
  label: string;
  url: string;
  /** "A", "B", "mixed" or "none": whose budget the figures are. */
  attribution: string;
  attributionLabel: string;
  offices: BudgetOffice[];
  /** Whole-office figures; shared and never split when the tier is B. */
  headline: {
    gaa2026: number | null;
    nep2027: number | null;
    house2027: number | null;
  };
  /** The like-for-like 2027 change on the same named projects. */
  vsProposal: {
    nep: number | null;
    house: number | null;
    delta: number | null;
  };
};

/** One 2027 project line: the NEP against the House bill. */
export type BudgetProject = {
  /** `<program>:<api id>`; also the exclusion id. */
  key: string;
  program: BudgetProgram;
  title: string;
  /** The program line the documents file it under. */
  line: string | null;
  office: string | null;
  /** The API's plain status label, e.g. "House bill only". */
  status: string;
  /** The API's group: house_only, nep_only, unchanged, increased, decreased, scope_review. */
  group: string;
  /** True for an unconfirmed (fuzzy or ambiguous) match. */
  held: boolean;
  /** null means the document has no such line, never zero. */
  nep: number | null;
  house: number | null;
  delta: number | null;
  /** The line's page on budget.bettergov.ph. */
  url: string;
  nepPdf: string | null;
  housePdf: string | null;
  lat: number | null;
  lon: number | null;
};

/** `data/budget/fy2027.yaml`. */
export type Budget2027 = {
  /** When the snapshot was taken (YYYY-MM-DD). */
  fetchedAt: string;
  /** The API's build of the comparison. */
  source: { builtAt: string; commit: string; notice: string };
  disclaimers: BudgetDisclaimer[];
  /** Program key → its label as the API publishes it. */
  programs: Record<BudgetProgram, string>;
  district: BudgetDistrict;
  projects: BudgetProject[];
};

/** One 2020–2026 program family (one name in one agency) that names the place. */
export type BudgetGaaProgram = {
  /** The API's `fam_key`; also the exclusion id after `gaa:`. */
  key: string;
  department: string;
  name: string;
  /** Year → amount, only for years where the amount is above zero. */
  amounts: Record<string, number>;
};

/** `data/budget/gaa.yaml`. */
export type BudgetGaa = {
  fetchedAt: string;
  years: number[];
  /** Department id → name. */
  departments: Record<string, string>;
  programs: BudgetGaaProgram[];
};

function peso(o: Obj, key: string, file: string, path = key): number | null {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isInteger(v)) {
    fail(file, path, "must be a whole number of pesos or null");
  }
  return v;
}

function optNum(o: Obj, key: string, file: string, path = key): number | null {
  const v = o[key];
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) {
    fail(file, path, "must be a number or null");
  }
  return v;
}

function list(o: Obj, key: string, file: string, path = key): unknown[] {
  const v = o[key] ?? [];
  if (!Array.isArray(v)) fail(file, path, "must be a list");
  return v;
}

function optUrl(o: Obj, key: string, file: string, path = key): string | null {
  return o[key] === undefined || o[key] === null
    ? null
    : url(o, key, file, path);
}

/** Checks `data/budget/scope.yaml`. Exclusion ids must be unique and carry a reason. */
export function parseBudgetScope(raw: unknown, file: string): BudgetScope {
  const o = obj(raw, file, "document");
  const district = str(o, "district", file);
  if (!district.startsWith("leg:")) {
    fail(file, "district", "must be an API district id like leg:…");
  }
  const seen = new Set<string>();
  const exclude = list(o, "exclude", file).map((entry, i) => {
    const at = `exclude[${i}]`;
    const e = obj(entry, file, at);
    const id = str(e, "id", file, `${at}.id`);
    if (!/^(dpwh|fmr|hfep|nia|gaa):.+/.test(id)) {
      fail(
        file,
        `${at}.id`,
        "must start with dpwh:, fmr:, hfep:, nia: or gaa:",
      );
    }
    if (seen.has(id)) fail(file, `${at}.id`, `${id} appears twice`);
    seen.add(id);
    return { id, reason: str(e, "reason", file, `${at}.reason`) };
  });
  return {
    place: str(o, "place", file),
    region: str(o, "region", file),
    district,
    exclude,
  };
}

function parseDisclaimers(o: Obj, file: string): BudgetDisclaimer[] {
  const out = list(o, "disclaimers", file).map((entry, i) => {
    const at = `disclaimers[${i}]`;
    const d = obj(entry, file, at);
    return {
      id: str(d, "id", file, `${at}.id`),
      title: str(d, "title", file, `${at}.title`),
      body: str(d, "body", file, `${at}.body`),
      url: url(d, "url", file, `${at}.url`),
    };
  });
  if (out.length === 0) fail(file, "disclaimers", "must not be empty");
  return out;
}

/** Checks `data/budget/fy2027.yaml`. Keys are unique; amounts are whole pesos or null. */
export function parseBudget2027(raw: unknown, file: string): Budget2027 {
  const o = obj(raw, file, "document");
  const s = obj(o.source, file, "source");
  const p = obj(o.programs, file, "programs");
  const programs = {} as Record<BudgetProgram, string>;
  for (const key of BUDGET_PROGRAMS) {
    programs[key] = str(p, key, file, `programs.${key}`);
  }
  const d = obj(o.district, file, "district");
  const h = obj(d.headline, file, "district.headline");
  const v = obj(d.vs_proposal, file, "district.vs_proposal");
  const seen = new Set<string>();
  const projects = list(o, "projects", file).map((entry, i): BudgetProject => {
    const at = `projects[${i}]`;
    const r = obj(entry, file, at);
    const key = str(r, "key", file, `${at}.key`);
    if (seen.has(key)) fail(file, `${at}.key`, `${key} appears twice`);
    seen.add(key);
    const program = str(r, "program", file, `${at}.program`);
    if (!BUDGET_PROGRAMS.includes(program as BudgetProgram)) {
      fail(
        file,
        `${at}.program`,
        `must be one of ${BUDGET_PROGRAMS.join(", ")}`,
      );
    }
    if (!key.startsWith(`${program}:`)) {
      fail(file, `${at}.key`, `must start with ${program}:`);
    }
    const held = r.held ?? false;
    if (typeof held !== "boolean")
      fail(file, `${at}.held`, "must be true or false");
    const nep = peso(r, "nep", file, `${at}.nep`);
    const house = peso(r, "house", file, `${at}.house`);
    if (nep === null && house === null) {
      fail(file, at, "must have an amount in at least one version");
    }
    return {
      key,
      program: program as BudgetProgram,
      title: str(r, "title", file, `${at}.title`),
      line: optStr(r, "line", file, `${at}.line`) ?? null,
      office: optStr(r, "office", file, `${at}.office`) ?? null,
      status: str(r, "status", file, `${at}.status`),
      group: str(r, "group", file, `${at}.group`),
      held,
      nep,
      house,
      delta: peso(r, "delta", file, `${at}.delta`),
      url: url(r, "url", file, `${at}.url`),
      nepPdf: optUrl(r, "nep_pdf", file, `${at}.nep_pdf`),
      housePdf: optUrl(r, "house_pdf", file, `${at}.house_pdf`),
      lat: optNum(r, "lat", file, `${at}.lat`),
      lon: optNum(r, "lon", file, `${at}.lon`),
    };
  });
  return {
    fetchedAt: isoDate(o, "fetched_at", file, "fetched_at"),
    source: {
      builtAt: str(s, "built_at", file, "source.built_at"),
      commit: str(s, "commit", file, "source.commit"),
      notice: str(s, "notice", file, "source.notice"),
    },
    disclaimers: parseDisclaimers(o, file),
    programs,
    district: {
      id: str(d, "id", file, "district.id"),
      label: str(d, "label", file, "district.label"),
      url: url(d, "url", file, "district.url"),
      attribution: str(d, "attribution", file, "district.attribution"),
      attributionLabel: str(
        d,
        "attribution_label",
        file,
        "district.attribution_label",
      ),
      offices: list(d, "offices", file, "district.offices").map((entry, i) => {
        const at = `district.offices[${i}]`;
        const f = obj(entry, file, at);
        return {
          name: str(f, "name", file, `${at}.name`),
          kind: str(f, "kind", file, `${at}.kind`),
          tier: str(f, "tier", file, `${at}.tier`),
          tierText: str(f, "tier_text", file, `${at}.tier_text`),
          coServed: strList(f, "co_served", file, `${at}.co_served`),
        };
      }),
      headline: {
        gaa2026: peso(h, "gaa_2026", file, "district.headline.gaa_2026"),
        nep2027: peso(h, "nep_2027", file, "district.headline.nep_2027"),
        house2027: peso(h, "house_2027", file, "district.headline.house_2027"),
      },
      vsProposal: {
        nep: peso(v, "nep", file, "district.vs_proposal.nep"),
        house: peso(v, "house", file, "district.vs_proposal.house"),
        delta: peso(v, "delta", file, "district.vs_proposal.delta"),
      },
    },
    projects,
  };
}

/**
 * Checks `data/budget/gaa.yaml`. Every program's department must be listed,
 * every amount must be a positive whole number in one of `years`.
 */
export function parseBudgetGaa(raw: unknown, file: string): BudgetGaa {
  const o = obj(raw, file, "document");
  const years = list(o, "years", file).map((y, i) => {
    if (typeof y !== "number" || !Number.isInteger(y) || y < 2000) {
      fail(file, `years[${i}]`, "must be a year");
    }
    return y;
  });
  if (years.length === 0) fail(file, "years", "must not be empty");
  const deps = obj(o.departments, file, "departments");
  const departments: Record<string, string> = {};
  for (const id of Object.keys(deps)) {
    departments[id] = str(deps, id, file, `departments.${id}`);
  }
  const seen = new Set<string>();
  const programs = list(o, "programs", file).map(
    (entry, i): BudgetGaaProgram => {
      const at = `programs[${i}]`;
      const r = obj(entry, file, at);
      const key = str(r, "key", file, `${at}.key`);
      if (seen.has(key)) fail(file, `${at}.key`, `${key} appears twice`);
      seen.add(key);
      const department = str(r, "department", file, `${at}.department`);
      if (!(department in departments)) {
        fail(file, `${at}.department`, `${department} is not in departments`);
      }
      const a = obj(r.amounts, file, `${at}.amounts`);
      const amounts: Record<string, number> = {};
      for (const [year, amount] of Object.entries(a)) {
        if (!years.includes(Number(year))) {
          fail(file, `${at}.amounts.${year}`, "is not one of the years");
        }
        if (
          typeof amount !== "number" ||
          !Number.isInteger(amount) ||
          amount <= 0
        ) {
          fail(
            file,
            `${at}.amounts.${year}`,
            "must be a positive whole number",
          );
        }
        amounts[year] = amount;
      }
      if (Object.keys(amounts).length === 0) {
        fail(file, `${at}.amounts`, "must have at least one year");
      }
      return {
        key,
        department,
        name: str(r, "name", file, `${at}.name`),
        amounts,
      };
    },
  );
  return {
    fetchedAt: isoDate(o, "fetched_at", file, "fetched_at"),
    years,
    departments,
    programs,
  };
}

// ── Pay (data/pay.yaml) ─────────────────────────────────────────────────────

/** Every elected office the site lists, city and barangay. */
export type Office =
  CitySeat | "captain" | "kagawad" | "sk-chair" | "sk-kagawad";

/** Every office, from the House down to the SK. `data/pay.yaml` must cover each. */
export const OFFICES: readonly Office[] = [
  "representative",
  "mayor",
  "vice-mayor",
  "councilor",
  "captain",
  "kagawad",
  "sk-chair",
  "sk-kagawad",
];

/** A document cited as a source: its title and link. */
export type Citation = { title: string; url: string };

/** One year's salary schedule: the DBM circulars and the Step 1 rate per grade. */
export type PayTranche = {
  year: number;
  /** The National Budget Circular (national government pay). */
  national: Citation;
  /** The Local Budget Circular (special and 1st-class cities, 100%). */
  local: Citation;
  /** Monthly pesos at Step 1, by salary grade. */
  step1: Record<number, number>;
};

/** How the law sets one office's pay. */
export type OfficePay = {
  grade: number;
  /** True for an honorarium "not to exceed" the grade, not a fixed salary. */
  cap: boolean;
  /** Which circular's table applies: `national` for the House. */
  schedule: "national" | "local";
  /** The law or circular that sets the grade, e.g. "Republic Act No. 7675, Sec. 8". */
  basis: string;
  url: string;
  /** Set when no document we found states the grade for this city. */
  unconfirmed: boolean;
};

/** The whole `data/pay.yaml` file. */
export type Pay = {
  /** When the figures were last checked against the circulars (YYYY-MM-DD). */
  checked: string;
  law: Citation;
  /** Oldest first, one per year. */
  tranches: PayTranche[];
  offices: Record<Office, OfficePay>;
};

function citation(raw: unknown, file: string, at: string): Citation {
  const c = obj(raw, file, at);
  return {
    title: str(c, "title", file, `${at}.title`),
    url: url(c, "url", file, `${at}.url`),
  };
}

function salaryGrade(v: unknown, file: string, at: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 33) {
    fail(file, at, "must be a salary grade from 1 to 33");
  }
  return v;
}

/**
 * Checks `data/pay.yaml`: tranches oldest first with whole-peso rates that
 * rise with the grade, and every office in `OFFICES` with a grade that each
 * tranche lists.
 */
export function parsePay(raw: unknown, file: string): Pay {
  const o = obj(raw, file, "document");
  let lastYear = 0;
  const tranches = list(o, "tranches", file).map((entry, i): PayTranche => {
    const at = `tranches[${i}]`;
    const t = obj(entry, file, at);
    const year = t.year;
    if (typeof year !== "number" || !Number.isInteger(year) || year < 2000) {
      fail(file, `${at}.year`, "must be a year");
    }
    if (year <= lastYear)
      fail(file, `${at}.year`, "must come after the one before");
    lastYear = year;
    const rates = obj(t.step1, file, `${at}.step1`);
    const step1: Record<number, number> = {};
    let lastRate = 0;
    const grades = Object.keys(rates)
      .map((g) => salaryGrade(Number(g), file, `${at}.step1.${g}`))
      .sort((a, b) => a - b);
    for (const grade of grades) {
      const rate = rates[grade];
      if (typeof rate !== "number" || !Number.isInteger(rate) || rate <= 0) {
        fail(
          file,
          `${at}.step1.${grade}`,
          "must be a positive whole number of pesos",
        );
      }
      if (rate <= lastRate) {
        fail(
          file,
          `${at}.step1.${grade}`,
          "must be more than the grade below it",
        );
      }
      lastRate = rate;
      step1[grade] = rate;
    }
    return {
      year,
      national: citation(t.national, file, `${at}.national`),
      local: citation(t.local, file, `${at}.local`),
      step1,
    };
  });
  if (tranches.length === 0) fail(file, "tranches", "must not be empty");
  const raws = obj(o.offices, file, "offices");
  for (const key of Object.keys(raws)) {
    if (!OFFICES.includes(key as Office)) {
      fail(file, `offices.${key}`, `is not one of ${OFFICES.join(", ")}`);
    }
  }
  const offices = Object.fromEntries(
    OFFICES.map((office): [Office, OfficePay] => {
      const at = `offices.${office}`;
      const p = obj(raws[office], file, at);
      const grade = salaryGrade(p.grade, file, `${at}.grade`);
      for (const [i, t] of tranches.entries()) {
        if (!(grade in t.step1)) {
          fail(
            file,
            `${at}.grade`,
            `SG ${grade} is missing from tranches[${i}].step1`,
          );
        }
      }
      if (p.cap !== undefined && typeof p.cap !== "boolean") {
        fail(file, `${at}.cap`, "must be true or false");
      }
      if (p.schedule !== "national" && p.schedule !== "local") {
        fail(file, `${at}.schedule`, "must be national or local");
      }
      if (p.note !== undefined && p.note !== "unconfirmed") {
        fail(file, `${at}.note`, "must be unconfirmed, or left out");
      }
      return [
        office,
        {
          grade,
          cap: p.cap === true,
          schedule: p.schedule,
          basis: str(p, "basis", file, `${at}.basis`),
          url: url(p, "url", file, `${at}.url`),
          unconfirmed: p.note === "unconfirmed",
        },
      ];
    }),
  ) as Record<Office, OfficePay>;
  return {
    checked: isoDate(o, "checked", file, "checked"),
    law: citation(o.law, file, "law"),
    tranches,
    offices,
  };
}

// ── City statistics (data/stats/*.yaml) ─────────────────────────────────────

function wholeCount(v: unknown, file: string, at: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    fail(file, at, "must be a whole number, 0 or more");
  }
  return v;
}

/** One census: when it counted, its official city total, and where we read it. */
export type Census = {
  year: number;
  /** The census reference date (YYYY-MM-DD). */
  date: string;
  /** The city's official total. The barangays add up to it. */
  total: number;
  /** The proclamation that made the counts official. */
  proclamation: Citation;
  /** Where the barangay counts were read. */
  source: Citation;
  /** False while the counts come from a secondary source not yet compared with PSA's file. */
  checked: boolean;
};

/** The whole `data/stats/population.yaml` file. */
export type Population = {
  /** Oldest first. */
  censuses: Census[];
  /** Barangay slug → census year → people counted. */
  barangays: Record<string, Record<number, number>>;
};

/**
 * Checks `data/stats/population.yaml`: censuses oldest first, every barangay
 * counted in every census, and each census's barangays adding up to its
 * official total.
 */
export function parsePopulation(raw: unknown, file: string): Population {
  const o = obj(raw, file, "document");
  let lastYear = 0;
  const censuses = list(o, "censuses", file).map((entry, i): Census => {
    const at = `censuses[${i}]`;
    const c = obj(entry, file, at);
    const year = c.year;
    if (
      typeof year !== "number" ||
      !Number.isInteger(year) ||
      year <= lastYear
    ) {
      fail(file, `${at}.year`, "must be a year after the one before");
    }
    lastYear = year;
    if (typeof c.checked !== "boolean") {
      fail(file, `${at}.checked`, "must be true or false");
    }
    return {
      year,
      date: isoDate(c, "date", file, `${at}.date`),
      total: wholeCount(c.total, file, `${at}.total`),
      proclamation: citation(c.proclamation, file, `${at}.proclamation`),
      source: citation(c.source, file, `${at}.source`),
      checked: c.checked,
    };
  });
  if (censuses.length === 0) fail(file, "censuses", "must not be empty");
  const raws = obj(o.barangays, file, "barangays");
  const barangays: Record<string, Record<number, number>> = {};
  const sums = new Map(censuses.map((c) => [c.year, 0]));
  for (const [slug, counts] of Object.entries(raws)) {
    const at = `barangays.${slug}`;
    if (!PERSON_SLUG.test(slug)) fail(file, at, "must be a barangay slug");
    const r = obj(counts, file, at);
    const byYear: Record<number, number> = {};
    for (const key of Object.keys(r)) {
      if (!sums.has(Number(key)))
        fail(file, `${at}.${key}`, "is not a census year");
    }
    for (const c of censuses) {
      const n = wholeCount(r[c.year], file, `${at}.${c.year}`);
      byYear[c.year] = n;
      sums.set(c.year, sums.get(c.year)! + n);
    }
    barangays[slug] = byYear;
  }
  for (const [i, c] of censuses.entries()) {
    const sum = sums.get(c.year)!;
    if (sum !== c.total) {
      fail(
        file,
        `censuses[${i}].total`,
        `is ${c.total}, but the barangays add up to ${sum}`,
      );
    }
  }
  return { censuses, barangays };
}

/** How far the barangays' hectares may be from the stated total (rounding in the city's table). */
export const LAND_AREA_TOLERANCE = 0.5;

/** The whole `data/stats/land-area.yaml` file. */
export type LandArea = {
  /** The city's table. */
  source: Citation;
  /** When we copied the table (YYYY-MM-DD); the table itself has no date. */
  read: string;
  /** The city's stated total, in hectares. */
  total: number;
  /** Barangay slug → hectares. */
  barangays: Record<string, number>;
};

function hectares(v: unknown, file: string, at: string): number {
  if (
    typeof v !== "number" ||
    !(v > 0) ||
    Math.abs(Math.round(v * 100) - v * 100) > 1e-6
  ) {
    fail(file, at, "must be hectares above 0, with at most 2 decimals");
  }
  return v;
}

/**
 * Checks `data/stats/land-area.yaml`: a cited source and read date, every
 * barangay's hectares above 0, and the barangays adding up to the stated
 * total within `LAND_AREA_TOLERANCE`.
 */
export function parseLandArea(raw: unknown, file: string): LandArea {
  const o = obj(raw, file, "document");
  const total = hectares(o.total, file, "total");
  const raws = obj(o.barangays, file, "barangays");
  const barangays: Record<string, number> = {};
  let sum = 0;
  for (const [slug, v] of Object.entries(raws)) {
    const at = `barangays.${slug}`;
    if (!PERSON_SLUG.test(slug)) fail(file, at, "must be a barangay slug");
    barangays[slug] = hectares(v, file, at);
    sum += barangays[slug];
  }
  if (Object.keys(barangays).length === 0) {
    fail(file, "barangays", "must not be empty");
  }
  if (Math.abs(sum - total) > LAND_AREA_TOLERANCE) {
    fail(
      file,
      "total",
      `is ${total}, but the barangays add up to ${Math.round(sum * 100) / 100}`,
    );
  }
  return {
    source: citation(o.source, file, "source"),
    read: isoDate(o, "read", file, "read"),
    total,
    barangays,
  };
}

/** One area's poverty estimate for one year. */
export type PovertyEstimate = {
  /** Percent of people below the poverty threshold. */
  incidence: number;
  /** Coefficient of variation, percent. Over 10 means "use with caution". */
  cv: number;
  /** The confidence interval (`Poverty.confidence`), percent. */
  low: number;
  high: number;
  /** Estimated number of poor people. */
  poor: number;
};

/** The areas `poverty.yaml` compares. */
export const POVERTY_AREAS = ["city", "ncr", "philippines"] as const;

/** One of `POVERTY_AREAS`. */
export type PovertyArea = (typeof POVERTY_AREAS)[number];

/** One area's estimates by year, and the changes PSA marks significant. */
export type PovertySeries = {
  /** Year → estimate. */
  years: Record<number, PovertyEstimate>;
  /** Pairs like "2021-2023" whose change PSA marks significant at 5%. */
  significant: string[];
};

/** The whole `data/stats/poverty.yaml` file. */
export type Poverty = {
  /** The years estimated, oldest first. */
  years: number[];
  release: Citation;
  /** When PSA released the publication (YYYY-MM-DD). */
  released: string;
  /** The confidence level of `low`–`high`, percent. */
  confidence: number;
  /** Year → pesos a person needs for the year, in NCR. */
  threshold: Record<number, number>;
  areas: Record<PovertyArea, PovertySeries>;
};

function percent(o: Obj, key: string, file: string, at: string): number {
  const v = o[key];
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 100) {
    fail(file, `${at}.${key}`, "must be a percent from 0 to 100");
  }
  return v;
}

/**
 * Checks `data/stats/poverty.yaml`: every area has an estimate for every
 * year, each inside its own interval, and significant changes name two of
 * the years.
 */
export function parsePoverty(raw: unknown, file: string): Poverty {
  const o = obj(raw, file, "document");
  let last = 0;
  const years = list(o, "years", file).map((y, i) => {
    if (typeof y !== "number" || !Number.isInteger(y) || y <= last) {
      fail(file, `years[${i}]`, "must be a year after the one before");
    }
    last = y;
    return y;
  });
  if (years.length === 0) fail(file, "years", "must not be empty");
  const t = obj(o.threshold, file, "threshold");
  const threshold = Object.fromEntries(
    years.map((y) => [y, wholeCount(t[y], file, `threshold.${y}`)]),
  );
  const confidence = o.confidence;
  if (confidence !== 90 && confidence !== 95) {
    fail(file, "confidence", "must be 90 or 95");
  }
  const a = obj(o.areas, file, "areas");
  const series = (key: PovertyArea): PovertySeries => {
    const at = `areas.${key}`;
    const r = obj(a[key], file, at);
    const byYear: Record<number, PovertyEstimate> = {};
    for (const y of years) {
      const yat = `${at}.${y}`;
      const e = obj(r[y], file, yat);
      const est = {
        incidence: percent(e, "incidence", file, yat),
        cv: percent(e, "cv", file, yat),
        low: percent(e, "low", file, yat),
        high: percent(e, "high", file, yat),
        poor: wholeCount(e.poor, file, `${yat}.poor`),
      };
      if (est.low > est.incidence || est.incidence > est.high) {
        fail(file, `${yat}.incidence`, "must sit between low and high");
      }
      byYear[y] = est;
    }
    const significant = strList(r, "significant", file, `${at}.significant`);
    significant.forEach((pair, i) => {
      const m = pair.match(/^(\d{4})-(\d{4})$/);
      if (!m || !years.includes(+m[1]!) || !years.includes(+m[2]!)) {
        fail(
          file,
          `${at}.significant[${i}]`,
          "must be two of the years, like 2021-2023",
        );
      }
    });
    return { years: byYear, significant };
  };
  return {
    years,
    release: citation(o.release, file, "release"),
    released: isoDate(o, "released", file, "released"),
    confidence,
    threshold,
    areas: {
      city: series("city"),
      ncr: series("ncr"),
      philippines: series("philippines"),
    },
  };
}

/** Where the city's operating income comes from, as `finances.yaml` lists it. */
export const INCOME_LINES = [
  "real-property-tax",
  "business-tax",
  "other-taxes",
  "fees-and-charges",
  "national-tax-allotment",
  "other-national",
] as const;

/** What the city spends its operating budget on, as `finances.yaml` lists it. */
export const SPENDING_LINES = [
  "general-public-services",
  "health",
  "education",
  "social-welfare",
  "housing",
  "labor",
  "economic-services",
  "interest",
] as const;

export type IncomeLine = (typeof INCOME_LINES)[number];
export type SpendingLine = (typeof SPENDING_LINES)[number];

/** A total and the lines it is made of, in pesos. */
export type Breakdown<K extends string> = {
  total: number;
  lines: Record<K, number>;
};

/** The whole `data/stats/finances.yaml` file. Amounts are whole pesos. */
export type Finances = {
  year: number;
  preliminary: boolean;
  /** When BLGF extracted the figures (YYYY-MM-DD). */
  extracted: string;
  source: Citation;
  /** BLGF's page that lists its data files. */
  page: string;
  income: Breakdown<IncomeLine>;
  spending: Breakdown<SpendingLine>;
  capitalOutlay: number;
  loanPrincipal: number;
  cashEnd: number;
};

function breakdown<K extends string>(
  raw: unknown,
  keys: readonly K[],
  file: string,
  at: string,
): Breakdown<K> {
  const b = obj(raw, file, at);
  const total = wholeCount(b.total, file, `${at}.total`);
  const l = obj(b.lines, file, `${at}.lines`);
  for (const key of Object.keys(l)) {
    if (!keys.includes(key as K)) {
      fail(file, `${at}.lines.${key}`, `is not one of ${keys.join(", ")}`);
    }
  }
  const lines = Object.fromEntries(
    keys.map((k) => [k, wholeCount(l[k], file, `${at}.lines.${k}`)]),
  ) as Record<K, number>;
  const sum = keys.reduce((s, k) => s + lines[k], 0);
  // Each line was rounded to whole pesos on its own, so allow a few pesos.
  if (Math.abs(sum - total) > keys.length) {
    fail(file, `${at}.total`, `is ${total}, but the lines add up to ${sum}`);
  }
  return { total, lines };
}

/** Checks `data/stats/finances.yaml`: every line known, and each breakdown adding up to its total. */
export function parseFinances(raw: unknown, file: string): Finances {
  const o = obj(raw, file, "document");
  const year = o.year;
  if (typeof year !== "number" || !Number.isInteger(year) || year < 2000) {
    fail(file, "year", "must be a year");
  }
  if (typeof o.preliminary !== "boolean") {
    fail(file, "preliminary", "must be true or false");
  }
  return {
    year,
    preliminary: o.preliminary,
    extracted: isoDate(o, "extracted", file, "extracted"),
    source: citation(o.source, file, "source"),
    page: url(o, "page", file),
    income: breakdown(o.income, INCOME_LINES, file, "income"),
    spending: breakdown(o.spending, SPENDING_LINES, file, "spending"),
    capitalOutlay: wholeCount(o["capital-outlay"], file, "capital-outlay"),
    loanPrincipal: wholeCount(o["loan-principal"], file, "loan-principal"),
    cashEnd: wholeCount(o["cash-end"], file, "cash-end"),
  };
}
