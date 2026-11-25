import { LOADED_BARANGAYS } from "./load.ts";
import type { Barangay, District } from "./schema.ts";

export type { Barangay, District } from "./schema.ts";

/** All 27 barangays, sorted by name. Source: `data/barangays/*.yaml`. */
export const BARANGAYS: Barangay[] = LOADED_BARANGAYS;

/** The barangay with this URL slug, or `undefined`. */
export function getBarangay(slug: string): Barangay | undefined {
  return BARANGAYS.find((b) => b.slug === slug);
}

/** Barangays in one council district, in name order. */
export function barangaysInDistrict(district: District): Barangay[] {
  return BARANGAYS.filter((b) => b.district === district);
}

/** ZIP codes are approximate: where to look one up officially. */
export const ZIP_LOCATOR_URL = "https://phlpost.gov.ph/zip-code-locator/";

/** What the map island needs to know about a barangay (serializable props). */
export type MapBarangay = Pick<
  Barangay,
  "slug" | "name" | "district" | "zip" | "captain" | "phones"
>;

/** The map's view of every barangay. */
export const MAP_BARANGAYS: MapBarangay[] = BARANGAYS.map(
  ({ slug, name, district, zip, captain, phones }) => ({
    slug,
    name,
    district,
    zip,
    captain,
    phones,
  }),
);

/** Where the map island fetches the barangay boundaries. */
export const BOUNDARIES_URL = "/data/mandaluyong-barangays.geojson";
