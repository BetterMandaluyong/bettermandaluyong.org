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
  { label: "Districts", href: "/districts" },
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
  /** Community links, as listed on about.bettergov.ph. */
  discordUrl: "https://discord.gg/bettergovph",
  facebookUrl: "https://www.facebook.com/bettergovph",
  /**
   * White horizontal logo for navy backgrounds (4:1). WebP, as the guide asks;
   * the SVG sets its wordmark as live text, which an <img> can't render.
   */
  logoWhiteSrc: "https://assets.bettergov.ph/logos/webp/horizontal-white.webp",
} as const;

/** A license the site is published under, as named in the footer. */
export type License = {
  /** Link text shown in the footer, e.g. "MIT License". */
  label: string;
  href: string;
};

/** Footer copy, links, and licenses. */
export const FOOTER = {
  description: "A community effort for a more livable Mandaluyong.",
  /** Footer version of the unofficial-site notice; ends with a link. */
  unofficial: {
    text: "This is an unofficial site, not run by the City Government. For official services, visit",
    linkLabel: "mandaluyong.gov.ph",
  },
  partOf: "Part of the BetterGov.ph initiative",
  /** Shown after "© <year>" in the bottom row. */
  copyright: "Better Mandaluyong City, Metro Manila, Philippines",
  columns: [
    {
      heading: "Get involved",
      links: [
        { label: "Email us", href: mailto(SITE.contactEmail) },
        { label: "Follow us on Facebook", href: SITE.followUrl },
        { label: "Join the BetterGov.ph Discord", href: BETTERGOV.discordUrl },
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
        {
          label: "Follow BetterGov.ph on Facebook",
          href: BETTERGOV.facebookUrl,
        },
        { label: "Design system", href: BETTERGOV.designUrl },
        { label: "Other BetterLGU sites", href: BETTERGOV.lguUrl },
      ],
    },
  ] satisfies FooterColumn[],
  licenses: [
    {
      label: "Content CC BY-NC-ND 4.0",
      href: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    },
    {
      label: "MIT License",
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
  lede: "Find your barangay, see who represents you, and learn how to reach them. We're adding more tools for Mandaluyong residents over time.",
  primaryCta: "Get in touch",
  secondaryCta: "Follow updates",
} as const;

function districtName(n: number): string {
  return `District ${n}`;
}

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
  homeLink: "All barangays and officials",
  exploreHeading: "Explore Mandaluyong",
  exploreIntro:
    "Tap a barangay on the map, or search by barangay, ZIP code, or the name of an official.",
  searchLabel: "Search barangays, ZIP codes, or officials",
  searchPlaceholder: "Try “Hulo”, “1552”, or a name",
  results: (shown: number, total: number) =>
    shown === total
      ? `${total} barangays`
      : `${shown} of ${total} barangays match`,
  noResults: "No barangay matches. Try fewer words or a different spelling.",
  matched: (role: string, name: string) => `${role}: ${name}`,
  backToList: "All barangays",
  openPage: "Open barangay page",
  districtLink: (n: number) => `About ${districtName(n)}`,
  captainsHeading: "Barangay captains",
  captainsIntro:
    "The Punong Barangay of each of the 27 barangays. Open a barangay to see its whole council.",
  skChairsHeading: "SK chairpersons",
  skChairsIntro:
    "The Sangguniang Kabataan chairperson of each barangay. Open a barangay to see its whole SK council.",
  cityHeading: "City officials",
  cityMeta: "Representative, mayor, vice mayor, and councilors",
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
    "Barangay boundaries and map data: © OpenStreetMap contributors (ODbL). Map tiles: © CARTO. Barangay codes: PSA.",
} as const;

/** Copy for the people pages (`/people` and `/people/<name>`). */
export const PEOPLE_COPY = {
  metaTitle: "People — Better Mandaluyong",
  metaDescription:
    "Mandaluyong's elected officials: the House representative, mayor, vice mayor, city councilors, and every barangay's officials, with contact details where the city publishes them.",
  heading: "People",
  intro:
    "The elected officials of Mandaluyong, from the House representative to each barangay's Sangguniang Kabataan. Contact details are the ones the City Government publishes.",
  cityHeading: "City officials",
  barangayHeading: (name: string) => `Barangay ${name}`,
  notFoundTitle: "Person not found — Better Mandaluyong",
  metaFor: (name: string, role: string) =>
    `${name}, ${role} in Mandaluyong: position, barangay or district, and how to reach them.`,
  contactHeading: "How to reach them",
  position: "Position",
  barangay: "Barangay",
  district: "Council district",
  wholeCity: "Serves the whole city",
  hallNote:
    "These are the barangay hall's contacts. The City Government doesn't publish personal contacts for barangay officials.",
  hallHeading: "Barangay hall",
  seeBarangay: (name: string) => `See all of Barangay ${name}`,
  allPeople: "All people",
} as const;

/** Copy for the districts page. */
export const DISTRICTS_COPY = {
  metaTitle: "Districts — Better Mandaluyong",
  metaDescription:
    "Mandaluyong's two council districts: which barangays are in each, and the city councilors who represent them. The whole city is one congressional district.",
  heading: "Districts",
  intro:
    "Mandaluyong has two council districts. Each elects city councilors to the Sangguniang Panlungsod. For Congress the whole city is a single district, so one representative serves everyone.",
  houseHeading: "One congressional district",
  barangays: (n: number, count: number) =>
    `${districtName(n)} · ${count} barangays`,
  mapLabel: (n: number) => `${districtName(n)} on the map`,
} as const;

/** Where the news record's change history lives: every bot commit to `data/news` is one run. */
export const NEWS_HISTORY_URL = `${SITE.repoUrl}/commits/main/data/news`;

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
  historyNote:
    "We check the city's site every few hours. Every change we record, including posts the city later takes down, is kept in public history.",
  historyLink: "See the history on GitHub",
  empty: "No news has been recorded yet.",
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

/** Builds a `mailto:` href for an address. */
export function mailto(address: string): string {
  return `mailto:${address}`;
}
