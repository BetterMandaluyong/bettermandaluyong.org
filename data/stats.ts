import financesRaw from "./stats/finances.yaml";
import landAreaRaw from "./stats/land-area.yaml";
import populationRaw from "./stats/population.yaml";
import povertyRaw from "./stats/poverty.yaml";
import {
  parseFinances,
  parseLandArea,
  parsePopulation,
  parsePoverty,
  type Finances,
  type LandArea,
  type Population,
  type Poverty,
} from "./schema.ts";

// Vite reads and parses the YAML at build time (vite-plugins/yaml.ts).

/** `data/stats/population.yaml`: people in each barangay, by census. */
export const POPULATION: Population = parsePopulation(
  populationRaw,
  "data/stats/population.yaml",
);

/** `data/stats/poverty.yaml`: PSA's poverty estimates for the city, NCR, and the country. */
export const POVERTY: Poverty = parsePoverty(
  povertyRaw,
  "data/stats/poverty.yaml",
);

/** `data/stats/finances.yaml`: the City Government's income and spending for one year (BLGF). */
export const FINANCES: Finances = parseFinances(
  financesRaw,
  "data/stats/finances.yaml",
);

/** `data/stats/land-area.yaml`: each barangay's land area in hectares (City Government). */
export const LAND_AREA: LandArea = parseLandArea(
  landAreaRaw,
  "data/stats/land-area.yaml",
);
