import type { Metadata } from "next";
import { BarangayList } from "../../components/BarangayList.tsx";
import { Container } from "../../components/Container.tsx";
import { OfficialList, officialItem } from "../../components/OfficialList.tsx";
import { PageShell } from "../../components/PageShell.tsx";
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
import { BarangayMap } from "../../islands/BarangayMap.tsx";
import { formatSourceDate } from "../../utils/barangays/format.ts";

export const metadata: Metadata = {
  title: COPY.metaTitle,
  description: COPY.metaDescription,
};

/**
 * All 27 barangays: a full-size interactive map, the list grouped by council
 * district, and the officials who represent them citywide (the House
 * representative and each district's councilors) with their contact details.
 * Server-rendered; only the map is a client island.
 */
export default function BarangaysPage() {
  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 className="type-display m-0 text-balance">{COPY.heading}</h1>
            <p className="type-lede m-0 mt-6 max-w-[65ch] text-pretty">
              {COPY.intro}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
          <BarangayMap geojsonUrl={BOUNDARIES_URL} barangays={MAP_BARANGAYS} />
          <SourceNote>{COPY.mapCredit}</SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
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
        <Container className="py-12 md:py-16">
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
