import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Button } from "../../components/Button.tsx";
import { BarangayList } from "../../components/BarangayList.tsx";
import { Card } from "../../components/Card.tsx";
import { Container } from "../../components/Container.tsx";
import { Eyebrow } from "../../components/Eyebrow.tsx";
import { Flag } from "../../components/Flag.tsx";
import { NewsList } from "../../components/NewsList.tsx";
import { OfficialList } from "../../components/OfficialList.tsx";
import { OrgChart, type OrgNode } from "../../components/OrgChart.tsx";
import { PersonCards } from "../../components/PersonCard.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { DilgNote } from "../../components/DilgNote.tsx";
import { SourceNote } from "../../components/SourceNote.tsx";
import { SiteHeader } from "../../components/SiteHeader.tsx";
import { UnofficialBar } from "../../components/UnofficialBar.tsx";
import { HOME, SITE, mailto } from "../../components/content.ts";
import {
  BARANGAYS,
  BOUNDARIES_URL,
  MAP_BARANGAYS,
} from "../../data/barangays.ts";
import { BARANGAY_PERSON_HREFS } from "../../data/people.ts";
import { MAP_PLACES, PLACE_KINDS } from "../../data/places.ts";
import { BarangayExplorer } from "../../islands/BarangayExplorer.tsx";
import { BarangayMap } from "../../islands/BarangayMap.tsx";
import { FacebookFeed } from "../../islands/FacebookFeed.tsx";
import type { NewsItem } from "../../data/schema.ts";
import { COLOR_TOKENS, TYPE_UTILITIES } from "../../components/tokens.ts";

export const metadata: Metadata = {
  title: `Storybook — ${SITE.name}`,
  description: "Design tokens and components used on bettermandaluyong.org.",
  robots: { index: false, follow: false },
};

/** An obviously sample tree for the OrgChart specimen; never real people. */
const SAMPLE_ORG: OrgNode = {
  title: "Sample City",
  children: [
    {
      title: "Sample branch",
      children: [
        {
          title: "Sample office",
          people: [{ name: "Sample Person One", href: "#" }],
        },
      ],
    },
    {
      title: "Another branch",
      children: [
        {
          title: "Sample council",
          meta: "One line about the office",
          people: [
            { name: "Sample Person Two", role: "Presiding officer", href: "#" },
          ],
          children: [
            {
              title: "Sample members",
              people: [
                { name: "Sample Person Three", href: "#" },
                { name: "Sample Person Four", href: "#" },
              ],
            },
          ],
        },
      ],
    },
    {
      title: "A grid branch",
      meta: "Children shown as a grid",
      children: [
        {
          title: "Sample group",
          grid: true,
          children: ["One", "Two", "Three"].map((n) => ({
            title: `Sample place ${n}`,
            href: "#",
            people: [{ name: `Sample Leader ${n}`, role: "Leader", href: "#" }],
          })),
        },
      ],
    },
  ],
};

/** Obviously sample rows for the NewsList specimen; never real city posts. */
const SAMPLE_NEWS: NewsItem[] = [
  {
    id: 1,
    url: "https://example.com/sample-1",
    title: "Sample: city announcement headline",
    publishedAt: "2026-01-15T10:00:00+08:00",
    categories: ["Sample category"],
    firstSeenAt: "2026-01-15T11:00:00+08:00",
    archive: null,
    missingSince: null,
    removedAt: null,
  },
  {
    id: 2,
    url: "https://example.com/sample-2",
    title: "Sample: city announcement headline (with an archived copy)",
    publishedAt: "2026-01-10T10:00:00+08:00",
    categories: ["Sample category", "Another sample"],
    firstSeenAt: "2026-01-10T11:00:00+08:00",
    archive: {
      status: "ok",
      url: "https://example.com/sample-archive",
      requestedAt: "2026-01-16T10:00:00+08:00",
      attempts: 0,
    },
    missingSince: null,
    removedAt: null,
  },
  {
    id: 3,
    url: "https://example.com/sample-3",
    title: "Sample: city announcement headline (removed)",
    publishedAt: "2026-01-05T10:00:00+08:00",
    categories: ["Sample category"],
    firstSeenAt: "2026-01-05T11:00:00+08:00",
    archive: {
      status: "ok",
      url: "https://example.com/sample-archive-removed",
      requestedAt: "2026-01-16T10:00:00+08:00",
      attempts: 0,
    },
    missingSince: "2026-01-19T10:00:00+08:00",
    removedAt: "2026-01-20T10:00:00+08:00",
  },
];

