import { describe, expect, it } from "vitest";
import {
  decodeEntities,
  stripTrackingParams,
  toManilaIso,
  cityPostUrl,
} from "./text.ts";

describe("toManilaIso", () => {
  it("renders a UTC instant in Manila time with a +08:00 offset", () => {
    expect(toManilaIso(new Date("2026-10-27T03:08:46Z"))).toBe(
      "2026-10-27T11:08:46+08:00",
    );
  });

  it("rolls the date over across midnight", () => {
    expect(toManilaIso(new Date("2026-12-31T20:00:00Z"))).toBe(
      "2027-01-01T04:00:00+08:00",
    );
  });
});

describe("decodeEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("A &amp; B &#8211; C&#8217;s")).toBe("A & B – C’s");
  });

  it("decodes hex entities and leaves unknown ones alone", () => {
    expect(decodeEntities("&#x2013; &nope;")).toBe("– &nope;");
  });

  it("does not double-decode", () => {
    expect(decodeEntities("&amp;lt;")).toBe("&lt;");
  });
});

describe("stripTrackingParams", () => {
  it("drops utm_ parameters and the ? when nothing else remains", () => {
    expect(
      stripTrackingParams(
        "https://mandaluyong.gov.ph/x/?utm_source=rss&utm_medium=rss&utm_campaign=x",
      ),
    ).toBe("https://mandaluyong.gov.ph/x/");
  });

  it("keeps other parameters in their original order", () => {
    expect(
      stripTrackingParams("https://mandaluyong.gov.ph/?p=58001&utm_source=rss"),
    ).toBe("https://mandaluyong.gov.ph/?p=58001");
    expect(
      stripTrackingParams(
        "https://mandaluyong.gov.ph/x/?a=1&utm_source=rss&b=2",
      ),
    ).toBe("https://mandaluyong.gov.ph/x/?a=1&b=2");
  });

  it("returns a clean URL unchanged", () => {
    expect(stripTrackingParams("https://mandaluyong.gov.ph/x/")).toBe(
      "https://mandaluyong.gov.ph/x/",
    );
  });

  it("returns null for non-http(s) and invalid input", () => {
    expect(stripTrackingParams("javascript:alert(1)")).toBeNull();
    expect(stripTrackingParams("not a url")).toBeNull();
  });
});

describe("cityPostUrl", () => {
  it("strips tracking params on the city host and www", () => {
    expect(cityPostUrl("https://mandaluyong.gov.ph/x/?utm_source=a&p=1")).toBe(
      "https://mandaluyong.gov.ph/x/?p=1",
    );
    expect(cityPostUrl("https://www.mandaluyong.gov.ph/x/")).toBe(
      "https://www.mandaluyong.gov.ph/x/",
    );
  });
  it("rejects other hosts, lookalikes and non-http schemes", () => {
    expect(cityPostUrl("https://evil.example/x/")).toBeNull();
    expect(
      cityPostUrl("https://mandaluyong.gov.ph.evil.example/x/"),
    ).toBeNull();
    expect(cityPostUrl("https://evil.example/@mandaluyong.gov.ph/")).toBeNull();
    expect(cityPostUrl("javascript:alert(1)")).toBeNull();
    expect(cityPostUrl("not a url")).toBeNull();
  });
});
