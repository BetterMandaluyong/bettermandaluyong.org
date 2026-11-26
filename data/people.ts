import { BARANGAYS as COPY } from "../components/content.ts";
import { BARANGAYS } from "./barangays.ts";
import { CITY_OFFICIALS } from "./city-officials.ts";
import { LOADED_PEOPLE } from "./load.ts";
import { hrefKey } from "../utils/barangays/keys.ts";
import type { CitySeat, District, ExternalIds } from "./schema.ts";

/** What kind of office a person holds. */
export type PersonKind = "city" | "barangay" | "sk";

/** The groups `/people` shows offices in, from the House down to the SK. */
export type PositionCategory =
  | "house"
  | "executive"
  | "council"
  | "captain"
  | "kagawad"
  | "sk-chair"
  | "sk-kagawad";

/** Every position category, in the order `/people` shows them. */
export const POSITION_CATEGORIES: readonly PositionCategory[] = [
  "house",
  "executive",
  "council",
  "captain",
  "kagawad",
  "sk-chair",
  "sk-kagawad",
];

const CITY_CATEGORY: Record<CitySeat, PositionCategory> = {
  representative: "house",
  mayor: "executive",
  "vice-mayor": "council",
  councilor: "council",
};

/** One office a person holds. */
export type Position = {
  /** Position, e.g. "Mayor", "Barangay Captain", "SK Kagawad". */
  role: string;
  category: PositionCategory;
  kind: PersonKind;
  /** The barangay's slug, for barangay and SK officials. */
  barangay?: string;
  /** Council district, for councilors and barangay officials. */
  district?: District;
  /** Index into `CITY_OFFICIALS`, for city officials. */
  cityIndex?: number;
};

/**
 * Someone with a page at `/people/<slug>`: a person from
 * `data/people/<id>.yaml` and the offices they hold, in the order the city
 * and barangay files list them.
 */
export type Person = {
  /** Their ULID, the name of their file in `data/people/`. */
  id: string;
  /** Their URL slug: `/people/<slug>`. */
  slug: string;
  name: string;
  /** Their ids in other records (Wikidata, Open Congress Data, …). */
  ids: ExternalIds;
  /** Never empty: the loader fails on a person who holds no office. */
  positions: Position[];
};

/** One person in one office: what a card on `/people` shows. */
export type Officeholder = { person: Person; position: Position };

type Holding = { id: string; position: Position };

const holdings: Holding[] = [
  ...CITY_OFFICIALS.map((o, cityIndex): Holding => ({
    id: o.personId,
    position: {
      role: o.role,
      category: CITY_CATEGORY[o.seat],
      kind: "city",
      ...(o.district ? { district: o.district } : {}),
      cityIndex,
    },
  })),
  ...BARANGAYS.flatMap((b): Holding[] => {
    const at = { barangay: b.slug, district: b.district };
    const ids = b.officialIds;
    const hold = (
      id: string,
      role: string,
      category: PositionCategory,
      kind: PersonKind,
    ): Holding => ({ id, position: { ...at, role, category, kind } });
    return [
      hold(ids.captain, COPY.captain, "captain", "barangay"),
      ...ids.kagawads.map((id) =>
        hold(id, COPY.kagawad, "kagawad", "barangay"),
      ),
      hold(ids.skChair, COPY.skChair, "sk-chair", "sk"),
      ...ids.skKagawads.map((id) =>
        hold(id, COPY.skKagawad, "sk-kagawad", "sk"),
      ),
    ];
  }),
];

const records = new Map(LOADED_PEOPLE.map((p) => [p.id, p]));
const byId = new Map<string, Person>();
for (const { id, position } of holdings) {
  let person = byId.get(id);
  if (!person) {
    const r = records.get(id)!; // the loader checked every id
    person = { id, slug: r.slug, name: r.name, ids: r.ids, positions: [] };
    byId.set(id, person);
  }
  person.positions.push(position);
}

/** Everyone: city officials first, then each barangay's officials. */
export const PEOPLE: Person[] = [...byId.values()];

const bySlug = new Map(PEOPLE.map((p) => [p.slug, p]));
const byKey = new Map(
  PEOPLE.flatMap((p) =>
    p.positions.map((pos) => [
      hrefKey(pos.barangay ?? "city", pos.role, p.name),
      p.slug,
    ]),
  ),
);

/** The person with this URL slug, or `undefined`. */
export function getPerson(slug: string): Person | undefined {
  return bySlug.get(slug);
}

/** The person with this id (ULID), or `undefined`. */
export function getPersonById(id: string): Person | undefined {
  return byId.get(id);
}

/** The `/people/…` path for a person. */
export function personPath(person: Pick<Person, "slug">): string {
  return `/people/${person.slug}`;
}

/**
 * Everyone holding an office in one category, as person-and-position pairs,
 * in the order the data lists them (barangays by name).
 */
export function officeholders(category: PositionCategory): Officeholder[] {
  return PEOPLE.flatMap((person) =>
    person.positions
      .filter((position) => position.category === category)
      .map((position) => ({ person, position })),
  );
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
  PEOPLE.flatMap((p) =>
    p.positions
      .filter((pos) => pos.barangay)
      .map((pos) => [
        hrefKey(pos.barangay!, pos.role, p.name),
        `/people/${p.slug}`,
      ]),
  ),
);
