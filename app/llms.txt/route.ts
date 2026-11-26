import { LLMS, SITE } from "../../components/content.ts";
import { MAIN_PAGES, absoluteUrl } from "../../components/metadata.ts";
import { BARANGAYS } from "../../data/barangays.ts";
import { buildLlmsTxt } from "../../utils/site/text.ts";

/**
 * /llms.txt: a plain-text guide to the site for AI tools (llmstxt.org): what
 * it is, its main pages, every barangay page, and where the data lives.
 */
export function GET(): Response {
  const txt = buildLlmsTxt({
    title: SITE.name,
    summary: SITE.description,
    details: LLMS.details,
    sections: [
      {
        heading: LLMS.pagesHeading,
        links: MAIN_PAGES.map((p) => ({
          label: p.label,
          url: absoluteUrl(p.path),
          note: p.description,
        })),
      },
      {
        heading: LLMS.barangaysHeading,
        links: BARANGAYS.map((b) => ({
          label: LLMS.barangayLabel(b.name),
          url: absoluteUrl(`/barangays/${b.slug}`),
          note: LLMS.barangayNote(b.district),
        })),
      },
      {
        heading: LLMS.dataHeading,
        links: LLMS.data.map((d) => ({
          label: d.label,
          url: absoluteUrl(d.path),
          note: d.note,
        })),
      },
      { heading: LLMS.optionalHeading, links: LLMS.optional },
    ],
  });
  return new Response(txt, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
