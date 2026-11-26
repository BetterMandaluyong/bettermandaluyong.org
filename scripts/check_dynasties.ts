// Cross-checks our city officials against BetterGov's dynasties API.
//
//   node scripts/check_dynasties.ts
//
// Fetches Mandaluyong's 2025 election winners from
// https://dynasties.bettergov.ph/api/v1 (election results from Open Halalan,
// ODbL 1.0; BetterGov's derived data CC0 1.0) and reports any official in
// data/city-officials.yaml who doesn't match a winner by surname and
// position, and any winner we don't list. It copies and writes nothing; see
// NOTICE.md ("Studied, not copied"). Run by hand: it needs the network, so
// it isn't part of `pnpm test`.

import { readCityOfficials } from "../utils/people/files.ts";

const city = readCityOfficials();
const CITY_OFFICIALS = [
  city.representative,
  city.mayor,
  city.viceMayor,
  ...city.councilors,
];

const API = "https://dynasties.bettergov.ph/api/v1";
const QUERY = "year=2025&province=ncr-second-district&town=mandaluyong";

type Contest = { id: string; position: string };
type Candidate = { display_name: string; won: number };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return ((await res.json()) as { data: T }).data;
}

/** The words of a name, accents and punctuation folded away, suffixes dropped. */
function words(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter((w) => w && !["JR", "SR", "II", "III", "IV"].includes(w));
}

/** True when the dataset's surname (its last word) is a word of our name. */
function sameSurname(ours: string, theirs: string): boolean {
  const last = words(theirs).at(-1);
  return last !== undefined && words(ours).includes(last);
}

const POSITION: Record<string, string> = {
  "MEMBER, HOUSE OF REPRESENTATIVES": "Congresswoman",
  MAYOR: "Mayor",
  "VICE MAYOR": "Vice Mayor",
  COUNCILOR: "Councilor",
};

const { contests } = await get<{ contests: Contest[] }>(`/contests?${QUERY}`);
const winners: { name: string; role: string }[] = [];
for (const c of contests) {
  const role = POSITION[c.position];
  if (!role) continue;
  const detail = await get<{ candidates: Candidate[] }>(`/contests/${c.id}`);
  for (const cand of detail.candidates) {
    if (cand.won === 1) winners.push({ name: cand.display_name, role });
  }
}

let problems = 0;
for (const o of CITY_OFFICIALS) {
  const found = winners.some(
    (w) => w.role === o.role && sameSurname(o.name, w.name),
  );
  if (!found) {
    problems++;
    console.log(`not a 2025 winner in the dataset: ${o.role} ${o.name}`);
  }
}
const extra = winners.filter(
  (w) =>
    !CITY_OFFICIALS.some(
      (o) => o.role === w.role && sameSurname(o.name, w.name),
    ),
);
console.log(
  `\n${winners.length} winners in the dataset, ${CITY_OFFICIALS.length} officials in our data.`,
);
if (extra.length) {
  console.log(
    `In the dataset but not in ours (the city's directory lists 6 councilors per district; the dataset has 8 seats each):`,
  );
  for (const w of extra) console.log(` - ${w.role} ${w.name}`);
}
process.exitCode = problems ? 1 : 0;
