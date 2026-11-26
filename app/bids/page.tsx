import type { Metadata } from "next";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Button } from "../../components/Button.tsx";
import { Container } from "../../components/Container.tsx";
import { FilterNav } from "../../components/FilterNav.tsx";
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
import { BID_KINDS, type BidKind } from "../../data/schema.ts";
import { parseListParams } from "../../utils/news/display.ts";
import { CITY_BIDS_URL } from "../../utils/notices/sources.ts";
import {
  NOTICES_PER_PAGE,
  kindsInUse,
  listNotices,
} from "../../utils/notices/query.ts";

export const metadata: Metadata = pageMetadata({
  title: BIDS.metaTitle,
  description: BIDS.metaDescription,
  path: "/bids",
});

/** Builds a /bids address, keeping the kind and skipping page 1. */
function bidsHref(kind: BidKind | null, page: number): string {
  const parts: string[] = [];
  if (kind) parts.push(`kind=${kind}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `/bids?${parts.join("&")}` : "/bids";
}

const ROW_LABELS: Record<string, string> = Object.fromEntries(
  BID_KINDS.map((k) => [k, BID_KIND_LABELS[k].one]),
);

/**
 * The city bids page: a paged list of links to the documents the City
 * Government's Bids and Awards Committee posts (invitations to bid, requests
 * for quotation, bulletins, awards, notices to proceed, plans), filterable by
 * kind, read from `data/bids/*.yaml` at build time. Bad query strings fall
 * back to defaults; no notices yet shows the empty state.
 */
export default async function BidsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const kinds = kindsInUse(BID_NOTICES, BID_KINDS);
  const { page, category } = parseListParams(
    { page: sp.page, category: sp.kind },
    kinds,
  );
  const kind = category as BidKind | null;
  const { items, total } = listNotices(BID_NOTICES, {
    page,
    perPage: NOTICES_PER_PAGE,
    kind,
  });
  const hasNewer = page > 1;
  const hasOlder = page * NOTICES_PER_PAGE < total;

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
          {kinds.length > 0 && (
            <FilterNav
              label={BIDS.filterLabel}
              className="mb-8"
              links={[
                {
                  label: NOTICES.allKinds,
                  href: "/bids",
                  current: kind === null,
                },
                ...kinds.map((k) => ({
                  label: BID_KIND_LABELS[k].many,
                  href: bidsHref(k, 1),
                  current: k === kind,
                })),
              ]}
            />
          )}

          {items.length > 0 ? (
            <NoticeList items={items} labels={ROW_LABELS} />
          ) : total === 0 && kind === null ? (
            <p className="type-body m-0">{BIDS.empty}</p>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="type-body m-0">{BIDS.noPage}</p>
              <Button href="/bids" variant="ghost">
                {BIDS.backToFirst}
              </Button>
            </div>
          )}

          {(hasNewer || hasOlder) && (
            <nav
              aria-label={BIDS.pagesLabel}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {hasNewer && (
                <Button href={bidsHref(kind, page - 1)} variant="ghost">
                  {NOTICES.newer}
                </Button>
              )}
              {hasOlder && (
                <Button href={bidsHref(kind, page + 1)} variant="ghost">
                  {NOTICES.older}
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
