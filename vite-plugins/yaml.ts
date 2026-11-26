import { parse } from "yaml";
import {
  parseBarangay,
  parseBidsFile,
  parseBudget2027,
  parseBudgetGaa,
  parseBudgetScope,
  parseCityOfficials,
  parseFinances,
  parseJobsFile,
  parseNewsFile,
  parsePay,
  parsePerson,
  parsePopulation,
  parsePoverty,
} from "../data/schema.ts";

/** The budget files and their validators, by name under data/budget/. */
const BUDGET_FILES: Record<string, (data: unknown, file: string) => unknown> = {
  "scope.yaml": parseBudgetScope,
  "fy2027.yaml": parseBudget2027,
  "gaa.yaml": parseBudgetGaa,
};

/** The city statistics files and their validators, by name under data/stats/. */
const STATS_FILES: Record<string, (data: unknown, file: string) => unknown> = {
  "population.yaml": parsePopulation,
  "poverty.yaml": parsePoverty,
  "finances.yaml": parseFinances,
};

/**
 * Converts the source of a `.yaml` file into an ES module whose default
 * export is the parsed data. Throws an error naming the file if the YAML is
 * invalid, so a broken data file fails the build instead of shipping.
 */
export function yamlToModule(
  source: string,
  id: string,
  validate: (path: string, data: unknown) => void = () => {},
): string {
  let data: unknown;
  try {
    data = parse(source);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${id}: invalid YAML: ${reason}`);
  }
  validate(id, data);
  return `export default ${JSON.stringify(data ?? null)};`;
}

/**
 * Checks the site's data files against `data/schema.ts` while they are being
 * built, so a bad field fails the build (not a page request). Throws an error
 * naming the file and field. Other `.yaml` files pass through unchecked.
 */
export function validateData(path: string, data: unknown): void {
  const barangay = path.match(/(?:^|\/)data\/barangays\/([^/]+)\.yaml$/);
  const person = path.match(/(?:^|\/)data\/people\/([^/]+)\.yaml$/);
  if (barangay) {
    parseBarangay(data, `data/barangays/${barangay[1]}.yaml`, barangay[1]);
  } else if (person) {
    parsePerson(data, `data/people/${person[1]}.yaml`, person[1]);
  } else if (/(?:^|\/)data\/city-officials\.yaml$/.test(path)) {
    parseCityOfficials(data, "data/city-officials.yaml");
  } else if (/(?:^|\/)data\/pay\.yaml$/.test(path)) {
    parsePay(data, "data/pay.yaml");
  } else {
    const news = path.match(/(?:^|\/)data\/news\/([^/]+)\.yaml$/);
    if (news) parseNewsFile(data, `data/news/${news[1]}.yaml`, news[1]);
    const notice = path.match(/(?:^|\/)data\/(bids|jobs)\/([^/]+)\.yaml$/);
    if (notice) {
      const parse = notice[1] === "bids" ? parseBidsFile : parseJobsFile;
      parse(data, `data/${notice[1]}/${notice[2]}.yaml`, notice[2]);
    }
    const budget = path.match(/(?:^|\/)data\/budget\/([^/]+\.yaml)$/);
    if (budget && BUDGET_FILES[budget[1]]) {
      BUDGET_FILES[budget[1]](data, `data/budget/${budget[1]}`);
    }
    const stats = path.match(/(?:^|\/)data\/stats\/([^/]+\.yaml)$/);
    if (stats && STATS_FILES[stats[1]]) {
      STATS_FILES[stats[1]](data, `data/stats/${stats[1]}`);
    }
  }
}

/**
 * A Vite plugin that lets code `import data from "./thing.yaml"` (and
 * `import.meta.glob("./*.yaml")`). The YAML is parsed at build time (and in
 * dev and tests), so the Worker bundle carries plain data and no parser.
 */
export function yamlPlugin() {
  return {
    name: "better-mandaluyong:yaml",
    transform(source: string, id: string) {
      const path = id.split("?")[0];
      if (!path.endsWith(".yaml")) return null;
      return { code: yamlToModule(source, path, validateData), map: null };
    },
  };
}
