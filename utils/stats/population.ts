// Display math for the population and poverty figures. Pure, so it is tested
// without the data files.
import type { District, Population } from "../../data/schema.ts";

/** A barangay as the population table needs it. */
export type BarangayRef = { slug: string; name: string; district: District };

/** One barangay's row: its count in the latest census and the one before. */
export type PopulationRow = BarangayRef & {
  latest: number;
  previous: number | null;
  /** Percent change since the previous census; null without one. */
  change: number | null;
  /** Percent of the city's people in the latest census. */
  share: number;
};

/** A council district's totals over its barangays. */
export type DistrictTotal = {
  district: District;
  barangays: number;
  latest: number;
  previous: number | null;
  change: number | null;
};

/** Percent change from `before` to `after`; null when `before` is 0. */
export function percentChange(before: number, after: number): number | null {
  return before === 0 ? null : ((after - before) / before) * 100;
}

/** The latest census and the one before it (null if there is only one). */
export function latestCensuses(population: Population) {
  const { censuses } = population;
  return {
    latest: censuses[censuses.length - 1]!,
    previous: censuses.length > 1 ? censuses[censuses.length - 2]! : null,
  };
}

/**
 * One row per barangay, most people first (ties by name). Throws if a
 * barangay has no counts, so a renamed slug fails the build, not the page.
 */
export function populationRows(
  population: Population,
  barangays: readonly BarangayRef[],
): PopulationRow[] {
  const { latest, previous } = latestCensuses(population);
  const rows = barangays.map((b): PopulationRow => {
    const counts = population.barangays[b.slug];
    if (!counts) throw new Error(`No population counts for barangay ${b.slug}`);
    const now = counts[latest.year]!;
    const before = previous ? counts[previous.year]! : null;
    return {
      ...b,
      latest: now,
      previous: before,
      change: before === null ? null : percentChange(before, now),
      share: latest.total === 0 ? 0 : (now / latest.total) * 100,
    };
  });
  return rows.sort(
    (a, b) => b.latest - a.latest || a.name.localeCompare(b.name),
  );
}

/** Totals for each council district, district 1 first. */
export function districtTotals(
  rows: readonly PopulationRow[],
): DistrictTotal[] {
  return ([1, 2] as const).map((district) => {
    const mine = rows.filter((r) => r.district === district);
    const latest = mine.reduce((s, r) => s + r.latest, 0);
    const hasPrevious = mine.every((r) => r.previous !== null);
    const previous = hasPrevious
      ? mine.reduce((s, r) => s + (r.previous ?? 0), 0)
      : null;
    return {
      district,
      barangays: mine.length,
      latest,
      previous,
      change: previous === null ? null : percentChange(previous, latest),
    };
  });
}

const count = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

/** A whole count with thousands separators: "465,902". */
export function formatCount(n: number): string {
  return count.format(n);
}

/** A percent with one decimal: "1.3%". */
export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

/** A signed percent change with one decimal: "+9.4%", "−12.0%", "0.0%"; a dash for null. */
export function formatChange(n: number | null): string {
  if (n === null) return "—";
  const fixed = Math.abs(n).toFixed(1);
  if (fixed === "0.0") return "0.0%";
  return `${n > 0 ? "+" : "−"}${fixed}%`;
}
