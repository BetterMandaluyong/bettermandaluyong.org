import { parseJobsFile, type JobNotice } from "./schema.ts";
import { sortNotices } from "../utils/notices/query.ts";

// Vite reads and parses every YAML file at build time (vite-plugins/yaml.ts).
const files = import.meta.glob("./jobs/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

/** Every city job post (City Hall vacancies and PESO listings) from `data/jobs/*.yaml`, validated, newest published first. */
export const JOB_NOTICES: JobNotice[] = sortNotices(
  Object.entries(files).flatMap(([path, raw]) => {
    const year = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return parseJobsFile(raw, `data/jobs/${year}.yaml`, year);
  }),
);
