// Builds data/barangays/<slug>.yaml (one per barangay) and
// public/data/mandaluyong-barangays.geojson from the city's public pages.
// The shapes written here are the government's simplified ones; run
// scripts/import_boundaries_osm.ts afterwards to swap in detailed outlines.
//
//   node scripts/import_barangays.ts <scraped-data-dir> <faeldon-geojson>
//
// <scraped-data-dir> is the snapshot of mandaluyong.gov.ph (it holds
// content/pages/government/...). <faeldon-geojson> is
// bgysubmuns-municity-1380500000.0.01.json from
// github.com/faeldon/philippines-json-maps (the boundaries are NAMRIA/PSA
// data from OCHA COD-AB, CC BY-IGO; see NOTICE.md).
//
// The YAML files are the source of truth once written: edit them by hand for
// small fixes. Rerunning this OVERWRITES them, so it is only for a bulk refresh
// (new barangay officials: 2028, or a court ruling). It prints every Punong Barangay that differs between the
// city's two pages so a person can settle it; it never guesses.
//
// Officials are written as person ids (ULIDs, from data/people/). Someone with
// exactly the same name who already holds an office in the same barangay keeps
// their id and URL; everyone else gets a new data/people/<ULID>.yaml. It prints
// every new person and everyone who no longer holds an office, so a person can
// merge renamed people by hand (the build fails until each person file is
// listed by an office).
//
// Hand-kept sections survive a rerun: `dilg` (when the officials were checked
// against the DILG Barangay Officials Directory) and `flags` (where the two
// disagree) are copied over from the old file. A `changed` flag means a DILG
// name replaced the city's; the rerun writes the city's name back, so the
// script lists those flags for a person to re-apply or drop.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import {
  barangayOfficialIds,
  parseBarangay,
  type BarangayRecord,
} from "../data/schema.ts";
import { parsePhones } from "../utils/barangays/phone.ts";
import { withNameComments } from "../utils/people/comments.ts";
import { readCityOfficials, readPeople } from "../utils/people/files.ts";
import { findPerson, newSlug, type KnownPerson } from "../utils/people/ids.ts";
import { ulidFactory } from "../utils/people/ulid.ts";

const [scrapedDir, geoPath] = process.argv.slice(2);
if (!scrapedDir || !geoPath) {
  console.error(
    "usage: node scripts/import_barangays.ts <scraped-data-dir> <faeldon-geojson>",
  );
  process.exit(1);
}

const govDir = join(scrapedDir, "content/pages/government");
const SOURCE_BASE = "https://mandaluyong.gov.ph/government/barangays/";

/**
 * ZIP codes by barangay. PHLPost assigns ZIPs to delivery areas, not
 * barangays, and publishes no barangay list; this follows Wikipedia's
 * "List of barangays of Metro Manila" and is shown as approximate.
 */
const ZIP_BY_NAME: Record<string, string> = {
  vergara: "1551",
  "addition hills": "1552",
  "highway hills": "1552",
  "pleasant hills": "1552",
  "barangka ibaba": "1553",
  mauway: "1553",
  "barangka ilaya": "1554",
  "buayang bato": "1554",
  "wack-wack greenhills": "1555",
};
const DEFAULT_ZIP = "1550";

type Member = { name: string };
type Boundary = { type: string; geometry: unknown; properties: any };

/** Lowercase letters only, ñ folded, "east" dropped: a join key for names. */
function key(s: string): string {
  return s
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/\beast\b/g, "")
    .replace(/[^a-z]/g, "");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ROMAN = /^(II|III|IV|V|VI|VII|VIII|IX|X)$/;

