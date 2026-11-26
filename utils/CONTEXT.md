# utils

Pure logic shared by pages, islands, and scripts: no data loading, no React.

| Folder       | What                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| `barangays/` | Phone parsing, date formatting, search, the person-link key (`hrefKey`) |
| `news/`      | Feed, WordPress, and Wayback parsers; the bot's jobs; record and YAML   |
| `people/`    | ULIDs, URL slugs and re-import matching, `# Name` comments, disk reader |

- **Every module ships with tests** next to it (`foo.ts` → `foo_test.ts`). New
  or changed logic needs passing tests in the same change.
- **Keep it importable everywhere.** Islands (in the browser) and pages (in the
  Worker) import some of these modules, so only the files meant for scripts
  (`news/files.ts`, `people/files.ts`) may use `node:fs`. Their headers say so.
- Use `.ts` import extensions and erasable TypeScript, as in `scripts/`, because
  scripts load these modules under plain `node`.
