import { parseBidsFile, type BidNotice } from "./schema.ts";
import { sortNotices } from "../utils/notices/query.ts";

// Vite reads and parses every YAML file at build time (vite-plugins/yaml.ts).
const files = import.meta.glob("./bids/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

/** Every city bid notice from `data/bids/*.yaml`, validated, newest published first. */
export const BID_NOTICES: BidNotice[] = sortNotices(
  Object.entries(files).flatMap(([path, raw]) => {
    const year = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return parseBidsFile(raw, `data/bids/${year}.yaml`, year);
  }),
);
