import { BARANGAYS as COPY } from "../components/content.ts";
import { BARANGAYS } from "./barangays.ts";
import { LOADED_PLACES } from "./load.ts";
import { PLACE_KINDS, type Place, type PlaceKind } from "./schema.ts";

export type { Place, PlaceKind } from "./schema.ts";
export { PLACE_KINDS } from "./schema.ts";

/** Every government place on the map. Source: `data/places.yaml`. */
export const PLACES: Place[] = LOADED_PLACES;

/**
 * What the map island needs to know about a place (serializable props). A
 * barangay hall carries its barangay's slug and the city's hall address.
 */
export type MapPlace = {
  kind: PlaceKind;
  name: string;
  lat: number;
  lng: number;
  /** Where the point came from: OpenStreetMap, or a Google Maps listing. */
  source: "osm" | "google";
  /** Link to the point's source (openstreetmap.org or Google Maps). */
  sourceUrl: string;
  /** The barangay's slug, for barangay halls. */
  barangay?: string;
  /** The hall address the city publishes, for barangay halls. */
  address?: string;
};

const OSM_TYPES = { n: "node", w: "way", r: "relation" } as const;

/** The Google Maps listing for a CID (the `google` field in places.yaml). */
export function googleMapsUrl(cid: string): string {
  return `https://maps.google.com/?cid=${cid}`;
}

/** The openstreetmap.org page for an element id like "w112549085". */
export function osmUrl(osm: string): string {
  const type = OSM_TYPES[osm[0] as keyof typeof OSM_TYPES];
  return `https://www.openstreetmap.org/${type}/${osm.slice(1)}`;
}

/**
 * Turns places into what the map shows: halls named after their barangay
 * (with its hall address), everything else as named, sorted by kind then name.
 */
export function toMapPlaces(
  places: readonly Place[],
  barangays: readonly { slug: string; name: string; address: string }[],
): MapPlace[] {
  const bySlug = new Map(barangays.map((b) => [b.slug, b]));
  const order = (k: PlaceKind) => PLACE_KINDS.indexOf(k);
  return places
    .map((p): MapPlace => {
      const b = p.barangay ? bySlug.get(p.barangay) : undefined;
      return {
        kind: p.kind,
        name: b ? COPY.hallName(b.name) : (p.name ?? ""),
        lat: p.lat,
        lng: p.lng,
        source: p.osm ? "osm" : "google",
        sourceUrl: p.osm ? osmUrl(p.osm) : googleMapsUrl(p.google ?? ""),
        ...(b ? { barangay: b.slug, address: b.address } : {}),
      };
    })
    .sort(
      (a, b) =>
        order(a.kind) - order(b.kind) || a.name.localeCompare(b.name, "en"),
    );
}

/** The map's view of every place. */
export const MAP_PLACES: MapPlace[] = toMapPlaces(PLACES, BARANGAYS);

/** How many places of each kind there are, for the filter labels. */
export function countByKind(
  places: readonly { kind: PlaceKind }[],
): Record<PlaceKind, number> {
  const counts = Object.fromEntries(PLACE_KINDS.map((k) => [k, 0])) as Record<
    PlaceKind,
    number
  >;
  for (const p of places) counts[p.kind]++;
  return counts;
}
