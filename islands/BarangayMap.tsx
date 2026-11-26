"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useId, useRef, useState } from "react";
import type {
  GeoJSON as LeafletGeoJSON,
  LatLngExpression,
  LayerGroup,
  Map as LeafletMap,
  Polygon,
} from "leaflet";
import type { MapBarangay } from "../data/barangays.ts";
import type { MapPlace } from "../data/places.ts";
import { PLACE_KINDS, type PlaceKind } from "../data/schema.ts";
import { BARANGAYS } from "../components/content.ts";
import { displayPhone, telHref } from "../utils/barangays/phone.ts";

type Status = "loading" | "ready" | "error";

// With a CARTO key (VITE_CARTO_KEY, see .env.example) the map uses CARTO's
// Voyager basemap; without one it falls back to OpenStreetMap's own tiles.
// A key shipped to the browser is public, so restrict it to our domains in
// the CARTO dashboard.
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY as string | undefined;
const TILES = CARTO_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_CREDIT = `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors${
  CARTO_KEY ? ' © <a href="https://carto.com/attributions">CARTO</a>' : ""
}`;

/** Mandaluyong's outline (OpenStreetMap), for the mask outside the city. */
const CITY_OUTLINE_URL = "/data/mandaluyong-city.geojson";

/** A ring covering the whole world; the city is cut out of it as a hole. */
const WORLD: LatLngExpression[] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

/** The outer rings of a Polygon/MultiPolygon GeoJSON, as Leaflet lat/lngs. */
function outerRings(data: unknown): LatLngExpression[][] {
  const rings: LatLngExpression[][] = [];
  const features =
    (data as { features?: { geometry: GeoJSON.Geometry }[] }).features ?? [];
  for (const { geometry: g } of features) {
    const polys =
      g.type === "Polygon"
        ? [g.coordinates]
        : g.type === "MultiPolygon"
          ? g.coordinates
          : [];
    for (const poly of polys) {
      rings.push(poly[0].map(([lng, lat]) => [lat, lng] as LatLngExpression));
    }
  }
  return rings;
}

/** Reads a design token (a `--color-ed-*` CSS variable) so the map uses it. */
function token(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();
}

/** The popup for one barangay, built from text nodes (never HTML strings). */
function popupContent(b: MapBarangay): HTMLElement {
  const root = document.createElement("div");
  const line = (text: string, strong?: boolean) => {
    const el = document.createElement(strong ? "strong" : "div");
    el.textContent = text;
    if (strong) el.style.display = "block";
    root.appendChild(el);
  };
  line(b.name, true);
  line(`${BARANGAYS.district(b.district)} · ${BARANGAYS.zip(b.zip)}`);
  line(`${BARANGAYS.captain}: ${b.captain}`);
  const phone = b.phones[0];
  if (phone) {
    const row = document.createElement("div");
    const href = telHref(phone);
    if (href) {
      const a = document.createElement("a");
      a.href = href;
      a.textContent = displayPhone(phone);
      row.appendChild(a);
    } else {
      row.textContent = displayPhone(phone);
    }
    root.appendChild(row);
  }
  const link = document.createElement("a");
  link.href = `/barangays/${b.slug}`;
  link.textContent = BARANGAYS.mapPopupLink;
  link.style.display = "inline-block";
  link.style.marginTop = "6px";
  root.appendChild(link);
  return root;
}

/** A square, letter-coded marker for a place kind (styled in globals.css). */
function markerGlyph(kind: PlaceKind): HTMLElement {
  const el = document.createElement("span");
  el.className = `map-marker map-marker-${kind}`;
  el.textContent = BARANGAYS.placeLetter[kind];
  el.setAttribute("aria-hidden", "true");
  return el;
}

/** The popup for one government place, built from text nodes. */
function placePopup(p: MapPlace): HTMLElement {
  const root = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = p.name;
  title.style.display = "block";
  root.appendChild(title);
  const kind = document.createElement("div");
  kind.textContent = BARANGAYS.placeKind[p.kind];
  root.appendChild(kind);
  if (p.address) {
    const address = document.createElement("div");
    address.textContent = p.address;
    root.appendChild(address);
  }
  // A hall's link goes to its barangay page, so credit a Google location here.
  if (p.barangay && p.source === "google") {
    const credit = document.createElement("div");
    credit.textContent = BARANGAYS.placeFromGoogle;
    root.appendChild(credit);
  }
  const link = document.createElement("a");
  if (p.barangay) {
    link.href = `/barangays/${p.barangay}`;
    link.textContent = BARANGAYS.mapPopupLink;
  } else {
    link.href = p.sourceUrl;
    link.rel = "noreferrer";
    link.textContent =
      p.source === "google"
        ? BARANGAYS.placeGoogleLink
        : BARANGAYS.placeOsmLink;
  }
  link.style.display = "inline-block";
  link.style.marginTop = "6px";
  root.appendChild(link);
  return root;
}

