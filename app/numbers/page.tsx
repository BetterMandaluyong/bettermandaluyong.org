import type { Metadata } from "next";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Container } from "../../components/Container.tsx";
import { DataTable } from "../../components/DataTable.tsx";
import { Notice } from "../../components/Notice.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { StatList } from "../../components/StatList.tsx";
import { NUMBERS } from "../../components/content.ts";
import { pageMetadata } from "../../components/metadata.ts";
import { BARANGAYS } from "../../data/barangays.ts";
import {
  INCOME_LINES,
  POVERTY_AREAS,
  SPENDING_LINES,
  type Breakdown,
} from "../../data/schema.ts";
import { FINANCES, POPULATION, POVERTY } from "../../data/stats.ts";
import { formatSourceDate } from "../../utils/barangays/format.ts";
import { formatPeso, formatPesoShort } from "../../utils/budget/format.ts";
import {
  districtTotals,
  formatChange,
  formatCount,
  formatPercent,
  latestCensuses,
  percentChange,
  populationRows,
} from "../../utils/stats/population.ts";

export const metadata: Metadata = pageMetadata({
  title: NUMBERS.metaTitle,
  description: NUMBERS.metaDescription,
  path: "/numbers",
});

/** A breakdown's lines, largest first, as table rows with their share. */
function breakdownRows<K extends string>(
  b: Breakdown<K>,
  keys: readonly K[],
  labels: Record<K, string>,
) {
  return [...keys]
    .sort((x, y) => b.lines[y] - b.lines[x])
    .map((k) => ({
      key: k,
      cells: [
        labels[k],
        formatPeso(b.lines[k]),
        formatPercent((b.lines[k] / b.total) * 100),
      ],
    }));
}

/**
 * "Mandaluyong in Numbers": headline figures, then the population of every
 * barangay (latest census against the one before, with district and city
 * totals), PSA's poverty estimate against Metro Manila and the country, and
 * the City Government's income and spending for one year from BLGF. Every
 * band credits its source, and flags figures still awaiting a check.
 */
