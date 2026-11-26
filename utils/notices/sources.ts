import type { BidKind } from "../../data/schema.ts";

const SITE = "https://mandaluyong.gov.ph";
const API = `${SITE}/wp-json/wp/v2`;

/**
 * The city's Download Manager categories in the bids section (`/bac/`), and
 * the kind each one means. A document in none of the specific categories but
 * in `invitation-to-bid` (the section's parent) is "other".
 */
export const BID_CATEGORIES: readonly { slug: string; kind: BidKind }[] = [
  { slug: "itb_bac", kind: "itb" },
  { slug: "rfq_bac", kind: "rfq" },
  { slug: "bid_bulletin", kind: "bulletin" },
  { slug: "noa", kind: "noa" },
  { slug: "ntp", kind: "ntp" },
  { slug: "poc", kind: "contract" },
  { slug: "pmr_bac", kind: "pmr" },
  { slug: "app_bac-invitation-to-bid", kind: "app" },
  { slug: "othenot", kind: "other" },
  { slug: "invitation-to-bid", kind: "other" },
];

/** The category of City Hall's own bulletins of vacancies. */
export const VACANCY_CATEGORY = "bulletin-of-vacancies";

/** The city's page for one category archive page, e.g. `/download-category/noa/page/2/`. */
export function categoryPageUrl(slug: string, page: number): string {
  const base = `${SITE}/download-category/${slug}/`;
  return page > 1 ? `${base}page/${page}/` : base;
}

/** One page (100, oldest id first) of every Download Manager document, metadata only. */
export function documentsUrl(page: number): string {
  return `${API}/wpdmpro?per_page=100&page=${page}&orderby=id&order=asc&_fields=id,link,title,date`;
}

/** One page (100, oldest id first) of the PESO job posts, metadata only. */
export function pesoJobsUrl(page: number): string {
  return `${API}/awsm_job_openings?per_page=100&page=${page}&orderby=id&order=asc&_fields=id,link,title,date`;
}

/** The city's own pages for the two sections, linked from ours. */
export const CITY_BIDS_URL = `${SITE}/bac/`;
export const CITY_JOBS_URL = `${SITE}/peso/`;
