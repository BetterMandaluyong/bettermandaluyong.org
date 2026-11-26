import type { CityNotice } from "../../data/schema.ts";
import type { Changes, NoticeReport } from "./jobs.ts";

const line = (i: CityNotice) => `- [${i.title}](${i.url}) (${i.kind})`;

const section = (heading: string, items: CityNotice[]): string[] =>
  items.length === 0
    ? []
    : [`**${heading}** (${items.length})`, ...items.map(line), ""];

const sections = (name: string, c: Changes): string[] => [
  ...section(`New ${name}`, c.added),
  ...section(`${name} missing from the city site (first miss)`, c.missing),
  ...section(`${name} removed from the city site`, c.removed),
  ...section(`${name} back on the city site`, c.restored),
];

/**
 * The commit title (after `chore(data): `) and the markdown body for a run.
 * The title counts only what changed, so a quiet run reads "refresh city bids and jobs".
 */
export function summarizeNotices(report: NoticeReport): {
  title: string;
  body: string;
} {
  const counts: [number, string][] = [
    [report.bids.added.length, "new bids"],
    [report.jobs.added.length, "new jobs"],
    [report.bids.removed.length + report.jobs.removed.length, "removed"],
    [report.bids.restored.length + report.jobs.restored.length, "restored"],
  ];
  const parts = counts.filter(([n]) => n > 0).map(([n, w]) => `${n} ${w}`);
  const title = `refresh city bids and jobs${parts.length ? ` (${parts.join(", ")})` : ""}`;
  const body = [
    ...sections("bids", report.bids),
    ...sections("jobs", report.jobs),
    ...(report.unmatched.length
      ? [
          `**Listed in a category but not in the document list** (${report.unmatched.length})`,
          ...report.unmatched.map((u) => `- ${u}`),
          "",
        ]
      : []),
    ...(report.problems.length
      ? ["**Problems**", ...report.problems.map((p) => `- ${p}`), ""]
      : []),
  ].join("\n");
  return { title, body: body.trim() };
}
