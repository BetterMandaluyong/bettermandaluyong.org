import { describe, expect, it } from "vitest";
import { buildHumansTxt, buildLlmsTxt } from "./text.ts";

describe("buildLlmsTxt", () => {
  it("writes the title, summary, details, and link sections", () => {
    const txt = buildLlmsTxt({
      title: "Example.org",
      summary: "A site.",
      details: ["First paragraph.", "Second\nparagraph."],
      sections: [
        {
          heading: "Pages",
          links: [
            { label: "Home", url: "https://example.org/", note: "Start" },
            { label: "About", url: "https://example.org/about" },
          ],
        },
      ],
    });
    expect(txt).toBe(
      [
        "# Example.org",
        "",
        "> A site.",
        "",
        "First paragraph.",
        "",
        "Second paragraph.",
        "",
        "## Pages",
        "",
        "- [Home](https://example.org/): Start",
        "- [About](https://example.org/about)",
        "",
      ].join("\n"),
    );
  });

  it("leaves out empty sections", () => {
    const txt = buildLlmsTxt({
      title: "T",
      summary: "S",
      details: [],
      sections: [{ heading: "Empty", links: [] }],
    });
    expect(txt).not.toContain("## Empty");
  });
});

describe("buildHumansTxt", () => {
  it("writes uppercase headings and indented lines", () => {
    const txt = buildHumansTxt([
      {
        heading: "Team",
        lines: [
          { value: "Example contributors" },
          { label: "Contact", value: "hi@example.org" },
        ],
      },
      { heading: "Empty", lines: [] },
      { heading: "Site", lines: [{ label: "Language", value: "English" }] },
    ]);
    expect(txt).toBe(
      [
        "/* TEAM */",
        "  Example contributors",
        "  Contact: hi@example.org",
        "",
        "/* SITE */",
        "  Language: English",
        "",
      ].join("\n"),
    );
  });
});
