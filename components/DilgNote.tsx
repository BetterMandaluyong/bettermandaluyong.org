import { BARANGAYS } from "./content.ts";
import { formatSourceDate } from "../utils/barangays/format.ts";

/**
 * Credit text for a barangay checked against the DILG Barangay Officials
 * Directory: "Checked against the DILG Barangay Officials Directory on
 * <date>." Pass it as `SourceNote` children. `dilg` is the barangay's `dilg`
 * block (renders nothing when absent); `changed` adds "Some names here come
 * from it." when the site shows a DILG name in place of the city's.
 */
export function DilgNote({
  dilg,
  changed = false,
}: {
  dilg?: { url: string; retrieved: string };
  changed?: boolean;
}) {
  if (!dilg) return null;
  return (
    <>
      {BARANGAYS.dilgBefore}{" "}
      <a href={dilg.url} rel="noreferrer" className="text-ed-navy">
        {BARANGAYS.dilgLink}
      </a>{" "}
      {BARANGAYS.dilgAfter(formatSourceDate(dilg.retrieved))}
      {changed && <> {BARANGAYS.dilgChanged}</>}
    </>
  );
}
