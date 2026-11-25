import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "../../../components/ArrowLink.tsx";
import { Container } from "../../../components/Container.tsx";
import { Flag } from "../../../components/Flag.tsx";
import { OfficialList } from "../../../components/OfficialList.tsx";
import { PageShell } from "../../../components/PageShell.tsx";
import { SectionHeader } from "../../../components/SectionHeader.tsx";
import { SourceNote } from "../../../components/SourceNote.tsx";
import { BARANGAYS as COPY, PEOPLE_COPY } from "../../../components/content.ts";
import {
  BOUNDARIES_URL,
  MAP_BARANGAYS,
  getBarangay,
} from "../../../data/barangays.ts";
import {
  CITY_OFFICIALS,
  CITY_OFFICIALS_AS_OF,
} from "../../../data/city-officials.ts";
import { PEOPLE, getPerson } from "../../../data/people.ts";
import { BarangayMap } from "../../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../../utils/barangays/format.ts";

type Params = { params: Promise<{ slug: string }> };

/** One page per person, built ahead of time. */
export function generateStaticParams() {
  return PEOPLE.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const person = getPerson((await params).slug);
  if (!person) return { title: PEOPLE_COPY.notFoundTitle };
  return {
    title: `${person.name} — Better Mandaluyong`,
    description: PEOPLE_COPY.metaFor(person.name, person.role),
  };
}

/**
 * One elected official: their position, the barangay or council district they
 * serve (with links), and how to reach them. City officials show the contacts
 * the city publishes for them; barangay and SK officials show the barangay
 * hall's contacts, labelled as the hall's. A map zooms to their barangay or
 * council district, and a credit links the city page the data came from.
 * Unknown slugs 404.
 */
export default async function PersonPage({ params }: Params) {
  const person = getPerson((await params).slug);
  if (!person) notFound();

  const official =
    person.cityIndex !== undefined ? CITY_OFFICIALS[person.cityIndex] : null;
  const barangay = person.barangay ? getBarangay(person.barangay) : undefined;

  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <ArrowLink href="/people">{PEOPLE_COPY.allPeople}</ArrowLink>
            <p className="type-label m-0 mt-6 text-ed-ink-3">{person.role}</p>
            <h1 className="type-display m-0 mt-2 text-balance">
              {person.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {person.district && (
                <a
                  href={`/districts#district-${person.district}`}
                  className="no-underline"
                >
                  <Flag variant="navy">{COPY.district(person.district)}</Flag>
                </a>
              )}
              {!person.district && (
                <Flag variant="navy">{PEOPLE_COPY.wholeCity}</Flag>
              )}
              {barangay && (
                <a
                  href={`/barangays/${barangay.slug}`}
                  className="no-underline"
                >
                  <Flag variant="outline">Barangay {barangay.name}</Flag>
                </a>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
          <SectionHeader
            label={
              official ? PEOPLE_COPY.contactHeading : PEOPLE_COPY.hallHeading
            }
          />
          {official ? (
            <OfficialList
              variant="card"
              label={person.name}
              items={[
                {
                  name: official.name,
                  role: official.role,
                  office: official.office,
                  phones: official.phones,
                  emails: official.emails,
                },
              ]}
            />
          ) : (
            barangay && (
              <>
                <OfficialList
                  variant="card"
                  label={PEOPLE_COPY.hallHeading}
                  items={[
                    {
                      name: barangay.address,
                      role: COPY.hallAddress,
                      phones: barangay.phones,
                      emails: barangay.email ? [barangay.email] : [],
                    },
                  ]}
                />
                <p className="type-ui m-0 mt-3 max-w-[65ch] text-ed-ink-3">
                  {PEOPLE_COPY.hallNote}
                </p>
                <div className="mt-6">
                  <ArrowLink href={`/barangays/${barangay.slug}`}>
                    {PEOPLE_COPY.seeBarangay(barangay.name)}
                  </ArrowLink>
                </div>
              </>
            )
          )}
          {official ? (
            <SourceNote
              href={official.sourceUrl}
              updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
            />
          ) : (
            barangay && (
              <SourceNote
                href={barangay.sourceUrl}
                updated={formatSourceDate(barangay.sourceModified)}
              />
            )
          )}
        </Container>
      </section>

      {(barangay || person.district) && (
        <section>
          <Container className="py-12 md:py-16">
            <BarangayMap
              geojsonUrl={BOUNDARIES_URL}
              barangays={MAP_BARANGAYS}
              focus={barangay?.slug}
              focusDistrict={barangay ? undefined : person.district}
              height="short"
            />
            <SourceNote>{COPY.mapCredit}</SourceNote>
          </Container>
        </section>
      )}
    </PageShell>
  );
}
