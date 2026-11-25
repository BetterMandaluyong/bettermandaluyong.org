// Worker entry: serves the vinext app and runs the news jobs on a schedule.
// The pattern follows vinext's apps/web/worker/index.ts (MIT, cloudflare/vinext).
import handler from "vinext/server/fetch-handler";
import {
  runArchiveJob,
  runFeedJob,
  runRemovalJob,
  type JobDeps,
} from "../utils/news/jobs.ts";
import { jobsForCron } from "../utils/news/schedule.ts";

/** The optional Internet Archive keys. They are not declared in cloudflare.config.ts on purpose: a declared secret with no value fails the deploy. */
type OptionalKeys = { IA_ACCESS_KEY?: string; IA_SECRET_KEY?: string };

/** Runs the jobs for one cron, one after another; each job records its own run row and never throws. */
async function run(cron: string, env: Env): Promise<void> {
  const keys = env as OptionalKeys;
  const deps: JobDeps = {
    db: env.DB,
    // Not the bare global: called as deps.fetch(), workerd would see the wrong `this`.
    fetch: (input, init) => fetch(input, init),
    now: () => new Date(),
    iaKeys:
      keys.IA_ACCESS_KEY && keys.IA_SECRET_KEY
        ? { access: keys.IA_ACCESS_KEY, secret: keys.IA_SECRET_KEY }
        : null,
  };
  for (const job of jobsForCron(cron)) {
    if (job === "feed") await runFeedJob(deps);
    else if (job === "archive") await runArchiveJob(deps);
    else if (job === "removal") await runRemovalJob(deps);
  }
}

export default {
  /** Hands every request to the vinext app. */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
  /** Runs the news jobs that belong to the cron that fired. */
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(run(controller.cron, env));
  },
};
