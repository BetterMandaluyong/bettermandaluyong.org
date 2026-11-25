import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { Button } from "../../components/Button.tsx";
import { Container } from "../../components/Container.tsx";
import { NewsList } from "../../components/NewsList.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { SectionHeader } from "../../components/SectionHeader.tsx";
import { NEWS, SITE } from "../../components/content.ts";
import { cx } from "../../components/cx.ts";
import { FacebookFeed } from "../../islands/FacebookFeed.tsx";
import { NEWS_PER_PAGE, parseListParams } from "../../utils/news/display.ts";
import { listCategories, listNews, safeRead } from "../../utils/news/store.ts";

export const metadata: Metadata = {
  title: NEWS.metaTitle,
  description: NEWS.metaDescription,
};

/** Builds a /news address, keeping the category and skipping page 1. */
function newsHref(category: string | null, page: number): string {
  const parts: string[] = [];
  if (category) parts.push(`category=${encodeURIComponent(category)}`);
  if (page > 1) parts.push(`page=${page}`);
  return parts.length ? `/news?${parts.join("&")}` : "/news";
}

/**
 * The official city news page: a paged, category-filterable list of links to
 * the City Government's posts, read from D1, plus a tap-to-load Facebook
 * feed. Bad query strings fall back to defaults; an empty or missing table
 * shows the empty state.
 */
export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const categories = await safeRead(() => listCategories(env.DB), []);
  const { page, category } = parseListParams(sp, categories);
  const { items, total } = await safeRead(
    () => listNews(env.DB, { page, perPage: NEWS_PER_PAGE, category }),
    { items: [], total: 0 },
  );
  const hasNewer = page > 1;
  const hasOlder = page * NEWS_PER_PAGE < total;

  const chip = (active: boolean) =>
    cx(
      "type-ui inline-flex min-h-11 items-center border px-4 no-underline transition-colors",
      active
        ? "border-ed-navy bg-ed-navy text-white"
        : "border-ed-navy text-ed-navy hover:bg-ed-navy hover:text-white",
    );

  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 className="type-display m-0 text-balance">{NEWS.heading}</h1>
            <p className="type-lede m-0 mt-6 max-w-[65ch] text-pretty">
              {NEWS.intro}
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container narrow className="py-12 md:py-16">
          {categories.length > 0 && (
            <nav aria-label="Categories" className="mb-8">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                <li>
                  <a
                    href="/news"
                    aria-current={category === null ? "page" : undefined}
                    className={chip(category === null)}
                  >
                    {NEWS.allCategories}
                  </a>
                </li>
                {categories.map((c) => (
                  <li key={c}>
                    <a
                      href={`/news?category=${encodeURIComponent(c)}`}
                      aria-current={c === category ? "page" : undefined}
                      className={chip(c === category)}
                    >
                      {c}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
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
        <Container narrow className="py-12 md:py-16">
          <SectionHeader label={NEWS.facebookHeading} />
          <FacebookFeed pageUrl={SITE.cityPioFacebookUrl} />
        </Container>
      </section>
    </PageShell>
  );
}
