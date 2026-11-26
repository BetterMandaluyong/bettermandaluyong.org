import type { Metadata } from "next";
import { Container } from "../../components/Container.tsx";
import { OrgChart } from "../../components/OrgChart.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import {
  PersonCards,
  type PersonCardItem,
} from "../../components/PersonCard.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { BARANGAYS as COPY, PEOPLE_COPY } from "../../components/content.ts";
import { BARANGAYS, getBarangay } from "../../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS_AS_OF,
} from "../../data/city-officials.ts";
import { buildOrgChart } from "../../data/org-chart.ts";
import {
  POSITION_CATEGORIES,
  officeholders,
  personPath,
  type Officeholder,
  type PositionCategory,
} from "../../data/people.ts";
import { formatSourceDate } from "../../utils/barangays/format.ts";

export const metadata: Metadata = {
  title: PEOPLE_COPY.metaTitle,
  description: PEOPLE_COPY.metaDescription,
};

/** Categories whose cards are grouped under each barangay's name. */
const BY_BARANGAY: ReadonlySet<PositionCategory> = new Set([
  "kagawad",
  "sk-kagawad",
]);

const ORG_ID = "org-chart";
const sectionId = (c: PositionCategory) => `people-${c}`;

function card(
  { person, position }: Officeholder,
  showPlace: boolean,
): PersonCardItem {
  const barangay = position.barangay && getBarangay(position.barangay);
  return {
    name: person.name,
    role: position.role,
    href: personPath(person),
    ...(showPlace && position.district ? { district: position.district } : {}),
    ...(showPlace && barangay ? { barangay: barangay.name } : {}),
  };
}

function CategoryCards({ category }: { category: PositionCategory }) {
  const holders = officeholders(category);
  const { heading } = PEOPLE_COPY.categories[category];
  if (!BY_BARANGAY.has(category)) {
    return (
      <PersonCards label={heading} items={holders.map((h) => card(h, true))} />
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {BARANGAYS.map((b) => {
        const here = holders.filter((h) => h.position.barangay === b.slug);
        const label = `${PEOPLE_COPY.barangayHeading(b.name)} · ${COPY.district(b.district)}`;
        return (
          <section key={b.slug} aria-label={`${heading}: ${label}`}>
            <h3 className="type-subheading m-0 mb-3">
              <a href={`/barangays/${b.slug}`} className="text-ed-navy">
                {PEOPLE_COPY.barangayHeading(b.name)}
              </a>
              <span className="type-ui text-ed-ink-3">
                {" "}
                · {COPY.district(b.district)}
              </span>
            </h3>
            <PersonCards
              label={`${heading}, ${label}`}
              items={here.map((h) => card(h, false))}
            />
          </section>
        );
      })}
    </div>
  );
}

/**
 * Everyone with a page at `/people/<slug>`, two ways: an org chart of how the
 * city's elected offices fit together (Congress, City Hall, the barangays),
 * then a card for every officeholder, grouped by position from the House
 * down to the SK. Barangay and SK kagawads are grouped by barangay. It isn't
 * in the main navigation.
 */
export default function PeoplePage() {
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
          <nav aria-label={PEOPLE_COPY.jumpLabel} className="mt-8">
            <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 p-0">
              {[
                { id: ORG_ID, text: PEOPLE_COPY.orgHeading },
                ...POSITION_CATEGORIES.map((c) => ({
                  id: sectionId(c),
                  text: PEOPLE_COPY.categories[c].heading,
                })),
              ].map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    className="type-ui inline-block py-2 text-ed-navy"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <section id={ORG_ID} className="scroll-mt-4 border-b border-ed-rule">
        <Container className="py-12 md:py-16">
          <SectionHeader label={PEOPLE_COPY.orgHeading} />
          <p className="type-body m-0 mb-8 max-w-[65ch] text-pretty">
            {PEOPLE_COPY.orgIntro}
          </p>
          <OrgChart root={buildOrgChart()} label={PEOPLE_COPY.orgLabel} />
          <SourceNote
            href={CITY_DIRECTORY_URL}
            updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
          />
        </Container>
      </section>

      {POSITION_CATEGORIES.map((category) => {
        const { heading, intro } = PEOPLE_COPY.categories[category];
        const count = officeholders(category).length;
        return (
          <section
            key={category}
            id={sectionId(category)}
            className="scroll-mt-4 border-b border-ed-rule"
          >
            <Container className="py-12 md:py-16">
              <SectionHeader label={heading} meta={PEOPLE_COPY.count(count)} />
              <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
                {intro}
              </p>
              <CategoryCards category={category} />
            </Container>
          </section>
        );
      })}
    </PageShell>
  );
}
