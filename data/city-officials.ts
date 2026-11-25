import type { District } from "./barangays.ts";

/** A city-level elected official and how the city publishes their contacts. */
export type CityOfficial = {
  name: string;
  /** "Congresswoman", "Mayor", "Vice Mayor", or "Councilor". */
  role: string;
  /** Council district for councilors; the congresswoman covers the whole city. */
  district?: District;
  office: string;
  /** Phone text as published; split with `parsePhones`. */
  phones: string[];
  emails: string[];
  /** Their page on mandaluyong.gov.ph. */
  sourceUrl: string;
};

/**
 * The city's directory page was last edited on this date (YYYY-MM-DD). Phones
 * and emails below come from each official's own page on mandaluyong.gov.ph,
 * checked against that directory. 2025–2028 term.
 */
export const CITY_OFFICIALS_AS_OF = "2026-03-12";

const COMPLEX = "City Government Complex, Maysilo Circle, Plainview";
const TEAM = "https://mandaluyong.gov.ph/team/";

/**
 * Mandaluyong is a lone congressional district, so one House representative
 * serves every barangay. The first phone is the city's district office; the
 * last is the House of Representatives' listing (via BetterGov's directory).
 */
export const REPRESENTATIVE: CityOfficial = {
  name: "Alexandria “Queenie” Pahati-Gonzales",
  role: "Congresswoman",
  office: `G/F Kaban ng Hiyas, ${COMPLEX}`,
  phones: [
    "(02) 8532-5001 local 758 to 787 and 790 to 795",
    "8534-9907",
    "8952-4056 local 7720 (House of Representatives)",
  ],
  emails: ["congressman@mandaluyong.gov.ph"],
  sourceUrl: `${TEAM}alexandria-queenie-pahati-gonzales/`,
};

/** The city mayor. */
export const MAYOR: CityOfficial = {
  name: "Carmelita “Menchie” Aguilar Abalos",
  role: "Mayor",
  office: `4/F Executive Building, ${COMPLEX}`,
  phones: [
    "(02) 8532-5001 local 752 to 756",
    "8532-4492",
    "8531-0194",
    "8532-2224",
    "8532-2332",
  ],
  emails: [
    "mayor@mandaluyong.gov.ph",
    "citymayor@mandaluyong.gov.ph",
    "mayorsoffice@mandaluyong.gov.ph",
    "menchieabalos702@gmail.com",
  ],
  sourceUrl: `${TEAM}carmelita-menchie-aguilar-abalos-2/`,
};

/** The city vice mayor, who presides over the Sangguniang Panlungsod. */
export const VICE_MAYOR: CityOfficial = {
  name: "Antonio “Anthony” delos Santos Suva, Jr.",
  role: "Vice Mayor",
  office: `4/F BOC Building, ${COMPLEX}`,
  phones: ["(02) 8532-1411", "(02) 8532-5001 local 618", "8534-1299 local 864"],
  emails: ["anthonysuva@gmail.com", "vicemayor.suva@mandaluyong.gov.ph"],
  sourceUrl: `${TEAM}antonio-delos-santos-suva-jr-2/`,
};

/** The 12 city councilors: six per council district. */
export const COUNCILORS: CityOfficial[] = [
  {
    name: "Charisse Marie Abalos-Vargas",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["8534-8927", "8533-4304", "8532-5001 to 28 local 577/578"],
    emails: ["councilor.charisse@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}charisse-marie-abalos-vargas/`,
  },
  {
    name: "Anjelo Elton P. Yap",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["8532-4438", "8532-5001 to 28 local 625"],
    emails: ["councilor.eltonyap@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}anjelo-elton-p-yap/`,
  },
  {
    name: "Danny L. de Guzman",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["8534-0044", "8532-5001 to 28 local 628"],
    emails: ["councilor.deguzman@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}danny-de-guzman/`,
  },
  {
    name: "Carissa Mariz S. Manalo",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["(02) 8641-1834", "(02) 8532-5000 local 843"],
    emails: ["teammarizmanalo@gmail.com"],
    sourceUrl: `${TEAM}carissa-mariz-manalo/`,
  },
  {
    name: "Grace Marie V. Antonio",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["(02) 8997-3612", "(02) 8532-5001 to 28 local 847"],
    emails: [
      "grasyaparasamasa2025@gmail.com",
      "councilor.antonio@mandaluyong.gov.ph",
    ],
    sourceUrl: `${TEAM}grace-marie-a-antonio-2/`,
  },
  {
    name: "Estanislao “Junis” V. Alim III",
    role: "Councilor",
    district: 1,
    office: COMPLEX,
    phones: ["8534-0983"],
    emails: [
      "councilor.junisalim@mandaluyong.gov.ph",
      "councilor.junisalim@yahoo.com",
    ],
    sourceUrl: `${TEAM}estanislao-junis-villaraza-alim-iii/`,
  },
  {
    name: "Benjamin “Benjie” A. Abalos III",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["8533-3126", "8532-5001 to 28 local 622"],
    emails: ["councilor.benjieabalos@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}benjamin-benjie-abalos-iii/`,
  },
  {
    name: "Alexander “Alex” C. Sta. Maria",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["(02) 8532-4362", "(02) 8532-5001 local 623"],
    emails: [
      "docalexsm@yahoo.com.ph",
      "councilor.sta.maria@mandaluyong.gov.ph",
    ],
    sourceUrl: `${TEAM}alexander-sta-maria/`,
  },
  {
    name: "Reginald S. Antiojo",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["(02) 8532-5001 local 858", "(02) 8533-3126", "09360297115"],
    emails: ["councilor.antiojo@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}reginald-antiojo/`,
  },
  {
    name: "Leslie F. Cruz",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["(02) 8534-0982", "(02) 8532-5001 local 626"],
    emails: ["cruz.leslief@gmail.com"],
    sourceUrl: `${TEAM}leslie-cruz/`,
  },
  {
    name: "Fernando “Dong” S. Ocampo",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["(02) 8532-5001 local 849"],
    emails: ["councilor.dongocampo@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}michael-ocampo/`,
  },
  {
    name: "Michael Eric “Botong” G. Cuejilo",
    role: "Councilor",
    district: 2,
    office: COMPLEX,
    phones: ["0916-652-0210", "8535-3603 local 631"],
    emails: ["councilor.cuejilo@mandaluyong.gov.ph"],
    sourceUrl: `${TEAM}michael-eric-botong-gonzales-cuejilo/`,
  },
];

/** The councilors who represent one council district. */
export function councilorsFor(district: District): CityOfficial[] {
  return COUNCILORS.filter((c) => c.district === district);
}
