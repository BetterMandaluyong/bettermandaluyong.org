import type { Pillar } from "./content.ts";

/**
 * A bordered grid of focus areas (title + one line each). Columns wrap at
 * 14rem, so it stacks on phones. `label` names the list for screen readers.
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
      className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-px overflow-hidden rounded-2xl border border-line bg-line p-0"
    >
      {pillars.map((pillar) => (
        <li key={pillar.title} className="flex flex-col gap-1.5 bg-surface p-6">
          <strong className="font-display text-xl font-medium">
            {pillar.title}
          </strong>
          <span className="text-[0.9375rem] text-muted">{pillar.body}</span>
        </li>
      ))}
    </ul>
  );
}
