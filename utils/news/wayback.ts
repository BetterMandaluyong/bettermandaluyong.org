/** Internet Archive S3-style keys for the Save Page Now API. */
export type IaKeys = { access: string; secret: string };

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
    ? closest.url
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
      captureUrl: location ? `https://web.archive.org${location}` : null,
      throttled: false,
    };
  }
  return {
    status: `http ${res.status}`,
    captureUrl: null,
    throttled: res.status === 429,
  };
}
