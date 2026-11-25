"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { GeoJSON as LeafletGeoJSON, Map as LeafletMap } from "leaflet";
import type { MapBarangay } from "../data/barangays.ts";
import { BARANGAYS } from "../components/content.ts";
import { parsePhones } from "../utils/barangays/phone.ts";

type Status = "loading" | "ready" | "error";

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_CREDIT =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
  const phone = parsePhones(b.phone)[0];
  if (phone) {
    const row = document.createElement("div");
    if (phone.href) {
      const a = document.createElement("a");
      a.href = phone.href;
      a.textContent = phone.text;
      row.appendChild(a);
    } else {
      row.textContent = phone.text;
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

/**
 * An interactive map of Mandaluyong's barangay boundaries, drawn with Leaflet
 * over OpenStreetMap tiles. Boundaries are fetched from `geojsonUrl`; each
 * is shaded by council district (solid for District 1, dashed for District 2,
 * so color isn't the only cue), shows its name on hover, and opens a popup
 * with the captain, phone, and a link to the barangay page on click. `focus`
 * (a slug) zooms to one barangay and dims the rest. The scroll wheel doesn't
 * zoom, so the map never traps page scrolling; animation is off under
 * `prefers-reduced-motion`. The barangay list on the page is the accessible
 * and no-JavaScript equivalent. `height` is "short" or "tall".
 */
export function BarangayMap({
  geojsonUrl,
  barangays,
  focus,
  height = "tall",
}: {
  geojsonUrl: string;
  barangays: readonly MapBarangay[];
  focus?: string;
  height?: "short" | "tall";
}) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");

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
        L.tileLayer(TILES, { maxZoom: 19, attribution: OSM_CREDIT }).addTo(
          created,
        );

        const bySlug = new Map(barangays.map((b) => [b.slug, b]));
        const ink = token("ed-ink");
        const fills: Record<number, string> = {
          1: token("ed-navy"),
          2: token("ed-sage"),
        };
        const styleFor = (slug: string, hover = false) => {
          const b = bySlug.get(slug);
          const district = b?.district ?? 1;
          const dim = focus !== undefined && focus !== slug;
          return {
            color: ink,
            weight: hover || slug === focus ? 3 : 1,
            dashArray: district === 2 ? "5 4" : undefined,
            fillColor: fills[district],
            fillOpacity: hover ? 0.45 : dim ? 0.08 : 0.25,
            opacity: dim && !hover ? 0.5 : 1,
          };
        };

        const layer: LeafletGeoJSON = L.geoJSON(data as GeoJSON.GeoJsonObject, {
          style: (f) => styleFor(f?.properties.slug),
          onEachFeature: (f, l) => {
            const b = bySlug.get(f.properties.slug);
            if (!b) return;
            l.bindTooltip(b.name, { sticky: true });
            l.bindPopup(popupContent(b));
            l.on("mouseover", () =>
              (l as L.Path).setStyle(styleFor(b.slug, true)),
            );
            l.on("mouseout", () => (l as L.Path).setStyle(styleFor(b.slug)));
          },
        }).addTo(created);

        let bounds = layer.getBounds();
        if (focus) {
          layer.eachLayer((l) => {
            const f = (l as L.GeoJSON).feature as
              { properties: { slug: string } } | undefined;
            if (f?.properties.slug === focus) {
              bounds = (l as L.Polygon).getBounds();
            }
          });
        }
        created.fitBounds(bounds, { padding: [16, 16], animate: false });
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void init();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [geojsonUrl, barangays, focus]);

  const heights =
    height === "short" ? "h-72 md:h-96" : "h-[26rem] md:h-[36rem]";

  return (
    <figure className="m-0">
      <div
        className={`relative isolate border border-ed-rule bg-ed-paper-2 ${heights}`}
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
            {status === "loading" ? BARANGAYS.mapLoading : BARANGAYS.mapError}
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
