import { describe, expect, it } from "vitest";
import { BARANGAYS } from "./barangays.ts";
import {
  MAP_PLACES,
  PLACES,
  PLACE_KINDS,
  countByKind,
  googleMapsUrl,
  osmUrl,
  toMapPlaces,
} from "./places.ts";
import { parsePlaces } from "./schema.ts";

const slugs = new Set(["hulo", "vergara"]);
const hall = () => ({
  kind: "barangay-hall",
  barangay: "hulo",
  lat: 14.57,
  lng: 121.03,
  osm: "n1",
});
const office = () => ({
  kind: "city",
  name: "Mandaluyong City Hall",
  lat: 14.58,
  lng: 121.03,
  osm: "w2",
});
const bad = (entries: unknown[], message: RegExp) =>
  expect(() => parsePlaces(entries, "data/places.yaml", slugs)).toThrow(
    message,
  );

describe("parsePlaces", () => {
  it("accepts halls and named offices", () => {
    expect(parsePlaces([hall(), office()], "places.yaml", slugs)).toEqual([
      {
        kind: "barangay-hall",
        barangay: "hulo",
        lat: 14.57,
        lng: 121.03,
        osm: "n1",
      },
      {
        kind: "city",
        name: "Mandaluyong City Hall",
        lat: 14.58,
        lng: 121.03,
        osm: "w2",
      },
    ]);
  });

  it("names the file and field when something is wrong", () => {
    bad(
      [{ ...office(), kind: "park" }],
      /places\.yaml: \[0\]\.kind must be one of/,
    );
    bad(
      [{ ...hall(), barangay: "nowhere" }],
      /\[0\]\.barangay "nowhere" is not a barangay/,
    );
    bad(
      [hall(), { ...hall(), osm: "n9" }],
      /\[1\]\.barangay hulo already has a hall/,
    );
    bad([office(), { ...office(), lat: 14.59 }], /\[1\]\.osm w2 appears twice/);
    bad([{ ...office(), osm: "way/2" }], /\[0\]\.osm must be n, w, or r/);
    bad(
      [{ ...office(), google: "123" }],
      /\[0\] needs exactly one of osm or google/,
    );
    bad(
      [{ ...office(), osm: undefined }],
      /\[0\] needs exactly one of osm or google/,
    );
    bad(
      [{ ...office(), osm: undefined, google: "0x12" }],
      /\[0\]\.google must be a Google Maps CID/,
    );
    bad(
      [
        { ...office(), osm: undefined, google: "123" },
        { ...office(), osm: undefined, google: "123", lat: 14.59 },
      ],
      /\[1\]\.google 123 appears twice/,
    );
    bad(
      [{ ...office(), name: undefined }],
      /\[0\]\.name must be a non-empty string/,
    );
    bad([{ ...office(), lat: 14.7 }], /\[0\]\.lat is outside Mandaluyong/);
    bad([{ ...office(), lng: "121" }], /\[0\]\.lng must be a number/);
    bad({} as unknown[], /document must be a list/);
  });
});

describe("places", () => {
  it("loads data/places.yaml with every kind present", () => {
    const counts = countByKind(PLACES);
    for (const kind of PLACE_KINDS)
      expect(counts[kind], kind).toBeGreaterThan(0);
    expect(counts["barangay-hall"]).toBeLessThanOrEqual(BARANGAYS.length);
  });

  it("names each hall after its barangay and gives it the city's address", () => {
    const hulo = MAP_PLACES.find((p) => p.barangay === "hulo");
    expect(hulo).toMatchObject({
      kind: "barangay-hall",
      name: "Hulo Barangay Hall",
      address: "Coronado Street",
    });
  });

  it("sorts by kind, then name", () => {
    const sorted = toMapPlaces(
      [
        { kind: "fire", name: "B", lat: 0, lng: 0, osm: "n1" },
        { kind: "city", name: "Z", lat: 0, lng: 0, osm: "n2" },
        { kind: "city", name: "A", lat: 0, lng: 0, osm: "n3" },
      ],
      [],
    );
    expect(sorted.map((p) => p.name)).toEqual(["A", "Z", "B"]);
  });

  it("accepts a place from a Google Maps listing", () => {
    const [p] = parsePlaces(
      [{ ...hall(), osm: undefined, google: "7501417893267530448" }],
      "places.yaml",
      slugs,
    );
    expect(p).toEqual({
      kind: "barangay-hall",
      barangay: "hulo",
      lat: 14.57,
      lng: 121.03,
      google: "7501417893267530448",
    });
    expect(p.osm).toBeUndefined();
  });

  it("links each place to its source", () => {
    expect(googleMapsUrl("7501417893267530448")).toBe(
      "https://maps.google.com/?cid=7501417893267530448",
    );
    const [osmPlace, googlePlace] = toMapPlaces(
      [
        { kind: "city", name: "A", lat: 0, lng: 0, osm: "w9" },
        { kind: "city", name: "B", lat: 0, lng: 0, google: "42" },
      ],
      [],
    );
    expect(osmPlace).toMatchObject({
      source: "osm",
      sourceUrl: "https://www.openstreetmap.org/way/9",
    });
    expect(googlePlace).toMatchObject({
      source: "google",
      sourceUrl: "https://maps.google.com/?cid=42",
    });
  });

  it("puts every barangay with a known hall on the map", () => {
    const halls = MAP_PLACES.filter((p) => p.kind === "barangay-hall");
    expect(halls).toHaveLength(BARANGAYS.length);
  });

  it("links each element to openstreetmap.org", () => {
    expect(osmUrl("n1")).toBe("https://www.openstreetmap.org/node/1");
    expect(osmUrl("w22")).toBe("https://www.openstreetmap.org/way/22");
    expect(osmUrl("r333")).toBe("https://www.openstreetmap.org/relation/333");
  });
});
