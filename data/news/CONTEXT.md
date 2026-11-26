# data/news

City Government news links, one file per Manila month (`2026-11.yaml`).
Link-only: titles, dates, categories, and archive status, never article text.

- **The news bot owns these files.** `.github/workflows/news-data.yml` runs
  `scripts/news_refresh.ts` and opens a PR from `bot/news-data` that may merge
  itself, and only when every changed file is under `data/news/`. Agents don't
  edit these files, push to `bot/news-data`, or merge its PR (AGENTS.md).
- **A fix goes through the code, not the data.** If an entry is wrong, fix the
  parser or job in `utils/news/` with a test, and let the next run rewrite the
  file. A one-off backfill uses `scripts/import_news.ts`, run by a person.
- `parseNewsFile` in `data/schema.ts` checks each file: unique WordPress ids,
  links on mandaluyong.gov.ph, Manila-time dates inside the file's month.
- `git log data/news` is the audit trail: each bot commit is one run.
