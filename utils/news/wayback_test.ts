import { describe, expect, it } from "vitest";
import {
  availabilityUrl,
  interpretSave,
  parseAvailability,
  saveRequest,
} from "./wayback.ts";

const URL_ = "https://mandaluyong.gov.ph/x/";

describe("availabilityUrl", () => {
  it("encodes the target url", () => {
    expect(availabilityUrl(URL_)).toBe(
      "https://archive.org/wayback/available?url=https%3A%2F%2Fmandaluyong.gov.ph%2Fx%2F",
    );
  });
});

describe("parseAvailability", () => {
  it("returns the closest snapshot url", () => {
    expect(
      parseAvailability({
        archived_snapshots: {
          closest: {
            available: true,
            url: "http://web.archive.org/web/2026/https://mandaluyong.gov.ph/x/",
          },
        },
      }),
    ).toBe("http://web.archive.org/web/2026/https://mandaluyong.gov.ph/x/");
  });
  it("returns null when there is no snapshot", () => {
    expect(parseAvailability({ archived_snapshots: {} })).toBeNull();
    expect(parseAvailability(null)).toBeNull();
  });
});

describe("saveRequest", () => {
  it("POSTs with LOW auth when keys are present", async () => {
    const req = saveRequest(URL_, { access: "AK", secret: "SK" });
    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://web.archive.org/save");
    expect(req.headers.get("Accept")).toBe("application/json");
    expect(req.headers.get("Authorization")).toBe("LOW AK:SK");
    expect(await req.text()).toBe(
      "url=https%3A%2F%2Fmandaluyong.gov.ph%2Fx%2F",
    );
  });
  it("GETs the anonymous save url without keys", () => {
    const req = saveRequest(URL_, null);
    expect(req.method).toBe("GET");
    expect(req.url).toBe(
      "https://web.archive.org/save/https://mandaluyong.gov.ph/x/",
    );
  });
});

describe("interpretSave", () => {
  it("reads the capture url from Content-Location", () => {
    const headers = new Headers({
      "Content-Location": "/web/20261125/https://mandaluyong.gov.ph/x/",
    });
    expect(interpretSave({ status: 200, headers })).toEqual({
      status: "ok",
      captureUrl:
        "https://web.archive.org/web/20261125/https://mandaluyong.gov.ph/x/",
      throttled: false,
    });
  });
  it("treats 3xx as ok", () => {
    expect(interpretSave({ status: 302, headers: new Headers() })).toEqual({
      status: "ok",
      captureUrl: null,
      throttled: false,
    });
  });
  it("flags 429 as throttled", () => {
    expect(interpretSave({ status: 429, headers: new Headers() })).toEqual({
      status: "http 429",
      captureUrl: null,
      throttled: true,
    });
  });
  it("reports other codes", () => {
    expect(interpretSave({ status: 503, headers: new Headers() }).status).toBe(
      "http 503",
    );
  });
});
