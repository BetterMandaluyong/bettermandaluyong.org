import type { BudgetProgram, BudgetProject } from "../data/schema.ts";
import { formatPeso, projectTitle } from "../utils/budget/format.ts";
import { ArrowLink } from "./ArrowLink.tsx";
import { Flag } from "./Flag.tsx";
import { BUDGET } from "./content.ts";

/** One version's amount, with a link to its page in the budget document when there is one. */
function Amount({
  label,
  amount,
  pdf,
  pdfLabel,
}: {
  label: string;
  amount: number | null;
  pdf: string | null;
  pdfLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="type-label text-ed-ink-3">{label}</dt>
      <dd className="m-0 font-display text-lg font-semibold text-ed-ink tabular-nums">
        {amount === null ? (
          <>
            <span aria-hidden="true">{formatPeso(null)}</span>
            <span className="sr-only">{BUDGET.noLine}</span>
          </>
        ) : (
          formatPeso(amount)
        )}
      </dd>
      {pdf && (
        <dd className="type-ui m-0">
          <a href={pdf} rel="noreferrer" className="text-ed-navy">
            {pdfLabel}
          </a>
        </dd>
      )}
    </div>
  );
}

/**
 * The 2027 project lines as a ruled `<ol>`: the title (without appended map
 * coordinates), its program and office, the API's status as a `Flag` (plus an
 * outline flag for an unconfirmed match), the NEP and House bill amounts side
 * by side (a dash where a version has no such line, never ₱0), links to each
 * document page, and a link to the line on budget.bettergov.ph. Pass
 * `projects` already sorted, `programs` (key → label), and a `label` for the
 * list. Server component; copy is `BUDGET` in content.ts.
 */
export function BudgetProjectList({
  projects,
  programs,
  label,
}: {
  projects: BudgetProject[];
  programs: Record<BudgetProgram, string>;
  label: string;
}) {
  return (
    <ol
      aria-label={label}
      className="m-0 list-none border-t border-ed-rule p-0"
    >
      {projects.map((p) => (
        <li
          key={p.key}
          className="grid gap-4 border-b border-ed-rule py-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Flag>{p.status}</Flag>
              {p.held && <Flag variant="outline">{BUDGET.unconfirmed}</Flag>}
            </div>
            <h3 className="type-subheading m-0 text-pretty">
              {projectTitle(p.title)}
            </h3>
            <p className="type-ui m-0 text-ed-ink-3">
              {[programs[p.program], p.line, p.office]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="type-ui m-0">
              <ArrowLink href={p.url} external>
                {BUDGET.detailsLink}
              </ArrowLink>
            </p>
          </div>
          <dl className="m-0 grid grid-cols-2 gap-4 self-start">
            <Amount
              label={BUDGET.nep}
              amount={p.nep}
              pdf={p.nepPdf}
              pdfLabel={BUDGET.nepPage}
            />
            <Amount
              label={BUDGET.house}
              amount={p.house}
              pdf={p.housePdf}
              pdfLabel={BUDGET.housePage}
            />
          </dl>
        </li>
      ))}
    </ol>
  );
}
