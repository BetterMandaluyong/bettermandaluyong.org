// Header and row styling ported from bettergovph/bettergov
// src/components/v2/directory/DirectoryResults.tsx (`ListView`) at commit
// 5ead8c0 (MIT, Copyright (c) 2025-2026 BetterGov.ph contributors); see
// NOTICE.md. Changed: a generic column/row API instead of directory entries,
// our font tokens, right-aligned tabular number columns, a caption, and an
// optional footer for totals.

import type { ReactNode } from "react";
import { cx } from "./cx.ts";

/** One column: its header text and whether it holds numbers (right-aligned). */
export type DataColumn = { label: string; numeric?: boolean };

/** One row: a stable `key` and one cell per column, in column order. */
export type DataRow = { key: string; cells: ReactNode[] };

const CELL = "px-4 py-3 align-top max-md:px-3 max-md:py-2.5";

/**
 * A ruled data table for figures people compare across rows (population by
 * barangay, a budget's lines). Mono uppercase headers on paper, hairline row
 * rules, numbers right-aligned in tabular digits. The first column is the
 * row's header (`<th scope="row">`). Scrolls sideways on its own on narrow
 * screens rather than widening the page. Takes `caption` (read out by
 * screen readers, hidden on screen), `columns`, `rows`, and optional `footer`
 * rows (totals), shown bold under a heavier rule. Server component.
 */
export function DataTable({
  caption,
  columns,
  rows,
  footer = [],
  className,
}: {
  caption: string;
  columns: DataColumn[];
  rows: DataRow[];
  footer?: DataRow[];
  className?: string;
}) {
  const align = (i: number) =>
    columns[i]?.numeric ? "text-right tabular-nums" : "text-left";
  const line = (row: DataRow, bold: boolean) => (
    <tr key={row.key} className="border-b border-ed-rule">
      {row.cells.map((cell, i) =>
        i === 0 ? (
          <th
            key={i}
            scope="row"
            className={cx(
              CELL,
              align(i),
              "type-body text-ed-ink",
              bold ? "font-semibold" : "font-normal",
            )}
          >
            {cell}
          </th>
        ) : (
          <td
            key={i}
            className={cx(
              CELL,
              align(i),
              "type-body text-ed-ink-2",
              bold && "font-semibold text-ed-ink",
            )}
          >
            {cell}
          </td>
        ),
      )}
    </tr>
  );
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full border-collapse font-sans">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={c.label}
                scope="col"
                className={cx(
                  "border-y border-ed-ink bg-ed-paper-2 px-4 py-3 font-mono text-[11px] font-medium tracking-[0.12em] text-ed-ink-2 uppercase max-md:px-3 max-md:py-2",
                  align(i),
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((r) => line(r, false))}</tbody>
        {footer.length > 0 && (
          <tfoot className="border-t-2 border-ed-ink">
            {footer.map((r) => line(r, true))}
          </tfoot>
        )}
      </table>
    </div>
  );
}
