import type { OrgNode, OrgPerson } from "../components/OrgChart.tsx";
import { BARANGAYS as COPY, PEOPLE_COPY } from "../components/content.ts";
import { barangaysInDistrict, type Barangay } from "./barangays.ts";
import {
  MAYOR,
  REPRESENTATIVE,
  VICE_MAYOR,
  councilorsFor,
  type CityOfficial,
} from "./city-officials.ts";
import { getPersonById, personHref, personPath } from "./people.ts";
import type { District } from "./schema.ts";

const DISTRICTS: District[] = [1, 2];

function official(o: CityOfficial, role?: string): OrgPerson {
  const person = getPersonById(o.personId);
  return {
    name: o.name,
    ...(role ? { role } : {}),
    ...(person ? { href: personPath(person) } : {}),
  };
}

function barangayNode(b: Barangay): OrgNode {
  const link = (name: string, role: string) => {
    const href = personHref(name, role, b.slug);
    return { name, role, ...(href ? { href } : {}) };
  };
  return {
    title: b.name,
    href: `/barangays/${b.slug}`,
    people: [link(b.captain, COPY.captain), link(b.skChair, COPY.skChair)],
  };
}

/**
 * The tree `/people` draws with `OrgChart`: the city at the root, then
 * Congress (the representative), City Hall (the mayor; the Sangguniang
 * Panlungsod with the vice mayor presiding and each district's councilors),
 * and the barangays by council district, each with its captain and SK chair.
 * It shows where each office sits, not who reports to whom.
 */
export function buildOrgChart(): OrgNode {
  const barangayCount = DISTRICTS.reduce(
    (n, d) => n + barangaysInDistrict(d).length,
    0,
  );
  return {
    title: PEOPLE_COPY.orgRoot,
    children: [
      {
        title: PEOPLE_COPY.orgCongress,
        children: [
          {
            title: PEOPLE_COPY.orgHouse,
            meta: PEOPLE_COPY.orgHouseMeta,
            people: [official(REPRESENTATIVE, REPRESENTATIVE.role)],
          },
        ],
      },
      {
        title: PEOPLE_COPY.orgCityHall,
        children: [
          { title: MAYOR.role, people: [official(MAYOR)] },
          {
            title: PEOPLE_COPY.orgCouncil,
            meta: PEOPLE_COPY.orgCouncilMeta,
            people: [official(VICE_MAYOR, VICE_MAYOR.role)],
            children: DISTRICTS.map((d) => ({
              title: PEOPLE_COPY.orgCouncilors(d),
              people: councilorsFor(d).map((o) => official(o)),
            })),
          },
        ],
      },
      {
        title: PEOPLE_COPY.orgBarangays,
        meta: PEOPLE_COPY.orgBarangaysMeta(barangayCount),
        children: DISTRICTS.map((d) => {
          const list = barangaysInDistrict(d);
          return {
            title: PEOPLE_COPY.orgDistrict(d, list.length),
            grid: true,
            children: list.map(barangayNode),
          };
        }),
      },
    ],
  };
}