/** The city types names in ALL CAPS; make them Title Case, leave others be. */
function tidyName(raw: string): string {
  let s = raw
    .replace(/\s+\.\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // "ANTONIO L. CASTANEDAANTONIO L. CASTANEDA": a pasted-twice name.
  const twice = s.match(/^(.{6,}?)\1$/i);
  if (twice) s = twice[1].trim();
  if (s !== s.toUpperCase()) return s;
  return s
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          if (ROMAN.test(part)) return part;
          if (/^(JR|SR)\.?$/.test(part))
            return (
              part[0] + part[1].toLowerCase() + (part.endsWith(".") ? "." : "")
            );
          if (part === "DG.") return part;
          return part.charAt(0) + part.slice(1).toLowerCase();
        })
        .join("-"),
    )
    .join(" ");
}

function frontmatter(md: string, field: string): string {
  const m = md.match(new RegExp(`^${field}: "?([^"\\n]*)"?$`, "m"));
  return m ? m[1] : "";
}

function cell(md: string, label: string): string {
  const m = md.match(
    new RegExp(`^\\| (?:\\*\\*)?${label}:?(?:\\*\\*)? \\| (.*?) \\|$`, "m"),
  );
  return m ? m[1].trim() : "";
}

/** Rows like "| Brgy. Kagawad | NAME |": the position, normalised, and name. */
function people(md: string): { role: string; name: string }[] {
  const out: { role: string; name: string }[] = [];
  for (const line of md.split("\n")) {
    const m = line.match(/^\| (.+?) \| (.+?) \|$/);
    if (!m) continue;
    const pos = m[1].toLowerCase();
    let role = "";
    if (/^(punong barangay|brgy\. chairman)$/.test(pos)) role = "captain";
    else if (pos === "brgy. kagawad") role = "kagawad";
    else if (/^sk chair(person|man)$/.test(pos)) role = "skChair";
    else if (pos === "sk kagawad") role = "skKagawad";
    if (role) out.push({ role, name: tidyName(m[2]) });
  }
  return out;
}

const duplicates: string[] = [];
/** Drops repeated names within one council (the city's pages repeat some). */
function unique(list: Member[], where: string): Member[] {
  const seen = new Set<string>();
  return list.filter((m) => {
    if (seen.has(m.name)) {
      duplicates.push(`${where}: "${m.name}" listed twice; kept once`);
      return false;
    }
    seen.add(m.name);
    return true;
  });
}

// --- 1. The city's directory table: code, district, chair. -----------------
const directory = readFileSync(join(govDir, "elected-officials.md"), "utf8");
const dirRows = new Map<
  string,
  { district: number; chair: string; phone: string }
>();
for (const line of directory.split("\n")) {
  const m = line.match(
    /^\| (\d) \| (\d{3}) \| \[([^\]]+)\]\([^)]*\) \| (.+?) \| (.*?) \| (.*?) \|$/,
  );
  if (m) {
    dirRows.set(key(m[3]), {
      district: Number(m[1]),
      chair: m[4].replace(/^HON\.\s*/i, ""),
      phone: m[6].trim(),
    });
  }
}

// --- 2. Boundaries: canonical names and PSGC codes. ------------------------
const geo = JSON.parse(readFileSync(geoPath, "utf8")) as {
  features: Boundary[];
};
const features = geo.features.filter((f) => f.properties.geo_level === "Bgy");
if (features.length !== 27)
  throw new Error(`expected 27, got ${features.length}`);

const round = (n: number) => Math.round(n * 1e5) / 1e5;
function roundCoords(c: any): any {
  return typeof c[0] === "number" ? c.map(round) : c.map(roundCoords);
}

// --- 3. Barangay pages: the newest page wins for each barangay. -----------
type Page = { md: string; file: string; modified: string };
const pagesByKey = new Map<string, Page>();
const pageDir = join(govDir, "barangays");
for (const file of readdirSync(pageDir)) {
  if (!file.endsWith(".md")) continue;
  const md = readFileSync(join(pageDir, file), "utf8");
  // The city's own location codes are unreliable (Bagong Silang's page uses
  // Addition Hills' map), so pages are matched by title instead.
  const title = key(
    frontmatter(md, "title").replace(/^Barangay\s+/i, ""),
  ).replace(/hagdan(?!g)/, "hagdang");
  if (!title) continue;
  const modified = frontmatter(md, "modified");
  const prev = pagesByKey.get(title);
  if (!prev || modified > prev.modified)
    pagesByKey.set(title, { md, file, modified });
}

