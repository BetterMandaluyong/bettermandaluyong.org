import type { Metadata } from "next";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { BudgetProjectList } from "../../components/BudgetProjectList.tsx";
import { BudgetYearList } from "../../components/BudgetYearList.tsx";
import { Container } from "../../components/Container.tsx";
import { Flag } from "../../components/Flag.tsx";
import { Notice } from "../../components/Notice.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { StatList } from "../../components/StatList.tsx";
import { BUDGET, BUDGET_HISTORY_URL } from "../../components/content.ts";
import { BUDGET_2027, BUDGET_GAA, BUDGET_SCOPE } from "../../data/budget.ts";
import { REPRESENTATIVE } from "../../data/city-officials.ts";
import { personHref } from "../../data/people.ts";
import { BUDGET_PROGRAMS } from "../../data/schema.ts";
import { formatSourceDate } from "../../utils/barangays/format.ts";
import {
  formatPesoShort,
  gaaYearTotals,
  sortProjects,
  statusCounts,
  versionTotal,
} from "../../utils/budget/format.ts";

export const metadata: Metadata = {
  title: BUDGET.metaTitle,
  description: BUDGET.metaDescription,
};

/**
 * The national budget page: the 2027 project lines that name Mandaluyong (the
 * NEP against the House bill), the DPWH office that serves the city with its
 * whole, unsplit figures, and the enacted budgets of 2020–2026, all read from
 * the snapshot in `data/budget/` at build time. The API's disclaimers are
 * printed as fetched, with any hand exclusions and the data credit.
 */
