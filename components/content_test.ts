import { describe, expect, it } from "vitest";
import {
  BETTERGOV,
  FOOTER,
  HOME,
  NAV,
  SITE,
  UNOFFICIAL,
  mailto,
} from "./content.ts";

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
    expect(SITE.repoUrl).toMatch(/^https:\/\/github\.com\//);
    for (const url of Object.values(BETTERGOV).filter((v) =>
      v.startsWith("http"),
    )) {
      expect(url).toMatch(/^https:\/\//);
    }
    for (const license of FOOTER.licenses) {
      expect(license.href).toMatch(/^https:\/\//);
    }
  });

  it("gives every footer link a label and an https or mailto href", () => {
    for (const column of FOOTER.columns) {
      expect(column.heading.trim()).not.toBe("");
      expect(column.links.length).toBeGreaterThan(0);
      for (const link of column.links) {
        expect(link.label.trim()).not.toBe("");
        expect(link.href).toMatch(/^(https:\/\/|mailto:)/);
      }
    }
  });

  it("links the footer to this repo on GitHub", () => {
    const hrefs = FOOTER.columns.flatMap((c) => c.links.map((l) => l.href));
    expect(hrefs).toContain(SITE.repoUrl);
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
