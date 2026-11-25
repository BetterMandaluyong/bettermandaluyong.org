## What & why

<!-- One or two sentences: what changed and why. -->

## Screenshots

<!-- For visual changes: before/after from the dev server, light and dark.
     Delete this section if there is nothing visual. -->

## Checklist

- [ ] Reused existing components (`PageShell`, `Button`, `Eyebrow`,
      `PillarList`, …) instead of hand-rolling new ones
- [ ] Component added or changed → `COMPONENTS.md` updated in this same change
- [ ] Token change → `DESIGN.md` updated first, then mirrored in
      `app/globals.css`
- [ ] User-facing copy follows `BRAND.md` and lives in `components/content.ts`
      (no invented people, quotes, or numbers)
- [ ] New/changed logic ships with tests in this change
- [ ] `pnpm check` passes
- [ ] `pnpm test` passes
- [ ] Branch is `feat/…` / `fix/…` / `chore/…` / `docs/…`; a human reviews and
      merges — never push or merge `main` directly (`main` deploys)
- [ ] Commits carry **no** `Co-Authored-By` / "Generated with …" AI trailers
