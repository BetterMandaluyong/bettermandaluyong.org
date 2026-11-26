// Refreshes data/budget/fy2027.yaml and data/budget/gaa.yaml from the
// BetterGov.ph Budget API (https://budget.bettergov.ph/docs), for the place,
// region and district in data/budget/scope.yaml. Run by hand:
//
//   node scripts/budget_refresh.ts [--dir data/budget]
//
// It reconciles every 2020–2026 search against the API's own total
// (department by department, year by year) and exits non-zero on a mismatch,
// so a lost page can't reach the site. A file whose figures haven't changed
// keeps its old fetched_at date and isn't rewritten.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  BUDGET_PROGRAMS,
  parseBudget2027,
  parseBudgetGaa,
  parseBudgetScope,
  type Budget2027,
  type BudgetGaa,
  type BudgetProgram,
} from "../data/schema.ts";
import {
  allGaaPrograms,
  allProjects,
  gaaMatchedAmount,
  getJson,
  type ApiDepartment,
  type ApiDistrict,
  type ApiGaaProgram,
  type ApiOverview,
  type ApiProjectRow,
  type FetchLike,
} from "../utils/budget/api.ts";
import {
  budget2027Yaml,
  budgetGaaYaml,
  writeIfChanged,
} from "../utils/budget/files.ts";
import { pick2027, pickGaa, toDistrict } from "../utils/budget/select.ts";

const i = process.argv.indexOf("--dir");
const dir = i >= 0 ? process.argv[i + 1] : "data/budget";
const fetchFn: FetchLike = (input, init) => fetch(input, init);
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Manila",
});

const scope = parseBudgetScope(
  parse(readFileSync(join(dir, "scope.yaml"), "utf8")),
  `${dir}/scope.yaml`,
);
const exclude = new Set(scope.exclude.map((e) => e.id));
const used = new Set<string>();

/** The file's existing text, or null. */
function current(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

/** Keeps the old fetched_at when nothing else changed, so reruns don't churn git. */
function stable<T extends { fetchedAt: string }>(
  path: string,
  next: T,
  toYaml: (t: T) => string,
  read: (raw: unknown) => { fetchedAt: string },
): string {
  const old = current(path);
  if (old) {
    const before = read(parse(old)).fetchedAt;
    const same = toYaml({ ...next, fetchedAt: before });
    if (same === old) return same;
  }
  return toYaml(next);
}

// --- 2027: the NEP against the House bill -------------------------------

const overview = await getJson<ApiOverview>(fetchFn, "/hgab/2027");
const card = await getJson<{ data: ApiDistrict }>(
  fetchFn,
  `/hgab/2027/districts/${encodeURIComponent(scope.district)}`,
);
const labels = new Map(overview.data.datasets.map((d) => [d.key, d.label]));
const programs = {} as Record<BudgetProgram, string>;
const rows: ApiProjectRow[] = [];
for (const program of BUDGET_PROGRAMS) {
  const label = labels.get(program);
  if (!label)
    throw new Error(`Budget API: no program "${program}" in /hgab/2027`);
  programs[program] = label;
  rows.push(...(await allProjects(fetchFn, program, scope.place)));
}
const picked = pick2027(rows, scope.place, scope.region, exclude);
picked.excluded.forEach((id) => used.add(id));

const fy2027: Budget2027 = {
  fetchedAt: today,
  source: {
    builtAt: overview.meta.built_at,
    commit: overview.meta.source_commit,
    notice: overview.meta.notice,
  },
  disclaimers: overview.disclaimers,
  programs,
  district: toDistrict(card.data),
  projects: picked.kept,
};
// Fail here, not at build time, if the API sent something the schema rejects.
parseBudget2027(parse(budget2027Yaml(fy2027)), `${dir}/fy2027.yaml`);

// --- 2020–2026: enacted budgets whose program names name the place -----

const departments = await getJson<{ data: ApiDepartment[] }>(
  fetchFn,
  "/gaa/departments",
);
const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
const gaaRows: ApiGaaProgram[] = [];
const names: Record<string, string> = {};
const mismatches: string[] = [];
for (const dep of departments.data) {
  const found = await allGaaPrograms(fetchFn, dep.id, scope.place);
  if (found.length === 0) continue;
  gaaRows.push(...found);
  for (const year of years) {
    const ours = found.reduce((s, r) => s + (r.years[year]?.amount ?? 0), 0);
    const theirs = await gaaMatchedAmount(fetchFn, dep.id, scope.place, year);
    if (ours !== theirs) {
      mismatches.push(
        `department ${dep.id}, ${year}: rows ${ours}, API ${theirs}`,
      );
    }
  }
}
if (mismatches.length) {
  throw new Error(
    `GAA totals don't reconcile with the API (a page was lost?):\n  ${mismatches.join("\n  ")}`,
  );
}
const gaaPicked = pickGaa(gaaRows, scope.place, exclude);
gaaPicked.excluded.forEach((id) => used.add(id));
for (const p of gaaPicked.kept) {
  const dep = departments.data.find((d) => d.id === p.department);
  names[p.department] = dep?.description ?? p.department;
}
const gaa: BudgetGaa = {
  fetchedAt: today,
  years,
  departments: Object.fromEntries(
    Object.entries(names).sort(([a], [b]) => a.localeCompare(b)),
  ),
  programs: gaaPicked.kept,
};
parseBudgetGaa(parse(budgetGaaYaml(gaa)), `${dir}/gaa.yaml`);

// --- Write and report ---------------------------------------------------

const unused = scope.exclude.filter((e) => !used.has(e.id));
if (unused.length) {
  throw new Error(
    `scope.yaml excludes lines the API no longer returns; remove them:\n  ${unused.map((e) => e.id).join("\n  ")}`,
  );
}

const p2027 = join(dir, "fy2027.yaml");
const pGaa = join(dir, "gaa.yaml");
const wrote = [
  writeIfChanged(
    p2027,
    stable(p2027, fy2027, budget2027Yaml, (raw) => parseBudget2027(raw, p2027)),
  ) && p2027,
  writeIfChanged(
    pGaa,
    stable(pGaa, gaa, budgetGaaYaml, (raw) => parseBudgetGaa(raw, pGaa)),
  ) && pGaa,
].filter(Boolean);

const count = (p: BudgetProgram) =>
  picked.kept.filter((r) => r.program === p).length;
console.log(
  [
    `2027: ${picked.kept.length} lines (${BUDGET_PROGRAMS.map((p) => `${p} ${count(p)}`).join(", ")}); ` +
      `left out ${picked.insideWords} inside longer words, ${picked.otherRegion} in other regions, ${picked.excluded.length} by hand`,
    `2020–2026: ${gaaPicked.kept.length} programs in ${Object.keys(names).length} departments; ` +
      `left out ${gaaPicked.insideWords} inside longer words, ${gaaPicked.unfunded} never funded, ${gaaPicked.excluded.length} by hand; totals reconcile`,
    `Files written: ${wrote.join(", ") || "none (no changes)"}`,
  ].join("\n"),
);
