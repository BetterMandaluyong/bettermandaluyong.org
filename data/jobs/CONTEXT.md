# data/jobs

Jobs the City Government posts, one file per Manila year (`2026.yaml`).
Link-only: title, date, kind, and link, never the job text.

- `kind: vacancy` is a City Hall bulletin of vacancies: a Download Manager
  document in the `bulletin-of-vacancies` category.
- `kind: peso` is a private employer's opening posted by the city's Public
  Employment Service Office (an AWSM job post under `/jobs-peso/`). The city
  gives no closing date, so `/jobs` shows only the last 12 months and says an
  older one may be filled.
- **The notices bot owns these files**, as in `data/bids/CONTEXT.md`: a fix goes
  through `utils/notices/` with a test, never a hand edit.
- `parseJobsFile` in `data/schema.ts` checks each file like the bids files.
