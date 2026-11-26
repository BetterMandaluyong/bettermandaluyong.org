// Reads the data files from disk for scripts that run outside Vite
// (scripts/import_barangays.ts, scripts/check_dynasties.ts). The site itself
// loads them through data/load.ts.

import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import {
  nameLookup,
  parseCityOfficials,
  parsePerson,
  resolveCityOfficials,
  type CityOfficials,
  type PersonRecord,
} from "../../data/schema.ts";

/** Every `data/people/*.yaml`, validated. */
export function readPeople(dir = "data/people"): PersonRecord[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => {
      const id = f.slice(0, -".yaml".length);
      return parsePerson(
        parse(readFileSync(`${dir}/${f}`, "utf8")),
        `${dir}/${f}`,
        id,
      );
    });
}

/** `data/city-officials.yaml`, validated, with names from the people files. */
export function readCityOfficials(
  people: readonly PersonRecord[] = readPeople(),
  file = "data/city-officials.yaml",
): CityOfficials {
  return resolveCityOfficials(
    parseCityOfficials(parse(readFileSync(file, "utf8")), file),
    file,
    nameLookup(people),
  );
}
