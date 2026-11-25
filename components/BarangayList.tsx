import type { Barangay, District } from "../data/barangays.ts";
import { BARANGAYS } from "./content.ts";

const DISTRICTS: District[] = [1, 2];

function Item({ barangay }: { barangay: Barangay }) {
  return (
    <li className="flex">
      <a
        href={`/barangays/${barangay.slug}`}
        className="flex min-h-11 w-full flex-col justify-center gap-0.5 border border-ed-rule bg-white px-4 py-3 text-ed-ink no-underline transition-colors hover:border-ed-ink"
      >
        <span className="type-subheading">{barangay.name}</span>
        <span className="type-ui text-ed-ink-3">
          {BARANGAYS.district(barangay.district)} ·{" "}
          {BARANGAYS.zip(barangay.zip)}
        </span>
      </a>
    </li>
  );
}

const GRID =
  "m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 p-0";

/**
 * The barangays as a grid of link tiles: name, council district, and
 * approximate ZIP, each linking to `/barangays/<slug>`. With
 * `groupByDistrict`, one headed list per council district. `label` names the
 * list for screen readers. This list is also the keyboard and no-JavaScript
 * way to reach everything the map shows. Server component.
 */
export function BarangayList({
  barangays,
  label,
  groupByDistrict,
}: {
  barangays: readonly Barangay[];
  label: string;
  groupByDistrict?: boolean;
}) {
  if (!groupByDistrict) {
    return (
      <ul aria-label={label} className={GRID}>
        {barangays.map((b) => (
          <Item key={b.slug} barangay={b} />
        ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {DISTRICTS.map((district) => {
        const inDistrict = barangays.filter((b) => b.district === district);
        const heading = `${BARANGAYS.district(district)} · ${inDistrict.length} barangays`;
        return (
          <section key={district} aria-label={heading}>
            <h3 className="type-subheading m-0 mb-3">{heading}</h3>
            <ul className={GRID}>
              {inDistrict.map((b) => (
                <Item key={b.slug} barangay={b} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
