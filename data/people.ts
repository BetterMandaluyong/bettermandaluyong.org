import { BARANGAYS as COPY } from "../components/content.ts";
import { BARANGAYS } from "./barangays.ts";
import { CITY_OFFICIALS } from "./city-officials.ts";
import { hrefKey } from "../utils/barangays/keys.ts";
import type { District } from "./schema.ts";

/** What kind of office a person holds. */
export type PersonKind = "city" | "barangay" | "sk";

/**
 * Anyone with a page at `/people/<slug>`: a city official, a barangay
 * official, or a Sangguniang Kabataan official.
 */
export type Person = {
  /** URL slug: the name lowercased with accents folded, e.g. "alex-c-sta-maria". */
  slug: string;
  name: string;
  /** Position, e.g. "Mayor", "Barangay Captain", "SK Kagawad". */
  role: string;
  kind: PersonKind;
  /** The barangay's slug, for barangay and SK officials. */
  barangay?: string;
  /** Council district, for councilors and barangay officials. */
  district?: District;
  /** Index into `CITY_OFFICIALS`, for city officials. */
  cityIndex?: number;
};

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

type Draft = Omit<Person, "slug">;

/**
 * Gives each draft a unique slug. A name used once is its own slug. A name
 * shared by different people gets the barangay appended ("-hulo", or
 * "-city"), and a number ("-2") if that still collides.
 */
export function assignSlugs(drafts: readonly Draft[]): Person[] {
  const counts = new Map<string, number>();
  for (const d of drafts) {
    const base = slugifyName(d.name);
    counts.set(base, (counts.get(base) ?? 0) + 1);
  }
  const used = new Set<string>();
  return drafts.map((d) => {
    const base = slugifyName(d.name);
    const first =
      counts.get(base) === 1 ? base : `${base}-${d.barangay ?? "city"}`;
    let slug = first;
    for (let n = 2; used.has(slug); n++) slug = `${first}-${n}`;
    used.add(slug);
    return { ...d, slug };
  });
}

const drafts: Draft[] = [
  ...CITY_OFFICIALS.map((o, cityIndex): Draft => ({
    name: o.name,
    role: o.role,
    kind: "city",
    district: o.district,
    cityIndex,
  })),
  ...BARANGAYS.flatMap((b): Draft[] => {
    const base = { barangay: b.slug, district: b.district };
    return [
      { ...base, name: b.captain, role: COPY.captain, kind: "barangay" },
      ...b.kagawads.map((name): Draft => ({
        ...base,
        name,
        role: "Barangay Kagawad",
        kind: "barangay",
      })),
      { ...base, name: b.skChair, role: "SK Chairperson", kind: "sk" },
      ...b.skKagawads.map((name): Draft => ({
        ...base,
        name,
        role: "SK Kagawad",
        kind: "sk",
      })),
    ];
  }),
];

/** Everyone: city officials first, then each barangay's officials. */
export const PEOPLE: Person[] = assignSlugs(drafts);

const bySlug = new Map(PEOPLE.map((p) => [p.slug, p]));
const byKey = new Map(
  PEOPLE.map((p) => [hrefKey(p.barangay ?? "city", p.role, p.name), p.slug]),
);

/** The person with this URL slug, or `undefined`. */
export function getPerson(slug: string): Person | undefined {
  return bySlug.get(slug);
}

/**
 * The `/people/…` slug for someone, found by name and role (and barangay
 * slug, for barangay and SK officials). `undefined` if there is no match.
 */
export function personSlugFor(
  name: string,
  role: string,
  barangaySlug?: string,
): string | undefined {
  return byKey.get(hrefKey(barangaySlug ?? "city", role, name));
}

/** The `/people/…` path for someone, or `undefined`. */
export function personHref(
  name: string,
  role: string,
  barangaySlug?: string,
): string | undefined {
  const slug = personSlugFor(name, role, barangaySlug);
  return slug ? `/people/${slug}` : undefined;
}

/**
 * `/people/…` links for every barangay and SK official, keyed by `hrefKey`
 * (barangay slug, position, name). Passed to the home page's explorer island.
 */
export const BARANGAY_PERSON_HREFS: Record<string, string> = Object.fromEntries(
  PEOPLE.filter((p) => p.barangay).map((p) => [
    hrefKey(p.barangay!, p.role, p.name),
    `/people/${p.slug}`,
  ]),
);
