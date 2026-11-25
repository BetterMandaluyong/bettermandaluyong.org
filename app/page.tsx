import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { ArrowLink } from "../components/ArrowLink.tsx";
import { Button } from "../components/Button.tsx";
import { Container } from "../components/Container.tsx";
import { Flag } from "../components/Flag.tsx";
import { NewsList } from "../components/NewsList.tsx";
import { OfficialList, officialItem } from "../components/OfficialList.tsx";
import { PageShell } from "../components/PageShell.tsx";
import { SectionHeader } from "../components/SectionHeader.tsx";
import { SourceNote } from "../components/SourceNote.tsx";
import {
  BARANGAYS as COPY,
  HOME,
  NEWS,
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
import { BARANGAY_PERSON_HREFS, personHref } from "../data/people.ts";
import { BarangayExplorer } from "../islands/BarangayExplorer.tsx";
import { formatSourceDate } from "../utils/barangays/format.ts";
import { latestNews, readOrDefault } from "../utils/news/store.ts";

export const metadata: Metadata = {
  title: HOME.metaTitle,
  description: HOME.metaDescription,
  openGraph: {
    title: SITE.name,
    description:
      "A community effort for a more livable Mandaluyong. Launching soon.",
  },
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Reading searchParams opts the page into per-request rendering, and lets
  // a shared link (`/?barangay=hulo`) open with that barangay selected.
  const sp = await searchParams;
  const chosen = typeof sp.barangay === "string" ? sp.barangay : undefined;
  // Secondary block: any D1 failure shows the empty state instead of failing the home page.
  const news = await readOrDefault(() => latestNews(env.DB, 3), []);
  const captains = BARANGAYS.map((b) => ({
    name: b.captain,
    role: `${COPY.captain} · ${b.name}`,
    href: personHref(b.captain, "Punong Barangay", b.slug),
  }));
  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-8 md:py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <Flag variant="navy">{HOME.eyebrow}</Flag>
              <h1 className="type-display m-0 mt-4 text-balance">
                {HOME.headline}
              </h1>
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
          />
          <SourceNote>{COPY.mapCredit}</SourceNote>
        </Container>
      </section>

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
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

      <section className="border-b border-ed-rule">
        <Container className="py-12 md:py-16">
          <SectionHeader label={COPY.captainsHeading} meta="27 barangays" />
          <p className="type-body m-0 mb-6 max-w-[65ch]">
            {COPY.captainsIntro}
          </p>
          <OfficialList label={COPY.captainsHeading} items={captains} columns />
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
            <ArrowLink href="/barangays">{COPY.homeLink}</ArrowLink>
            <ArrowLink href="/people">{PEOPLE_COPY.allPeople}</ArrowLink>
          </div>
        </Container>
      </section>

      <section>
        <Container className="py-12 md:py-16">
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
