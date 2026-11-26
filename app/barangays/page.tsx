import type { Metadata } from "next";
import { BarangayList } from "../../components/BarangayList.tsx";
import { Container } from "../../components/Container.tsx";
import { OfficialList, officialItem } from "../../components/OfficialList.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { pageMetadata } from "../../components/metadata.ts";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { BARANGAYS as COPY } from "../../components/content.ts";
import {
  BARANGAYS,
  BOUNDARIES_URL,
  MAP_BARANGAYS,
  ZIP_LOCATOR_URL,
} from "../../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS_AS_OF,
  REPRESENTATIVE,
  councilorsFor,
} from "../../data/city-officials.ts";
import { MAP_PLACES } from "../../data/places.ts";
import { BarangayMap } from "../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../utils/barangays/format.ts";

export const metadata: Metadata = pageMetadata({
  title: COPY.metaTitle,
  description: COPY.metaDescription,
  path: "/barangays",
});

/**
 * All 27 barangays: a full-size interactive map, the list grouped by council
 * district, and the officials who represent them citywide (the House
 * representative and each district's councilors) with their contact details.
 * Server-rendered; only the map is a client island.
 */
export default function BarangaysPage() {
  return (
    <PageShell>
      <PageMasthead title={COPY.heading} lede={COPY.intro} />

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <BarangayMap
            geojsonUrl={BOUNDARIES_URL}
            barangays={MAP_BARANGAYS}
            places={MAP_PLACES}
          />
          <SourceNote>{COPY.mapCredit}</SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.listHeading} meta={COPY.homeMeta} />
          <BarangayList
            barangays={BARANGAYS}
            label={COPY.listHeading}
            groupByDistrict
          />
          <p className="type-ui m-0 mt-6 max-w-[65ch] text-ed-ink-3">
            {COPY.zipNote}{" "}
            <a href={ZIP_LOCATOR_URL} rel="noreferrer" className="text-ed-navy">
              {COPY.zipLookup}
            </a>
            .
          </p>
        </Container>
      </section>

      <section>
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.repsHeading} />
          <p className="type-body m-0 mb-8 max-w-[65ch]">{COPY.districtNote}</p>
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
            {([1, 2] as const).map((district) => (
              <div key={district}>
                <h3 className="type-subheading m-0 mb-3">
                  {COPY.councilorsHeading(district)}
                </h3>
                <OfficialList
                  variant="card"
                  label={COPY.councilorsHeading(district)}
                  items={councilorsFor(district).map(officialItem)}
                />
              </div>
            ))}
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