export default function BudgetPage() {
  const projects = sortProjects(BUDGET_2027.projects);
  const nep = versionTotal(projects, "nep");
  const house = versionTotal(projects, "house");
  const years = gaaYearTotals(BUDGET_GAA);
  const latest = years[years.length - 1];
  const { district } = BUDGET_2027;
  const asOf = formatSourceDate(BUDGET_2027.fetchedAt);
  const repHref = personHref(REPRESENTATIVE.name, REPRESENTATIVE.role);

  return (
    <PageShell>
      <PageMasthead title={BUDGET.heading} lede={BUDGET.intro}>
        <p className="type-body m-0 max-w-[65ch] text-pretty">
          {BUDGET.notSpending} {BUDGET.asOf(asOf)}{" "}
          <ArrowLink href={BUDGET_HISTORY_URL}>{BUDGET.historyLink}</ArrowLink>
        </p>
      </PageMasthead>

      <section>
        <Container className="py-8 md:py-12">
          <SectionHeader label={BUDGET.figuresHeading} />
          <StatList
            label={BUDGET.figuresHeading}
            items={[
              {
                label: BUDGET.figures.lines,
                value: String(projects.length),
                note: BUDGET.figures.linesNote(BUDGET_PROGRAMS.length),
              },
              {
                label: BUDGET.figures.nep,
                value: formatPesoShort(nep.amount),
                note: BUDGET.figures.versionNote(nep.lines),
              },
              {
                label: BUDGET.figures.house,
                value: formatPesoShort(house.amount),
                note: BUDGET.figures.versionNote(house.lines),
              },
              {
                label: BUDGET.figures.gaa(latest.year),
                value: formatPesoShort(latest.amount),
                note: BUDGET.figures.gaaNote(latest.programs),
              },
            ]}
          />
          <p className="type-body m-0 mt-6 max-w-[65ch] text-pretty">
            {BUDGET.versionsNote}
          </p>
        </Container>
      </section>

      <section className="border-t border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader
            label={BUDGET.projectsHeading}
            meta={BUDGET.projectsMeta(projects.length)}
          />
          <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
            {BUDGET.projectsIntro}
          </p>
          {projects.length === 0 ? (
            <p className="type-body m-0">{BUDGET.projectsEmpty}</p>
          ) : (
            <>
              <ul
                aria-label={BUDGET.statusesLabel}
                className="m-0 mb-8 flex list-none flex-wrap gap-2 p-0"
              >
                {statusCounts(projects).map(({ status, count }) => (
                  <li key={status}>
                    <Flag variant="outline">
                      {status} · {count}
                    </Flag>
                  </li>
                ))}
              </ul>
              <BudgetProjectList
                projects={projects}
                programs={BUDGET_2027.programs}
                label={BUDGET.projectsHeading}
              />
            </>
          )}
        </Container>
      </section>

      <section className="border-t border-ed-rule bg-ed-paper-2">
        <Container className="py-8 md:py-12">
          <SectionHeader label={BUDGET.officeHeading} />
          <p className="type-body m-0 mb-8 max-w-[65ch] text-pretty">
            {BUDGET.officeIntro}
          </p>
          {district.offices.map((office) => (
            <div key={office.name} className="mb-8 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="type-subheading m-0">{office.name}</h3>
                <Flag>{office.tierText}</Flag>
              </div>
              <p className="type-ui m-0 text-ed-ink-3">{office.kind}</p>
              {office.coServed.length > 0 && (
                <p className="type-body m-0 max-w-[65ch]">
                  {BUDGET.alsoServes}: {office.coServed.join("; ")}.
                </p>
              )}
            </div>
          ))}
          <StatList
            label={BUDGET.officeHeading}
            items={[
              {
                label: BUDGET.office.gaa2026,
                value: formatPesoShort(district.headline.gaa2026),
              },
              {
                label: BUDGET.office.nep2027,
                value: formatPesoShort(district.headline.nep2027),
              },
              {
                label: BUDGET.office.house2027,
                value: formatPesoShort(district.headline.house2027),
              },
              {
                label: BUDGET.office.change,
                value:
                  district.vsProposal.delta === null
                    ? formatPesoShort(null)
                    : `${district.vsProposal.delta > 0 ? "+" : ""}${formatPesoShort(district.vsProposal.delta)}`,
                note: `${BUDGET.nep} ${formatPesoShort(district.vsProposal.nep)} · ${BUDGET.house} ${formatPesoShort(district.vsProposal.house)}`,
              },
            ]}
          />
          <div className="mt-6 flex flex-col gap-3">
            <p className="type-body m-0">
              {BUDGET.representative}{" "}
              {repHref ? (
                <a href={repHref} className="text-ed-navy">
                  {REPRESENTATIVE.name}
                </a>
              ) : (
                REPRESENTATIVE.name
              )}
              .
            </p>
            <p className="type-ui m-0">
              <ArrowLink href={district.url} external>
                {BUDGET.districtLink}
              </ArrowLink>
            </p>
          </div>
        </Container>
      </section>

      <section className="border-t border-ed-rule">
        <Container narrow className="py-8 md:py-12">
          <SectionHeader
            label={BUDGET.gaaHeading}
            meta={BUDGET.gaaYear(BUDGET_GAA.programs.length)}
          />
          <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
            {BUDGET.gaaIntro}
          </p>
          <BudgetYearList gaa={BUDGET_GAA} />
        </Container>
      </section>

      <section className="border-t border-ed-rule bg-ed-paper-2">
        <Container narrow className="py-8 md:py-12">
          <SectionHeader label={BUDGET.aboutHeading} />
          <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
            {BUDGET.about}
          </p>
          <div className="flex flex-col gap-4">
            {BUDGET_2027.disclaimers.map((d) => (
              <Notice key={d.id} tag={BUDGET.disclaimersTag} title={d.title}>
                <p className="type-body m-0 mt-3">{d.body}</p>
                <p className="type-ui m-0 mt-3">
                  <a href={d.url} rel="noreferrer" className="text-ed-navy">
                    {d.url.replace(/^https:\/\//, "")}
                  </a>
                </p>
              </Notice>
            ))}
            <p className="type-ui m-0 max-w-[65ch] text-ed-ink-3">
              {BUDGET_2027.source.notice}
            </p>
          </div>

          <h3 className="type-subheading m-0 mt-10 mb-3">
            {BUDGET.excludedHeading}
          </h3>
          {BUDGET_SCOPE.exclude.length === 0 ? (
            <p className="type-body m-0">{BUDGET.excludedNone}</p>
          ) : (
            <ul className="type-body m-0 pl-5">
              {BUDGET_SCOPE.exclude.map((e) => (
                <li key={e.id}>
                  <code className="font-mono text-sm">{e.id}</code>: {e.reason}
                </li>
              ))}
            </ul>
          )}

          <SourceNote>
            {BUDGET.credit}{" "}
            <a
              href={BUDGET.licenseUrl}
              rel="noreferrer"
              className="text-ed-navy"
            >
              {BUDGET.licenseLink}
            </a>
            :{" "}
            <a
              href={BUDGET.sourceUrl}
              rel="noreferrer"
              className="text-ed-navy"
            >
              {BUDGET.sourceLink}
            </a>
            {" · "}
            <a href={BUDGET.docsUrl} rel="noreferrer" className="text-ed-navy">
              {BUDGET.docsLink}
            </a>
            . {BUDGET.changes} {BUDGET.asOf(asOf)}
          </SourceNote>
        </Container>
      </section>
    </PageShell>
  );
}
