// Worker entry: serves the vinext app. The news record is data in the repo
// (data/news), refreshed by .github/workflows/news-data.yml, so there are no
// scheduled jobs here. The pattern follows vinext's apps/web/worker/index.ts
// (MIT, cloudflare/vinext).
import handler from "vinext/server/fetch-handler";

export default {
  /** Hands every request to the vinext app. */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return handler.fetch(request, env, ctx);
  },
};