/** What the map is showing right now; read by Leaflet's event handlers. */
type View = {
  selected?: string | null;
  focus?: string;
  focusDistrict?: 1 | 2;
  matches?: readonly string[] | null;
  hovered?: string | null;
  onSelect?: (slug: string) => void;
};

type Api = {
  restyle: () => void;
  fit: (animate: boolean) => void;
  showPlaces: (kinds: readonly PlaceKind[]) => void;
};

/**
 * An interactive map of Mandaluyong's barangay boundaries, drawn with Leaflet
 * over CARTO Voyager tiles (OpenStreetMap tiles without a key). Boundaries are
 * fetched from `geojsonUrl`; each is shaded by council district, with a
 * dotted border for District 1 and dashed for District 2 (so color isn't the
 * only cue; only the city's edge is solid), and names
 * itself on hover. Everything outside the city outline (`outlineUrl`) is
 * grayed out, and panning and zooming out stop near the city's edge.
 *
 * `places` adds government places as square, letter-coded markers (barangay
 * halls, city and national offices, police, fire stations, MRT and LRT
 * stations), with a row of
 * checkboxes under the map to show or hide each kind. `defaultPlaceKinds`
 * sets which kinds start shown (barangay halls only, by default).
 *
 * Two modes. Without `onSelect`, a click opens a popup (captain, phone, link
 * to the barangay page). With `onSelect`, a click calls it with the slug and
 * the parent shows the details (see `BarangayExplorer`).
 *
 * The view props change what is shown without rebuilding the map: `selected`
 * (a slug, or null) zooms to one barangay and dims the rest; `focus` does the
 * same for a fixed barangay; `focusDistrict` zooms to and highlights one
 * council district; `matches` (slugs) dims everything else, for search
 * results. The scroll wheel doesn't zoom, so the map never traps page
 * scrolling; animation is off under `prefers-reduced-motion`. The barangay
 * list on the page is the accessible and no-JavaScript equivalent. `height`:
 * "short", "tall", or "fill" (a fixed height on phones, the parent's height on
 * large screens).
 */
