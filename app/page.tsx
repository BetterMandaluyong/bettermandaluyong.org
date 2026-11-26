import type { Metadata } from "next";
import { ArrowLink } from "../components/ArrowLink.tsx";
import { Button } from "../components/Button.tsx";
import { Container } from "../components/Container.tsx";
import { NewsList } from "../components/NewsList.tsx";
import { OfficialList, officialItem } from "../components/OfficialList.tsx";
import { PageShell } from "../components/PageShell.tsx";
import { pageMetadata } from "../components/metadata.ts";
import { SectionHeader } from "../components/SectionHeader.tsx";
import { SourceNote } from "../components/SourceNote.tsx";
import { StatList } from "../components/StatList.tsx";
import {
  BARANGAYS as COPY,
  HOME,
  NEWS,
  PAY_COPY,
  PEOPLE_COPY,
  SITE,
  mailto,
} from "../components/content.ts";
import { BARANGAYS, BOUNDARIES_URL } from "../data/barangays.ts";
import {
  CITY_DIRECTORY_URL,
  CITY_OFFICIALS,
  CITY_OFFICIALS_AS_OF,
} from "../data/city-officials.ts";
import { PAY, currentRate } from "../data/pay.ts";
import { BARANGAY_PERSON_HREFS, personHref } from "../data/people.ts";
import { OFFICES } from "../data/schema.ts";
import { BarangayExplorer } from "../islands/BarangayExplorer.tsx";
import { formatSourceDate } from "../utils/barangays/format.ts";
import { NEWS_ITEMS } from "../data/news.ts";
import { MAP_PLACES } from "../data/places.ts";
import { latestNews } from "../utils/news/query.ts";
import { formatPeso } from "../utils/budget/format.ts";

export const metadata: Metadata = pageMetadata({
  title: HOME.metaTitle,
  description: HOME.metaDescription,
  path: "/",
  shareTitle: SITE.name,
  shareDescription: HOME.shareDescription,
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Reading searchParams opts the page into per-request rendering, and lets
  // a shared link (`/?barangay=hulo`) open with that barangay selected.
  const sp = await searchParams;
  const chosen = typeof sp.barangay === "string" ? sp.barangay : undefined;
  const news = latestNews(NEWS_ITEMS, 5);
  const captains = BARANGAYS.map((b) => ({
    name: b.captain,
    role: b.name,
    href: personHref(b.captain, COPY.captain, b.slug),
  }));
  const skChairs = BARANGAYS.map((b) => ({
    name: b.skChair,
    role: b.name,
    href: personHref(b.skChair, "SK Chairperson", b.slug),
  }));
  const rates = OFFICES.flatMap((office) => currentRate(office) ?? []);
  const local = rates.find((r) => r.office === "mayor")?.circular;
  const national = rates.find((r) => r.office === "representative")?.circular;
  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <h1 className="type-display m-0 text-balance">{HOME.headline}</h1>
              <p className="type-lede m-0 mt-4 max-w-[65ch] text-pretty">
                {HOME.lede}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Button href={mailto(SITE.contactEmail)}>
                {HOME.primaryCta}
              </Button>
              <ArrowLink href={SITE.followUrl} external>
                {HOME.secondaryCta}
              </ArrowLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.exploreHeading} meta={COPY.homeMeta} />
          <p className="type-body m-0 mb-6 max-w-[65ch]">{COPY.exploreIntro}</p>
          <BarangayExplorer
            barangays={BARANGAYS}
            hrefs={BARANGAY_PERSON_HREFS}
            geojsonUrl={BOUNDARIES_URL}
            initialSelected={chosen}
            places={MAP_PLACES}
          />
          <SourceNote>{COPY.mapCredit}</SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.cityHeading} meta={COPY.cityMeta} />
          <OfficialList
            variant="card"
            label={COPY.cityHeading}
            items={CITY_OFFICIALS.map(officialItem)}
          />
          <SourceNote
            href={CITY_DIRECTORY_URL}
            updated={formatSourceDate(CITY_OFFICIALS_AS_OF)}
          />
        </Container>
      </section>

      {rates.length > 0 && (
        <section className="border-b border-ed-rule">
          <Container className="py-8 md:py-12">
            <SectionHeader
              label={PAY_COPY.homeHeading}
              meta={PAY_COPY.homeMeta(rates[0]!.year)}
            />
            <p className="type-body m-0 mb-6 max-w-[65ch]">
              {PAY_COPY.homeIntro}
            </p>
            <StatList
              label={PAY_COPY.homeHeading}
              items={rates.map((r) => ({
                label: PAY_COPY.offices[r.office],
                value: formatPeso(r.monthly),
                note: PAY_COPY.homeNote(r.grade, r.cap),
              }))}
            />
            <p className="type-body m-0 mt-6 max-w-[65ch] text-ed-ink-2">
              {PAY_COPY.caveat}
            </p>
            {local && (
              <SourceNote href={local.url} label={local.title}>
                {national && (
                  <>
                    {PAY_COPY.houseFrom}{" "}
                    <a
                      href={national.url}
                      rel="noreferrer"
                      className="text-ed-navy"
                    >
                      {national.title}
                    </a>
                    .{" "}
                  </>
                )}
                {PAY_COPY.checked(formatSourceDate(PAY.checked))}
              </SourceNote>
            )}
          </Container>
        </section>
      )}

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.captainsHeading} meta="27 barangays" />
          <p className="type-body m-0 mb-6 max-w-[65ch]">
            {COPY.captainsIntro}
          </p>
          <OfficialList
            label={COPY.captainsHeading}
            items={captains}
            columns
            stacked
          />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <ArrowLink href="/barangays">{COPY.homeLink}</ArrowLink>
            <ArrowLink href="/people">{PEOPLE_COPY.allPeople}</ArrowLink>
          </div>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-8 md:py-12">
          <SectionHeader label={COPY.skChairsHeading} meta="27 barangays" />
          <p className="type-body m-0 mb-6 max-w-[65ch]">
            {COPY.skChairsIntro}
          </p>
          <OfficialList
            label={COPY.skChairsHeading}
            items={skChairs}
            columns
            stacked
          />
        </Container>
      </section>

      <section>
        <Container className="py-8 md:py-12">
          <SectionHeader label={NEWS.latestHeading} />
          {news.length > 0 ? (
            <NewsList compact items={news} />
          ) : (
            <p className="type-body m-0 max-w-[65ch] text-ed-ink-2">
              {NEWS.empty}
            </p>
          )}
          <div className="mt-6">
            <ArrowLink href="/news">{NEWS.latestLink}</ArrowLink>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
