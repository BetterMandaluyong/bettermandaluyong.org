"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLink } from "../components/ArrowLink.tsx";
import { Button } from "../components/Button.tsx";
import { Flag } from "../components/Flag.tsx";
import { BARANGAYS, mailto } from "../components/content.ts";
import type { Barangay, MapBarangay } from "../data/barangays.ts";
import type { MapPlace } from "../data/places.ts";
import { parsePhones } from "../utils/barangays/phone.ts";
import { hrefKey } from "../utils/barangays/keys.ts";
import { searchBarangays } from "../utils/barangays/search.ts";
import { BarangayMap } from "./BarangayMap.tsx";

function PersonRow({
  name,
  role,
  href,
}: {
  name: string;
  role: string;
  href?: string;
}) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-ed-rule py-2">
      {href ? (
        <a
          href={href}
          className="type-ui block py-1.5 text-ed-navy no-underline hover:underline"
        >
          {name}
        </a>
      ) : (
        <span className="type-ui text-ed-ink">{name}</span>
      )}
      <span className="type-label text-ed-ink-3">{role}</span>
    </li>
  );
}

/** The panel's detail view for one barangay: contacts and its whole council. */
function BarangayDetail({
  barangay: b,
  hrefs,
  headingRef,
  onBack,
}: {
  barangay: Barangay;
  hrefs: Record<string, string>;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onBack: () => void;
}) {
  const href = (role: string, name: string) =>
    hrefs[hrefKey(b.slug, role, name)];
  const phones = b.phones.flatMap(parsePhones);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← {BARANGAYS.backToList}
        </Button>
      </div>
      <div>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="type-section m-0 outline-offset-4"
        >
          {b.name}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Flag variant="navy">{BARANGAYS.district(b.district)}</Flag>
          <Flag variant="outline">{BARANGAYS.zip(b.zip)}</Flag>
        </div>
      </div>
      <dl className="m-0 flex flex-col gap-4">
        <div>
          <dt className="type-label text-ed-ink-3">{BARANGAYS.hallHeading}</dt>
          <dd className="type-ui m-0 mt-1 py-1.5 text-ed-ink-2">{b.address}</dd>
        </div>
        <div>
          <dt className="type-label text-ed-ink-3">{BARANGAYS.phone}</dt>
          <dd className="m-0 mt-1 flex flex-col">
            {phones.map((p) =>
              p.href ? (
                <a
                  key={p.text}
                  href={p.href}
                  className="type-ui block py-1.5 text-ed-navy no-underline hover:underline"
                >
                  {p.text}
                </a>
              ) : (
                <span
                  key={p.text}
                  className="type-ui block py-1.5 text-ed-ink-2"
                >
                  {p.text}
                </span>
              ),
            )}
          </dd>
        </div>
        {b.email && (
          <div>
            <dt className="type-label text-ed-ink-3">{BARANGAYS.email}</dt>
            <dd className="m-0">
              <a
                href={mailto(b.email)}
                className="type-ui block py-1.5 text-ed-navy no-underline hover:underline"
              >
                {b.email}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <section aria-label={BARANGAYS.councilHeading}>
        <h4 className="type-subheading m-0 mb-1">{BARANGAYS.councilHeading}</h4>
        <ul className="m-0 list-none border-t border-ed-rule p-0">
          <PersonRow
            name={b.captain}
            role={BARANGAYS.captain}
            href={href(BARANGAYS.captain, b.captain)}
          />
          {b.kagawads.map((name) => (
            <PersonRow
              key={name}
              name={name}
              role={BARANGAYS.kagawad}
              href={href("Barangay Kagawad", name)}
            />
          ))}
        </ul>
      </section>
      <section aria-label={BARANGAYS.skHeading}>
        <h4 className="type-subheading m-0 mb-1">{BARANGAYS.skHeading}</h4>
        <ul className="m-0 list-none border-t border-ed-rule p-0">
          <PersonRow
            name={b.skChair}
            role={BARANGAYS.skChair}
            href={href("SK Chairperson", b.skChair)}
          />
          {b.skKagawads.map((name) => (
            <PersonRow
              key={name}
              name={name}
              role={BARANGAYS.skKagawad}
              href={href("SK Kagawad", name)}
            />
          ))}
        </ul>
      </section>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <ArrowLink href={`/barangays/${b.slug}`}>
          {BARANGAYS.openPage}
        </ArrowLink>
        <ArrowLink href={`/districts#district-${b.district}`}>
          {BARANGAYS.districtLink(b.district)}
        </ArrowLink>
      </div>
    </div>
  );
}

/**
 * The home page's main interface: a map of the barangays on the left, and on
 * the right a search box with a card for each barangay. Picking a card or a
 * barangay on the map zooms to it and shows its details in the panel (hall
 * contacts and the whole barangay and SK council, each name linking to its
 * `/people/…` page). Search matches barangay names, ZIP codes, "district 1",
 * and officials' names; matching barangays stay bright on the map. The chosen
 * barangay is kept in the address (`/?barangay=hulo`) so a view can be shared.
 *
 * Cards are ordinary links to `/barangays/<slug>`, so the list works before
 * JavaScript loads and without it; with JavaScript a plain click selects
 * instead. Props: `barangays` (all of them), `hrefs` (person links, keyed by
 * `hrefKey` from utils/barangays/keys.ts), `geojsonUrl`, `initialSelected` (a
 * slug from the address), and `places` (government places for the map, with
 * filters under it).
 */
export function BarangayExplorer({
  barangays,
  hrefs,
  geojsonUrl,
  initialSelected,
  places,
}: {
  barangays: readonly Barangay[];
  hrefs: Record<string, string>;
  geojsonUrl: string;
  initialSelected?: string;
  places?: readonly MapPlace[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(
    initialSelected && barangays.some((b) => b.slug === initialSelected)
      ? initialSelected
      : null,
  );
  const [hovered, setHovered] = useState<string | null>(null);
  const userPicked = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const mapBarangays = useMemo<MapBarangay[]>(
    () =>
      barangays.map(({ slug, name, district, zip, captain, phones }) => ({
        slug,
        name,
        district,
        zip,
        captain,
        phones,
      })),
    [barangays],
  );
  const hits = useMemo(
    () => searchBarangays(barangays, query),
    [barangays, query],
  );
  const matches = useMemo(
    () => (query.trim() ? hits.map((h) => h.barangay.slug) : null),
    [hits, query],
  );
  const chosen = selected ? barangays.find((b) => b.slug === selected) : null;

  function select(slug: string | null) {
    userPicked.current = true;
    setHovered(null);
    setSelected(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("barangay", slug);
    else url.searchParams.delete("barangay");
    window.history.replaceState(null, "", url);
  }

  // Move focus along with the panel's content, but not on first load.
  useEffect(() => {
    if (!userPicked.current) return;
    if (selected) headingRef.current?.focus();
    else searchRef.current?.focus();
  }, [selected]);

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:h-[42rem]">
      <div className="lg:col-span-3 lg:h-full lg:min-h-0">
        <BarangayMap
          geojsonUrl={geojsonUrl}
          barangays={mapBarangays}
          selected={selected}
          matches={matches}
          hovered={hovered}
          onSelect={select}
          height="fill"
          places={places}
        />
      </div>
      <div className="flex h-[32rem] min-h-0 flex-col border border-ed-rule bg-white lg:col-span-2 lg:h-full">
        {chosen ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <BarangayDetail
              barangay={chosen}
              hrefs={hrefs}
              headingRef={headingRef}
              onBack={() => select(null)}
            />
          </div>
        ) : (
          <>
            <div role="search" className="border-b border-ed-rule p-4">
              <label
                htmlFor="barangay-search"
                className="type-label mb-2 block text-ed-ink-3"
              >
                {BARANGAYS.searchLabel}
              </label>
              <input
                ref={searchRef}
                id="barangay-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={BARANGAYS.searchPlaceholder}
                autoComplete="off"
                className="type-body min-h-11 w-full border border-ed-rule-strong bg-white px-3 text-ed-ink"
              />
              <p aria-live="polite" className="type-ui m-0 mt-2 text-ed-ink-3">
                {BARANGAYS.results(hits.length, barangays.length)}
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {hits.length === 0 ? (
                <p className="type-body m-0 text-ed-ink-2">
                  {BARANGAYS.noResults}
                </p>
              ) : (
                <ul
                  aria-label={BARANGAYS.listHeading}
                  className="m-0 grid list-none gap-3 p-0"
                >
                  {hits.map(({ barangay: b, official }) => (
                    <li key={b.slug}>
                      <a
                        href={`/barangays/${b.slug}`}
                        onMouseEnter={() => setHovered(b.slug)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(b.slug)}
                        onBlur={() => setHovered(null)}
                        onClick={(e) => {
                          if (
                            e.button !== 0 ||
                            e.metaKey ||
                            e.ctrlKey ||
                            e.shiftKey ||
                            e.altKey
                          ) {
                            return;
                          }
                          e.preventDefault();
                          select(b.slug);
                        }}
                        className="flex min-h-11 flex-col gap-0.5 border border-ed-rule bg-white px-4 py-3 text-ed-ink no-underline transition-colors hover:border-ed-ink"
                      >
                        <span className="type-subheading">{b.name}</span>
                        <span className="type-ui text-ed-ink-3">
                          {BARANGAYS.district(b.district)} ·{" "}
                          {BARANGAYS.zip(b.zip)}
                        </span>
                        <span className="type-ui text-ed-ink-2">
                          {official
                            ? BARANGAYS.matched(official.role, official.name)
                            : `${BARANGAYS.captain}: ${b.captain}`}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
