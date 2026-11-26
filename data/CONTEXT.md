# data

The site's facts, as YAML, parsed and checked at build time. The YAML is the
source of truth: edit it, never generated output.

## How it fits together

- `vite-plugins/yaml.ts` turns each `.yaml` import into data and runs the
  matching validator from `schema.ts` on it, so a bad field fails the build with
  the file and field name.
- `load.ts` loads every file and checks the links between them: each person id
  an office lists has a file in `people/`, no two people share a slug, and every
  person holds an office.
- The modules pages import (`barangays.ts`, `city-officials.ts`, `people.ts`,
  `places.ts`, `news.ts`, `org-chart.ts`, `budget.ts`, `pay.ts`, `stats.ts`)
  expose typed data. Pages never import YAML directly.

| Path                                    | What                                                      | Written by                        |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------- |
| `people/<ULID>.yaml`                    | One per elected official (see `people/CONTEXT.md`)        | People; `import_barangays.ts`     |
| `barangays/<slug>.yaml`                 | The 27 barangays: hall, council and SK as person ids      | `import_barangays.ts`; hand fixes |
| `city-officials.yaml`                   | Representative, mayor, vice mayor, councilors             | People, from the city's pages     |
| `places.yaml`                           | Government places on the map (OSM or Google CID source)   | People                            |
| `pay.yaml`                              | Salary schedule and each office's grade, from DBM         | People, from the circulars        |
| `stats/population.yaml`                 | People in each barangay, by census (PSA)                  | People                            |
| `stats/poverty.yaml`                    | PSA poverty estimates: city, NCR, Philippines             | People                            |
| `stats/finances.yaml`                   | The city's own income and spending for a year (BLGF)      | People                            |
| `news/YYYY-MM.yaml`                     | City news links                                           | The news bot only                 |
| `budget/scope.yaml`                     | Place, region, district, and lines left out by hand       | People                            |
| `budget/fy2027.yaml`, `budget/gaa.yaml` | National budget snapshot from the BetterGov.ph Budget API | `budget_refresh.ts` only          |

## Rules

- **Change the schema with the data.** A new field means a change to
  `schema.ts`, its test in `schema_test.ts`, and the type the pages use.
- **Never invent facts** (BRAND.md). Every value comes from a source you can
  link: the city's pages, OpenStreetMap, or a dataset credited in NOTICE.md.
  Barangay and city files keep their `source` URL and date.
- **Tests read these files.** `*_test.ts` here check invariants across the real
  data (27 barangays, 7 kagawads each, comments naming each id). Run `pnpm test`
  after any data edit.
- **Only `*.yaml` is data.** Loaders and tests filter by extension, so notes
  like this file are safe here. Keep it that way when you add a reader.
- **Pay is the law's rate, not the payroll.** `pay.yaml` holds DBM's Step 1
  rates and each office's grade, read from the circulars themselves (never a
  news report or a third-party table). Pages must keep the caveats with every
  figure (`PAY_COPY`). Each January, add the new tranche from DBM's NBC and LBC
  and update `checked:`; `data/pay_test.ts` pins one year's figures; update it
  too.
- **City statistics keep their checks.** `stats/population.yaml` must add up to
  each census's official total, and `checked: false` marks counts still awaiting
  a comparison with PSA's own file (the page says so). When PSA's site lets you
  download the 2024 barangay table, compare every row, then set `checked: true`
  and point `source:` at PSA. Add newer poverty estimates (2021, 2023) the same
  way, from PSA's tables.
