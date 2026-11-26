# data/people

One YAML file per elected official, named by a
[ULID](https://github.com/ulid/spec). Offices in `data/barangays/*.yaml` and
`data/city-officials.yaml` point at these files by id. The convention follows
[bettergovph/open-congress-data](https://github.com/bettergovph/open-congress-data)
(`data/person/<ULID>.toml`), so records can be cross-referenced across BetterGov
projects.

## A person file

```yaml
id: 01M8AYCW7MHBKQ7069DPW4M70W # the ULID; must equal the file name
slug: alexandria-queenie-pahati-gonzales # the /people/<slug> URL
name: Alexandria “Queenie” Pahati-Gonzales
ids: # optional: the same person in other datasets
  open_congress: 01K5ST47FR57HGGQ3D5QR4HP2N
  wikidata: Q66827038
```

Only these four fields are allowed. `data/schema.ts` (`parsePerson`) checks
them.

## Rules

- **The id is a ULID and never changes.** It is 26 characters of Crockford
  base32, uppercase, with no I, L, O, or U. It is both the file name and `id:`.
  Never derive it from a name, and never reuse one.
- **Make a ULID with the repo's generator** (no dependencies):
  `node -e "import('./utils/people/ulid.ts').then(m => console.log(m.ulidFactory()()))"`.
  Don't hand-type one or copy one from another file.
- **The slug is frozen too.** Pick it when you add the person: their name as
  lowercase words joined by hyphens (`slugifyName` in `utils/people/ids.ts`). If
  that's taken, add the barangay slug or `city`. Fixing a name's spelling
  changes `name:` only, never `slug:`, so links keep working. Slugs must be
  unique across all files.
- **Every file must hold an office.** The build fails on a person file that no
  barangay file or `city-officials.yaml` lists. Delete a person who left office
  (or move their `ids:` to the new file if they were re-added under a new id).
- **Offices write the id with the name as a comment:**
  `captain: 01M8… # Joseph Parong Jose`. `data/people_test.ts` fails if the
  comment is missing or doesn't match `name:`. When you rename someone, update
  the comments too.
- **`ids:` keys come from an allow-list.** `EXTERNAL_ID_KINDS` in
  `data/schema.ts` gives each key a format check and a link for the person's
  "Records Elsewhere" section. To support a new dataset, add an entry there with
  a test in `data/schema_test.ts`, plus a NOTICE.md row. Quote values YAML would
  read as numbers.
- **Only add an external id you've checked** against the record itself (name,
  office, term), never one guessed from a name search. Say what you checked in
  the PR.
- **Same name, different person:** two officials with the same name in different
  barangays are different files. Merge true duplicates by hand.

## Who writes these files

- People by hand, for city officials and fixes.
- `scripts/import_barangays.ts` on a bulk refresh. It reuses an id when the same
  name already holds an office in the same barangay, creates files for everyone
  else, and prints new and unlisted people for a person to review.

See DEVELOPMENT.md, "People", for the step-by-step.
