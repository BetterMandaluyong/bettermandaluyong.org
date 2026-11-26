// Node-only: reads and writes data/bids/*.yaml and data/jobs/*.yaml for the
// scripts. The site itself never imports this; it reads the files through
// data/bids.ts and data/jobs.ts.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  parseBidsFile,
  parseJobsFile,
  type CityNotice,
} from "../../data/schema.ts";
import { FILE_HEADER, serializeByYear, type NoticeState } from "./repo.ts";
import type { NoticeRecords } from "./jobs.ts";

function load<K extends string>(
  dir: string,
  name: "bids" | "jobs",
  parseFile: (raw: unknown, file: string, year: string) => CityNotice<K>[],
): NoticeState<K> {
  const state: NoticeState<K> = new Map();
  let files: string[];
  try {
    files = readdirSync(dir).filter((n) => n.endsWith(".yaml"));
  } catch {
    return state;
  }
  for (const f of files) {
    const year = f.replace(/\.yaml$/, "");
    const file = `data/${name}/${f}`;
    const raw: unknown = parse(readFileSync(join(dir, f), "utf8"));
    for (const item of parseFile(raw, file, year)) {
      if (state.has(item.id)) {
        throw new Error(`${file}: ${item.id} is also in another file`);
      }
      state.set(item.id, item);
    }
  }
  return state;
}

/** Reads every `YYYY.yaml` in `<root>/bids` and `<root>/jobs`, validated. A missing folder is an empty record. */
export function loadNoticeRecords(root: string): NoticeRecords {
  return {
    bids: load(join(root, "bids"), "bids", parseBidsFile),
    jobs: load(join(root, "jobs"), "jobs", parseJobsFile),
  };
}

function write(
  dir: string,
  files: Record<string, string>,
  prefix: string,
): string[] {
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const [year, text] of Object.entries(files)) {
    const path = join(dir, `${year}.yaml`);
    let current: string | null = null;
    try {
      current = readFileSync(path, "utf8");
    } catch {
      current = null;
    }
    if (current !== text) {
      writeFileSync(path, text);
      written.push(`${prefix}/${year}`);
    }
  }
  return written;
}

/** Writes the year files under `<root>/bids` and `<root>/jobs`, leaving unchanged ones untouched. Returns what it wrote, e.g. ["bids/2026"]. */
export function writeNoticeRecords(
  root: string,
  records: NoticeRecords,
): string[] {
  return [
    ...write(
      join(root, "bids"),
      serializeByYear(records.bids, FILE_HEADER.bids),
      "bids",
    ),
    ...write(
      join(root, "jobs"),
      serializeByYear(records.jobs, FILE_HEADER.jobs),
      "jobs",
    ),
  ].sort();
}