const barangays = [];
const mismatches: string[] = [];
const outFeatures = [];

for (const f of features) {
  const name: string = f.properties.adm4_en;
  const k = key(name);
  const row = dirRows.get(k);
  if (!row) throw new Error(`no directory row for ${name}`);
  const page = pagesByKey.get(k);
  if (!page) throw new Error(`no page for ${name}`);

  const all = people(page.md);
  const captain = all.find((p) => p.role === "captain");
  if (!captain) throw new Error(`no captain for ${name}`);
  const kagawads: Member[] = all
    .filter((p) => p.role === "kagawad")
    .map((p) => ({ name: p.name }));
  const skChair = all.find((p) => p.role === "skChair");
  const skKagawads: Member[] = all
    .filter((p) => p.role === "skKagawad")
    .map((p) => ({ name: p.name }));

  const dirChair = tidyName(row.chair);
  const tok = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z ]/g, "")
        .split(" ")
        .filter((w) => w.length > 1),
    );
  const a = tok(captain.name);
  const b = tok(dirChair);
  const overlap =
    [...a].filter((w) => b.has(w)).length / new Set([...a, ...b]).size;
  if (overlap < 0.75) {
    mismatches.push(
      `${name}: page says "${captain.name}", directory says "${dirChair}"`,
    );
  }

  const slug = slugify(name);
  barangays.push({
    slug,
    name,
    code: String(f.properties.adm4_psgc),
    district: row.district,
    zip: ZIP_BY_NAME[name.toLowerCase()] ?? DEFAULT_ZIP,
    address: cell(page.md, "Office Address"),
    // Some pages list hotlines instead of "Phone"; the directory table
    // then fills in.
    phone: cell(page.md, "Phone") || row.phone,
    ...(cell(page.md, "Email Address")
      ? { email: cell(page.md, "Email Address") }
      : {}),
    captain: captain.name,
    kagawads: unique(kagawads, `${name} barangay council`),
    skChair: skChair?.name ?? "",
    skKagawads: unique(skKagawads, `${name} SK council`),
    sourceUrl: frontmatter(page.md, "url") || SOURCE_BASE,
    sourceModified: frontmatter(page.md, "modified").slice(0, 10),
  });
  outFeatures.push({
    type: "Feature",
    properties: { slug, name, psgc: String(f.properties.adm4_psgc) },
    geometry: {
      type: (f.geometry as any).type,
      coordinates: roundCoords((f.geometry as any).coordinates),
    },
  });
}

barangays.sort((x, y) => x.name.localeCompare(y.name));

// Who is on file, and where each person holds office now (read before the
// barangay files are overwritten).
mkdirSync("data/people", { recursive: true });
const peopleOnFile = readPeople();
const city = readCityOfficials(peopleOnFile);
const cityIds = new Set(
  [city.representative, city.mayor, city.viceMayor, ...city.councilors].map(
    (o) => o.personId,
  ),
);
const oldBarangays: BarangayRecord[] = existsSync("data/barangays")
  ? readdirSync("data/barangays")
      .filter((f) => f.endsWith(".yaml"))
      .map((f) =>
        parseBarangay(
          parse(readFileSync(`data/barangays/${f}`, "utf8")),
          `data/barangays/${f}`,
          f.slice(0, -".yaml".length),
        ),
      )
  : [];
const known: KnownPerson[] = peopleOnFile.map((p) => ({
  id: p.id,
  name: p.name,
  scopes: [
    ...(cityIds.has(p.id) ? ["city"] : []),
    ...oldBarangays
      .filter((b) => barangayOfficialIds(b.officialIds).includes(p.id))
      .map((b) => b.slug),
  ],
}));
const names = new Map(peopleOnFile.map((p) => [p.id, p.name]));
const slugsTaken = new Set(peopleOnFile.map((p) => p.slug));
const newUlid = ulidFactory();
const created: string[] = [];
const listed = new Set(cityIds);

