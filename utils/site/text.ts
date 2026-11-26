/** A link in an llms.txt section. */
export type LlmsLink = {
  label: string;
  url: string;
  /** Optional note after the link, e.g. what the page holds. */
  note?: string;
};

/** The parts of an llms.txt file (https://llmstxt.org). */
export type LlmsTxt = {
  /** The H1: the site's name. */
  title: string;
  /** The blockquote: a one-line summary. */
  summary: string;
  /** Plain paragraphs after the summary. */
  details: readonly string[];
  /** H2 sections, each a list of links. An "Optional" section may be skipped by readers. */
  sections: readonly { heading: string; links: readonly LlmsLink[] }[];
};

/** Strips line breaks so a value stays on its own Markdown line. */
function oneLine(s: string): string {
  return s.replace(/\s*\n\s*/g, " ").trim();
}

/**
 * Builds an llms.txt document: `# title`, `> summary`, paragraphs, then one
 * `## heading` per section with `- [label](url): note` lines. Sections with
 * no links are left out.
 */
export function buildLlmsTxt(doc: LlmsTxt): string {
  const out = [`# ${oneLine(doc.title)}`, "", `> ${oneLine(doc.summary)}`];
  for (const p of doc.details) out.push("", oneLine(p));
  for (const section of doc.sections) {
    if (section.links.length === 0) continue;
    out.push("", `## ${oneLine(section.heading)}`, "");
    for (const l of section.links) {
      const note = l.note ? `: ${oneLine(l.note)}` : "";
      out.push(`- [${oneLine(l.label)}](${l.url})${note}`);
    }
  }
  out.push("");
  return out.join("\n");
}

/** One line in a humans.txt section: `Label: value`, or just the value. */
export type HumansLine = { label?: string; value: string };

/**
 * Builds a humans.txt document (https://humanstxt.org): one `/* HEADING *\/`
 * block per section, each line indented by two spaces. Sections with no lines
 * are left out.
 */
export function buildHumansTxt(
  sections: readonly { heading: string; lines: readonly HumansLine[] }[],
): string {
  const blocks = sections
    .filter((s) => s.lines.length > 0)
    .map((s) =>
      [
        `/* ${oneLine(s.heading).toUpperCase()} */`,
        ...s.lines.map(
          (l) =>
            `  ${l.label ? `${oneLine(l.label)}: ` : ""}${oneLine(l.value)}`,
        ),
      ].join("\n"),
    );
  return `${blocks.join("\n\n")}\n`;
}
