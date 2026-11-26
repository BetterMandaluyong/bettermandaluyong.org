import type { District } from "../data/schema.ts";
import { BARANGAYS } from "./content.ts";
import { Flag } from "./Flag.tsx";

/** One officeholder for `PersonCard` / `PersonCards`. */
export type PersonCardItem = {
  name: string;
  /** Their position, e.g. "Councilor" or "SK Kagawad". */
  role: string;
  /** Their `/people/<slug>` page; the whole card links to it. */
  href: string;
  /** Council district, shown as a flag. */
  district?: District;
  /** The barangay's display name, shown as a flag, e.g. "Hulo". */
  barangay?: string;
};

/**
 * One officeholder as a square link tile: position label, name, and flags
 * for their council district and barangay. The whole tile is one link, so
 * nothing inside it is a link. Server component.
 */
export function PersonCard({ item }: { item: PersonCardItem }) {
  return (
    <a
      href={item.href}
      className="flex h-full min-h-11 flex-col gap-1 border border-ed-rule bg-white px-4 py-3 text-ed-ink no-underline transition-colors hover:border-ed-ink motion-reduce:transition-none"
    >
      <span className="type-label text-ed-ink-3">{item.role}</span>
      <span className="type-subheading text-ed-navy">{item.name}</span>
      {(item.district || item.barangay) && (
        <span className="mt-1 flex flex-wrap gap-1.5">
          {item.district && <Flag>{BARANGAYS.district(item.district)}</Flag>}
          {item.barangay && (
            <Flag variant="outline">Barangay {item.barangay}</Flag>
          )}
        </span>
      )}
    </a>
  );
}

/**
 * A grid of `PersonCard`s that fills the row and stacks to one column on
 * phones. `label` names the list for screen readers. Server component.
 */
export function PersonCards({
  items,
  label,
}: {
  items: readonly PersonCardItem[];
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3 p-0"
    >
      {items.map((item) => (
        <li key={item.href} className="flex flex-col">
          <PersonCard item={item} />
        </li>
      ))}
    </ul>
  );
}
