const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Decode named (&amp; &lt; &gt; &quot; &apos;) and numeric (&#8211; &#x2013;) entities in one pass. */
export function decodeEntities(s: string): string {
  return s.replace(
    /&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|(\w+));/g,
    (match, dec?: string, hex?: string, name?: string) => {
      if (name !== undefined) return NAMED[name] ?? match;
      const code = dec !== undefined ? Number(dec) : parseInt(hex ?? "", 16);
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    },
  );
}

/** Format an instant as an ISO 8601 string in Manila time (UTC+8, no DST), e.g. 2026-10-27T11:08:46+08:00. */
export function toManilaIso(date: Date): string {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${shifted.toISOString().slice(0, 19)}+08:00`;
}

/**
 * Remove every `utm_*` query parameter from an http(s) URL, keeping the rest in
 * their original order. Drops the `?` when no parameters remain. Returns null
 * for invalid URLs and non-http(s) schemes (javascript:, mailto:, …).
 */
export function stripTrackingParams(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  const kept = new URLSearchParams(
    [...parsed.searchParams].filter(([name]) => !name.startsWith("utm_")),
  );
  parsed.search = kept.toString();
  return parsed.href;
}

const CITY_HOSTS = new Set(["mandaluyong.gov.ph", "www.mandaluyong.gov.ph"]);

/**
 * Validate a link to a city post: tracking params are stripped and the host
 * must be mandaluyong.gov.ph or www.mandaluyong.gov.ph. Returns null for any
 * other host, for invalid URLs and for non-http(s) schemes.
 */
export function cityPostUrl(raw: string): string | null {
  const url = stripTrackingParams(raw);
  if (url === null) return null;
  return CITY_HOSTS.has(new URL(url).host) ? url : null;
}
