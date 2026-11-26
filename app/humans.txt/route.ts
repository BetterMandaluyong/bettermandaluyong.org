import { COMMIT_SHA, commitUrl } from "../../components/build.ts";
import { HUMANS, SITE } from "../../components/content.ts";
import { buildHumansTxt } from "../../utils/site/text.ts";

/**
 * /humans.txt (humanstxt.org): the people behind the site, who we thank, and
 * what it's built with, plus a link to this build's commit when it's known.
 */
export function GET(): Response {
  const build = commitUrl(SITE.repoUrl, COMMIT_SHA);
  const txt = buildHumansTxt([
    HUMANS.team,
    HUMANS.thanks,
    {
      heading: HUMANS.site.heading,
      lines: [
        ...HUMANS.site.lines,
        ...(build ? [{ label: HUMANS.buildLabel, value: build }] : []),
      ],
    },
  ]);
  return new Response(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
