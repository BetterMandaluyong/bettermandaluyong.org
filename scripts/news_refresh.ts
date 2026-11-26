// Refreshes data/news/*.yaml from the city site and the Wayback Machine.
// Run by .github/workflows/news-data.yml; safe to run by hand.
//
//   node scripts/news_refresh.ts [--feed] [--archive] [--removal]
//        [--dir data/news] [--summary summary.md]
//
// With no job flag it runs all three. A city or Wayback outage is reported in
// the summary, not as an error; only invalid data files stop the run. When
// GITHUB_OUTPUT is set it writes `degraded=true` if the city feed could not
// be read, so the workflow can fail loudly after it has saved what it got.
import { appendFileSync, writeFileSync } from "node:fs";
import { loadNewsState, writeNewsState } from "../utils/news/files.ts";
import {
  runArchiveJob,
  runFeedJob,
  runRemovalJob,
  type JobDeps,
} from "../utils/news/jobs.ts";
import { summarize, type RunReport } from "../utils/news/summary.ts";

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(name);

const all = !has("--feed") && !has("--archive") && !has("--removal");
const dir = flag("--dir") ?? "data/news";
const access = process.env.IA_ACCESS_KEY;
const secret = process.env.IA_SECRET_KEY;
const deps: JobDeps = {
  fetch: (input, init) => fetch(input, init),
  now: () => new Date(),
  iaKeys: access && secret ? { access, secret } : null,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

const state = loadNewsState(dir);
const report: RunReport = {};
if (all || has("--feed")) report.feed = await runFeedJob(state, deps);
if (all || has("--archive")) report.archive = await runArchiveJob(state, deps);
if (all || has("--removal")) report.removal = await runRemovalJob(state, deps);

const written = writeNewsState(dir, state);
const { title, body } = summarize(report);
console.log(`${title}; files written: ${written.join(", ") || "none"}`);
if (body) console.log(`\n${body}`);

const summaryPath = flag("--summary");
if (summaryPath) writeFileSync(summaryPath, `${title}\n\n${body}\n`);
if (report.feed && !report.feed.ok && process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, "degraded=true\n");
}
