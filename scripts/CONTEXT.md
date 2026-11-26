# scripts

Node scripts run by hand or by a workflow, never by the site. Each file's header
says what it does, how to run it, and what it overwrites. Read the header before
running a script.

- **They run with plain `node`** (Node strips the types), not through Vite. Use
  only erasable TypeScript (no `enum`, no parameter properties), and import with
  the `.ts` extension. Read YAML from disk with the `yaml` package, or through
  `utils/people/files.ts` and `utils/news/files.ts`, never with
  `import "./x.yaml"`.
- **Validate before writing.** Scripts parse data with the same `data/schema.ts`
  functions the build uses.
- **Importers overwrite files.** `import_barangays.ts` rewrites
  `data/barangays/*.yaml` and adds `data/people/*.yaml`.
  `import_boundaries_osm.ts` rewrites the boundaries GeoJSON. Run them only for
  a bulk refresh, review the diff and what they print, and never let them guess.
  They report anything they couldn't match.
- **Put pure logic in `utils/` with tests.** Scripts stay thin I/O. A network
  script like `check_dynasties.ts` isn't part of `pnpm test`.
- `news_refresh.ts` belongs to the news bot workflow. Change it with care, and
  with tests in `utils/news/`.
- `budget_refresh.ts` rewrites `data/budget/fy2027.yaml` and `gaa.yaml` from the
  Budget API. It fails rather than write totals that don't reconcile with the
  API's own; run it by hand (DEPLOYMENT.md) and review the diff.
- Never add a deploy or Cloudflare login step here: those are human steps
  (DEPLOYMENT.md).
