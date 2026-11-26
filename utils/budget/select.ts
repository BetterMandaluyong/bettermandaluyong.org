// Turns raw Budget API rows into the snapshot's shape, keeping only lines that
// name the place as a whole word. Pure: the refresh script and tests use it.
import type {
  BudgetDistrict,
  BudgetGaaProgram,
  BudgetProgram,
  BudgetProject,
} from "../../data/schema.ts";
import type { ApiDistrict, ApiGaaProgram, ApiProjectRow } from "./api.ts";

const fold = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * True when every word of `place` appears in `text` as a whole word: no letter
 * or digit right before or after it. Case and accents don't count. The API's
 * own search matches inside words, so this is what keeps "Taytay" from
 * bringing in "Taytayan".
 */
export function namesPlace(place: string, text: string): boolean {
  const hay = fold(text);
  return fold(place)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) =>
      new RegExp(
        `(?<![\\p{L}\\p{N}])${escape(word)}(?![\\p{L}\\p{N}])`,
        "u",
      ).test(hay),
    );
}

/** The exclusion id of a 2027 line: `<program>:<api id>`. */
export const projectKey = (row: Pick<ApiProjectRow, "dataset" | "id">) =>
  `${row.dataset}:${row.id}`;

/** One API row in the snapshot's shape. The House PDF is the third reading where there is one. */
export function toProject(row: ApiProjectRow): BudgetProject {
  return {
    key: projectKey(row),
    program: row.dataset as BudgetProgram,
    title: row.title,
    line: row.program ?? null,
    office: row.office ?? null,
    status: row.status_label,
    group: row.bridge_group,
    held: row.held === true,
    nep: row.nep_php,
    house: row.house_php,
    delta: row.delta_php,
    url: row.url,
    nepPdf: row.pdf_url?.nep ?? null,
    housePdf: row.pdf_url?.hgab3 ?? row.pdf_url?.hgab2 ?? null,
    lat: row.lat ?? null,
    lon: row.lon ?? null,
  };
}

/** What the 2027 filter kept, and how many rows each rule dropped. */
export type Pick2027 = {
  kept: BudgetProject[];
  /** Rows where the place was only inside a longer word. */
  insideWords: number;
  /** Rows in another region (rows with no region are kept). */
  otherRegion: number;
  /** Exclusion ids that matched a row. */
  excluded: string[];
};

/**
 * Keeps the 2027 rows that name `place` as a whole word in the title, sit in
 * `region` (or give none: the irrigation list has no region), and aren't
 * excluded by hand. A row found by two programs' searches is kept once.
 */
export function pick2027(
  rows: ApiProjectRow[],
  place: string,
  region: string,
  exclude: ReadonlySet<string>,
): Pick2027 {
  const out: Pick2027 = {
    kept: [],
    insideWords: 0,
    otherRegion: 0,
    excluded: [],
  };
  const seen = new Set<string>();
  for (const row of rows) {
    const key = projectKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!namesPlace(place, row.title)) {
      out.insideWords++;
    } else if (row.region_key && row.region_key !== region) {
      out.otherRegion++;
    } else if (exclude.has(key)) {
      out.excluded.push(key);
    } else {
      out.kept.push(toProject(row));
    }
  }
  return out;
}

/** What the 2020–2026 filter kept, and how many rows each rule dropped. */
export type PickGaa = {
  kept: BudgetGaaProgram[];
  insideWords: number;
  /** Rows with no amount above zero in any year (lines carried at ₱0). */
  unfunded: number;
  excluded: string[];
};

/**
 * Keeps the GAA program families that name `place` as a whole word, have an
 * amount above zero in some year, and aren't excluded (`gaa:<fam_key>`).
 * Rows with the same `fam_key` are merged by adding their yearly amounts.
 */
export function pickGaa(
  rows: ApiGaaProgram[],
  place: string,
  exclude: ReadonlySet<string>,
): PickGaa {
  const out: PickGaa = { kept: [], insideWords: 0, unfunded: 0, excluded: [] };
  const byKey = new Map<string, BudgetGaaProgram>();
  for (const row of rows) {
    if (!namesPlace(place, row.name)) {
      out.insideWords++;
      continue;
    }
    const amounts: Record<string, number> = {};
    for (const [year, cell] of Object.entries(row.years)) {
      if (cell.amount > 0) amounts[year] = cell.amount;
    }
    if (Object.keys(amounts).length === 0) {
      out.unfunded++;
      continue;
    }
    const id = `gaa:${row.fam_key}`;
    if (exclude.has(id)) {
      if (!out.excluded.includes(id)) out.excluded.push(id);
      continue;
    }
    const existing = byKey.get(row.fam_key);
    if (existing) {
      for (const [year, amount] of Object.entries(amounts)) {
        existing.amounts[year] = (existing.amounts[year] ?? 0) + amount;
      }
    } else {
      byKey.set(row.fam_key, {
        key: row.fam_key,
        department: row.department_id,
        name: row.name,
        amounts,
      });
    }
  }
  out.kept = [...byKey.values()];
  return out;
}

/**
 * The district card in the snapshot's shape. Each office's co-served
 * districts are named from the card's own list; unknown ids keep their id.
 */
export function toDistrict(card: ApiDistrict): BudgetDistrict {
  const labels = new Map(card.co_served_districts.map((d) => [d.id, d.label]));
  return {
    id: card.id,
    label: card.label,
    url: card.url,
    attribution: card.attribution.code,
    attributionLabel: card.attribution.label,
    offices: card.offices.map((o) => ({
      name: o.name,
      kind: o.kind_label,
      tier: o.tier,
      tierText: o.tier_text,
      coServed: o.district_ids
        .filter((id) => id !== card.id)
        .map((id) => labels.get(id) ?? id),
    })),
    headline: {
      gaa2026: card.headline.fy2026_gaa_php,
      nep2027: card.headline.fy2027_nep_php,
      house2027: card.headline.fy2027_hgab3_php,
    },
    vsProposal: {
      nep: card.fy2027_vs_proposal.nep_php,
      house: card.fy2027_vs_proposal.hgab3_php,
      delta: card.fy2027_vs_proposal.delta_php,
    },
  };
}
