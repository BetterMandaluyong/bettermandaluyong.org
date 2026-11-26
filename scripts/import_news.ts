// One-off: builds data/news/*.yaml from the city's WordPress API, then merges
// the old D1 history into it. Run by a person; the bot takes over afterwards.
//
//   node scripts/import_news.ts --backfill
//   node scripts/import_news.ts --from-d1 d1-news.json
//
// Export the D1 table first (see DEPLOYMENT.md, "Retire D1"). The export holds
// no secrets but is not meant for git: d1-news.json is in .gitignore.
import { readFileSync } from "node:fs";
import { loadNewsState, writeNewsState } from "../utils/news/files.ts";
import { d1Rows, mergeD1Rows } from "../utils/news/importer.ts";
import { mergeFeedItems } from "../utils/news/repo.ts";
import { decodeEntities, toManilaIso } from "../utils/news/text.ts";
import {
  parseWpJson,
  parseWpPosts,
  wpCategoriesUrl,
  wpPostsUrl,
} from "../utils/news/wp.ts";

const dir = "data/news";
const state = loadNewsState(dir);
const nowIso = toManilaIso(new Date());

if (process.argv.includes("--backfill")) {
  const get = async (url: string): Promise<Response> => {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    return res;
  };
  const categories = new Map<number, string>();
  const catsRes = await get(wpCategoriesUrl());
  if (!catsRes.ok) throw new Error(`categories: HTTP ${catsRes.status}`);
  for (const c of parseWpJson(await catsRes.text()) as unknown[]) {
    const { id, name } = (c ?? {}) as { id?: unknown; name?: unknown };
    if (typeof id === "number" && typeof name === "string") {
      categories.set(id, decodeEntities(name));
    }
  }
  let added = 0;
  for (let page = 1; ; page++) {
    const res = await get(wpPostsUrl(page));
    // WordPress answers 400 for a page past the end.
    if (res.status === 400) break;
    if (!res.ok) throw new Error(`posts page ${page}: HTTP ${res.status}`);
    const posts = parseWpPosts(parseWpJson(await res.text()), categories);
    if (posts.length === 0) break;
    added += mergeFeedItems(state, posts, nowIso, {
      updateExisting: false,
    }).length;
    console.log(`page ${page}: ${posts.length} posts`);
  }
  console.log(`backfill added ${added} posts`);
}

const d1Path = process.argv[process.argv.indexOf("--from-d1") + 1];
if (process.argv.includes("--from-d1")) {
  if (!d1Path || d1Path.startsWith("--"))
    throw new Error("--from-d1 needs a file");
  const r = mergeD1Rows(
    state,
    d1Rows(JSON.parse(readFileSync(d1Path, "utf8"))),
  );
  console.log(
    `D1: ${r.merged} rows merged, ${r.added} posts only D1 had, ${r.skipped} skipped`,
  );
}

if (
  !process.argv.includes("--backfill") &&
  !process.argv.includes("--from-d1")
) {
  throw new Error("usage: import_news.ts --backfill | --from-d1 <file>");
}
console.log(
  `files written: ${writeNewsState(dir, state).join(", ") || "none"}`,
);
