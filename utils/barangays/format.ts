/**
 * Formats a `YYYY-MM-DD` date as "February 20, 2026". The date is read as a
 * calendar date, not a moment, so the viewer's time zone can't shift it.
 * Returns the input unchanged if it isn't a valid date.
 */
export function formatSourceDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
