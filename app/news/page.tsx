import type { Metadata } from "next";
import { ArrowLink } from "../../components/ArrowLink.tsx";
import { Button } from "../../components/Button.tsx";
import { Container } from "../../components/Container.tsx";
import { FilterNav } from "../../components/FilterNav.tsx";
import { NewsList } from "../../components/NewsList.tsx";
import { PageMasthead } from "../../components/PageMasthead.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { pageMetadata } from "../../components/metadata.ts";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { NEWS, NEWS_HISTORY_URL, SITE } from "../../components/content.ts";
import { FacebookFeed } from "../../islands/FacebookFeed.tsx";
import { NEWS_ITEMS } from "../../data/news.ts";
import { NEWS_PER_PAGE, parseListParams } from "../../utils/news/display.ts";
import { listCategories, listNews } from "../../utils/news/query.ts";

export const metadata: Metadata = pageMetadata({
  title: NEWS.metaTitle,
  description: NEWS.metaDescription,
  path: "/news",
});

/** Builds a /news address, keeping the category and skipping page 1. */
function newsHref(category: string | null, page: number): string {
  const parts: string[] = [];
  if (category) parts.push(`category=${encodeURIComponent(category)}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `/news?${parts.join("&")}` : "/news";
}

/**
 * The official city news page: a paged, category-filterable list of links to
 * the City Government's posts, read from `data/news/*.yaml` at build time,
 * plus a tap-to-load Facebook feed. Bad query strings fall back to defaults.
 * No posts yet shows the empty state.
 */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categories = listCategories(NEWS_ITEMS);
  const { page, category } = parseListParams(sp, categories);
  const { items, total } = listNews(NEWS_ITEMS, {
    page,
    perPage: NEWS_PER_PAGE,
    category,
  });
  const hasNewer = page > 1;
  const hasOlder = page * NEWS_PER_PAGE < total;

  return (
    <PageShell>
      <PageMasthead title={NEWS.heading} lede={NEWS.intro}>
        <p className="type-body m-0 max-w-[65ch] text-pretty">
          {NEWS.historyNote}{" "}
          <ArrowLink href={NEWS_HISTORY_URL}>{NEWS.historyLink}</ArrowLink>
        </p>
      </PageMasthead>

      <section>
        <Container narrow className="py-8 md:py-12">
          {categories.length > 0 && (
            <FilterNav
              label="Categories"
              className="mb-8"
              links={[
                {
                  label: NEWS.allCategories,
                  href: "/news",
                  current: category === null,
                },
                ...categories.map((c) => ({
                  label: c,
                  href: `/news?category=${encodeURIComponent(c)}`,
                  current: c === category,
                })),
              ]}
            />
          )}

          {items.length > 0 ? (
            <NewsList items={items} />
          ) : total === 0 && category === null ? (
            <p className="type-body m-0">{NEWS.empty}</p>
          ) : (
            <div className="flex flex-col items-start gap-4">
              <p className="type-body m-0">{NEWS.noPage}</p>
              <Button href="/news" variant="ghost">
                {NEWS.backToFirst}
              </Button>
            </div>
          )}

          {(hasNewer || hasOlder) && (
            <nav
              aria-label="Pages"
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              {hasNewer && (
                <Button href={newsHref(category, page - 1)} variant="ghost">
                  {NEWS.newer}
                </Button>
              )}
              {hasOlder && (
                <Button href={newsHref(category, page + 1)} variant="ghost">
                  {NEWS.older}
                </Button>
              )}
            </nav>
          )}
        </Container>
      </section>

      <section className="border-t border-ed-rule bg-ed-paper-2">
        <Container narrow className="py-8 md:py-12">
          <SectionHeader label={NEWS.facebookHeading} />
          <FacebookFeed pageUrl={SITE.cityPioFacebookUrl} />
        </Container>
      </section>
    </PageShell>
  );
}
