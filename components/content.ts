/**
 * Canonical site copy and links. Pages read from here instead of hardcoding
 * strings, so a wording change is a one-line edit. Follow BRAND.md when
 * changing any of it, and never invent facts, people, or numbers.
 */

/** Organization-wide facts used in metadata, header, and footer. */
export const SITE = {
  name: "Better Mandaluyong",
  url: "https://bettermandaluyong.org/",
  description: "Unofficial community portal for Mandaluyong residents.",
  location: "Mandaluyong City, Metro Manila",
  /** Placeholder inbox: confirm it exists before launch. */
  contactEmail: "hello@bettermandaluyong.org",
  followUrl: "https://www.facebook.com/BetterMandaluyong",
  officialSiteUrl: "https://mandaluyong.gov.ph/",
  cityPioFacebookUrl: "https://www.facebook.com/MandaluyongPIO",
} as const;

/** A link in the main site navigation. */
export type NavItem = {
  label: string;
  href: string;
};

/** Main navigation, shown in the header. Hrefs are on-site paths. */
export const NAV: NavItem[] = [{ label: "News", href: "/news" }];

/** The notice that this is not the city government's site. */
export const UNOFFICIAL = {
  text: "Unofficial community site, not run by the City Government of Mandaluyong.",
  linkLabel: "Official site: mandaluyong.gov.ph",
} as const;

/** Footer-only copy. */
export const FOOTER = {
  followLabel: "Follow Better Mandaluyong",
} as const;

/** A focus area shown on the home page. */
export type Pillar = {
  title: string;
  body: string;
};

/** Home (launching-soon) page copy. */
export const HOME = {
  metaTitle: "Better Mandaluyong — Launching soon",
  metaDescription:
    "Better Mandaluyong is a community effort for a more livable Mandaluyong. Our website is launching soon.",
  eyebrow: "Launching soon",
  headline: "A better Mandaluyong starts with all of us.",
  lede: "We're building a home for residents who want safer streets, greener spaces, and a city that works for everyone. The full site is on its way.",
  primaryCta: "Get in touch",
  secondaryCta: "Follow updates",
  pillarsLabel: "What we care about",
  pillars: [
    {
      title: "Walkable streets",
      body: "Sidewalks, crossings, and transit people can actually use.",
    },
    {
      title: "Green spaces",
      body: "Parks, trees, and shade in every barangay.",
    },
    {
      title: "Open governance",
      body: "Clear information and real ways to take part.",
    },
  ] satisfies Pillar[],
} as const;

/** Builds a `mailto:` href for an address. */
export function mailto(address: string): string {
  return `mailto:${address}`;
}
