// How a new person gets their URL slug, and how a re-import finds the person
// it already knows. Pure functions; used by scripts/import_barangays.ts.

/** The name as a URL slug: lowercase, accents and quotes folded away. */
export function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’“”"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A URL slug for a new person that no one in `taken` uses: the name's slug,
 * else with the place they serve appended ("-hulo", or "-city"), else with a
 * number ("-2"). Existing people keep their slugs.
 */
export function newSlug(
  name: string,
  scope: string,
  taken: ReadonlySet<string>,
): string {
  const base = slugifyName(name);
  if (!taken.has(base)) return base;
  const scoped = `${base}-${scope}`;
  let slug = scoped;
  for (let n = 2; taken.has(slug); n++) slug = `${scoped}-${n}`;
  return slug;
}

/** Someone already on file, and where they hold office now. */
export type KnownPerson = {
  id: string;
  name: string;
  /** Barangay slugs, or "city", where they hold an office. */
  scopes: readonly string[];
};

/**
 * The person on file to reuse for `name` in an office in `scope`: someone
 * with exactly that name who already holds an office there (a kagawad who
 * became captain keeps their id). Anyone else with the same name is treated
 * as a different person; a person merges true duplicates by hand.
 */
export function findPerson<T extends KnownPerson>(
  name: string,
  scope: string,
  known: readonly T[],
): T | undefined {
  return known.find((p) => p.name === name && p.scopes.includes(scope));
}
