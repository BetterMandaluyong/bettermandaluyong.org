/**
 * Canonical site copy and links. Pages read from here instead of hardcoding
 * strings, so a wording change is a one-line edit. Follow BRAND.md when
 * changing any of it, and never invent facts, people, or numbers.
 */

/** Organization-wide facts used in metadata, header, and footer. */
export const SITE = {
  /**
   * The site's name: header and footer wordmark, page titles, link previews.
   * Written as the domain, as BetterGov.ph does.
   */
  name: "BetterMandaluyong.org",
  /** The community group behind it (and its Facebook page), used in sentences. */
  groupName: "Better Mandaluyong",
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

/**
 * The notice that this is not the city government's site, shown in the top
 * bar and the footer. The text ends with the link, then a period.
 */
export const UNOFFICIAL = {
  text: "This is an unofficial site, not run by the City Government. For official services, visit",
  linkLabel: "mandaluyong.gov.ph",
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
  description:
    "A community-run portal for Mandaluyong: barangays, officials, and city news in one place.",
  /** The unofficial-site notice, worded the same as the top bar. */
  unofficial: UNOFFICIAL,
  partOf: "Part of the BetterGov.ph initiative",
  /** Shown after "© <year>" in the bottom row. */
  copyright: `${SITE.name} · ${SITE.location}, Philippines`,
  columns: [
    {
      heading: "Get in Touch",
      links: [
        { label: "Email us", href: mailto(SITE.contactEmail) },
        { label: "Follow us on Facebook", href: SITE.followUrl },
        { label: "Contribute on GitHub", href: SITE.repoUrl },
        { label: "Report a problem", href: `${SITE.repoUrl}/issues` },
        { label: "View credits", href: `${SITE.repoUrl}/blob/main/NOTICE.md` },
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
        { label: "Join the BetterGov.ph Discord", href: BETTERGOV.discordUrl },
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

/** Home page copy. */
export const HOME = {
  metaTitle: SITE.name,
  metaDescription:
    "A community-run portal for Mandaluyong, by Better Mandaluyong. Find your barangay, see who represents you, and learn how to reach them.",
  /** Open Graph description, for link previews. */
  shareDescription:
    "A community-run portal for Mandaluyong: barangays, officials, and city news in one place.",
  headline: "The community-run portal for Mandaluyong.",
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
  metaTitle: `Barangays — ${SITE.name}`,
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
  captainsHeading: "Barangay Captains",
  captainsIntro:
    "The barangay captain of each of the 27 barangays. Open a barangay to see its whole council.",
  skChairsHeading: "SK Chairpersons",
  skChairsIntro:
    "The Sangguniang Kabataan chairperson of each barangay. Open a barangay to see its whole SK council.",
  cityHeading: "City Officials",
  cityMeta: "Representative, mayor, vice mayor, and councilors",
  mapLabel:
    "Map of Mandaluyong's barangays. The list of barangays has the same information.",
  mapLoading: "Loading the map…",
  mapError:
    "The map couldn't load. The list of barangays has the same information.",
  mapLegend: "Council district",
  mapPopupLink: "View barangay page",
  /** The map's place filters: one checkbox per kind, with a count. */
  placesLegend: "Show on map",
  placeKinds: {
    "barangay-hall": "Barangay halls",
    city: "City offices",
    national: "National government offices",
    police: "Police stations",
    fire: "Fire stations",
    rail: "MRT and LRT stations",
  },
  /** One place's kind, in its popup. */
  placeKind: {
    "barangay-hall": "Barangay hall",
    city: "City government office",
    national: "National government office",
    police: "Police station",
    fire: "Fire station",
    rail: "Train station",
  },
  /** The letter on each kind's map marker, so color isn't the only cue. */
  placeLetter: {
    "barangay-hall": "B",
    city: "C",
    national: "N",
    police: "P",
    fire: "F",
    rail: "T",
  },
  placeCount: (label: string, n: number) => `${label} (${n})`,
  hallName: (barangay: string) => `${barangay} Barangay Hall`,
  placeOsmLink: "View on OpenStreetMap",
  placeGoogleLink: "View on Google Maps",
  /** Shown in a hall's popup when its location came from Google Maps. */
  placeFromGoogle: "Location: Google Maps",
  listHeading: "All Barangays",
  district: (n: number) => `District ${n}`,
  zip: (zip: string) => `ZIP ${zip}`,
  zipNote:
    "ZIP codes are approximate. The post office assigns them to delivery areas, not barangays.",
  zipLookup: "Look up a ZIP code at PHLPost",
  districtNote:
    "Mandaluyong has two council districts. The whole city is one congressional district, so every barangay has the same House representative.",
  repsHeading: "Who Represents You",
  repsHouseHeading: "House Representative",
  repsCityHeading: "Mayor and Vice Mayor",
  councilorsHeading: (n: number) => `District ${n} Councilors`,
  hallHeading: "Barangay Hall",
  hallAddress: "Address",
  councilHeading: "Barangay Council",
  skHeading: "Sangguniang Kabataan",
  captain: "Barangay Captain",
  kagawad: "Barangay Kagawad",
  skChair: "SK Chairperson",
  skKagawad: "SK Kagawad",
  office: "Office",
  phone: "Phone",
  email: "Email",
  repsFor: (district: number) =>
    `Your district councilors are in District ${district}.`,
  backToAll: "All barangays",
  notFoundTitle: `Barangay not found — ${SITE.name}`,
  source: "Source:",
  sourceLink: "City Government of Mandaluyong",
  lastUpdated: (date: string) => `Last updated by the city on ${date}.`,
  mapCredit:
    "Barangay boundaries, the city outline, and government places: © OpenStreetMap contributors (ODbL), except three barangay hall locations from Google Maps. Map tiles: © CARTO. Barangay codes: PSA.",
} as const;

/** Copy for the people pages (`/people` and `/people/<name>`). */
export const PEOPLE_COPY = {
  metaTitle: `People — ${SITE.name}`,
  metaDescription:
    "Mandaluyong's elected officials: the House representative, mayor, vice mayor, city councilors, and every barangay's officials, with contact details where the city publishes them.",
  heading: "People",
  intro:
    "The elected officials of Mandaluyong, from the House representative to each barangay's Sangguniang Kabataan. Contact details are the ones the City Government publishes.",
  cityHeading: "City Officials",
  barangayHeading: (name: string) => `Barangay ${name}`,
  notFoundTitle: `Person not found — ${SITE.name}`,
  metaFor: (name: string, role: string) =>
    `${name}, ${role} in Mandaluyong: position, barangay or district, and how to reach them.`,
  contactHeading: "How to Reach Them",
  position: "Position",
  barangay: "Barangay",
  district: "Council district",
  wholeCity: "Serves the whole city",
  hallNote:
    "These are the barangay hall's contacts. The City Government doesn't publish personal contacts for barangay officials.",
  hallHeading: "Barangay Hall",
  seeBarangay: (name: string) => `See all of Barangay ${name}`,
  allPeople: "All people",
} as const;

/** Copy for the districts page. */
export const DISTRICTS_COPY = {
  metaTitle: `Districts — ${SITE.name}`,
  metaDescription:
    "Mandaluyong's two council districts: which barangays are in each, and the city councilors who represent them. The whole city is one congressional district.",
  heading: "Districts",
  intro:
    "Mandaluyong has two council districts. Each elects city councilors to the Sangguniang Panlungsod. For Congress the whole city is a single district, so one representative serves everyone.",
  houseHeading: "One Congressional District",
  barangays: (n: number, count: number) =>
    `${districtName(n)} · ${count} Barangays`,
  mapLabel: (n: number) => `${districtName(n)} on the map`,
} as const;

/** Where the news record's change history lives: every bot commit to `data/news` is one run. */
export const NEWS_HISTORY_URL = `${SITE.repoUrl}/commits/main/data/news`;

/** Copy for the city news page, the news list, and the Facebook island. */
export const NEWS = {
  metaTitle: `City News — ${SITE.name}`,
  metaDescription:
    "Official announcements from the City Government of Mandaluyong, linked from an unofficial community site.",
  heading: "City News",
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
  latestHeading: "News from the City Hall",
  latestLink: "All city news",
} as const;

/** Builds a `mailto:` href for an address. */
export function mailto(address: string): string {
  return `mailto:${address}`;
}
