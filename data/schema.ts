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
  /** Punong Barangay (the barangay captain). */
  captain: string;
  /** Barangay kagawads (councilors). */
  kagawads: string[];
  /** Sangguniang Kabataan chairperson. */
  skChair: string;
  skKagawads: string[];
  /** The city page the data came from, and its last edit date (YYYY-MM-DD). */
  sourceUrl: string;
  sourceModified: string;
};

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
  return {
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
  };
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
