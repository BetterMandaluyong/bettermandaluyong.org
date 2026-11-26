import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLink } from "../../../components/ArrowLink.tsx";
import { Container } from "../../../components/Container.tsx";
import { Flag } from "../../../components/Flag.tsx";
import {
  OfficialList,
  officialItem,
} from "../../../components/OfficialList.tsx";
import { PageShell } from "../../../components/PageShell.tsx";
import { SectionHeader } from "../../../components/SectionHeader.tsx";
import { SourceNote } from "../../../components/SourceNote.tsx";
import { BARANGAYS as COPY, SITE } from "../../../components/content.ts";
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
import { BarangayMap } from "../../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../../utils/barangays/format.ts";

type Params = { params: Promise<{ slug: string }> };

/** One page per barangay, built ahead of time. */
export function generateStaticParams() {
  return BARANGAYS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const barangay = getBarangay((await params).slug);
  if (!barangay) return { title: COPY.notFoundTitle };
  return {
    title: `Barangay ${barangay.name} — ${SITE.name}`,
    description: `Barangay ${barangay.name}, Mandaluyong: its officials, contact details, council district, and approximate ZIP code.`,
  };
}

/**
 * One barangay: where it is on the map, the barangay hall's address and
 * phones, the barangay council and Sangguniang Kabataan, and the officials
 * who represent it citywide (House representative, mayor, vice mayor, and its
 * district's councilors), with a credit and date for the city page the data
 * came from. Unknown slugs 404.
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
  const sk = [
    person(barangay.skChair, COPY.skChair),
    ...barangay.skKagawads.map((m) => person(m, COPY.skKagawad)),
  ];

  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <ArrowLink href="/barangays">{COPY.backToAll}</ArrowLink>
            <h1 className="type-display m-0 mt-6 text-balance">
              Barangay {barangay.name}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3">
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
              <a
                href={ZIP_LOCATOR_URL}
                rel="noreferrer"
                className="text-ed-navy"
              >
                {COPY.zipLookup}
              </a>
              .
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
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
        <Container className="py-12 md:py-16">
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
        <Container className="py-12 md:py-16">
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
          />
        </Container>
      </section>

      <section>
        <Container className="py-12 md:py-16">
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
