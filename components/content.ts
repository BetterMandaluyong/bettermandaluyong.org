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
  { label: "Budget", href: "/budget" },
  { label: "Numbers", href: "/numbers" },
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
  /** Open volunteer tasks across BetterGov.ph projects, filtered by role. */
  volunteerUrl: "https://about.bettergov.ph/volunteer/",
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

/** A kind of help the volunteer band asks for. */
export type VolunteerRole = {
  /** Short role name, e.g. "Translators". */
  role: string;
  /** One line on what that help looks like. */
  description: string;
};

/**
 * The volunteer call to action shown above the footer on every page
 * (`VolunteerBand`). Signing up happens on BetterGov.ph's volunteer page and
 * Discord; we don't run a form of our own.
 */
export const VOLUNTEER = {
  eyebrow: "Volunteers welcome",
  heading: "Help Build a Better Mandaluyong",
  body: `${SITE.name} is community-run and part of the BetterGov.ph movement. There's room for every skill, and you don't need to have worked in government.`,
  primary: {
    label: "Volunteer with BetterGov.ph",
    href: BETTERGOV.volunteerUrl,
  },
  secondary: {
    label: "Join the BetterGov.ph Discord",
    href: BETTERGOV.discordUrl,
  },
  rolesLabel: "Ways to help",
  roles: [
    {
      role: "Writers and content creators",
      description: "Explain city news, budgets, and services in plain words.",
    },
    {
      role: "Marketing and outreach",
      description: "Help residents find the site and share what's on it.",
    },
    {
      role: "Translators",
      description: "Bring pages to readers in Filipino and other languages.",
    },
    {
      role: "Developers",
      description: "Build features and fix bugs in the open on GitHub.",
    },
    {
      role: "Designers",
      description: "Make pages clearer and easier to use on a phone.",
    },
    {
      role: "Researchers",
      description: "Check officials, contacts, and public records.",
    },
  ] satisfies VolunteerRole[],
} as const;

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
  /** The DILG check, around a link: "Checked against the <link> on <date>." */
  dilgBefore: "Checked against the",
  dilgLink: "DILG Barangay Officials Directory",
  dilgAfter: (date: string) => `on ${date}.`,
  dilgChanged: "Some names here come from it.",
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
  jumpLabel: "Groups on this page",
  count: (n: number) => (n === 1 ? "1 person" : `${n} people`),
  orgHeading: "How the Offices Fit Together",
  orgIntro:
    "Mandaluyong is one district in the House of Representatives. At City Hall, the mayor heads the City Government and the vice mayor presides over the city council, the Sangguniang Panlungsod. Each barangay has its own council and Sangguniang Kabataan. The chart shows where each office sits, not who reports to whom.",
  orgLabel: "Chart of Mandaluyong's elected offices",
  orgRoot: "Mandaluyong City",
  orgCongress: "Congress",
  orgHouse: "House of Representatives",
  orgHouseMeta: "One district: the whole city",
  orgCityHall: "City Hall",
  orgCouncil: "Sangguniang Panlungsod",
  orgCouncilMeta: "The city council. The vice mayor presides.",
  orgCouncilors: (n: number) => `District ${n} Councilors`,
  orgBarangays: "Barangays",
  orgBarangaysMeta: (count: number) =>
    `${count} barangays, each with its own council and SK`,
  orgDistrict: (n: number, count: number) =>
    `District ${n} · ${count} Barangays`,
  /** One card section per position category, in `POSITION_CATEGORIES` order. */
  categories: {
    house: {
      heading: "House of Representatives",
      intro:
        "Mandaluyong is a single congressional district, so one representative serves the whole city.",
    },
    executive: {
      heading: "City Executive",
      intro: "The mayor heads the City Government.",
    },
    council: {
      heading: "Sangguniang Panlungsod",
      intro:
        "The city council: the vice mayor, who presides, and the councilors elected from each district.",
    },
    captain: {
      heading: "Barangay Captains",
      intro: "The Punong Barangay of each barangay.",
    },
    kagawad: {
      heading: "Barangay Kagawads",
      intro: "Each barangay council has seven kagawads.",
    },
    "sk-chair": {
      heading: "SK Chairpersons",
      intro:
        "Each barangay's Sangguniang Kabataan, its youth council, is led by an SK chairperson.",
    },
    "sk-kagawad": {
      heading: "SK Kagawads",
      intro: "The city lists fewer SK kagawads where seats are vacant.",
    },
  },
  externalHeading: "Records Elsewhere",
  externalIntro: "Where this person appears in other public datasets.",
  externalLink: (name: string, source: string) => `${name} on ${source}`,
} as const;