export default function NumbersPage() {
  const { latest, previous } = latestCensuses(POPULATION);
  const rows = populationRows(POPULATION, BARANGAYS);
  const districts = districtTotals(rows);
  const cityChange = previous
    ? percentChange(previous.total, latest.total)
    : null;
  const povertyYear = POVERTY.years[POVERTY.years.length - 1]!;
  const cityPoverty = POVERTY.areas.city.years[povertyYear]!;
  const f = FINANCES;

  return (
    <PageShell>
      <PageMasthead title={NUMBERS.heading} lede={NUMBERS.intro} />

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={NUMBERS.glanceHeading} />
          <StatList
            label={NUMBERS.glanceHeading}
            items={[
              {
                label: NUMBERS.people(latest.year),
                value: formatCount(latest.total),
                note: previous
                  ? NUMBERS.peopleNote(formatChange(cityChange), previous.year)
                  : undefined,
              },
              {
                label: NUMBERS.poverty(povertyYear),
                value: formatPercent(cityPoverty.incidence),
                note: NUMBERS.povertyGlanceNote,
              },
              {
                label: NUMBERS.income(f.year),
                value: formatPesoShort(f.income.total),
                note: NUMBERS.incomeNote,
              },
              {
                label: NUMBERS.spending(f.year),
                value: formatPesoShort(f.spending.total),
                note: NUMBERS.spendingNote,
              },
            ]}
          />
        </Container>
      </section>

      <section id="population" className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader
            label={NUMBERS.populationHeading}
            meta={NUMBERS.populationMeta(latest.year)}
          />
          <p className="type-body m-0 mb-6 max-w-[65ch]">
            {NUMBERS.populationIntro}
          </p>
          <DataTable
            caption={NUMBERS.populationCaption(latest.year)}
            columns={[
              { label: NUMBERS.columns.barangay },
              { label: NUMBERS.columns.district },
              ...(previous
                ? [
                    {
                      label: NUMBERS.columns.year(previous.year),
                      numeric: true,
                    },
                  ]
                : []),
              { label: NUMBERS.columns.year(latest.year), numeric: true },
              ...(previous
                ? [{ label: NUMBERS.columns.change, numeric: true }]
                : []),
              { label: NUMBERS.columns.share, numeric: true },
            ]}
            rows={rows.map((r) => ({
              key: r.slug,
              cells: [
                <a
                  key="name"
                  href={`/barangays/${r.slug}`}
                  className="text-ed-navy"
                >
                  {r.name}
                </a>,
                r.district,
                ...(previous ? [formatCount(r.previous ?? 0)] : []),
                formatCount(r.latest),
                ...(previous ? [formatChange(r.change)] : []),
                formatPercent(r.share),
              ],
            }))}
            footer={[
              ...districts.map((d) => ({
                key: `district-${d.district}`,
                cells: [
                  NUMBERS.districtRow(d.district),
                  "",
                  ...(previous ? [formatCount(d.previous ?? 0)] : []),
                  formatCount(d.latest),
                  ...(previous ? [formatChange(d.change)] : []),
                  formatPercent((d.latest / latest.total) * 100),
                ],
              })),
              {
                key: "city",
                cells: [
                  NUMBERS.cityRow,
                  "",
                  ...(previous ? [formatCount(previous.total)] : []),
                  formatCount(latest.total),
                  ...(previous ? [formatChange(cityChange)] : []),
                  formatPercent(100),
                ],
              },
            ]}
          />
          {!latest.checked && (
            <Notice
              className="mt-6"
              tag={NUMBERS.uncheckedTag}
              title={NUMBERS.uncheckedTitle(latest.year)}
            >
              <p className="type-body m-0 mt-2 max-w-[65ch]">
                {NUMBERS.unchecked(latest.year)}
              </p>
            </Notice>
          )}
          {[...POPULATION.censuses].reverse().map((c) => (
            <SourceNote key={c.year} href={c.source.url} label={c.source.title}>
              {NUMBERS.madeOfficial}{" "}
              <a
                href={c.proclamation.url}
                rel="noreferrer"
                className="text-ed-navy"
              >
                {c.proclamation.title}
              </a>
              .
            </SourceNote>
          ))}
        </Container>
      </section>

      <section id="poverty" className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader
            label={NUMBERS.povertyHeading}
            meta={NUMBERS.povertyMeta(povertyYear)}
          />
          <p className="type-body m-0 mb-6 max-w-[65ch]">
            {NUMBERS.povertyIntro(
              formatPeso(POVERTY.threshold[povertyYear]!),
              povertyYear,
            )}
          </p>
          <StatList
            label={NUMBERS.povertyHeading}
            items={POVERTY_AREAS.map((key) => {
              const e = POVERTY.areas[key].years[povertyYear]!;
              return {
                label: NUMBERS.areas[key],
                value: formatPercent(e.incidence),
                note: NUMBERS.povertyNote(
                  formatPercent(e.low),
                  formatPercent(e.high),
                  POVERTY.confidence,
                  formatCount(e.poor),
                ),
              };
            })}
          />
          <p className="type-body m-0 mt-6 max-w-[65ch]">
            {NUMBERS.povertyCaution}
          </p>
          <h3 className="type-subheading m-0 mt-10 mb-4">
            {NUMBERS.povertyTrendHeading}
          </h3>
          <DataTable
            caption={NUMBERS.povertyTrendCaption}
            columns={[
              { label: NUMBERS.areaColumn },
              ...POVERTY.years.map((y) => ({
                label: String(y),
                numeric: true,
              })),
            ]}
            rows={POVERTY_AREAS.map((key) => {
              const area = POVERTY.areas[key];
              return {
                key,
                cells: [
                  NUMBERS.areas[key],
                  ...POVERTY.years.map((y, i) => {
                    const before = POVERTY.years[i - 1];
                    const mark =
                      before !== undefined &&
                      area.significant.includes(`${before}-${y}`);
                    return `${formatPercent(area.years[y]!.incidence)}${mark ? "*" : ""}`;
                  }),
                ],
              };
            })}
          />
          <p className="type-ui m-0 mt-3 text-ed-ink-3">
            {NUMBERS.significantNote}
          </p>
          <SourceNote href={POVERTY.release.url} label={POVERTY.release.title}>
            {NUMBERS.povertyTables}
          </SourceNote>
        </Container>
      </section>

      <section id="money">
        <Container className="py-8 md:py-12">
          <SectionHeader
            label={NUMBERS.moneyHeading}
            meta={NUMBERS.moneyMeta(f.year, f.preliminary)}
          />
          <p className="type-body m-0 max-w-[65ch]">
            {NUMBERS.moneyIntro(f.year)}
          </p>
          <p className="type-ui m-0 mt-3 mb-6">
            <ArrowLink href={NUMBERS.nationalUrl}>
              {NUMBERS.nationalLink}
            </ArrowLink>
          </p>
          <StatList
            label={NUMBERS.moneyHeading}
            items={[
              {
                label: NUMBERS.income(f.year),
                value: formatPesoShort(f.income.total),
                note: NUMBERS.incomeNote,
              },
              {
                label: NUMBERS.spending(f.year),
                value: formatPesoShort(f.spending.total),
                note: NUMBERS.spendingNote,
              },
              {
                label: NUMBERS.capital,
                value: formatPesoShort(f.capitalOutlay),
                note: NUMBERS.capitalNote,
              },
              {
                label: NUMBERS.cash,
                value: formatPesoShort(f.cashEnd),
                note: NUMBERS.cashNote,
              },
            ]}
          />
          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="type-subheading m-0 mb-4">
                {NUMBERS.incomeHeading}
              </h3>
              <DataTable
                caption={NUMBERS.incomeCaption(f.year)}
                columns={[
                  { label: NUMBERS.sourceColumn },
                  { label: NUMBERS.amountColumn, numeric: true },
                  { label: NUMBERS.shareColumn, numeric: true },
                ]}
                rows={breakdownRows(
                  f.income,
                  INCOME_LINES,
                  NUMBERS.incomeLines,
                )}
                footer={[
                  {
                    key: "total",
                    cells: [
                      NUMBERS.totalRow,
                      formatPeso(f.income.total),
                      formatPercent(100),
                    ],
                  },
                ]}
              />
            </div>
            <div className="min-w-0">
              <h3 className="type-subheading m-0 mb-4">
                {NUMBERS.spendingHeading}
              </h3>
              <DataTable
                caption={NUMBERS.spendingCaption(f.year)}
                columns={[
                  { label: NUMBERS.sectorColumn },
                  { label: NUMBERS.amountColumn, numeric: true },
                  { label: NUMBERS.shareColumn, numeric: true },
                ]}
                rows={breakdownRows(
                  f.spending,
                  SPENDING_LINES,
                  NUMBERS.spendingLines,
                )}
                footer={[
                  {
                    key: "total",
                    cells: [
                      NUMBERS.totalRow,
                      formatPeso(f.spending.total),
                      formatPercent(100),
                    ],
                  },
                ]}
              />
            </div>
          </div>
          <SourceNote href={f.source.url} label={f.source.title}>
            {f.preliminary &&
              NUMBERS.preliminary(formatSourceDate(f.extracted))}
          </SourceNote>
        </Container>
      </section>
    </PageShell>
  );
}
