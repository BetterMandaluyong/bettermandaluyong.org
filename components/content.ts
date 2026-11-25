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
  /** Public repository; the footer links to it, its issues, and commits. */
  repoUrl: "https://github.com/BetterMandaluyong/bettermandaluyong.org",
} as const;

/** A link in the main site navigation. */
export type NavItem = {
  label: string;
  href: string;
};

/** Main navigation, shown in the header. Hrefs are on-site paths. */
export const NAV: NavItem[] = [
  { label: "Barangays", href: "/barangays" },
  { label: "News", href: "/news" },
];

/** The notice that this is not the city government's site. */
export const UNOFFICIAL = {
  text: "Unofficial community site, not run by the City Government of Mandaluyong.",
  linkLabel: "Official site: mandaluyong.gov.ph",
} as const;

/**
 * The BetterGov.ph movement this site is part of. The logo is not ours: it is
 * loaded unmodified from BetterGov's own asset CDN, as its logo guide asks
 * (github.com/bettergovph/logo), and is not covered by our licenses.
 */
export const BETTERGOV = {
  name: "BetterGov.ph",
  url: "https://bettergov.ph/",
  aboutUrl: "https://about.bettergov.ph/",
  designUrl: "https://bettergov.ph/design",
  lguUrl: "https://lgu.bettergov.ph/",
  /**
   * White horizontal logo for navy backgrounds (4:1). WebP, as the guide asks;
   * the SVG sets its wordmark as live text, which an <img> can't render.
   */
  logoWhiteSrc: "https://assets.bettergov.ph/logos/webp/horizontal-white.webp",
} as const;

/** A license the site is published under, as named in the footer. */
export type License = {
  /** Short name shown in the footer, e.g. "MIT". */
  name: string;
  /** What it covers: "Code" or "Content". */
  covers: string;
  href: string;
};

/** Footer copy, links, and licenses. */
export const FOOTER = {
  description: "A community effort for a more livable Mandaluyong.",
  partOf: "Part of the BetterGov.ph initiative",
  openSourceFlag: "Open source",
  columns: [
    {
      heading: "Get involved",
      links: [
        { label: "Email us", href: mailto(SITE.contactEmail) },
        { label: "Follow Better Mandaluyong", href: SITE.followUrl },
      ],
    },
    {
      heading: "Open source",
      links: [
        { label: "Source code on GitHub", href: SITE.repoUrl },
        { label: "Report a problem", href: `${SITE.repoUrl}/issues` },
        { label: "Credits", href: `${SITE.repoUrl}/blob/main/NOTICE.md` },
      ],
    },
    {
      heading: "BetterGov.ph",
      links: [
        { label: "About BetterGov.ph", href: BETTERGOV.aboutUrl },
        { label: "Design system", href: BETTERGOV.designUrl },
        { label: "Other BetterLGU sites", href: BETTERGOV.lguUrl },
      ],
    },
  ] satisfies FooterColumn[],
  licenses: [
    {
      name: "CC BY-NC-ND 4.0",
      covers: "Content",
      href: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    },
    {
      name: "MIT",
      covers: "Code",
      href: `${SITE.repoUrl}/blob/main/LICENSE`,
    },
  ] satisfies License[],
} as const;

/** A headed list of links in the footer. */
export type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
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
} as const;

/**
 * Copy for the barangay map, list, and pages. The data itself lives in
 * `data/`; everything here is wording. ZIP codes are approximate and the copy
 * says so; never present them as official.
 */
export const BARANGAYS = {
  metaTitle: "Barangays — Better Mandaluyong",
  metaDescription:
    "A map of Mandaluyong's 27 barangays, with their officials, contact details, and approximate ZIP codes, plus the councilors and House representative who serve each one.",
  heading: "Barangays",
  intro:
    "Find your barangay, who leads it, and how to reach them. Everything here comes from the City Government's own pages, and each page links back to its source.",
  homeMeta: "27 barangays · 2 council districts",
  homeIntro:
    "Mandaluyong has 27 barangays in two council districts. Tap one on the map or pick it from the list.",
  homeLink: "All barangays and officials",
  mapLabel:
    "Map of Mandaluyong's barangays. The list of barangays has the same information.",
  mapLoading: "Loading the map…",
  mapError:
    "The map couldn't load. The list of barangays has the same information.",
  mapLegend: "Council district",
  mapPopupLink: "View barangay page",
  listHeading: "All barangays",
  district: (n: number) => `District ${n}`,
  zip: (zip: string) => `ZIP ${zip}`,
  zipNote:
    "ZIP codes are approximate. The post office assigns them to delivery areas, not barangays.",
  zipLookup: "Look up a ZIP code at PHLPost",
  districtNote:
    "Mandaluyong has two council districts. The whole city is one congressional district, so every barangay has the same House representative.",
  repsHeading: "Who represents you",
  repsHouseHeading: "House representative",
  repsCityHeading: "Mayor and Vice Mayor",
  councilorsHeading: (n: number) => `District ${n} councilors`,
  hallHeading: "Barangay hall",
  hallAddress: "Address",
  councilHeading: "Barangay council",
  skHeading: "Sangguniang Kabataan",
  captain: "Punong Barangay",
  kagawad: "Barangay Kagawad",
  skChair: "SK Chairperson",
  skKagawad: "SK Kagawad",
  office: "Office",
  phone: "Phone",
  email: "Email",
  repsFor: (district: number) =>
    `Your district councilors are in District ${district}.`,
  backToAll: "All barangays",
  notFoundTitle: "Barangay not found — Better Mandaluyong",
  source: "Source:",
  sourceLink: "City Government of Mandaluyong",
  lastUpdated: (date: string) => `Last updated by the city on ${date}.`,
  mapCredit:
    "Barangay boundaries: NAMRIA and PSA, via OCHA COD-AB (CC BY-IGO). Map tiles: © OpenStreetMap contributors.",
} as const;

/** Copy for the city news page, the news list, and the Facebook island. */
export const NEWS = {
  metaTitle: "City news — Better Mandaluyong",
  metaDescription:
    "Official announcements from the City Government of Mandaluyong, linked from an unofficial community site.",
  heading: "City news",
  intro:
    "Official announcements from the City Government of Mandaluyong. We link to the city's posts; we don't copy them.",
  archived: "Archived copy",
  removed: "Removed from the city site",
  empty: "News will appear here after the first update.",
  noPage: "No posts here.",
  backToFirst: "Back to the latest news",
  newer: "Newer",
  older: "Older",
  allCategories: "All",
  facebookHeading: "City Public Information Office on Facebook",
  facebookShow: "Show Facebook posts",
  facebookNote: "Loads content from Facebook, which may set cookies.",
  facebookLink: "See all posts on Facebook",
  latestHeading: "Latest from the City",
  latestLink: "All city news",
} as const;

/** Copy for the status page and the StatusLine component. */
export const STATUS = {
  metaTitle: "Status — Better Mandaluyong",
  heading: "Status",
  intro: "Whether our automatic updates are working.",
  lines: { feed: "City news feed", archive: "Archiving" },
  states: {
    working: "Working",
    "not-working": "Not working",
    "not-checked": "Not checked recently",
  },
  lastSuccess: "Last successful:",
  never: "No successful run yet",
} as const;

/** Builds a `mailto:` href for an address. */
export function mailto(address: string): string {
  return `mailto:${address}`;
}
