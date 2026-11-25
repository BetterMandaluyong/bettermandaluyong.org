/**
 * The key that finds a person's `/people/…` link: barangay slug (or "city"),
 * position, and name, joined with "|". Shared by the server pages that build
 * the link table and the explorer island that reads it.
 */
export function hrefKey(barangay: string, role: string, name: string): string {
  return `${barangay}|${role}|${name}`;
}
