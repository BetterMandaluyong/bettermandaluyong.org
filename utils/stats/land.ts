// Display math for land area and population density. Pure, so it is tested
// without the data files.
import type { District, LandArea, Population } from "../../data/schema.ts";
import { type BarangayRef, latestCensuses } from "./population.ts";

/** One barangay's land: its hectares, share of the city, and people per hectare. */
export type LandRow = BarangayRef & {
  hectares: number;
  /** Percent of the city's stated land area. */
  share: number;
  /** People in the latest census. */
  people: number;
  /** People per hectare in the latest census. */
  density: number;
};

/** A council district's land and people over its barangays. */
export type LandDistrictTotal = {
  district: District;
  hectares: number;
  people: number;
  density: number;
};

/** People per hectare; 0 when there is no land. */
export function density(people: number, hectares: number): number {
  return hectares > 0 ? people / hectares : 0;
}

/**
 * One row per barangay, most land first (ties by name), with people from the
 * latest census. Throws if a barangay has no land area or no counts, so a
 * renamed slug fails the build, not the page.
 */
export function landRows(
  land: LandArea,
  population: Population,
  barangays: readonly BarangayRef[],
): LandRow[] {
  const { latest } = latestCensuses(population);
  const rows = barangays.map((b): LandRow => {
    const hectares = land.barangays[b.slug];
    if (hectares === undefined) {
      throw new Error(`No land area for barangay ${b.slug}`);
    }
    const people = population.barangays[b.slug]?.[latest.year];
    if (people === undefined) {
      throw new Error(`No population counts for barangay ${b.slug}`);
    }
    return {
      ...b,
      hectares,
      share: (hectares / land.total) * 100,
      people,
      density: density(people, hectares),
    };
  });
  return rows.sort(
    (a, b) => b.hectares - a.hectares || a.name.localeCompare(b.name),
  );
}

/** Land and people for each council district, district 1 first. */
export function landDistrictTotals(
  rows: readonly LandRow[],
): LandDistrictTotal[] {
  return ([1, 2] as const).map((district) => {
    const mine = rows.filter((r) => r.district === district);
    const hectares = mine.reduce((s, r) => s + r.hectares, 0);
    const people = mine.reduce((s, r) => s + r.people, 0);
    return { district, hectares, people, density: density(people, hectares) };
  });
}

const ha = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Hectares with two decimals and thousands separators: "1,126.00 ha". A
 * no-break space keeps the unit with the number in narrow table cells.
 */
export function formatHectares(n: number): string {
  return `${ha.format(n)}\u00a0ha`;
}

/** Hectares as square kilometres, two decimals: "11.26 km²" (no-break space). */
export function formatSquareKm(hectares: number): string {
  return `${ha.format(hectares / 100)}\u00a0km²`;
}
