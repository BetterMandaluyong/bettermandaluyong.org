import cityOfficialsRaw from "./city-officials.yaml";
import {
  parseBarangay,
  parseCityOfficials,
  type Barangay,
  type CityOfficials,
} from "./schema.ts";

// Vite reads and parses every YAML file at build time (vite-plugins/yaml.ts).
const barangayFiles = import.meta.glob("./barangays/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

/** All barangays from `data/barangays/*.yaml`, validated, sorted by name. */
export const LOADED_BARANGAYS: Barangay[] = Object.entries(barangayFiles)
  .map(([path, raw]) => {
    const file = `data${path.slice(1)}`;
    const slug = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return parseBarangay(raw, file, slug);
  })
  .sort((a, b) => a.name.localeCompare(b.name));

/** `data/city-officials.yaml`, validated. */
export const LOADED_CITY_OFFICIALS: CityOfficials = parseCityOfficials(
  cityOfficialsRaw,
  "data/city-officials.yaml",
);
