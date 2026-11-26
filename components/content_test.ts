import { describe, expect, it } from "vitest";
import {
  BARANGAYS,
  BIDS,
  BETTERGOV,
  BUDGET,
  DISTRICTS_COPY,
  FOOTER,
  JOBS,
  NAV,
  NEWS,
  NUMBERS,
  PAY_COPY,
  PEOPLE_COPY,
  SITE,
  UNOFFICIAL,
  VOLUNTEER,
  mailto,
} from "./content.ts";

/** Short words that stay lowercase inside a Title Case heading. */
const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
]);

/** True when every word is capitalized, except small words after the first. */
function isTitleCase(heading: string): boolean {
  return heading
    .split(/\s+/)
    .filter((word) => /^[a-z]/i.test(word))
    .every(
      (word, i) => /^[A-Z]/.test(word) || (i > 0 && SMALL_WORDS.has(word)),
    );
}

describe("content", () => {
  it("names the site after its domain", () => {
    expect(SITE.url).toBe(`https://${SITE.name.toLowerCase()}/`);
    expect(SITE.groupName).toBe("Better Mandaluyong");
    expect(FOOTER.copyright.startsWith(SITE.name)).toBe(true);
  });

  it("writes every section heading in Title Case", () => {
    const headings = [
      ...FOOTER.columns.map((c) => c.heading),
      BARANGAYS.heading,
      BARANGAYS.exploreHeading,
      BARANGAYS.captainsHeading,
      BARANGAYS.skChairsHeading,
      BARANGAYS.cityHeading,
      BARANGAYS.listHeading,
      BARANGAYS.repsHeading,
      BARANGAYS.repsHouseHeading,
      BARANGAYS.repsCityHeading,
      BARANGAYS.councilorsHeading(1),
      BARANGAYS.hallHeading,
      BARANGAYS.councilHeading,
      BARANGAYS.skHeading,
      PEOPLE_COPY.heading,
      PEOPLE_COPY.cityHeading,
      PEOPLE_COPY.barangayHeading("Hulo"),
      PEOPLE_COPY.contactHeading,
      PEOPLE_COPY.hallHeading,
      PEOPLE_COPY.orgHeading,
      PEOPLE_COPY.orgCouncilors(1),
      PEOPLE_COPY.orgDistrict(1, 13),
      PEOPLE_COPY.externalHeading,
      ...Object.values(PEOPLE_COPY.categories).map((c) => c.heading),
      DISTRICTS_COPY.heading,
      DISTRICTS_COPY.houseHeading,
      DISTRICTS_COPY.barangays(1, 14),
      NEWS.heading,
      BIDS.heading,
      JOBS.heading,
      JOBS.cityHallHeading,
      JOBS.pesoHeading,
      VOLUNTEER.heading,
      NEWS.facebookHeading,
      NEWS.latestHeading,
      BUDGET.heading,
      BUDGET.figuresHeading,
      BUDGET.projectsHeading,
      BUDGET.officeHeading,
      BUDGET.gaaHeading,
      BUDGET.aboutHeading,
      BUDGET.excludedHeading,
      PAY_COPY.homeHeading,
      PAY_COPY.personHeading,
      NUMBERS.heading,
      NUMBERS.glanceHeading,
      NUMBERS.populationHeading,
      NUMBERS.povertyHeading,
      NUMBERS.moneyHeading,
      NUMBERS.incomeHeading,
      NUMBERS.spendingHeading,
      NUMBERS.barangayHeading,
    ];
    for (const heading of headings)
      expect(isTitleCase(heading), heading).toBe(true);
    expect(isTitleCase("Barangay captains")).toBe(false);
    expect(isTitleCase("News from the City Hall")).toBe(true);
  });

  it("builds a mailto href", () => {
    expect(mailto(SITE.contactEmail)).toBe(
      "mailto:hello@bettermandaluyong.org",
    );
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

  it("links the budget page's sources over https", () => {
    expect(BUDGET.sourceUrl).toMatch(/^https:\/\//);
    expect(BUDGET.docsUrl).toMatch(/^https:\/\//);
    expect(BUDGET.licenseUrl).toMatch(/^https:\/\//);
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
    expect(UNOFFICIAL.text).toContain("unofficial");
    expect(UNOFFICIAL.linkLabel.trim()).not.toBe("");
  });

  it("words the top bar and the footer notice the same", () => {
    expect(FOOTER.unofficial).toBe(UNOFFICIAL);
  });

  it("links the footer to the BetterGov.ph Discord and Facebook", () => {
    const hrefs = FOOTER.columns.flatMap((c) => c.links.map((l) => l.href));
    expect(hrefs).toContain(BETTERGOV.discordUrl);
    expect(hrefs).toContain(BETTERGOV.facebookUrl);
  });

  it("sends volunteers to BetterGov.ph's volunteer page and Discord", () => {
    expect(VOLUNTEER.primary.href).toBe(BETTERGOV.volunteerUrl);
    expect(VOLUNTEER.secondary.href).toBe(BETTERGOV.discordUrl);
    expect(VOLUNTEER.roles.length).toBeGreaterThan(0);
    for (const { role, description } of VOLUNTEER.roles) {
      expect(role.trim()).not.toBe("");
      expect(description.trim()).not.toBe("");
    }
  });

  it("labels every license link", () => {
    for (const license of FOOTER.licenses) {
      expect(license.label.trim()).not.toBe("");
    }
  });
});
