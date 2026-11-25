/** Internet Archive S3-style keys for the Save Page Now API. */
export type IaKeys = { access: string; secret: string };

/**
 * Resolve a Wayback location (absolute or relative) and accept it only when it
 * is on web.archive.org over http(s). Returns the https form, or null for any
 * other host (including protocol-relative `//host/...`), port or scheme.
 */
export function archiveUrl(loc: string): string | null {
  if (loc.trim() === "") return null;
  let parsed: URL;
  try {
    parsed = new URL(loc, "https://web.archive.org");
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (parsed.host !== "web.archive.org") return null;
  parsed.protocol = "https:";
  return parsed.href;
}

/** Build the Wayback availability-check URL for a page. */
export function availabilityUrl(url: string): string {
  return `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
}

/** Read the closest snapshot URL from an availability response, or null when none is available. */
export function parseAvailability(json: unknown): string | null {
  const closest = (
    json as {
      archived_snapshots?: { closest?: { available?: unknown; url?: unknown } };
    } | null
  )?.archived_snapshots?.closest;
  return closest?.available === true && typeof closest.url === "string"
    ? archiveUrl(closest.url)
    : null;
}

/** Build the Save Page Now request: authenticated POST with keys, anonymous GET without. */
export function saveRequest(url: string, keys: IaKeys | null): Request {
  if (!keys) return new Request(`https://web.archive.org/save/${url}`);
  return new Request("https://web.archive.org/save", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `LOW ${keys.access}:${keys.secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url }).toString(),
  });
}

/** Turn a Save Page Now response into a status string, the capture URL when known, and a throttle flag. */
export function interpretSave(res: { status: number; headers: Headers }): {
  status: string;
  captureUrl: string | null;
  throttled: boolean;
} {
  if (res.status >= 200 && res.status < 400) {
    const location = res.headers.get("Content-Location");
    return {
      status: "ok",
      captureUrl: location ? archiveUrl(location) : null,
      throttled: false,
    };
  }
  return {
    status: `http ${res.status}`,
    captureUrl: null,
    throttled: res.status === 429,
  };
}
