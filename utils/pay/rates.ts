// Looks up what the law sets as pay for an office in a given year, from the
// parsed `data/pay.yaml`. Pure, so it is tested without the data file.
import type { Citation, Office, Pay, PayTranche } from "../../data/schema.ts";

/** One office's pay in one year, ready to show. */
export type OfficeRate = {
  office: Office;
  grade: number;
  /** True for an honorarium ceiling ("up to"), false for a set salary. */
  cap: boolean;
  /** Pesos a month at Step 1. */
  monthly: number;
  /** Twelve months of `monthly`: basic pay only, no bonuses or allowances. */
  yearly: number;
  /** The salary schedule's year (its tranche). */
  year: number;
  /** The DBM circular whose table the amount comes from. */
  circular: Citation;
  /** The law or circular that sets the grade, and its link. */
  basis: Citation;
  /** Set when no document we found states the grade for this city. */
  unconfirmed: boolean;
};

/**
 * The salary schedule in force in `year`: the latest tranche that starts in
 * or before it. A year before the first tranche gets `undefined`; a year
 * after the last keeps the last (a new schedule needs a data update).
 */
export function trancheFor(
  tranches: readonly PayTranche[],
  year: number,
): PayTranche | undefined {
  let found: PayTranche | undefined;
  for (const t of tranches) if (t.year <= year) found = t;
  return found;
}

/** What the law sets for `office` in `year`, or `undefined` before the first schedule. */
export function officeRate(
  pay: Pay,
  office: Office,
  year: number,
): OfficeRate | undefined {
  const tranche = trancheFor(pay.tranches, year);
  if (!tranche) return undefined;
  const p = pay.offices[office];
  const monthly = tranche.step1[p.grade];
  if (monthly === undefined) return undefined; // parsePay rules this out
  return {
    office,
    grade: p.grade,
    cap: p.cap,
    monthly,
    yearly: monthly * 12,
    year: tranche.year,
    circular: tranche[p.schedule],
    basis: { title: p.basis, url: p.url },
    unconfirmed: p.unconfirmed,
  };
}