/**
 * Copy for officials' pay, on the home page and each person's page. The
 * amounts come from `data/pay.yaml`: the national salary schedule, not the
 * city's payroll. Keep that in the wording, and keep the caveats with every
 * figure: no allowances or bonuses, and actual pay can be lower.
 */
export const PAY_COPY = {
  homeHeading: "What Officials Are Paid",
  homeMeta: (year: number) => `${year} salary schedule`,
  homeIntro:
    "The monthly basic pay the law sets for each elected office in Mandaluyong, from the national government's salary schedule. Barangay and SK officials receive an honorarium instead, and the law sets only the most they can get.",
  personHeading: "Pay",
  /** One label per office, as the home page lists them. */
  offices: {
    representative: "House representative",
    mayor: "Mayor",
    "vice-mayor": "Vice mayor",
    councilor: "City councilor",
    captain: "Barangay captain",
    kagawad: "Barangay kagawad",
    "sk-chair": "SK chairperson",
    "sk-kagawad": "SK kagawad",
  },
  /** The note under a figure on the home page. */
  homeNote: (grade: number, cap: boolean) =>
    cap
      ? `At most, a month (salary grade ${grade}, Step 1)`
      : `A month (salary grade ${grade}, Step 1)`,
  monthly: "Monthly basic pay",
  monthlyCap: "Most it can be, a month",
  monthlyNote: (year: number) => `From the ${year} salary schedule.`,
  yearly: "A year, before bonuses",
  yearlyNote: "Twelve months of basic pay.",
  grade: "Salary grade",
  gradeValue: (grade: number) => `SG ${grade}`,
  gradeNote: (cap: boolean) =>
    cap ? "Step 1. The honorarium can't go above it." : "Step 1.",
  setBy: "The salary grade is set by",
  caveat:
    "This is the rate the national salary schedule sets for the office, not the city's payroll, which isn't published. It leaves out allowances and bonuses. The city adopts each year's rates by ordinance, and the law delays raises for elected officials until the terms of those who approved them end, so actual pay can be lower.",
  capCaveat:
    "Barangay and SK officials receive an honorarium, not a salary. The barangay sets it, up to this amount, depending on its funds.",
  unconfirmedTag: "To be confirmed",
  unconfirmedTitle: "Which councilor grade applies",
  unconfirmed:
    "The national government's list of local positions gives city councilors two grades, 25 and 27, without saying which cities get which. We show grade 27, the one that matches the vice mayor's grade 28 in the city charter, until we can confirm it.",
  houseFrom: "The House representative's is from",
  checked: (date: string) => `Checked against the circulars on ${date}.`,
} as const;

/**
 * Copy for "Mandaluyong in Numbers" (`/numbers`) and the population band on
 * barangay pages. Figures live in `data/stats/`; each band credits its
 * source. Keep the caveats in the wording: the city's poverty estimates are
 * imprecise and PSA finds none of their changes significant, a census marked
 * `checked: false` awaits a check against PSA's file, and the money figures
 * are BLGF's preliminary ones.
 */
