# data/bids

The City Government's bid notices, one file per Manila year (`2026.yaml`):
invitations to bid, requests for quotation, bid bulletins, notices of award,
notices to proceed, contracts, monitoring reports, and procurement plans, as
posted in the bids section of mandaluyong.gov.ph (`/bac/`). Link-only: title,
date, kind, and link, never the document.

- **The notices bot owns these files.** `.github/workflows/notices-data.yml`
  runs `scripts/notices_refresh.ts` and opens a PR from `bot/notices-data`. It
  never merges itself; a person reviews and merges it. Agents don't edit these
  files by hand or push to `bot/notices-data`.
- **A fix goes through the code, not the data.** If a kind or title is wrong,
  fix `utils/notices/` with a test and let the next run rewrite the file. After
  the city recategorizes documents, run it with `--backfill`.
- **The kind comes from the city's category** (`BID_CATEGORIES` in
  `utils/notices/sources.ts`), not from the title. A document only in the
  section's parent category is `other`, and `other` never replaces a known kind.
- `parseBidsFile` in `data/schema.ts` checks each file: unique WordPress ids,
  links on mandaluyong.gov.ph, a known kind, and dates inside the file's year.
- `git log data/bids` is the audit trail: each bot commit is one run.
