// Replaces the barangay shapes in public/data/mandaluyong-barangays.geojson
// with detailed OpenStreetMap boundaries.
//
//   node scripts/import_boundaries_osm.ts
//
// The government boundary file used by import_barangays.ts is heavily
// simplified (some barangays have 3 or 4 corners). This script asks
// Nominatim (OpenStreetMap's search service, one request per second as its
// usage policy asks) for each barangay's administrative boundary and keeps
// the slug, name, and PSGC code already in the file. The result is OpenStreetMap
// data under the ODbL: credit "© OpenStreetMap contributors" (see NOTICE.md).
// It prints every barangay it could not match and leaves that one unchanged.

import { readFileSync, writeFileSync } from "node:fs";

const FILE = "public/data/mandaluyong-barangays.geojson";
const UA =
  "bettermandaluyong.org-boundary-import/1.0 (https://bettermandaluyong.org)";

type Feature = {
  type: "Feature";
  properties: { slug: string; name: string; psgc: string; osm?: string };
  geometry: { type: string; coordinates: unknown };
};
const doc = JSON.parse(readFileSync(FILE, "utf8")) as {
  type: string;
  features: Feature[];
};

const round = (n: number) => Math.round(n * 1e5) / 1e5;
function roundCoords(c: any): any {
  return typeof c[0] === "number" ? c.map(round) : c.map(roundCoords);
}
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const unmatched: string[] = [];
for (const f of doc.features) {
  const q = new URLSearchParams({
    q: `${f.properties.name}, Mandaluyong`,
    format: "jsonv2",
    polygon_geojson: "1",
    polygon_threshold: "0",
    limit: "10",
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok)
    throw new Error(`nominatim ${res.status} for ${f.properties.name}`);
  const results = (await res.json()) as any[];
  const hit = results.find(
    (r) =>
      r.osm_type === "relation" &&
      r.category === "boundary" &&
      r.type === "administrative" &&
      /Mandaluyong/.test(r.display_name) &&
      ["Polygon", "MultiPolygon"].includes(r.geojson?.type) &&
      fold(r.name ?? "").includes(fold(f.properties.name).slice(0, 8)),
  );
  if (hit) {
    f.geometry = {
      type: hit.geojson.type,
      coordinates: roundCoords(hit.geojson.coordinates),
    };
    f.properties.osm = `r${hit.osm_id}`;
    console.log(`ok   ${f.properties.name} (r${hit.osm_id})`);
  } else {
    unmatched.push(f.properties.name);
    console.log(`MISS ${f.properties.name}`);
  }
  await new Promise((r) => setTimeout(r, 1100));
}

writeFileSync(FILE, JSON.stringify(doc) + "\n");
if (unmatched.length) console.log(`\nunchanged: ${unmatched.join(", ")}`);
