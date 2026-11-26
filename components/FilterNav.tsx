import { cx } from "./cx.ts";

/** One filter link: its text, where it goes, and whether it is the one showing. */
export type FilterLink = { label: string; href: string; current: boolean };

/**
 * A row of square filter links (navy outline; the current one filled navy,
 * with `aria-current="page"`), 44px tall, wrapping on phones. Plain links, so
 * filtering works without JavaScript. `label` names the `<nav>` for screen
 * readers, e.g. "Categories". Server component.
 */
export function FilterNav({
  label,
  links,
  className,
}: {
  label: string;
  links: FilterLink[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              aria-current={l.current ? "page" : undefined}
              className={cx(
                "type-ui inline-flex min-h-11 items-center border px-4 no-underline transition-colors motion-reduce:transition-none",
                l.current
                  ? "border-ed-navy bg-ed-navy text-white"
                  : "border-ed-navy text-ed-navy hover:bg-ed-navy hover:text-white",
              )}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
