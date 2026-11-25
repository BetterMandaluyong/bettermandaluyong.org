import { describe, expect, it } from "vitest";
import { HOME, SITE, mailto } from "./content.ts";

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
});
