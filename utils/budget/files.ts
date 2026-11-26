// Turns the budget snapshot into the YAML in data/budget/. The text functions
// are pure (tested); `writeIfChanged` is the only file access, for the script.
import { readFileSync, writeFileSync } from "node:fs";
import { stringify } from "yaml";
import type { Budget2027, BudgetGaa } from "../../data/schema.ts";

const HEADER =
  "# Written by scripts/budget_refresh.ts from the BetterGov.ph Budget API\n" +
  "# (https://budget.bettergov.ph/docs). Don't edit by hand: change\n" +
  "# data/budget/scope.yaml and run the script. See DEPLOYMENT.md.\n";

const dump = (data: unknown) => HEADER + stringify(data, { lineWidth: 0 });

/** `data/budget/fy2027.yaml` text for a snapshot, in the schema's snake_case. */
export function budget2027Yaml(b: Budget2027): string {
  return dump({
    fetched_at: b.fetchedAt,
    source: {
      built_at: b.source.builtAt,
      commit: b.source.commit,
      notice: b.source.notice,
    },
    disclaimers: b.disclaimers,
    programs: b.programs,
    district: {
      id: b.district.id,
      label: b.district.label,
      url: b.district.url,
      attribution: b.district.attribution,
      attribution_label: b.district.attributionLabel,
      offices: b.district.offices.map((o) => ({
        name: o.name,
        kind: o.kind,
        tier: o.tier,
        tier_text: o.tierText,
        co_served: o.coServed,
      })),
      headline: {
        gaa_2026: b.district.headline.gaa2026,
        nep_2027: b.district.headline.nep2027,
        house_2027: b.district.headline.house2027,
      },
      vs_proposal: b.district.vsProposal,
    },
    projects: b.projects.map((p) => ({
      key: p.key,
      program: p.program,
      title: p.title,
      line: p.line,
      office: p.office,
      status: p.status,
      group: p.group,
      held: p.held,
      nep: p.nep,
      house: p.house,
      delta: p.delta,
      url: p.url,
      nep_pdf: p.nepPdf,
      house_pdf: p.housePdf,
      lat: p.lat,
      lon: p.lon,
    })),
  });
}

/** `data/budget/gaa.yaml` text, programs sorted by key so reruns diff cleanly. */
export function budgetGaaYaml(g: BudgetGaa): string {
  return dump({
    fetched_at: g.fetchedAt,
    years: g.years,
    departments: g.departments,
    programs: [...g.programs]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((p) => ({
        key: p.key,
        department: p.department,
        name: p.name,
        amounts: p.amounts,
      })),
  });
}

/** Writes `text` to `path` unless it is already there. Returns whether it wrote. */
export function writeIfChanged(path: string, text: string): boolean {
  let current: string | null = null;
  try {
    current = readFileSync(path, "utf8");
  } catch {
    current = null;
  }
  if (current === text) return false;
  writeFileSync(path, text);
  return true;
}
