import fy2027Raw from "./budget/fy2027.yaml";
import gaaRaw from "./budget/gaa.yaml";
import scopeRaw from "./budget/scope.yaml";
import {
  parseBudget2027,
  parseBudgetGaa,
  parseBudgetScope,
  type Budget2027,
  type BudgetGaa,
  type BudgetScope,
} from "./schema.ts";

// Vite reads and parses the YAML at build time (vite-plugins/yaml.ts). The
// snapshot is written by scripts/budget_refresh.ts; see DEPLOYMENT.md.

/** `data/budget/scope.yaml`: the place searched and the lines left out by hand. */
export const BUDGET_SCOPE: BudgetScope = parseBudgetScope(
  scopeRaw,
  "data/budget/scope.yaml",
);

/** `data/budget/fy2027.yaml`: the 2027 lines that name the place, and the district card. */
export const BUDGET_2027: Budget2027 = parseBudget2027(
  fy2027Raw,
  "data/budget/fy2027.yaml",
);

/** `data/budget/gaa.yaml`: the 2020–2026 programs that name the place. */
export const BUDGET_GAA: BudgetGaa = parseBudgetGaa(
  gaaRaw,
  "data/budget/gaa.yaml",
);
