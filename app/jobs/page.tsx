import type { Metadata } from "next";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Container } from "../../components/Container.tsx";
import { NoticeList } from "../../components/NoticeList.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { pageMetadata } from "../../components/metadata.ts";
import { JOBS, JOBS_HISTORY_URL } from "../../components/content.ts";
import { JOB_NOTICES } from "../../data/jobs.ts";
import type { JobKind } from "../../data/schema.ts";
import { formatNewsDate } from "../../utils/news/display.ts";
import { CITY_JOBS_URL } from "../../utils/notices/sources.ts";
import { newestNotice, recentNotices } from "../../utils/notices/query.ts";

export const metadata: Metadata = pageMetadata({
  title: JOBS.metaTitle,
  description: JOBS.metaDescription,
  path: "/jobs",
});

/** How far back each section looks. The city gives no closing dates. */
const MONTHS = 12;

/** The newest live post of a kind as a long date, or null. */
function newestDate(kind: JobKind): string | null {
  const n = newestNotice(JOB_NOTICES, kind);
  return n ? formatNewsDate(n.publishedAt) : null;
}

/**
 * The city jobs page, from `data/jobs/*.yaml`: City Hall's bulletins of
 * vacancies, then the private employers' openings posted by PESO, each from
 * the last `MONTHS` months and still on the city site. Listings carry no
 * closing date, so the page says older ones may be filled. An empty section
 * says when the newest post was.
 */
export default function JobsPage() {
  const now = new Date();
  const vacancies = recentNotices(JOB_NOTICES, "vacancy", MONTHS, now);
  const peso = recentNotices(JOB_NOTICES, "peso", MONTHS, now);

  return (
    <PageShell>
      <PageMasthead title={JOBS.heading} lede={JOBS.intro}>
        <p className="type-body m-0 max-w-[65ch] text-pretty">
          {JOBS.historyNote}{" "}
          <ArrowLink href={JOBS_HISTORY_URL}>{JOBS.historyLink}</ArrowLink>
        </p>
      </PageMasthead>

      <section>
        <Container narrow className="py-8 md:py-12">
          <SectionHeader label={JOBS.cityHallHeading} />
          <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
            {JOBS.cityHallIntro}
          </p>
          {vacancies.length > 0 ? (
            <NoticeList items={vacancies} />
          ) : (
            <p className="type-body m-0">
              {JOBS.cityHallNone(MONTHS, newestDate("vacancy"))}
            </p>
          )}
        </Container>
      </section>

      <section className="border-t border-ed-rule bg-ed-paper-2">
        <Container narrow className="py-8 md:py-12">
          <SectionHeader label={JOBS.pesoHeading} />
          <p className="type-body m-0 mb-6 max-w-[65ch] text-pretty">
            {JOBS.pesoIntro(MONTHS)}
          </p>
          {peso.length > 0 ? (
            <NoticeList items={peso} />
          ) : (
            <p className="type-body m-0">
              {JOBS.pesoNone(MONTHS, newestDate("peso"))}
            </p>
          )}
          <div className="mt-6">
            <ArrowLink href={CITY_JOBS_URL} external>
              {JOBS.pesoCityLink}
            </ArrowLink>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}
