import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { Container } from "../../components/Container.tsx";
import { PageShell } from "../../components/PageShell.tsx";
import { StatusLine } from "../../components/StatusLine.tsx";
import { STATUS } from "../../components/content.ts";
import { lineStatus } from "../../utils/news/status.ts";
import { readOrDefault, recentRuns } from "../../utils/news/store.ts";

export const metadata: Metadata = {
  title: STATUS.metaTitle,
  robots: { index: false },
};

const JOBS = ["feed", "archive"] as const;

/**
 * The status page: whether the scheduled city news feed and archiving jobs
 * are working, from their recent runs in D1. Rendered per request, so it
 * never shows a stale "Working". Any failed read (missing table, unbound or
 * unavailable D1) reads as "Not checked recently", never as "Working"; the
 * failure is logged. Shows no error text or counts.
 */
export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Reading searchParams opts the page into per-request rendering.
  await searchParams;
  const now = new Date();
  const lines = await Promise.all(
    JOBS.map(async (job) => ({
      job,
      ...lineStatus(
        await readOrDefault(() => recentRuns(env.DB, job, 50), []),
        now,
        // An idle archive run proves nothing about saving, so it cannot hide failures.
        { ignoreIdle: job === "archive" },
      ),
    })),
  );

  return (
    <PageShell>
      <section className="border-b border-ed-rule bg-ed-paper-2">
        <Container className="py-14 md:py-20">
          <div className="max-w-3xl">
            <h1 className="type-display m-0 text-balance">{STATUS.heading}</h1>
            <p className="type-lede m-0 mt-6 max-w-[65ch] text-pretty">
              {STATUS.intro}
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container narrow className="py-12 md:py-16">
          <ul className="m-0 list-none border-t border-ed-rule p-0">
            {lines.map(({ job, state, lastSuccessAt }) => (
              <StatusLine
                key={job}
                label={STATUS.lines[job]}
                state={state}
                lastSuccessAt={lastSuccessAt}
              />
            ))}
          </ul>
        </Container>
      </section>
    </PageShell>
  );
}
