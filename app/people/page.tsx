import type { Metadata } from "next";
import { Container } from "../../components/Container.tsx";
import { OfficialList } from "../../components/OfficialList.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { PEOPLE_COPY } from "../../components/content.ts";
import { BARANGAYS } from "../../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS_AS_OF,
} from "../../data/city-officials.ts";
import { PEOPLE } from "../../data/people.ts";
import { formatSourceDate } from "../../utils/barangays/format.ts";

export const metadata: Metadata = {
  title: PEOPLE_COPY.metaTitle,
  description: PEOPLE_COPY.metaDescription,
};

/**
 * Everyone with a page at `/people/<name>`: city officials first, then each
 * barangay's officials. A plain index so every person page has a parent;
 * it isn't in the main navigation.
 */
export default function PeoplePage() {
  const toItem = (p: (typeof PEOPLE)[number]) => ({
    name: p.name,
    role: p.role,
    href: `/people/${p.slug}`,
  });
  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 className="type-display m-0 text-balance">
              {PEOPLE_COPY.heading}
            </h1>
            <p className="type-lede m-0 mt-6 max-w-[65ch] text-pretty">
              {PEOPLE_COPY.intro}
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
          <SectionHeader label={PEOPLE_COPY.cityHeading} />
          <OfficialList
            label={PEOPLE_COPY.cityHeading}
            items={PEOPLE.filter((p) => p.kind === "city").map(toItem)}
            columns
          />
          <SourceNote
            href={CITY_DIRECTORY_URL}
            updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
          />
        </Container>
      </section>

      {BARANGAYS.map((b) => (
        <section key={b.slug} className="border-b border-ed-rule">
          <Container className="py-10">
            <SectionHeader label={PEOPLE_COPY.barangayHeading(b.name)} />
            <OfficialList
              label={PEOPLE_COPY.barangayHeading(b.name)}
              items={PEOPLE.filter((p) => p.barangay === b.slug).map(toItem)}
              columns
            />
          </Container>
        </section>
      ))}
    </PageShell>
  );
}