/** A titled band, hairline-separated like every BetterGov page section. */
function Band({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-ed-rule">
      <Container className="py-12">
        <SectionHeader label={title} />
        <div className="flex flex-col gap-8">{children}</div>
      </Container>
    </section>
  );
}

/** One specimen: its name as a label, then the rendered thing. */
function Specimen({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <Eyebrow>{name}</Eyebrow>
      <div>{children}</div>
    </div>
  );
}

// Living catalog of the design system: every token and every component in
// COMPONENTS.md, rendered with real props. Not linked from the site and kept
// out of search engines.
export default function StorybookPage() {
  return (
    <PageShell>
      <section className="bg-ed-paper-2">
        <Container className="py-14">
          <Eyebrow tone="navy">Design system</Eyebrow>
          <h1 className="type-display m-0 mt-4">Storybook</h1>
          <p className="type-lede m-0 mt-5 max-w-[65ch]">
            The tokens and components this site is built from, based on the{" "}
            <a href="https://bettergov.ph/design">BetterGov.ph design system</a>
            . See DESIGN.md and COMPONENTS.md for the rules.
          </p>
        </Container>
      </section>

      <Band title="Logo">
        <div className="flex flex-wrap items-end gap-10">
          <Specimen name="/logo-seal.svg">
            <img src="/logo-seal.svg" alt="" width={120} height={120} />
          </Specimen>
          <Specimen name="/logo-mark.svg">
            <img src="/logo-mark.svg" alt="" width={72} height={72} />
          </Specimen>
        </div>
      </Band>

      <Band title="Color">
        {Object.entries(COLOR_TOKENS).map(([group, tokens]) => (
          <div key={group} className="flex flex-col gap-3">
            <h3 className="type-subheading m-0">{group}</h3>
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3 p-0">
              {tokens.map((token) => (
                <li
                  key={token.name}
                  className="flex items-center gap-3 border border-ed-rule p-3"
                >
                  <span
                    aria-hidden="true"
                    className="size-10 shrink-0 border border-ed-rule"
                    style={{ background: `var(--color-${token.name})` }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <code className="font-mono text-[13px] text-ed-ink">
                      {token.name}
                    </code>
                    <span className="type-ui text-ed-ink-3">{token.role}</span>
                    {token.decorativeOnly && (
                      <Flag variant="outline" className="mt-1 self-start">
                        Not for text
                      </Flag>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Band>

      <Band title="Type">
        {TYPE_UTILITIES.map((utility) => (
          <Specimen key={utility.name} name={utility.name}>
            <p className={`${utility.name} m-0`}>
              {utility.name === "type-label"
                ? "Explore Mandaluyong"
                : HOME.headline}
            </p>
            <p className="type-ui m-0 mt-1 text-ed-ink-3">{utility.role}</p>
          </Specimen>
        ))}
      </Band>

      <Band title="Components">
        <Specimen name="Button (solid, ghost, sm)">
          <div className="flex flex-wrap items-center gap-4">
            <Button href={mailto(SITE.contactEmail)}>{HOME.primaryCta}</Button>
            <Button href="#" variant="ghost">
              Secondary action
            </Button>
            <Button size="sm">Small button</Button>
          </div>
        </Specimen>
        <Specimen name="ArrowLink">
          <ArrowLink href={SITE.followUrl} external>
            {HOME.secondaryCta}
          </ArrowLink>
        </Specimen>
        <Specimen name="Flag (default, navy, red, outline)">
          <div className="flex flex-wrap gap-3">
            <Flag>Draft</Flag>
            <Flag variant="navy">New</Flag>
            <Flag variant="red">Advisory</Flag>
            <Flag variant="outline">Archived</Flag>
          </div>
        </Specimen>
        <Specimen name="Eyebrow (default, navy, red)">
          <div className="flex flex-wrap gap-6">
            <Eyebrow>Services</Eyebrow>
            <Eyebrow tone="navy">Updated today</Eyebrow>
            <Eyebrow tone="red">Urgent</Eyebrow>
          </div>
        </Specimen>
        <Specimen name="SectionHeader (with meta)">
          <SectionHeader label="Barangay Directory" meta="27 barangays" />
        </Specimen>
        <Specimen name="Card (plain, linked)">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="type-subheading m-0">Plain card</h3>
              <p className="type-body m-0 mt-2">A bordered box for content.</p>
            </Card>
            <Card href="#">
              <h3 className="type-subheading m-0">Linked card</h3>
              <p className="type-body m-0 mt-2">
                The whole card is one link; the border darkens on hover.
              </p>
            </Card>
          </div>
        </Specimen>
        <Specimen name="UnofficialBar (also on top of every page)">
          <UnofficialBar />
        </Specimen>
        <Specimen name="SiteHeader (logo + nav)">
          <SiteHeader />
        </Specimen>
        <Specimen name="NewsList (full)">
          <NewsList items={SAMPLE_NEWS} />
        </Specimen>
        <Specimen name="NewsList (compact)">
          <NewsList items={SAMPLE_NEWS} compact />
        </Specimen>
        <Specimen name="FacebookFeed (island; loads nothing until tapped)">
          <FacebookFeed pageUrl={SITE.cityPioFacebookUrl} />
        </Specimen>
        <Specimen name="BarangayList (first four; `groupByDistrict` on /barangays)">
          <BarangayList
            barangays={BARANGAYS.slice(0, 4)}
            label="Sample barangays"
          />
        </Specimen>
        <Specimen name="OfficialList (plain)">
          <OfficialList
            label="Sample council"
            items={[
              { name: "Sample Person One", role: "Barangay Captain" },
              { name: "Sample Person Two", role: "Barangay Kagawad" },
            ]}
          />
        </Specimen>
        <Specimen name="OfficialList (card, with contacts; sample data only)">
          <OfficialList
            variant="card"
            label="Sample official"
            items={[
              {
                name: "Sample Person",
                role: "Councilor · District 1",
                office: "Sample office address",
                phones: ["8000-0000", "(02) 8000-0001 local 123"],
                emails: ["sample@example.com"],
              },
            ]}
          />
        </Specimen>
        <Specimen name="PersonCards (with and without place flags; sample data only)">
          <PersonCards
            label="Sample people"
            items={[
              {
                name: "Sample Person One",
                role: "Councilor",
                href: "#1",
                district: 1,
              },
              {
                name: "Sample Person Two",
                role: "Barangay Captain",
                href: "#2",
                district: 2,
                barangay: "Sample",
              },
              { name: "Sample Person Three", role: "SK Kagawad", href: "#3" },
            ]}
          />
        </Specimen>
        <Specimen name="OrgChart (columns on wide screens, a tree on phones; sample data only)">
          <OrgChart root={SAMPLE_ORG} label="Sample org chart" />
        </Specimen>
        <Specimen name="SourceNote">
          <SourceNote
            href="https://example.com/"
            label="Sample source"
            updated="January 1, 2026"
          >
            Extra credit text goes here.
          </SourceNote>
        </Specimen>
        <Specimen name="DilgNote (inside SourceNote; changed)">
          <SourceNote
            href="https://example.com/"
            label="Sample source"
            updated="January 1, 2026"
          >
            <DilgNote
              dilg={{
                url: "https://dilg.gov.ph/barangay-officials-directory",
                retrieved: "2026-11-26",
              }}
              changed
            />
          </SourceNote>
        </Specimen>
        <Specimen name="BarangayMap (island; Leaflet + OpenStreetMap tiles; city mask, places with every kind shown)">
          <BarangayMap
            geojsonUrl={BOUNDARIES_URL}
            barangays={MAP_BARANGAYS}
            places={MAP_PLACES}
            defaultPlaceKinds={PLACE_KINDS}
            height="short"
          />
        </Specimen>
        <Specimen name="BarangayExplorer (island; the home page's map + search + cards)">
          <BarangayExplorer
            barangays={BARANGAYS}
            hrefs={BARANGAY_PERSON_HREFS}
            geojsonUrl={BOUNDARIES_URL}
            places={MAP_PLACES}
          />
        </Specimen>
      </Band>
    </PageShell>
  );
}
