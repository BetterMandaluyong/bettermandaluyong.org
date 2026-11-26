import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "../../../components/ArrowLink.tsx";
import { Container } from "../../../components/Container.tsx";
import { Flag } from "../../../components/Flag.tsx";
import {
  OfficialList,
  officialItem,
} from "../../../components/OfficialList.tsx";
import { PageMasthead } from "../../../components/PageMasthead.tsx";
import { PageShell } from "../../../components/PageShell.tsx";
import { pageMetadata } from "../../../components/metadata.ts";
import { SectionHeader } from "../../../components/SectionHeader.tsx";
import { DilgNote } from "../../../components/DilgNote.tsx";
import { SourceNote } from "../../../components/SourceNote.tsx";
import { StatList } from "../../../components/StatList.tsx";
import {
  BARANGAYS as COPY,
  NUMBERS,
  SITE,
} from "../../../components/content.ts";
import {
  BARANGAYS,
  BOUNDARIES_URL,
  MAP_BARANGAYS,
  ZIP_LOCATOR_URL,
  getBarangay,
} from "../../../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS_AS_OF,
  MAYOR,
  REPRESENTATIVE,
  VICE_MAYOR,
  councilorsFor,
} from "../../../data/city-officials.ts";
import { personHref } from "../../../data/people.ts";
import { POPULATION } from "../../../data/stats.ts";
import { BarangayMap } from "../../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../../utils/barangays/format.ts";
import {
  formatChange,
  formatCount,
  latestCensuses,
  populationRows,
} from "../../../utils/stats/population.ts";

type Params = { params: Promise<{ slug: string }> };

/** One page per barangay, built ahead of time. */
export function generateStaticParams() {
  return BARANGAYS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const barangay = getBarangay((await params).slug);
  if (!barangay) return { title: COPY.notFoundTitle };
  return pageMetadata({
    title: `Barangay ${barangay.name} — ${SITE.name}`,
    description: `Barangay ${barangay.name}, Mandaluyong: its officials, contact details, council district, and approximate ZIP code.`,
    path: `/barangays/${barangay.slug}`,
  });
}

/**
 * One barangay: where it is on the map, the barangay hall's address and
 * phones, the barangay council and Sangguniang Kabataan, and the officials
 * who represent it citywide (House representative, mayor, vice mayor, and its
 * district's councilors), with a credit and date for the city page the data
 * came from. A band gives its population in the latest census, the change
 * since the one before, and its rank in the city. Unknown slugs 404.
 */
export default async function BarangayPage({ params }: Params) {
  const barangay = getBarangay((await params).slug);
  if (!barangay) notFound();

  const person = (name: string, role: string) => ({
    name,
    role,
    href: personHref(name, role, barangay.slug),
  });
  const council = [
    person(barangay.captain, COPY.captain),
    ...barangay.kagawads.map((m) => person(m, COPY.kagawad)),
  ];
  const censuses = latestCensuses(POPULATION);
  const ranked = populationRows(POPULATION, BARANGAYS);
  const rank = ranked.findIndex((r) => r.slug === barangay.slug);
  const people = ranked[rank]!;
  const sk = [
    person(barangay.skChair, COPY.skChair),
    ...barangay.skKagawads.map((m) => person(m, COPY.skKagawad)),
  ];

  return (
    <PageShell>
      <PageMasthead
        title={`Barangay ${barangay.name}`}
        before={<ArrowLink href="/barangays">{COPY.backToAll}</ArrowLink>}
      >
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/districts#district-${barangay.district}`}
            className="no-underline"
          >
            <Flag variant="navy">{COPY.district(barangay.district)}</Flag>
          </a>
          <Flag variant="outline">{COPY.zip(barangay.zip)}</Flag>
        </div>
        <p className="type-ui m-0 mt-3 max-w-[65ch] text-ed-ink-3">
          {COPY.zipNote}{" "}
          <a href={ZIP_LOCATOR_URL} rel="noreferrer">
            {COPY.zipLookup}
          </a>
          .
        </p>
      </PageMasthead>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <BarangayMap
            geojsonUrl={BOUNDARIES_URL}
            barangays={MAP_BARANGAYS}
            focus={barangay.slug}
            height="short"
          />
          <SourceNote>{COPY.mapCredit}</SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={NUMBERS.barangayHeading} />
          <StatList
            label={NUMBERS.barangayHeading}
            items={[
              {
                label: NUMBERS.barangayCount(censuses.latest.year),
                value: formatCount(people.latest),
              },
              ...(censuses.previous
                ? [
                    {
                      label: NUMBERS.barangayChange(censuses.previous.year),
                      value: formatChange(people.change),
                      note: NUMBERS.previousCount(
                        formatCount(people.previous ?? 0),
                        censuses.previous.year,
                      ),
                    },
                  ]
                : []),
              {
                label: NUMBERS.barangayRank,
                value: NUMBERS.rankValue(rank + 1, ranked.length),
                note: NUMBERS.rankNote,
              },
            ]}
          />
          <div className="mt-6">
            <ArrowLink href="/numbers#population">{NUMBERS.seeAll}</ArrowLink>
          </div>
          <SourceNote
            href={censuses.latest.source.url}
            label={censuses.latest.source.title}
          >
            {!censuses.latest.checked &&
              NUMBERS.uncheckedTitle(censuses.latest.year) + "."}
          </SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.hallHeading} />
          <OfficialList
            variant="card"
            label={COPY.hallHeading}
            items={[
              {
                name: barangay.address,
                role: COPY.hallAddress,
                phones: barangay.phones,
                emails: barangay.email ? [barangay.email] : [],
              },
            ]}
          />
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <SectionHeader label={COPY.councilHeading} />
              <OfficialList label={COPY.councilHeading} items={council} />
            </div>
            <div>
              <SectionHeader label={COPY.skHeading} />
              <OfficialList label={COPY.skHeading} items={sk} />
            </div>
          </div>
          <SourceNote
            href={barangay.sourceUrl}
            updated={formatSourceDate(barangay.sourceModified)}
          >
            <DilgNote
              dilg={barangay.dilg}
              changed={barangay.flags.some((f) => f.status === "changed")}
            />
          </SourceNote>
        </Container>
      </section>

      <section>
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.repsHeading} />
          <p className="type-body m-0 mb-8 max-w-[65ch]">
            {COPY.repsFor(barangay.district)} {COPY.districtNote}
          </p>
          <div className="flex flex-col gap-10">
            <div>
              <h3 className="type-subheading m-0 mb-3">
                {COPY.repsHouseHeading}
              </h3>
              <OfficialList
                variant="card"
                label={COPY.repsHouseHeading}
                items={[officialItem(REPRESENTATIVE)]}
              />
            </div>
            <div>
              <h3 className="type-subheading m-0 mb-3">
                {COPY.repsCityHeading}
              </h3>
              <OfficialList
                variant="card"
                label={COPY.repsCityHeading}
                items={[officialItem(MAYOR), officialItem(VICE_MAYOR)]}
              />
            </div>
            <div>
              <h3 className="type-subheading m-0 mb-3">
                {COPY.councilorsHeading(barangay.district)}
              </h3>
              <OfficialList
                variant="card"
                label={COPY.councilorsHeading(barangay.district)}
                items={councilorsFor(barangay.district).map(officialItem)}
              />
            </div>
          </div>
          <SourceNote
            href={CITY_DIRECTORY_URL}
            updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
          />
        </Container>
      </section>
    </PageShell>
  );
}
