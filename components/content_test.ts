import { describe, expect, it } from "vitest";
import { HOME, NAV, SITE, UNOFFICIAL, mailto } from "./content.ts";

describe("content", () => {
  it("builds a mailto href", () => {
    expect(mailto(SITE.contactEmail)).toBe(
      "mailto:hello@bettermandaluyong.org",
    );
  });

  it("has a non-empty title and body for every pillar", () => {
    expect(HOME.pillars.length).toBeGreaterThan(0);
    for (const pillar of HOME.pillars) {
      expect(pillar.title.trim()).not.toBe("");
      expect(pillar.body.trim()).not.toBe("");
    }
  });

  it("uses absolute https links", () => {
    expect(SITE.url).toMatch(/^https:\/\//);
    expect(SITE.followUrl).toMatch(/^https:\/\//);
  });

  it("uses absolute https links for the official city pages", () => {
    expect(SITE.officialSiteUrl).toMatch(/^https:\/\//);
    expect(SITE.cityPioFacebookUrl).toMatch(/^https:\/\//);
  });

  it("keeps every nav link on-site", () => {
    expect(NAV.length).toBeGreaterThan(0);
    for (const item of NAV) {
      expect(item.label.trim()).not.toBe("");
      expect(item.href.startsWith("/")).toBe(true);
    }
  });

  it("says plainly that the site is unofficial", () => {
    expect(UNOFFICIAL.text).toContain("Unofficial");
    expect(UNOFFICIAL.linkLabel.trim()).not.toBe("");
  });
});
