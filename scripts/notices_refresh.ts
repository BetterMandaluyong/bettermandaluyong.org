// Refreshes data/bids/*.yaml and data/jobs/*.yaml from the city site: the
// bid notices in the bids section (/bac/), City Hall's bulletins of
// vacancies, and the PESO job posts (/peso/). Links, titles, dates, and kinds
// only; never the documents or job text. Run by
// .github/workflows/notices-data.yml; safe to run by hand.
//
//   node scripts/notices_refresh.ts [--backfill] [--root data]
//        [--summary summary.md]
//
// A normal run reads the API listings and the first pages of each category.
// --backfill reads every category page (about 100 requests, a few minutes):
// use it once to fill an empty record, or after the city recategorizes.
// It overwrites the year files under data/bids and data/jobs; review the diff.
// A city outage is reported in the summary; when GITHUB_OUTPUT is set it also
// writes `degraded=true` if the document list could not be read, so the
// workflow can fail loudly after it has saved what it got.
import { appendFileSync, writeFileSync } from "node:fs";
import {
  loadNoticeRecords,
  writeNoticeRecords,
} from "../utils/notices/files.ts";
import { runNoticesJob, type NoticeDeps } from "../utils/notices/jobs.ts";
import { summarizeNotices } from "../utils/notices/summary.ts";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const root = flag("--root") ?? "data";
const deps: NoticeDeps = {
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      headers: {
        "User-Agent":
          "BetterMandaluyong.org notices bot (+https://github.com/BetterMandaluyong/bettermandaluyong.org)",
      },
    }),
  now: () => new Date(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const records = loadNoticeRecords(root);
const report = await runNoticesJob(records, deps, {
  backfill: process.argv.includes("--backfill"),
});
const written = writeNoticeRecords(root, records);
const { title, body } = summarizeNotices(report);
console.log(`${title}; files written: ${written.join(", ") || "none"}`);
if (body) console.log(`\n${body}`);

const summaryPath = flag("--summary");
if (summaryPath) writeFileSync(summaryPath, `${title}\n\n${body}\n`);
if (!report.ok && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, "degraded=true\n");
}
