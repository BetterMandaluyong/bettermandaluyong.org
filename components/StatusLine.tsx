import { formatManilaDateTime } from "../utils/news/display.ts";
import type { LineState } from "../utils/news/status.ts";
import { Flag } from "./Flag.tsx";
import { STATUS } from "./content.ts";

const flagVariant = {
  working: "navy",
  "not-working": "red",
  "not-checked": "outline",
} as const;

/**
 * One row on the status page: the label, a flag that spells out the state
 * ("Working", "Not working", "Not checked recently"), and a muted line with
 * the last successful run in Manila time, or "No successful run yet" when
 * `lastSuccessAt` is null. Shows no error text or counts. Server component.
 */
export function StatusLine({
  label,
  state,
  lastSuccessAt,
}: {
  label: string;
  state: LineState;
  lastSuccessAt: string | null;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-ed-rule py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="type-subheading">{label}</span>
        <Flag variant={flagVariant[state]}>{STATUS.states[state]}</Flag>
      </div>
      <p className="type-ui m-0 text-ed-ink-3">
        {lastSuccessAt ? (
          <>
            {STATUS.lastSuccess}{" "}
            <time dateTime={lastSuccessAt}>
              {formatManilaDateTime(lastSuccessAt)}
            </time>
          </>
        ) : (
          STATUS.never
        )}
      </p>
    </li>
  );
}
