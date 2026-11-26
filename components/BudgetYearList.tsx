import type { BudgetGaa } from "../data/schema.ts";
import {
  formatPeso,
  formatPesoShort,
  gaaProgramsFor,
  gaaYearTotals,
  projectTitle,
} from "../utils/budget/format.ts";
import { BUDGET } from "./content.ts";

/**
 * The enacted budgets (GAA) year by year, newest first, as native
 * `<details>` rows (no JavaScript): each summary shows the year, how many
 * programs it funds, and their total; opened, it lists those programs largest
 * first with their department and exact amount (names without appended
 * map coordinates). A program counts in a year
 * only where its amount is above zero. Takes `gaa` (`BUDGET_GAA`) and
 * `openYear` to start one year open. Server component.
 */
export function BudgetYearList({
  gaa,
  openYear,
}: {
  gaa: BudgetGaa;
  openYear?: number;
}) {
  const years = [...gaaYearTotals(gaa)].reverse();
  return (
    <div className="border-t border-ed-rule">
      {years.map((y) => {
        const programs = gaaProgramsFor(gaa, y.year);
        return (
          <details
            key={y.year}
            open={y.year === openYear}
            className="group border-b border-ed-rule"
          >
            <summary className="flex min-h-11 cursor-pointer flex-wrap items-baseline gap-x-4 gap-y-1 py-4 marker:text-ed-navy">
              <span className="font-display text-lg font-semibold text-ed-ink">
                {y.year}
              </span>
              <span className="type-ui text-ed-ink-3">
                {BUDGET.gaaYear(y.programs)}
              </span>
              <span className="ml-auto font-display text-lg font-semibold text-ed-ink tabular-nums">
                {formatPesoShort(y.amount)}
              </span>
            </summary>
            {programs.length === 0 ? (
              <p className="type-body m-0 pb-6">{BUDGET.gaaNone}</p>
            ) : (
              <ol className="m-0 mb-6 list-none border-t border-ed-rule p-0">
                {programs.map((p) => (
                  <li
                    key={p.key}
                    className="grid gap-1 border-b border-ed-rule py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6"
                  >
                    <div>
                      <p className="type-ui m-0 text-ed-ink">
                        {projectTitle(p.name)}
                      </p>
                      <p className="type-ui m-0 text-ed-ink-3">
                        {gaa.departments[p.department]}
                      </p>
                    </div>
                    <p className="type-ui m-0 font-semibold text-ed-ink tabular-nums sm:text-right">
                      {formatPeso(p.amount)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </details>
        );
      })}
    </div>
  );
}
