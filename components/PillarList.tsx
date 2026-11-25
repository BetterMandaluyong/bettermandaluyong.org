import { Card } from "./Card.tsx";
import type { Pillar } from "./content.ts";

/**
 * Focus areas (title + one line each) as a grid of square cards; columns
 * wrap at 16rem, so it stacks on phones. `label` names the list for screen
 * readers.
 */
export function PillarList({
  pillars,
  label,
}: {
  pillars: readonly Pillar[];
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-0"
    >
      {pillars.map((pillar) => (
        <li key={pillar.title} className="flex">
          <Card className="w-full">
            <h3 className="type-subheading m-0">{pillar.title}</h3>
            <p className="type-body m-0 mt-2">{pillar.body}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}
