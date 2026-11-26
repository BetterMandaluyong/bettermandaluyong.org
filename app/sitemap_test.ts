import { readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { SITE } from "../components/content.ts";
import robots from "./robots.ts";
import sitemap from "./sitemap.ts";

// Keeps /sitemap.xml in step with the routes in app/. The sitemap is rebuilt
// from data on every build, so new barangays and people join it on their own;
// what can drift is the list of routes. A new page.tsx fails here until it is
// in MAIN_PAGES (static routes), sitemap.ts (dynamic routes), or robots.ts's
// disallow list (pages search engines shouldn't index, like /storybook).

// Page modules import next/navigation, which only vinext's Vite config
// resolves. The test only calls generateStaticParams, so a stub will do.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: () => {
    throw new Error("redirect");
  },
}));

const APP = dirname(fileURLToPath(import.meta.url));

/** Every page.tsx under app/, as its route ("/", "/budget", "/people/[slug]"). */
function pageRoutes(dir = APP): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return pageRoutes(path);
    if (e.name !== "page.tsx") return [];
    const segments = relative(APP, dir)
      .split(sep)
      .filter((s) => s !== "" && !/^\(.*\)$/.test(s)); // drop route groups
    return [`/${segments.join("/")}`];
  });
}

const routes = pageRoutes();
const isDynamic = (route: string) => route.includes("[");
const entries = sitemap().map((e) => e.url);
const paths = entries.map((url) => new URL(url).pathname);

const rules = robots().rules;
const disallowed = (Array.isArray(rules) ? rules : [rules]).flatMap((r) =>
  r.disallow === undefined ? [] : [r.disallow].flat(),
);
const isDisallowed = (path: string) =>
  disallowed.some((d) => path === d || path.startsWith(`${d}/`));

/** A route as a regex over paths: each [param] matches one path segment. */
function routePattern(route: string): RegExp {
  const escaped = route
    .split("/")
    .map((s) =>
      /^\[.+\]$/.test(s) ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${escaped}$`);
}

describe("sitemap", () => {
  it("finds the app's pages", () => {
    expect(routes).toContain("/");
    expect(routes.some(isDynamic)).toBe(true);
  });

  it("lists every static page that search engines may index", () => {
    const missing = routes
      .filter((r) => !isDynamic(r) && !isDisallowed(r))
      .filter((r) => !paths.includes(r));
    expect(
      missing,
      "add the page to MAIN_PAGES (components/metadata.ts), or to robots.ts's disallow list if it shouldn't be indexed",
    ).toEqual([]);
  });

  it("lists every prebuilt page of each dynamic route", async () => {
    for (const route of routes.filter(isDynamic)) {
      if (isDisallowed(route)) continue;
      const file = join(APP, ...route.split("/").filter(Boolean), "page.tsx");
      const page = (await import(file)) as {
        generateStaticParams?: () => Record<string, string>[];
      };
      expect(
        page.generateStaticParams,
        `${route} has no generateStaticParams`,
      ).toBeTypeOf("function");
      const built = page.generateStaticParams!().map((params) =>
        route.replace(/\[([^\]]+)\]/g, (_, key: string) => params[key]!),
      );
      const listed = paths.filter((p) => routePattern(route).test(p));
      expect(
        [...listed].sort(),
        `sitemap.ts should list every ${route} page`,
      ).toEqual([...built].sort());
    }
  });

  it("only lists paths that a page serves", () => {
    const stray = paths.filter(
      (p) => !routes.some((r) => routePattern(r).test(p)),
    );
    expect(stray).toEqual([]);
  });

  it("lists nothing that robots.txt disallows", () => {
    expect(paths.filter(isDisallowed)).toEqual([]);
  });

  it("lists each page once, as an absolute URL on the site", () => {
    expect(new Set(entries).size).toBe(entries.length);
    for (const url of entries) expect(url.startsWith(SITE.url)).toBe(true);
  });
});
