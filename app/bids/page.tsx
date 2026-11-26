import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Button } from "../../components/Button.tsx";
import { Container } from "../../components/Container.tsx";
import { NoticeFilters } from "../../components/NoticeFilters.tsx";
import { NoticeList } from "../../components/NoticeList.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { pageMetadata } from "../../components/metadata.ts";
import {
  BID_KIND_LABELS,
  BIDS,
  BIDS_HISTORY_URL,
  NOTICES,
} from "../../components/content.ts";
import { BID_NOTICES } from "../../data/bids.ts";
import { BID_KINDS } from "../../data/schema.ts";
import { CITY_BIDS_URL } from "../../utils/notices/sources.ts";
import {
  NOTICES_PER_PAGE,
  filterNotices,
  hasNoticeFilters,
  kindsInUse,
  noticesHref,
  parseNoticeFilters,
} from "../../utils/notices/query.ts";

export const metadata: Metadata = pageMetadata({
  title: BIDS.metaTitle,
  description: BIDS.metaDescription,
  path: "/bids",
});

const ROW_LABELS: Record<string, string> = Object.fromEntries(
  BID_KINDS.map((k) => [k, BID_KIND_LABELS[k].one]),
);

/**
 * The city bids page: a paged list of links to the documents the City
 * Government's Bids and Awards Committee posts (invitations to bid, requests
 * for quotation, bulletins, awards, notices to proceed, plans), read from
 * `data/bids/*.yaml` at build time. A GET form searches titles and filters by
 * kind and Manila date range, and sorts by date or title; the filters live in
 * the address (`q`, `kind`, `from`, `to`, `sort`, `page`). An address that
 * isn't in its tidy form (empty fields from the form, bad values) redirects
 * to it; no notices yet shows the empty state.
 */
export default async function BidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kinds = kindsInUse(BID_NOTICES, BID_KINDS);
  const filters = parseNoticeFilters(sp, kinds);
  const here = noticesHref("/bids", filters, filters.page);
  const asked = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      (Array.isArray(v) ? v : [v ?? ""]).map((x) => [k, x]),
    ),
  ).toString();
  if (here !== (asked ? `/bids?${asked}` : "/bids")) redirect(here);

  const matching = filterNotices(BID_NOTICES, filters);
  const total = matching.length;
  const start = (filters.page - 1) * NOTICES_PER_PAGE;
  const items = matching.slice(start, start + NOTICES_PER_PAGE);
  const active = hasNoticeFilters(filters);
  const hasNewer = filters.page > 1;
  const hasOlder = start + NOTICES_PER_PAGE < total;

  return (
    <PageShell>
      <PageMasthead title={BIDS.heading} lede={BIDS.intro}>
        <div className="flex max-w-[65ch] flex-col gap-4">
          <p className="type-body m-0 text-pretty">{BIDS.deadlineNote}</p>
          <p className="type-body m-0 text-pretty">
            {BIDS.historyNote}{" "}
            <ArrowLink href={BIDS_HISTORY_URL}>{BIDS.historyLink}</ArrowLink>
          </p>
        </div>
      </PageMasthead>

      <section>
        <Container narrow className="py-8 md:py-12">
          {BID_NOTICES.length > 0 && (
            <NoticeFilters
              action="/bids"
              values={filters}
              kinds={kinds.map((k) => ({
                value: k,
                label: BID_KIND_LABELS[k].many,
              }))}
              active={active}
              className="mb-8 border-b border-ed-rule pb-8"
            />
          )}

          {items.length > 0 ? (
            <>
              <p className="type-ui m-0 mb-4 text-ed-ink-3">
                {NOTICES.showing(start + 1, start + items.length, total)}
              </p>
              <NoticeList items={items} labels={ROW_LABELS} />
            </>
          ) : BID_NOTICES.length === 0 ? (
            <p className="type-body m-0">{BIDS.empty}</p>
          ) : total === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="type-body m-0">{NOTICES.noMatches}</p>
              <Button href="/bids" variant="ghost">
                {NOTICES.clear}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="type-body m-0">{BIDS.noPage}</p>
              <Button href={noticesHref("/bids", filters, 1)} variant="ghost">
                {BIDS.backToFirst}
              </Button>
            </div>
          )}

          {(hasNewer || hasOlder) && items.length > 0 && (
            <nav
              aria-label={BIDS.pagesLabel}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {hasNewer && (
                <Button
                  href={noticesHref("/bids", filters, filters.page - 1)}
                  variant="ghost"
                >
                  {filters.sort === "newest" ? NOTICES.newer : NOTICES.previous}
                </Button>
              )}
              {hasOlder && (
                <Button
                  href={noticesHref("/bids", filters, filters.page + 1)}
                  variant="ghost"
                >
                  {filters.sort === "newest" ? NOTICES.older : NOTICES.next}
                </Button>
              )}
            </nav>
          )}

          <p className="type-ui m-0 mt-8 text-ed-ink-3">
            {NOTICES.source}{" "}
            <a href={CITY_BIDS_URL} rel="noreferrer" className="text-ed-navy">
              {BIDS.cityLink}
            </a>{" "}
            ({NOTICES.sourceLink}).
          </p>
        </Container>
      </section>
    </PageShell>
  );
}
