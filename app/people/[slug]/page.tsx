import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "../../../components/ArrowLink.tsx";
import { Container } from "../../../components/Container.tsx";
import { Flag } from "../../../components/Flag.tsx";
import { OfficialList } from "../../../components/OfficialList.tsx";
import { PageMasthead } from "../../../components/PageMasthead.tsx";
import { PageShell } from "../../../components/PageShell.tsx";
import { SectionHeader } from "../../../components/SectionHeader.tsx";
import { DilgNote } from "../../../components/DilgNote.tsx";
import { SourceNote } from "../../../components/SourceNote.tsx";
import {
  BARANGAYS as COPY,
  PEOPLE_COPY,
  SITE,
} from "../../../components/content.ts";
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
import { EXTERNAL_ID_KEYS, EXTERNAL_ID_KINDS } from "../../../data/schema.ts";
import { BarangayMap } from "../../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../../utils/barangays/format.ts";

type Params = { params: Promise<{ slug: string }> };

/** Every position someone holds, e.g. "Mayor" or "SK Kagawad". */
function roles(person: { positions: { role: string }[] }): string {
  return person.positions.map((p) => p.role).join(" · ");
}

/** One page per person, built ahead of time. */
export function generateStaticParams() {
  return PEOPLE.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const person = getPerson((await params).slug);
  if (!person) return { title: PEOPLE_COPY.notFoundTitle };
  return {
    title: `${person.name} — ${SITE.name}`,
    description: PEOPLE_COPY.metaFor(person.name, roles(person)),
  };
}

/**
 * One elected official: their position, the barangay or council district they
 * serve (with links), and how to reach them. City officials show the contacts
 * the city publishes for them; barangay and SK officials show the barangay
 * hall's contacts, labelled as the hall's. Links to their records in other
 * datasets (`ids:` in their person file) come next. A map zooms to their barangay or
 * council district, and a credit links the city page the data came from.
 * Unknown slugs 404.
 */
export default async function PersonPage({ params }: Params) {
  const person = getPerson((await params).slug);
  if (!person) notFound();

  // Their first office (a city one, if any) sets the contacts and the map.
  const position = person.positions[0]!;
  const official =
    position.cityIndex !== undefined
      ? CITY_OFFICIALS[position.cityIndex]
      : null;
  const barangay = position.barangay
    ? getBarangay(position.barangay)
    : undefined;
  const external = EXTERNAL_ID_KEYS.flatMap((key) => {
    const value = person.ids[key];
    if (!value) return [];
    const kind = EXTERNAL_ID_KINDS[key];
    return [{ key, value, label: kind.label, url: kind.url?.(value) }];
  });

  return (
    <PageShell>
      <PageMasthead
        title={person.name}
        before={<ArrowLink href="/people">{PEOPLE_COPY.allPeople}</ArrowLink>}
        eyebrow={
          <p className="type-label m-0 text-ed-ink-3">{roles(person)}</p>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          {position.district && (
            <a
              href={`/districts#district-${position.district}`}
              className="no-underline"
            >
              <Flag variant="navy">{COPY.district(position.district)}</Flag>
            </a>
          )}
          {!position.district && (
            <Flag variant="navy">{PEOPLE_COPY.wholeCity}</Flag>
          )}
          {barangay && (
            <a href={`/barangays/${barangay.slug}`} className="no-underline">
              <Flag variant="outline">Barangay {barangay.name}</Flag>
            </a>
          )}
        </div>
      </PageMasthead>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
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
              >
                <DilgNote
                  dilg={barangay.dilg}
                  changed={barangay.flags.some(
                    (f) => f.status === "changed" && f.dilg === person.name,
                  )}
                />
              </SourceNote>
            )
          )}
        </Container>
      </section>

      {external.length > 0 && (
        <section className="border-b border-ed-rule">
          <Container className="py-8 md:py-12">
            <SectionHeader label={PEOPLE_COPY.externalHeading} />
            <p className="type-body m-0 mb-4 max-w-[65ch]">
              {PEOPLE_COPY.externalIntro}
            </p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {external.map((e) => (
                <li
                  key={e.key}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
                >
                  {e.url ? (
                    <ArrowLink href={e.url} external>
                      {PEOPLE_COPY.externalLink(person.name, e.label)}
                    </ArrowLink>
                  ) : (
                    <span className="type-body">
                      {PEOPLE_COPY.externalLink(person.name, e.label)}
                    </span>
                  )}
                  <span className="font-mono text-[13px] text-ed-ink-3">
                    {e.value}
                  </span>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {(barangay || position.district) && (
        <section>
          <Container className="py-8 md:py-12">
            <BarangayMap
              geojsonUrl={BOUNDARIES_URL}
              barangays={MAP_BARANGAYS}
              focus={barangay?.slug}
              focusDistrict={barangay ? undefined : position.district}
              height="short"
            />
            <SourceNote>{COPY.mapCredit}</SourceNote>
          </Container>
        </section>
      )}
    </PageShell>
  );
}
