"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type {
  GeoJSON as LeafletGeoJSON,
  Map as LeafletMap,
  Polygon,
} from "leaflet";
import type { MapBarangay } from "../data/barangays.ts";
import { BARANGAYS } from "../components/content.ts";
import { displayPhone, telHref } from "../utils/barangays/phone.ts";

type Status = "loading" | "ready" | "error";

// With a CARTO key (VITE_CARTO_KEY, see .env.example) the map uses CARTO's
// Voyager basemap; without one it falls back to OpenStreetMap's own tiles,
// muted and tinted blue. A key shipped to the browser is public, so restrict
// it to our domains in the CARTO dashboard.
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY as string | undefined;
const TILES = CARTO_KEY
  ? `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_KEY}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_CREDIT = `© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors${
  CARTO_KEY ? ' © <a href="https://carto.com/attributions">CARTO</a>' : ""
}`;

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

/** What the map is showing right now; read by Leaflet's event handlers. */
type View = {
  selected?: string | null;
  focus?: string;
  focusDistrict?: 1 | 2;
  matches?: readonly string[] | null;
  hovered?: string | null;
  onSelect?: (slug: string) => void;
};

type Api = { restyle: () => void; fit: (animate: boolean) => void };

/**
 * An interactive map of Mandaluyong's barangay boundaries, drawn with Leaflet
 * over CARTO Voyager tiles (OpenStreetMap tiles, tinted blue, without a key). Boundaries are fetched from `geojsonUrl`; each is
 * shaded by council district (solid for District 1, dashed for District 2, so
 * color isn't the only cue) and names itself on hover.
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
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
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
        const res = await fetch(geojsonUrl);
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
        });
        map = created;
        L.tileLayer(TILES, {
          maxZoom: 19,
          // Without a CARTO key, mute and tint OSM's tiles (globals.css).
          className: CARTO_KEY ? undefined : "map-tiles-blue",
          attribution: OSM_CREDIT,
        }).addTo(created);

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
            dashArray: district === 2 ? "5 4" : undefined,
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
        };
        api.current.fit(false);
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
  }, [geojsonUrl, barangays]);

  useEffect(() => {
    if (status === "ready") api.current?.restyle();
  }, [status, selected, focus, focusDistrict, matchKey, hovered]);

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
      <figcaption className="type-ui mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-ed-ink-2">
        <span className="type-label text-ed-ink-3">{BARANGAYS.mapLegend}</span>
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-6 border border-ed-ink bg-ed-navy/25"
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
