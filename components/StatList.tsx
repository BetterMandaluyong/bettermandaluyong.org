import { cx } from "./cx.ts";

/** One headline figure: a label, the figure, and an optional note under it. */
export type Stat = {
  label: string;
  value: string;
  note?: string;
};

/**
 * Headline figures as a `<dl>` grid of hairline-ruled cells: a mono label,
 * the figure in the display face, and a short note. Four across on wide
 * screens, two on tablets, stacked on phones. Takes `items` and an accessible
 * `label`. Server component.
 */
export function StatList({
  items,
  label,
  className,
}: {
  items: Stat[];
  label: string;
  className?: string;
}) {
  return (
    <dl
      aria-label={label}
      className={cx(
        "m-0 grid grid-cols-1 border-t border-l border-ed-rule sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex flex-col gap-2 border-r border-b border-ed-rule bg-white p-5"
        >
          <dt className="type-label text-ed-ink-3">{item.label}</dt>
          <dd className="m-0 font-display text-[28px] leading-tight font-bold text-ed-ink tabular-nums">
            {item.value}
          </dd>
          {item.note && (
            <dd className="type-ui m-0 text-ed-ink-3">{item.note}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}
