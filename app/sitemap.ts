import type { MetadataRoute } from "next";
import { MAIN_PAGES, absoluteUrl } from "../components/metadata.ts";
import { BARANGAYS } from "../data/barangays.ts";
import { PEOPLE, personPath } from "../data/people.ts";

/**
 * /sitemap.xml: the main sections, every barangay page, and every person
 * page. News posts live on the city's site, so they aren't listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...MAIN_PAGES.map((p) => p.path),
    ...BARANGAYS.map((b) => `/barangays/${b.slug}`),
    ...PEOPLE.map(personPath),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