export const NUMBERS = {
  metaTitle: `Mandaluyong in Numbers — ${SITE.name}`,
  metaDescription:
    "How many people live in each of Mandaluyong's 27 barangays, how many live below the poverty line, and what the City Government took in and spent, from the PSA and the Bureau of Local Government Finance.",
  heading: "Mandaluyong in Numbers",
  intro:
    "Public figures about our city in one place: how many of us live in each barangay, how many live below the poverty line, and where the City Government's money comes from and goes. Every figure links to where it came from.",

  glanceHeading: "At a Glance",
  people: (year: number) => `People, ${year} census`,
  peopleNote: (change: string, year: number) => `${change} since ${year}.`,
  poverty: (year: number) => `Below the poverty line, ${year}`,
  povertyGlanceNote: "PSA's estimate. Use with caution.",
  income: (year: number) => `City income, ${year}`,
  incomeNote: "Operating income, before borrowing.",
  spending: (year: number) => `City spending, ${year}`,
  spendingNote: "Operating expenses.",

  populationHeading: "People in Each Barangay",
  populationMeta: (year: number) => `${year} census`,
  populationIntro:
    "How many people the Philippine Statistics Authority counted in each barangay, most people first, with the change since the census before.",
  columns: {
    barangay: "Barangay",
    district: "District",
    year: (year: number) => String(year),
    change: "Change",
    share: "Share of city",
  },
  districtRow: (n: number) => `District ${n}`,
  cityRow: "Whole city",
  populationCaption: (year: number) =>
    `People in each Mandaluyong barangay, ${year} census`,
  uncheckedTag: "Still checking",
  uncheckedTitle: (year: number) =>
    `The ${year} barangay counts are from a secondary source`,
  unchecked: (year: number) =>
    `PSA's website blocks automated downloads, so the ${year} counts come from City Population, a site that compiles PSA's census tables. Its earlier counts match PSA's for every barangay, and its city total matches the official one. We'll compare each barangay with PSA's own file.`,
  madeOfficial: "Made official by",

  povertyHeading: "Poverty",
  povertyMeta: (year: number) => `${year} estimates`,
  povertyIntro: (threshold: string, year: number) =>
    `The share of people whose family income was below the poverty line: ${threshold} a person for the whole of ${year} in Metro Manila, enough for basic food and other needs.`,
  areas: {
    city: "Mandaluyong",
    ncr: "Metro Manila",
    philippines: "Philippines",
  },
  povertyNote: (low: string, high: string, confidence: number, poor: string) =>
    `Between ${low} and ${high}, at ${confidence}% confidence. About ${poor} people.`,
  povertyCaution:
    "PSA marks each of Mandaluyong's estimates \"use with caution\": its survey reaches few households here, so the true share could be anywhere in the range shown. PSA also doesn't count any of the city's changes from one estimate to the next as significant.",
  povertyTrendHeading: "Since 2018",
  povertyTrendCaption: "Share of people below the poverty line, by year",
  areaColumn: "Area",
  significantNote:
    "* PSA counts the change from the year before as significant (at 5%).",
  povertyTables: "Tables 2a and 6a.",

  moneyHeading: "The City's Money",
  moneyMeta: (year: number, preliminary: boolean) =>
    preliminary ? `${year}, preliminary` : String(year),
  moneyIntro: (year: number) =>
    `What the City Government took in and spent in ${year}, as the city's treasurer reported it to the Bureau of Local Government Finance. This is the city's own budget, not the national budget.`,
  capital: "Capital outlay",
  capitalNote: "Buildings, roads, and equipment.",
  cash: "Cash at year end",
  cashNote: "Funds and cash left over.",
  incomeHeading: "Where It Came From",
  spendingHeading: "Where It Went",
  incomeCaption: (year: number) =>
    `Where the City Government's ${year} operating income came from`,
  spendingCaption: (year: number) =>
    `Where the City Government's ${year} operating spending went`,
  sourceColumn: "Source",
  sectorColumn: "Sector",
  amountColumn: "Amount",
  shareColumn: "Share",
  totalRow: "Total",
  incomeLines: {
    "real-property-tax": "Real property tax",
    "business-tax": "Business tax",
    "other-taxes": "Other local taxes",
    "fees-and-charges": "Fees, charges, and city enterprises",
    "national-tax-allotment": "National tax allotment",
    "other-national": "Other national shares and grants",
  },
  spendingLines: {
    "general-public-services": "General public services",
    health: "Health, nutrition, and population",
    education: "Education, culture, and sports",
    "social-welfare": "Social welfare",
    housing: "Housing and community development",
    labor: "Labor and employment",
    "economic-services": "Economic services",
    interest: "Interest on loans",
  },
  preliminary: (date: string) =>
    `Preliminary figures, extracted by BLGF on ${date}.`,

  barangayHeading: "People",
  barangayCount: (year: number) => `People, ${year} census`,
  barangayChange: (year: number) => `Change since ${year}`,
  barangayRank: "Rank in the city",
  rankValue: (rank: number, of: number) => `${rank} of ${of}`,
  rankNote: "By number of people.",
  previousCount: (count: string, year: number) => `${count} in ${year}.`,
  seeAll: "See every barangay's population",
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

/** Where the budget snapshot's change history lives: every refresh is a commit to `data/budget`. */
export const BUDGET_HISTORY_URL = `${SITE.repoUrl}/commits/main/data/budget`;

/**
 * Copy for the national budget page. The figures come from the BetterGov.ph
 * Budget API (snapshot in `data/budget/`). Keep its rules in the wording:
 * amounts are as published, not spending; the NEP and the House bill are
 * compared, never added; a line in one version only is a lead, not a finding.
 */
export const BUDGET = {
  metaTitle: `National Budget — ${SITE.name}`,
  metaDescription:
    "The national budget money that names Mandaluyong: every 2027 project in the President's proposal and the House bill, and the enacted budgets of 2020 to 2026.",
  heading: "The National Budget in Mandaluyong",
  intro:
    "What the national budget sets aside for projects in Mandaluyong: the 2027 projects in the President's proposal and in the House's version, and what was enacted from 2020 to 2026. This is national money, not the City Government's own budget.",
  notSpending:
    "Amounts are what the budget documents say, not money spent. A dash means a document has no such line.",
  asOf: (date: string) => `Figures as of ${date}.`,
  historyLink: "See every change on GitHub",

  figuresHeading: "At a Glance",
  figures: {
    lines: "Project lines for 2027",
    linesNote: (programs: number) =>
      `In ${programs} national programs that list projects one by one.`,
    nep: "2027 proposal (NEP)",
    house: "2027 House bill",
    versionNote: (lines: number) => `Over the ${lines} lines it has.`,
    gaa: (year: number) => `Enacted for ${year}`,
    gaaNote: (programs: number) =>
      `${programs} programs and projects that name the city.`,
  },
  versionsNote:
    "The NEP is the budget the President proposes; the House bill is the House of Representatives' version. They are two versions of the same budget: compare them, don't add them.",

  projectsHeading: "Projects for 2027",
  projectsIntro:
    "Every 2027 line whose title names Mandaluyong, in the four national programs that list projects one by one: public works, farm-to-market roads, health facilities, and irrigation. A line found in only one version is a lead to check, not a finding.",
  projectsMeta: (n: number) => `${n} lines`,
  statusesLabel: "Lines by status",
  nep: "NEP",
  house: "House bill",
  noLine: "no such line",
  unconfirmed: "Unconfirmed match",
  detailsLink: "See this line on budget.bettergov.ph",
  nepPage: "NEP page",
  housePage: "House bill page",
  projectsEmpty: "No 2027 lines name Mandaluyong yet.",

  officeHeading: "Who Builds Here",
  officeIntro:
    "Public works money is published by DPWH office, not by city. The office that serves Mandaluyong also serves other districts, so its figures are the whole office's: shared, never split.",
  alsoServes: "Also serves",
  office: {
    gaa2026: "Enacted for 2026, whole office",
    nep2027: "2027 NEP, whole office",
    house2027: "2027 House bill, named projects",
    change: "2027 change on the same named projects",
  },
  districtLink: "See the district on budget.bettergov.ph",
  representative: "Represented in Congress by",

  gaaHeading: "Enacted Budgets, 2020–2026",
  gaaIntro:
    "Programs and projects in the General Appropriations Act, in any department, whose name names Mandaluyong. These are appropriations, the authority to spend, not spending. A program counts in a year only if it has money that year.",
  gaaYear: (programs: number) =>
    programs === 1 ? "1 program" : `${programs} programs`,
  gaaNone: "No programs name Mandaluyong this year.",

  aboutHeading: "About These Figures",
  about:
    "We copy these figures from the BetterGov.ph Budget API and keep every change in public history. We search for lines that name Mandaluyong as a whole word; a line that doesn't spell out the city won't appear here, and the API doesn't yet place every project by city.",
  excludedHeading: "Lines Left Out by Hand",
  excludedNone: "No lines have been left out by hand.",
  disclaimersTag: "From the data source",
  credit:
    "Data: BetterGov.ph Budget API, by People's Budget Coalition × BetterGov.PH, licensed",
  licenseLink: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes:
    "We kept only the lines that name Mandaluyong, dropped the map coordinates from project titles, and grouped the 2020–2026 programs by year. Figures, labels, and dates are unchanged.",
  sourceLink: "budget.bettergov.ph",
  sourceUrl: "https://budget.bettergov.ph/",
  docsLink: "API documentation",
  docsUrl: "https://budget.bettergov.ph/docs",
} as const;

/**
 * Link previews (Open Graph and X/Twitter cards). The image is the square
 * logo seal, so cards use the "summary" layout.
 */
export const SHARE = {
  image: {
    url: "/png/logo-seal-1024.png",
    width: 1024,
    height: 1024,
    alt: "The Better Mandaluyong logo, a blue and gold seal",
  },
  locale: "en_PH",
  twitterCard: "summary",
} as const;

/** The RSS feed of city news links, served at `path`. */
export const FEED = {
  path: "/news/feed.xml",
  title: NEWS.metaTitle,
  description: NEWS.metaDescription,
  language: "en-ph",
  /** How many of the newest posts the feed lists. */
  size: 50,
} as const;

/** Copy for `/llms.txt`, a plain-text guide to the site for AI tools (llmstxt.org). */
export const LLMS = {
  details: [
    `${UNOFFICIAL.text} ${SITE.officialSiteUrl}`,
    "Officials' names and contacts come from the City Government's public pages, checked against the DILG Barangay Officials Directory. Each page links to its source and says when it was last updated. City news items link to the city's own posts; we don't copy them.",
    "Code is MIT-licensed. Content is CC BY-NC-ND 4.0. Work reused from other projects keeps its own license: see NOTICE.md in the repository.",
  ],
  pagesHeading: "Pages",
  homeLabel: "Home",
  barangaysHeading: "Barangays",
  barangayLabel: (name: string) => `Barangay ${name}`,
  barangayNote: (district: number) => districtName(district),
  dataHeading: "Data",
  data: [
    {
      label: "City news feed (RSS)",
      path: FEED.path,
      note: `The ${FEED.size} newest city news links`,
    },
    {
      label: "Sitemap",
      path: "/sitemap.xml",
      note: "Every page on the site",
    },
    {
      label: "Barangay boundaries (GeoJSON)",
      path: "/data/mandaluyong-barangays.geojson",
      note: "© OpenStreetMap contributors, ODbL 1.0",
    },
  ],
  optionalHeading: "Optional",
  optional: [
    {
      label: "Site data (YAML)",
      url: `${SITE.repoUrl}/tree/main/data`,
      note: "Barangays, officials, map places, and city news links",
    },
    { label: "Source code", url: SITE.repoUrl },
    {
      label: "Credits and licenses",
      url: `${SITE.repoUrl}/blob/main/NOTICE.md`,
    },
    { label: "BetterGov.ph design system", url: BETTERGOV.designUrl },
  ],
} as const;

/** Copy for `/humans.txt` (humanstxt.org): who builds the site, and thanks. */
export const HUMANS = {
  team: {
    heading: "Team",
    lines: [
      { value: `${SITE.groupName} contributors` },
      { label: "Contributors", value: `${SITE.repoUrl}/graphs/contributors` },
      { label: "Contact", value: SITE.contactEmail },
      { label: "Facebook", value: SITE.followUrl },
      { label: "From", value: `${SITE.location}, Philippines` },
    ],
  },
  thanks: {
    heading: "Thanks",
    lines: [
      { label: "BetterGov.ph", value: BETTERGOV.url },
      { label: "The BetterLGU sites", value: BETTERGOV.lguUrl },
      {
        label: "OpenStreetMap contributors",
        value: "https://www.openstreetmap.org/copyright",
      },
      {
        label: "Everyone else we credit",
        value: `${SITE.repoUrl}/blob/main/NOTICE.md`,
      },
    ],
  },
  site: {
    heading: "Site",
    lines: [
      { label: "Language", value: "English" },
      { label: "Standards", value: "HTML, CSS, RSS 2.0, Open Graph" },
      { label: "Components", value: "vinext, React, Tailwind CSS, Leaflet" },
      { label: "Software", value: "Cloudflare Workers, GitHub" },
      { label: "Design", value: BETTERGOV.designUrl },
      { label: "Source", value: SITE.repoUrl },
    ],
  },
  /** Label for the build's commit link, added when the commit is known. */
  buildLabel: "Build",
} as const;

/** Builds a `mailto:` href for an address. */
export function mailto(address: string): string {
  return `mailto:${address}`;
}
