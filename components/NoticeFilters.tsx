import { Button } from "./Button.tsx";
import { NOTICES } from "./content.ts";
import type { NoticeFilters as Filters } from "../utils/notices/query.ts";
import { NOTICE_SORTS, MAX_NOTICE_QUERY } from "../utils/notices/query.ts";

/** One choice in the type dropdown: the kind's value and what it is called. */
export type KindOption = { value: string; label: string };

const field =
  "type-body min-h-11 w-full rounded-none border border-ed-rule-strong bg-white px-3 text-ed-ink";
const labelClass = "type-label mb-2 block text-ed-ink-3";

/**
 * The search and filter form above a notice list: a title search, a type
 * dropdown ("All" plus `kinds`), a "Date posted" from–to range, and the sort
 * order, with "Apply filters" and, when `active`, a "Clear filters" link back
 * to `action`. A plain GET form to `action`, so it works without JavaScript
 * and every filtered list has its own address; `values` fills it in from the
 * current one. Server component.
 */
export function NoticeFilters({
  action,
  values,
  kinds,
  active,
  className,
}: {
  action: string;
  values: Omit<Filters, "page">;
  kinds: KindOption[];
  active: boolean;
  className?: string;
}) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label={NOTICES.filtersLabel}
      className={className}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="notice-q" className={labelClass}>
            {NOTICES.searchLabel}
          </label>
          <input
            id="notice-q"
            name="q"
            type="search"
            defaultValue={values.q}
            placeholder={NOTICES.searchPlaceholder}
            maxLength={MAX_NOTICE_QUERY}
            autoComplete="off"
            className={field}
          />
        </div>
        <div>
          <label htmlFor="notice-kind" className={labelClass}>
            {NOTICES.kindLabel}
          </label>
          <select
            id="notice-kind"
            name="kind"
            defaultValue={values.kind ?? ""}
            className={field}
          >
            <option value="">{NOTICES.allKinds}</option>
            {kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notice-sort" className={labelClass}>
            {NOTICES.sortLabel}
          </label>
          <select
            id="notice-sort"
            name="sort"
            defaultValue={values.sort}
            className={field}
          >
            {NOTICE_SORTS.map((s) => (
              <option key={s} value={s}>
                {NOTICES.sorts[s]}
              </option>
            ))}
          </select>
        </div>
        <fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0 sm:col-span-2 sm:grid-cols-2">
          <legend className="type-label mb-2 p-0 text-ed-ink-3 sm:col-span-2">
            {NOTICES.dateLegend}
          </legend>
          <div>
            <label htmlFor="notice-from" className="type-ui mb-1 block">
              {NOTICES.fromLabel}
            </label>
            <input
              id="notice-from"
              name="from"
              type="date"
              defaultValue={values.from ?? ""}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="notice-to" className="type-ui mb-1 block">
              {NOTICES.toLabel}
            </label>
            <input
              id="notice-to"
              name="to"
              type="date"
              defaultValue={values.to ?? ""}
              className={field}
            />
          </div>
        </fieldset>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button type="submit">{NOTICES.apply}</Button>
        {active && (
          <Button href={action} variant="ghost">
            {NOTICES.clear}
          </Button>
        )}
      </div>
    </form>
  );
}
