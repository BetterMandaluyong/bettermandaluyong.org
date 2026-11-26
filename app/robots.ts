import type { MetadataRoute } from "next";
import { absoluteUrl } from "../components/metadata.ts";

/** /robots.txt: every crawler may read the site except the component catalog. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/storybook" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
