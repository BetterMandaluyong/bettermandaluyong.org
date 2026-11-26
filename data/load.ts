import cityOfficialsRaw from "./city-officials.yaml";
import placesRaw from "./places.yaml";
import {
  barangayOfficialIds,
  duplicateSlugs,
  nameLookup,
  parseBarangay,
  parseCityOfficials,
  parsePerson,
  parsePlaces,
  resolveBarangay,
  resolveCityOfficials,
  unlistedPeople,
  type Barangay,
  type CityOfficials,
  type PersonRecord,
  type Place,
} from "./schema.ts";

// Vite reads and parses every YAML file at build time (vite-plugins/yaml.ts).
const personFiles = import.meta.glob("./people/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

const barangayFiles = import.meta.glob("./barangays/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

/** Everyone in `data/people/*.yaml`, validated, in file (id) order. */
export const LOADED_PEOPLE: PersonRecord[] = Object.entries(personFiles)
  .map(([path, raw]) => {
    const id = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return parsePerson(raw, `data${path.slice(1)}`, id);
  })
  .sort((a, b) => a.id.localeCompare(b.id));

const dupes = duplicateSlugs(LOADED_PEOPLE);
if (dupes.length > 0) {
  throw new Error(
    `data/people: slug used by more than one person: ${dupes.join(", ")}`,
  );
}

const nameOf = nameLookup(LOADED_PEOPLE);

/** All barangays from `data/barangays/*.yaml`, validated, sorted by name. */
export const LOADED_BARANGAYS: Barangay[] = Object.entries(barangayFiles)
  .map(([path, raw]) => {
    const file = `data${path.slice(1)}`;
    const slug = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return resolveBarangay(parseBarangay(raw, file, slug), file, nameOf);
  })
  .sort((a, b) => a.name.localeCompare(b.name));

/** `data/city-officials.yaml`, validated, with names from `data/people/`. */
export const LOADED_CITY_OFFICIALS: CityOfficials = resolveCityOfficials(
  parseCityOfficials(cityOfficialsRaw, "data/city-officials.yaml"),
  "data/city-officials.yaml",
  nameOf,
);

// Every person file must hold an office somewhere.
const unlisted = unlistedPeople(LOADED_PEOPLE, [
  ...LOADED_BARANGAYS.flatMap((b) => barangayOfficialIds(b.officialIds)),
  ...[
    LOADED_CITY_OFFICIALS.representative,
    LOADED_CITY_OFFICIALS.mayor,
    LOADED_CITY_OFFICIALS.viceMayor,
    ...LOADED_CITY_OFFICIALS.councilors,
  ].map((o) => o.personId),
]);
if (unlisted.length > 0) {
  throw new Error(
    `data/people: no barangay or city-officials.yaml lists ${unlisted
      .map((id) => `${id}.yaml`)
      .join(", ")}; list them in an office or delete the file`,
  );
}

/** `data/places.yaml`, validated against the barangay files. */
export const LOADED_PLACES: Place[] = parsePlaces(
  placesRaw,
  "data/places.yaml",
  new Set(LOADED_BARANGAYS.map((b) => b.slug)),
);