/** The person id for an official of barangay `scope`, creating one if new. */
function personFor(name: string, scope: string, usedHere: Set<string>): string {
  const match = findPerson(
    name,
    scope,
    known.filter((p) => !usedHere.has(p.id)),
  );
  let id = match?.id;
  if (!id) {
    id = newUlid();
    const slug = newSlug(name, scope, slugsTaken);
    slugsTaken.add(slug);
    names.set(id, name);
    writeFileSync(
      `data/people/${id}.yaml`,
      stringify({ id, slug, name }, { lineWidth: 0 }),
    );
    created.push(
      `${scope}: ${name} -> /people/${slug} (data/people/${id}.yaml)`,
    );
  }
  usedHere.add(id);
  listed.add(id);
  return id;
}

mkdirSync("data/barangays", { recursive: true });
mkdirSync("public/data", { recursive: true });
const changedFlags: string[] = [];
for (const b of barangays) {
  const usedHere = new Set<string>();
  const path = `data/barangays/${b.slug}.yaml`;
  const old = existsSync(path)
    ? ((parse(readFileSync(path, "utf8")) ?? {}) as {
        dilg?: unknown;
        flags?: { status?: string; field?: string; dilg?: string }[];
      })
    : {};
  for (const f of old.flags ?? []) {
    if (f.status === "changed") {
      changedFlags.push(`${b.slug}: ${f.field} → ${f.dilg}`);
    }
  }
  const doc = {
    name: b.name,
    psgc: b.code,
    district: b.district,
    zip: b.zip,
    hall: {
      address: b.address,
      phones: parsePhones(b.phone).map((p) => p.text),
      email: (b as { email?: string }).email ?? null,
    },
    council: {
      captain: personFor(b.captain, b.slug, usedHere),
      kagawads: b.kagawads.map((m) => personFor(m.name, b.slug, usedHere)),
    },
    sk: {
      chair: personFor(b.skChair, b.slug, usedHere),
      kagawads: b.skKagawads.map((m) => personFor(m.name, b.slug, usedHere)),
    },
    source: { url: b.sourceUrl, updated: b.sourceModified },
    ...(old.dilg ? { dilg: old.dilg } : {}),
    ...(old.flags?.length ? { flags: old.flags } : {}),
  };
  writeFileSync(
    path,
    withNameComments(
      `# Written by scripts/import_barangays.ts; edit by hand if needed.\n` +
        stringify(doc, { defaultStringType: "PLAIN", lineWidth: 0 }),
      (id) => names.get(id),
    ),
  );
}
writeFileSync(
  "public/data/mandaluyong-barangays.geojson",
  JSON.stringify({ type: "FeatureCollection", features: outFeatures }) + "\n",
);

console.log(
  `wrote ${barangays.length} barangay YAML files and ${outFeatures.length} polygons`,
);
for (const d of duplicates) console.log(" - " + d);
if (created.length) {
  console.log(`\nNew people (${created.length}); merge any who were renamed:`);
  for (const c of created) console.log(" - " + c);
}
const unlisted = peopleOnFile.filter((p) => !listed.has(p.id));
if (unlisted.length) {
  console.log(
    "\nNo longer hold an office (delete the file, or move its ids: to the new person):",
  );
  for (const p of unlisted) {
    console.log(` - ${p.name}: data/people/${p.id}.yaml`);
  }
}
if (mismatches.length) {
  console.log(
    "\nPunong Barangay differs between the city's pages (settle by hand):",
  );
  for (const m of mismatches) console.log(" - " + m);
}
if (changedFlags.length) {
  console.log(
    "\nDILG names were applied over the city's here; the city's are back now.",
  );
  console.log("Re-apply them or drop the flags (the build checks they match):");
  for (const line of changedFlags) console.log(`  ${line}`);
}
