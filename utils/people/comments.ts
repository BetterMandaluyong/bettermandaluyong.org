// Person ids in the office files are ULIDs, which say nothing to a reader,
// so each one carries its person's name as a trailing YAML comment.

const ID_LINE =
  /^(\s*(?:- )?(?:[A-Za-z_]+: )?)([0-7][0-9A-HJKMNP-TV-Z]{25})(?:\s+#.*)?$/;

/**
 * Sets the `# Name` comment after every person id in a YAML text
 * (`captain: 01K…`, `- 01K…`, or
 * `- person: 01K…`), replacing any old comment. Ids with no
 * name in `nameOf` are left as they are.
 */
export function withNameComments(
  yaml: string,
  nameOf: (id: string) => string | undefined,
): string {
  return yaml
    .split("\n")
    .map((line) => {
      const m = line.match(ID_LINE);
      const name = m && nameOf(m[2]);
      return name ? `${m[1]}${m[2]} # ${name}` : line;
    })
    .join("\n");
}
