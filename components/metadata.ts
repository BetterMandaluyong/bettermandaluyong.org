import type { Metadata } from "next";
import {
  BARANGAYS,
  DISTRICTS_COPY,
  FEED,
  HOME,
  LLMS,
  NEWS,
  PEOPLE_COPY,
  SHARE,
  SITE,
} from "./content.ts";

/**
 * Turns an on-site path ("/barangays") into a full URL on the production
 * domain. Link previews, canonicals, the sitemap, and the feed need full URLs.
 */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString();
}

/** A main section of the site, as listed in llms.txt and the sitemap. */
export type MainPage = { path: string; label: string; description: string };

/** The site's main sections, in navigation order after the home page. */
export const MAIN_PAGES: MainPage[] = [
  { path: "/", label: LLMS.homeLabel, description: HOME.metaDescription },
  {
    path: "/barangays",
    label: BARANGAYS.heading,
    description: BARANGAYS.metaDescription,
  },
  {
    path: "/districts",
    label: DISTRICTS_COPY.heading,
    description: DISTRICTS_COPY.metaDescription,
  },
  {
    path: "/people",
    label: PEOPLE_COPY.heading,
    description: PEOPLE_COPY.metaDescription,
  },
  { path: "/news", label: NEWS.heading, description: NEWS.metaDescription },
];

/** The share image, as Open Graph and X/Twitter cards take it. */
const SHARE_IMAGE = { ...SHARE.image, url: absoluteUrl(SHARE.image.url) };

/**
 * Site-wide metadata for the root layout: the title and description pages
 * fall back to, the base URL, the share image, and the feed link. Pages
 * replace most of it through {@link pageMetadata}.
 */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    title: SITE.name,
    description: SITE.description,
    icons: { icon: { url: "/logo-seal.svg", type: "image/svg+xml" } },
    alternates: { types: { "application/rss+xml": absoluteUrl(FEED.path) } },
    openGraph: {
      siteName: SITE.name,
      type: "website",
      locale: SHARE.locale,
      title: SITE.name,
      description: SITE.description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: SHARE.twitterCard,
      title: SITE.name,
      description: SITE.description,
      images: [SHARE_IMAGE],
    },
  };
}

/**
 * A page's metadata: `<title>`, description, canonical URL, the RSS link, and
 * complete Open Graph and X/Twitter tags. Metadata merges shallowly, so a page
 * that set only `openGraph.title` would lose the site name and image; this
 * builds every object in full.
 *
 * - `path`: the page's on-site path, e.g. "/barangays/hulo". Query strings
 *   are left off, so filtered or paged views point back to the base page.
 * - `shareTitle` / `shareDescription`: what link previews show, when it
 *   should differ from the `<title>` and description.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  shareTitle?: string;
  shareDescription?: string;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const shareTitle = opts.shareTitle ?? opts.title;
  const shareDescription = opts.shareDescription ?? opts.description;
  return {
    title: opts.title,
    description: opts.description,
    alternates: {
      canonical: url,
      types: { "application/rss+xml": absoluteUrl(FEED.path) },
    },
    openGraph: {
      siteName: SITE.name,
      type: "website",
      locale: SHARE.locale,
      url,
      title: shareTitle,
      description: shareDescription,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: SHARE.twitterCard,
      title: shareTitle,
      description: shareDescription,
      images: [SHARE_IMAGE],
    },
  };
}
