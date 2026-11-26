# data/barangays

One file per barangay, named by its slug (`hulo.yaml`), as published on
mandaluyong.gov.ph. `parseBarangay` in `data/schema.ts` checks each one.

- **Officials are person ids, not names.** `council.captain`, `council.kagawads`
  (exactly 7), `sk.chair`, and `sk.kagawads` (1–7; the city lists fewer where
  seats are vacant) are ULIDs of files in `data/people/`. Each is followed by
  `# Name`, and a test checks the comment matches the person file. See
  `data/people/CONTEXT.md`.
- **`scripts/import_barangays.ts` overwrites these files** on a bulk refresh
  (new officials in 2028, a court ruling). Small fixes are made by hand. After a
  refresh, review what it prints: changed Punong Barangays, new people, and
  people who no longer hold an office.
- **`dilg` and `flags` are kept by hand.** `dilg` records when the officials
  were checked against DILG's Barangay Officials Directory. `flags` lists each
  disagreement by name (not id), with a status. `resolveBarangay` in
  `data/schema.ts` checks that every flag still matches the names shown, so
  settle a flag by fixing the person file and deleting the flag. The importer
  keeps both sections on a rerun. DEVELOPMENT.md, "Editing site data", explains
  each status.
- **Keep the source.** `source.url` and `source.updated` are the city page and
  its last edit date. Every page that shows this data credits them.
- **The slug is fixed.** It's the `/barangays/<slug>` URL and must match the
  map's polygons in `public/data/mandaluyong-barangays.geojson` (a test checks
  this), so don't rename a file.
- `psgc` is the PSA code (`13805000NN`). `zip` is approximate, because PHLPost
  publishes no barangay list, and the site says so.
