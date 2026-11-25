import { LOADED_CITY_OFFICIALS } from "./load.ts";
import type { CityOfficial, District } from "./schema.ts";

export type { CityOfficial } from "./schema.ts";

/**
 * The city's directory page was last edited on this date (YYYY-MM-DD).
 * Phones and emails come from each official's own page on mandaluyong.gov.ph,
 * checked against that directory. 2025–2028 term.
 */
export const CITY_OFFICIALS_AS_OF = LOADED_CITY_OFFICIALS.asOf;

/** The city's directory page of elected officials. */
export const CITY_DIRECTORY_URL = LOADED_CITY_OFFICIALS.sourceUrl;

/**
 * Mandaluyong is a lone congressional district, so one House representative
 * serves every barangay.
 */
export const REPRESENTATIVE: CityOfficial =
  LOADED_CITY_OFFICIALS.representative;

/** The city mayor. */
export const MAYOR: CityOfficial = LOADED_CITY_OFFICIALS.mayor;

/** The city vice mayor, who presides over the Sangguniang Panlungsod. */
export const VICE_MAYOR: CityOfficial = LOADED_CITY_OFFICIALS.viceMayor;

/** The 12 city councilors: six per council district. */
export const COUNCILORS: CityOfficial[] = LOADED_CITY_OFFICIALS.councilors;

/** Every city official, in display order. */
export const CITY_OFFICIALS: CityOfficial[] = [
  REPRESENTATIVE,
  MAYOR,
  VICE_MAYOR,
  ...COUNCILORS,
];

/** The councilors who represent one council district. */
export function councilorsFor(district: District): CityOfficial[] {
  return COUNCILORS.filter((c) => c.district === district);
}
