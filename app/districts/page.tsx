import type { Metadata } from "next";
import { BarangayList } from "../../components/BarangayList.tsx";
import { Container } from "../../components/Container.tsx";
import { OfficialList, officialItem } from "../../components/OfficialList.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { pageMetadata } from "../../components/metadata.ts";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { BARANGAYS as COPY, DISTRICTS_COPY } from "../../components/content.ts";
import {
  BOUNDARIES_URL,
  MAP_BARANGAYS,
  barangaysInDistrict,
} from "../../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS_AS_OF,
  REPRESENTATIVE,
  councilorsFor,
} from "../../data/city-officials.ts";
import { BarangayMap } from "../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../utils/barangays/format.ts";

export const metadata: Metadata = pageMetadata({
  title: DISTRICTS_COPY.metaTitle,
  description: DISTRICTS_COPY.metaDescription,
  path: "/districts",
});

/**
 * The city's two council districts. The House representative is shown once,
 * since the whole city is one congressional district. Each district gets its
 * own band (anchored at `#district-1` and `#district-2`): a map zoomed to it,
 * its councilors with contacts, and its barangays. Server-rendered; only
 * the maps are client islands.
 */
export default function DistrictsPage() {
  return (
    <PageShell>
      <PageMasthead
        title={DISTRICTS_COPY.heading}
        lede={DISTRICTS_COPY.intro}
      />

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={DISTRICTS_COPY.houseHeading} />
          <OfficialList
            variant="card"
            label={COPY.repsHouseHeading}
            items={[officialItem(REPRESENTATIVE)]}
          />
        </Container>
      </section>

      {([1, 2] as const).map((district) => {
        const barangays = barangaysInDistrict(district);
        return (
          <section
            key={district}
            id={`district-${district}`}
            className="scroll-mt-4 border-b border-ed-rule"
          >
            <Container className="py-8 md:py-12">
              <SectionHeader
                label={COPY.district(district)}
                meta={DISTRICTS_COPY.barangays(district, barangays.length)}
              />
              <BarangayMap
                geojsonUrl={BOUNDARIES_URL}
                barangays={MAP_BARANGAYS}
                focusDistrict={district}
                height="short"
              />
              <div className="mt-10 flex flex-col gap-10">
                <div>
                  <h3 className="type-subheading m-0 mb-3">
                    {COPY.councilorsHeading(district)}
                  </h3>
                  <OfficialList
                    variant="card"
                    label={COPY.councilorsHeading(district)}
                    items={councilorsFor(district).map(officialItem)}
                  />
                </div>
                <div>
                  <h3 className="type-subheading m-0 mb-3">
                    {DISTRICTS_COPY.barangays(district, barangays.length)}
                  </h3>
                  <BarangayList
                    barangays={barangays}
                    label={DISTRICTS_COPY.barangays(district, barangays.length)}
                  />
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      <section>
        <Container className="py-8">
          <SourceNote
            href={CITY_DIRECTORY_URL}
            updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
          >
            {COPY.mapCredit}
          </SourceNote>
        </Container>
      </section>
    </PageShell>
  );
}
