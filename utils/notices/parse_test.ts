import { describe, expect, it } from "vitest";
import {
  cleanTitle,
  linkKey,
  parseCategoryPage,
  parseWpEntries,
} from "./parse.ts";

describe("parseWpEntries", () => {
  const raw = (over: Record<string, unknown> = {}) => ({
    id: 58965,
    link: "https://mandaluyong.gov.ph/download/sbb-no-9/",
    title: { rendered: "ITB &#8211; Plastic Storage" },
    date: "2026-11-26T17:28:02",
    ...over,
  });

  it("maps an API entry to a link-only entry in Manila time", () => {
    expect(parseWpEntries([raw()])).toEqual([
      {
        id: 58965,
        url: "https://mandaluyong.gov.ph/download/sbb-no-9/",
        title: "ITB – Plastic Storage",
        publishedAt: "2026-11-26T17:28:02+08:00",
      },
    ]);
  });

  it("skips bad ids, dates, titles, and links off the city site", () => {
    expect(
      parseWpEntries([
        raw({ id: "1" }),
        raw({ id: 0 }),
        raw({ date: "2026-11-26" }),
        raw({ title: { rendered: "  " } }),
        raw({ link: "https://example.com/x/" }),
        null,
      ]),
    ).toEqual([]);
  });

  it("returns nothing for a non-list", () => {
    expect(parseWpEntries({ code: "rest_no_route" })).toEqual([]);
  });
});

describe("cleanTitle and linkKey", () => {
  it("drops tags and collapses spaces", () => {
    expect(cleanTitle(" <b>NOA</b>\n &amp;  NTP ")).toBe("NOA & NTP");
  });

  it("normalizes a link to one trailing slash, no query", () => {
    expect(linkKey("https://mandaluyong.gov.ph/download/x?wpdmdl=1")).toBe(
      "https://mandaluyong.gov.ph/download/x/",
    );
    expect(linkKey("https://mandaluyong.gov.ph/download/x//#a")).toBe(
      "https://mandaluyong.gov.ph/download/x/",
    );
  });
});

describe("parseCategoryPage", () => {
  // Trimmed from https://mandaluyong.gov.ph/download-category/bid_opp/ (2026-11-26).
  const html = `
    <li class="menu-item menu-item-object-wpdmpro"><a href="https://mandaluyong.gov.ph/download/final-revenue-code-2017/"><span>Final Revenue Code 2017 (PDF)</span></a></li>
    <h3 class="blog-post_title" style="x"><a href="https://mandaluyong.gov.ph/download/sbb-no-9-dated-11-25-2026/">SBB No. 9</a></h3>
    <a class="share_post" href="https://twitter.com/intent/tweet?url=https://mandaluyong.gov.ph/download/sbb-no-9-dated-11-25-2026/"></a>
    <h3 class="blog-post_title"><a href="https://mandaluyong.gov.ph/download/itb-7500-pieces-of-plastic-storage-80l/">ITB</a></h3>
    <h3 class="blog-post_title"><a href="https://mandaluyong.gov.ph/download/itb-7500-pieces-of-plastic-storage-80l/">ITB again</a></h3>
    <ul class="wgl-pagination"><li><a class="page-numbers" href="https://mandaluyong.gov.ph/download-category/bid_opp/page/2/">2</a></li>
    <li><a class="page-numbers" href="https://mandaluyong.gov.ph/download-category/bid_opp/page/15/">15</a></li></ul>`;

  it("reads only the listed documents, once each, and the last page", () => {
    expect(parseCategoryPage(html, "bid_opp")).toEqual({
      urls: [
        "https://mandaluyong.gov.ph/download/sbb-no-9-dated-11-25-2026/",
        "https://mandaluyong.gov.ph/download/itb-7500-pieces-of-plastic-storage-80l/",
      ],
      lastPage: 15,
    });
  });

  it("ignores other categories' page links, and says 1 page when there are none", () => {
    expect(parseCategoryPage(html, "noa").lastPage).toBe(1);
    expect(parseCategoryPage("<p>empty</p>", "noa")).toEqual({
      urls: [],
      lastPage: 1,
    });
  });
});
