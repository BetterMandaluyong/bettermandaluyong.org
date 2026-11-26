import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEED, SHARE, SITE } from "./content.ts";
import {
  MAIN_PAGES,
  absoluteUrl,
  pageMetadata,
  rootMetadata,
} from "./metadata.ts";

describe("absoluteUrl", () => {
  it("joins a path onto the site's domain", () => {
    expect(absoluteUrl("/")).toBe(SITE.url);
    expect(absoluteUrl("/barangays/hulo")).toBe(
      "https://bettermandaluyong.org/barangays/hulo",
    );
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata({
    title: "Barangays — Example",
    description: "All the barangays.",
    path: "/barangays",
  });

  it("sets the title, description, and canonical URL", () => {
    expect(meta.title).toBe("Barangays — Example");
    expect(meta.description).toBe("All the barangays.");
    expect(meta.alternates?.canonical).toBe(
      "https://bettermandaluyong.org/barangays",
    );
  });

  it("keeps the feed link the root layout sets", () => {
    expect(meta.alternates?.types?.["application/rss+xml"]).toBe(
      absoluteUrl(FEED.path),
    );
  });

  it("builds complete Open Graph tags for the page's own URL", () => {
    expect(meta.openGraph).toMatchObject({
      siteName: SITE.name,
      type: "website",
      locale: SHARE.locale,
      url: "https://bettermandaluyong.org/barangays",
      title: "Barangays — Example",
      description: "All the barangays.",
      images: [
        {
          url: "https://bettermandaluyong.org/png/logo-seal-1024.png",
          width: 1024,
          height: 1024,
          alt: SHARE.image.alt,
        },
      ],
    });
  });

  it("builds X/Twitter card tags", () => {
    expect(meta.twitter).toMatchObject({
      card: "summary",
      title: "Barangays — Example",
      description: "All the barangays.",
    });
  });

  it("uses the share title and description for previews only", () => {
    const home = pageMetadata({
      title: "T",
      description: "D",
      path: "/",
      shareTitle: "Share T",
      shareDescription: "Share D",
    });
    expect(home.title).toBe("T");
    expect(home.description).toBe("D");
    expect(home.openGraph?.title).toBe("Share T");
    expect(home.openGraph?.description).toBe("Share D");
    expect(home.twitter?.title).toBe("Share T");
  });
});

describe("rootMetadata", () => {
  it("sets the base URL and no page URL", () => {
    const meta = rootMetadata();
    expect(meta.metadataBase?.toString()).toBe(SITE.url);
    expect(meta.openGraph?.url).toBeUndefined();
  });
});

describe("SHARE", () => {
  it("points at an image that exists in public/", () => {
    expect(existsSync(`public${SHARE.image.url}`)).toBe(true);
  });
});

describe("MAIN_PAGES", () => {
  it("lists only routes that exist", () => {
    for (const { path } of MAIN_PAGES) {
      expect(existsSync(`app${path === "/" ? "" : path}/page.tsx`), path).toBe(
        true,
      );
    }
  });
});
