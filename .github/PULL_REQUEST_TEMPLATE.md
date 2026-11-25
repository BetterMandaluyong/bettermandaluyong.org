## What & why

<!-- One or two sentences: what changed and why. -->

## Screenshots

<!-- For visual changes: before/after from the dev server, desktop and phone.
     Delete this section if there is nothing visual. -->

## Checklist

- [ ] Reused existing components (`PageShell`, `Container`, `Button`,
      `ArrowLink`, `Card`, `Flag`, …) or ported BetterGov's, instead of
      hand-rolling new ones
- [ ] Colors use `ed-*` tokens and text uses `type-*` utilities (no hex values);
      square corners, no shadows
- [ ] Component added or changed → `COMPONENTS.md` entry **and** `/storybook`
      specimen updated in this same change
- [ ] Token change or departure from BetterGov → `DESIGN.md` updated first
- [ ] Anything copied from another project (code, text, images, data) has its
      license checked and a `NOTICE.md` entry
- [ ] User-facing copy follows `BRAND.md` and lives in `components/content.ts`
      (no invented people, quotes, or numbers)
- [ ] New/changed logic ships with tests in this change
- [ ] `pnpm check` passes
- [ ] `pnpm test` passes
- [ ] Branch is `feat/…` / `fix/…` / `chore/…` / `docs/…`; a human reviews and
      merges — never push or merge `main` directly (`main` deploys)
- [ ] Commits carry **no** `Co-Authored-By` / "Generated with …" AI trailers