export function BarangayMap({
  geojsonUrl,
  barangays,
  focus,
  focusDistrict,
  selected,
  matches,
  hovered,
  onSelect,
  height = "tall",
  places,
  defaultPlaceKinds = ["barangay-hall"],
  outlineUrl = CITY_OUTLINE_URL,
}: {
  geojsonUrl: string;
  barangays: readonly MapBarangay[];
  focus?: string;
  focusDistrict?: 1 | 2;
  selected?: string | null;
  matches?: readonly string[] | null;
  hovered?: string | null;
  onSelect?: (slug: string) => void;
  height?: "short" | "tall" | "fill";
  places?: readonly MapPlace[];
  defaultPlaceKinds?: readonly PlaceKind[];
  outlineUrl?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const legendId = useId();
  const [shownKinds, setShownKinds] =
    useState<readonly PlaceKind[]>(defaultPlaceKinds);
  const api = useRef<Api | null>(null);
  const view = useRef<View>({});
  view.current = {
    selected,
    focus,
    focusDistrict,
    matches,
    hovered,
    onSelect,
  };
  const matchKey = matches ? matches.join(",") : "";

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | undefined;

    async function init() {
      try {
        const mod = await import("leaflet");
        const L = (mod as unknown as { default?: typeof mod }).default ?? mod;
        // The outline only draws the mask: the map still works without it.
        const [res, outline] = await Promise.all([
          fetch(geojsonUrl),
          fetch(outlineUrl)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (!res.ok) throw new Error(`boundaries: ${res.status}`);
        const data = await res.json();
        if (cancelled || !container.current) return;

        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const created = L.map(container.current, {
          scrollWheelZoom: false,
          zoomAnimation: !reduceMotion,
          fadeAnimation: !reduceMotion,
          markerZoomAnimation: !reduceMotion,
          // With maxBounds (set below), panning stops hard at the edge.
          maxBoundsViscosity: 1,
        });
        map = created;
        L.tileLayer(TILES, {
          maxZoom: 19,
          attribution: OSM_CREDIT,
        }).addTo(created);

        // Gray out everything outside Mandaluyong: a world-sized polygon with
        // the city cut out, under the barangays, then the city's edge on top.
        const cityRings = outline ? outerRings(outline) : [];
        if (cityRings.length > 0) {
          L.polygon([WORLD, ...cityRings], {
            stroke: false,
            fillColor: token("ed-ink-4"),
            fillOpacity: 0.55,
            interactive: false,
          }).addTo(created);
        }

        const bySlug = new Map(barangays.map((b) => [b.slug, b]));
        const layers = new Map<string, Polygon>();
        const ink = token("ed-ink");
        const fills: Record<number, string> = {
          1: token("ed-navy"),
          2: token("ed-sage"),
        };

        const styleFor = (slug: string, pointer = false) => {
          const v = view.current;
          const hover = pointer || v.hovered === slug;
          const b = bySlug.get(slug);
          const district = b?.district ?? 1;
          const chosen = v.selected ?? v.focus;
          let dim = false;
          if (chosen) dim = chosen !== slug;
          else if (v.focusDistrict) dim = district !== v.focusDistrict;
          else if (v.matches) dim = !v.matches.includes(slug);
          const strong = slug === chosen;
          return {
            color: ink,
            weight: hover || strong ? 3 : 1,
            // Every barangay border is broken, so only the city's edge is a
            // solid line: dotted for District 1, dashed for District 2.
            dashArray: district === 2 ? "6 4" : "1 4",
            lineCap: "round" as const,
            fillColor: fills[district],
            fillOpacity: hover ? 0.45 : strong ? 0.5 : dim ? 0.06 : 0.25,
            opacity: dim && !hover ? 0.45 : 1,
          };
        };

        const layer: LeafletGeoJSON = L.geoJSON(data as GeoJSON.GeoJsonObject, {
          style: (f) => styleFor(f?.properties.slug),
          onEachFeature: (f, l) => {
            const b = bySlug.get(f.properties.slug);
            if (!b) return;
            const path = l as Polygon;
            layers.set(b.slug, path);
            path.bindTooltip(b.name, { sticky: true });
            if (view.current.onSelect) {
              path.on("click", () => view.current.onSelect?.(b.slug));
            } else {
              path.bindPopup(popupContent(b));
            }
            path.on("mouseover", () => path.setStyle(styleFor(b.slug, true)));
            path.on("mouseout", () => path.setStyle(styleFor(b.slug)));
          },
        }).addTo(created);

        if (cityRings.length > 0) {
          L.polygon(cityRings, {
            color: token("ed-ink"),
            weight: 2.5,
            fill: false,
            interactive: false,
          }).addTo(created);
        }

        // Government places: one layer group per kind, toggled by the
        // checkboxes. Markers sit above the barangay shapes.
        const groups = new Map<PlaceKind, LayerGroup>();
        for (const p of places ?? []) {
          let group = groups.get(p.kind);
          if (!group) {
            group = L.layerGroup();
            groups.set(p.kind, group);
          }
          const marker = L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              html: markerGlyph(p.kind),
              className: "map-marker-icon",
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12],
              tooltipAnchor: [12, 0],
            }),
            keyboard: true,
            riseOnHover: true,
          });
          marker.bindTooltip(p.name);
          marker.bindPopup(placePopup(p));
          marker.on("add", () =>
            marker
              .getElement()
              ?.setAttribute(
                "aria-label",
                `${BARANGAYS.placeKind[p.kind]}: ${p.name}`,
              ),
          );
          group.addLayer(marker);
        }

        // Keep the view on Mandaluyong: no panning far past its edge, and no
        // zooming out past the whole city (recomputed when the map resizes).
        const cityBounds = layer.getBounds();
        created.setMaxBounds(cityBounds.pad(0.25));
        const lockZoom = () =>
          created.setMinZoom(created.getBoundsZoom(cityBounds.pad(0.05)));
        created.on("resize", lockZoom);

        api.current = {
          restyle: () => {
            for (const [slug, path] of layers) path.setStyle(styleFor(slug));
          },
          fit: (animate) => {
            const v = view.current;
            const slug = v.selected ?? v.focus;
            let bounds = slug ? layers.get(slug)?.getBounds() : undefined;
            if (!bounds && v.focusDistrict) {
              for (const [s, path] of layers) {
                if (bySlug.get(s)?.district !== v.focusDistrict) continue;
                const b = path.getBounds();
                bounds = bounds
                  ? bounds.extend(b)
                  : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
              }
            }
            created.fitBounds(bounds ?? layer.getBounds(), {
              padding: [16, 16],
              animate: animate && !reduceMotion,
              maxZoom: 16,
            });
          },
          showPlaces: (kinds) => {
            for (const [kind, group] of groups) {
              if (kinds.includes(kind)) group.addTo(created);
              else group.remove();
            }
          },
        };
        api.current.fit(false);
        lockZoom();
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void init();

    return () => {
      cancelled = true;
      api.current = null;
      map?.remove();
      setStatus("loading");
    };
  }, [geojsonUrl, barangays, outlineUrl, places]);

  useEffect(() => {
    if (status === "ready") api.current?.restyle();
  }, [status, selected, focus, focusDistrict, matchKey, hovered]);

  useEffect(() => {
    if (status === "ready") api.current?.showPlaces(shownKinds);
  }, [status, shownKinds]);

  const placeCounts = new Map<PlaceKind, number>();
  for (const p of places ?? []) {
    placeCounts.set(p.kind, (placeCounts.get(p.kind) ?? 0) + 1);
  }
  const placeKinds = PLACE_KINDS.filter((k) => placeCounts.has(k));
  const toggleKind = (kind: PlaceKind, on: boolean) =>
    setShownKinds((kinds) =>
      on ? [...kinds, kind] : kinds.filter((k) => k !== kind),
    );

  const first = useRef(true);
  useEffect(() => {
    if (status !== "ready") return;
    // The first fit already happened when the map was built.
    if (first.current) {
      first.current = false;
      return;
    }
    api.current?.fit(true);
  }, [status, selected, focus, focusDistrict]);

  const mapHeight =
    height === "short"
      ? "h-72 md:h-96"
      : height === "fill"
        ? "h-80 lg:h-auto lg:min-h-0 lg:flex-1"
        : "h-[26rem] md:h-[36rem]";

  return (
    <figure className={height === "fill" ? "m-0 flex h-full flex-col" : "m-0"}>
      <div
        className={`relative isolate border border-ed-rule bg-ed-paper-2 ${mapHeight}`}
      >
        <div
          ref={container}
          role="region"
          aria-label={BARANGAYS.mapLabel}
          className="h-full w-full"
        />
        {status !== "ready" && (
          <p
            role="status"
            className="type-ui absolute inset-0 z-[1000] m-0 flex items-center justify-center bg-ed-paper-2 p-6 text-center text-ed-ink-2"
          >
            {status === "error" ? BARANGAYS.mapError : BARANGAYS.mapLoading}
          </p>
        )}
      </div>
      {placeKinds.length > 0 && (
        <div
          role="group"
          aria-labelledby={legendId}
          className="mt-2 flex flex-wrap items-center gap-x-6"
        >
          <span id={legendId} className="type-label text-ed-ink-3">
            {BARANGAYS.placesLegend}
          </span>
          {placeKinds.map((kind) => (
            <label
              key={kind}
              className="type-ui inline-flex min-h-11 cursor-pointer items-center gap-2 text-ed-ink-2"
            >
              <input
                type="checkbox"
                checked={shownKinds.includes(kind)}
                onChange={(e) => toggleKind(kind, e.target.checked)}
                className="size-5 cursor-pointer accent-ed-navy"
              />
              <span
                aria-hidden="true"
                className={`map-marker map-marker-${kind}`}
              >
                {BARANGAYS.placeLetter[kind]}
              </span>
              {BARANGAYS.placeCount(
                BARANGAYS.placeKinds[kind],
                placeCounts.get(kind) ?? 0,
              )}
            </label>
          ))}
        </div>
      )}
      <figcaption className="type-ui mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-ed-ink-2">
        <span className="type-label text-ed-ink-3">{BARANGAYS.mapLegend}</span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-6 border border-dotted border-ed-ink bg-ed-navy/25"
          />
          {BARANGAYS.district(1)}
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-6 border border-dashed border-ed-ink bg-ed-sage/25"
          />
          {BARANGAYS.district(2)}
        </span>
      </figcaption>
    </figure>
  );
}
