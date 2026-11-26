import type { NewsItem } from "../../data/schema.ts";
import type { ArchiveResult, FeedResult, RemovalResult } from "./jobs.ts";

/** What one refresh run did; a field is absent when that job did not run. */
export type RunReport = {
  feed?: FeedResult;
  archive?: ArchiveResult;
  removal?: RemovalResult;
};

const line = (i: NewsItem) => `- [${i.title}](${i.url})`;

const section = (heading: string, items: NewsItem[]): string[] =>
  items.length === 0
    ? []
    : [`**${heading}** (${items.length})`, ...items.map(line), ""];

/**
 * The commit title (after `chore(data): `) and the markdown body for a run.
 * The title counts only what changed, so a quiet run reads "refresh city news".
 */
export function summarize(report: RunReport): { title: string; body: string } {
  const counts: [number, string][] = [
    [report.feed?.added.length ?? 0, "new"],
    [report.archive?.archived.length ?? 0, "archived"],
    [report.removal?.removed.length ?? 0, "removed"],
    [report.removal?.restored.length ?? 0, "restored"],
  ];
  const parts = counts.filter(([n]) => n > 0).map(([n, w]) => `${n} ${w}`);
  const title = `refresh city news${parts.length ? ` (${parts.join(", ")})` : ""}`;

  const notes: string[] = [];
  const problem = (
    name: string,
    r?: { ok: boolean; errorCode: string | null },
  ) => {
    if (r && (!r.ok || r.errorCode))
      notes.push(`- ${name}: ${r.errorCode ?? "failed"}`);
  };
  problem("feed", report.feed);
  problem("archive", report.archive);
  problem("removal check", report.removal);

  const body = [
    ...section("New posts", report.feed?.added ?? []),
    ...section("Archived", report.archive?.archived ?? []),
    ...section("Archiving gave up", report.archive?.gaveUp ?? []),
    ...section(
      "Missing from the city site (first miss)",
      report.removal?.missing ?? [],
    ),
    ...section("Removed from the city site", report.removal?.removed ?? []),
    ...section("Back on the city site", report.removal?.restored ?? []),
    ...(notes.length ? ["**Problems**", ...notes, ""] : []),
  ].join("\n");
  return { title, body: body.trim() };
}
