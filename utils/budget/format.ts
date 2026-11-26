// Display math for the budget page. Pure, so it is tested without the data.
// The NEP and the House bill are two versions of one budget: totals are kept
// per version and never added together.
import type {
  BudgetGaa,
  BudgetGaaProgram,
  BudgetProject,
} from "../../data/schema.ts";

/** Shown where a document has no such line. Never "₱0". */
export const NO_LINE = "—";

const exact = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });
const short = new Intl.NumberFormat("en-PH", { maximumSignificantDigits: 3 });

/** An exact peso amount, "₱200,000,000"; a dash for null. Negative amounts keep their sign. */
export function formatPeso(amount: number | null): string {
  if (amount === null) return NO_LINE;
  const sign = amount < 0 ? "−" : "";
  return `${sign}₱${exact.format(Math.abs(amount))}`;
}

/** A rounded amount for headline figures: "₱1.13 billion", "₱234 million", "₱500,000". */
export function formatPesoShort(amount: number | null): string {
  if (amount === null) return NO_LINE;
  const sign = amount < 0 ? "−" : "";
  const abs = Math.abs(amount);
  if (abs >= 1e12) return `${sign}₱${short.format(abs / 1e12)} trillion`;
  if (abs >= 1e9) return `${sign}₱${short.format(abs / 1e9)} billion`;
  if (abs >= 1e6) return `${sign}₱${short.format(abs / 1e6)} million`;
  return `${sign}₱${exact.format(abs)}`;
}

/** One version's total over some lines: how many lines it has, and their sum (null when none). */
export type VersionTotal = { lines: number; amount: number | null };

/** The total of one version (`nep` or `house`) over the lines that have it. */
export function versionTotal(
  projects: BudgetProject[],
  version: "nep" | "house",
): VersionTotal {
  let lines = 0;
  let amount = 0;
  for (const p of projects) {
    const v = p[version];
    if (v !== null) {
      lines++;
      amount += v;
    }
  }
  return { lines, amount: lines ? amount : null };
}

/** Lines largest first by the House bill, then by the NEP; ties by title. */
export function sortProjects(projects: BudgetProject[]): BudgetProject[] {
  const size = (p: BudgetProject) => p.house ?? p.nep ?? 0;
  return [...projects].sort(
    (a, b) => size(b) - size(a) || a.title.localeCompare(b.title),
  );
}

/** How many lines fall in each status, in first-seen order of the sorted list. */
export function statusCounts(
  projects: BudgetProject[],
): { status: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of projects)
    counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
  return [...counts].map(([status, count]) => ({ status, count }));
}

/** One enacted year: its total over the programs that name the place, and how many it funds. */
export type GaaYear = { year: number; amount: number; programs: number };

/** Each year's total, oldest first. A program counts in a year only where its amount is above zero. */
export function gaaYearTotals(gaa: BudgetGaa): GaaYear[] {
  return gaa.years.map((year) => {
    let amount = 0;
    let programs = 0;
    for (const p of gaa.programs) {
      const v = p.amounts[String(year)];
      if (v) {
        amount += v;
        programs++;
      }
    }
    return { year, amount, programs };
  });
}

/** The programs funded in one year, largest first; ties by name. */
export function gaaProgramsFor(
  gaa: BudgetGaa,
  year: number,
): (BudgetGaaProgram & { amount: number })[] {
  return gaa.programs
    .filter((p) => p.amounts[String(year)])
    .map((p) => ({ ...p, amount: p.amounts[String(year)] }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

/**
 * A project title without the map coordinates some documents append
 * ("…, Mandaluyong, 14.587, 121.038" or "… (14.595, 121.026)" → "…, Mandaluyong"). The
 * coordinates stay in the data (`lat`, `lon`); only the reading text drops them.
 */
export function projectTitle(title: string): string {
  return title
    .replace(
      /,?\s*\(?\s*-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\s*\)?\s*$/,
      "",
    )
    .trim();
}
