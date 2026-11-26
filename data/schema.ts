// Validators for the YAML data files. Each throws an Error that names the
// file and the field, so a broken data file fails the build with a message a
// person can act on. No runtime dependencies.

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
  /** The barangay captain (Punong Barangay). */
  captain: string;
  /** Barangay kagawads (councilors). */
  kagawads: string[];
  /** Sangguniang Kabataan chairperson. */
  skChair: string;
  skKagawads: string[];
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
 * Checks one barangay YAML document and returns it as a `Barangay`. `file`
 * is the path shown in error messages; `slug` comes from the file name.
 */
export function parseBarangay(
  raw: unknown,
  file: string,
  slug: string,
): Barangay {
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
  let dilg: Barangay["dilg"];
  if (o.dilg !== undefined && o.dilg !== null) {
    const d = obj(o.dilg, file, "dilg");
    dilg = {
      url: url(d, "url", file, "dilg.url"),
      retrieved: isoDate(d, "retrieved", file, "dilg.retrieved"),
    };
  }
  const flags = parseFlags(o.flags, file);
  const barangay: Barangay = {
    slug,
    name: str(o, "name", file),
    code,
    district: district(o, file),
    zip,
    address: str(hall, "address", file, "hall.address"),
    phones: strList(hall, "phones", file, "hall.phones", { min: 1 }),
    ...(email ? { email } : {}),
    captain: str(council, "captain", file, "council.captain"),
    kagawads: strList(council, "kagawads", file, "council.kagawads", {
      min: 7,
      max: 7,
    }),
    skChair: str(sk, "chair", file, "sk.chair"),
    // The city lists fewer SK kagawads where seats are vacant.
    skKagawads: strList(sk, "kagawads", file, "sk.kagawads", {
      min: 1,
      max: 7,
    }),
    sourceUrl: url(source, "url", file, "source.url"),
    sourceModified: updated,
    ...(dilg ? { dilg } : {}),
    flags,
  };
  // A flag must describe what the site shows: a changed name is on the page,
  // a kept city name is on the page, and a DILG-only name isn't.
  for (const [i, f] of flags.entries()) {
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

/** A city-level elected official and how the city publishes their contacts. */
export type CityOfficial = {
  name: string;
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

function parseCityOfficial(
  raw: unknown,
  file: string,
  path: string,
): CityOfficial {
  const o = obj(raw, file, path);
  const emails = strList(o, "emails", file, `${path}.emails`, { min: 1 });
  for (const e of emails) {
    if (!/^[^@\s]+@[^@\s]+$/.test(e))
      fail(file, `${path}.emails`, `has an invalid email "${e}"`);
  }
  return {
    name: str(o, "name", file, `${path}.name`),
    role: str(o, "role", file, `${path}.role`),
    ...(o.district !== undefined ? { district: district(o, file) } : {}),
    office: str(o, "office", file, `${path}.office`),
    phones: strList(o, "phones", file, `${path}.phones`, { min: 1 }),
    emails,
    sourceUrl: url(o, "source_url", file, `${path}.source_url`),
  };
}

/** The whole `data/city-officials.yaml` file. */
export type CityOfficials = {
  /** When the city's directory page was last edited (YYYY-MM-DD). */
  asOf: string;
  sourceUrl: string;
  representative: CityOfficial;
  mayor: CityOfficial;
  viceMayor: CityOfficial;
  councilors: CityOfficial[];
};

/** Checks `data/city-officials.yaml` and returns it typed. */
export function parseCityOfficials(raw: unknown, file: string): CityOfficials {
  const o = obj(raw, file, "document");
  const asOf = str(o, "as_of", file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf))
    fail(file, "as_of", "must be a YYYY-MM-DD date");
  const list = o.councilors;
  if (!Array.isArray(list)) fail(file, "councilors", "must be a list");
  const councilors = list.map((c, i) =>
    parseCityOfficial(c, file, `councilors[${i}]`),
  );
  for (const [i, c] of councilors.entries()) {
    if (!c.district) fail(file, `councilors[${i}].district`, "must be 1 or 2");
  }
  return {
    asOf,
    sourceUrl: url(o, "source_url", file),
    representative: parseCityOfficial(o.representative, file, "representative"),
    mayor: parseCityOfficial(o.mayor, file, "mayor"),
    viceMayor: parseCityOfficial(o.vice_mayor, file, "vice_mayor"),
    councilors,
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
