// Node-only: reads and writes data/news/*.yaml for the scripts. The site
// itself never imports this; it reads the files through data/news.ts.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { parseNewsFile } from "../../data/schema.ts";
import { serializeAll, type NewsState } from "./repo.ts";

/** Reads every `YYYY-MM.yaml` in `dir`, validated. A missing folder is an empty record. */
export function loadNewsState(dir: string): NewsState {
  const state: NewsState = new Map();
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith(".yaml"));
  } catch {
    return state;
  }
  for (const name of names) {
    const month = name.replace(/\.yaml$/, "");
    const file = `data/news/${name}`;
    const items = parseNewsFile(
      parse(readFileSync(join(dir, name), "utf8")),
      file,
      month,
    );
    for (const item of items) {
      if (state.has(item.id)) {
        throw new Error(`${file}: post ${item.id} is also in another file`);
      }
      state.set(item.id, item);
    }
  }
  return state;
}

/** Writes the month files, leaving unchanged ones untouched. Returns the months written. */
export function writeNewsState(dir: string, state: NewsState): string[] {
  mkdirSync(dir, { recursive: true });
  const written: string[] = [];
  for (const [month, text] of Object.entries(serializeAll(state))) {
    const path = join(dir, `${month}.yaml`);
    let current: string | null = null;
    try {
      current = readFileSync(path, "utf8");
    } catch {
      current = null;
    }
    if (current !== text) {
      writeFileSync(path, text);
      written.push(month);
    }
  }
  return written.sort();
}
