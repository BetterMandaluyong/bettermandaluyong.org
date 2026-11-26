import { cityPostUrl, decodeEntities } from "../news/text.ts";

/** A document or job post as the WordPress API lists it. Link-only. */
export type WpEntry = {
  id: number;
  url: string;
  title: string;
  /** ISO 8601 in Manila time (+08:00). */
  publishedAt: string;
};

type RawEntry = {
  id?: unknown;
  link?: unknown;
  title?: { rendered?: unknown };
  date?: unknown;
};

/**
 * Maps a WordPress API list (documents or job posts) to entries. Dates are
 * Manila local time without an offset. Entries with a bad id or date, an
 * empty title, or a link off the city site are skipped.
 */
export function parseWpEntries(json: unknown): WpEntry[] {
  if (!Array.isArray(json)) return [];
  const out: WpEntry[] = [];
  for (const e of json as RawEntry[]) {
    const rawTitle = e?.title?.rendered;
    if (
      typeof e?.id !== "number" ||
      !Number.isInteger(e.id) ||
      e.id < 1 ||
      typeof e.link !== "string" ||
      typeof rawTitle !== "string" ||
      typeof e.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(e.date)
    ) {
      continue;
    }
    const url = cityPostUrl(e.link);
    const title = cleanTitle(rawTitle);
    const publishedAt = `${e.date}+08:00`;
    if (url === null || title === "" || Number.isNaN(Date.parse(publishedAt)))
      continue;
    out.push({ id: e.id, url, title, publishedAt });
  }
  return out;
}

/** Decodes entities, drops tags, and collapses whitespace in a WordPress title. */
export function cleanTitle(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalizes a city link for matching: no query or fragment, one trailing slash. */
export function linkKey(url: string): string {
  return url.split(/[?#]/)[0]!.replace(/\/*$/, "/");
}

const TITLE_LINK =
  /class="blog-post_title"[^>]*>\s*<a\s+href="(https:\/\/(?:www\.)?mandaluyong\.gov\.ph\/download\/[^"]+)"/g;

/**
 * Reads one category archive page: the document links in its main list (the
 * menus and sidebars also link to documents, so only post titles count) and
 * the highest page number its pagination links to (1 when there is none).
 */
export function parseCategoryPage(
  html: string,
  slug: string,
): { urls: string[]; lastPage: number } {
  const urls = [
    ...new Set([...html.matchAll(TITLE_LINK)].map((m) => linkKey(m[1]!))),
  ];
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pages = [
    ...html.matchAll(
      new RegExp(`/download-category/${escaped}/page/(\\d+)/`, "g"),
    ),
  ].map((m) => Number(m[1]));
  return { urls, lastPage: Math.max(1, ...pages) };
}
