import { parseNewsFile, type NewsItem } from "./schema.ts";
import { sortNews } from "../utils/news/query.ts";

// Vite reads and parses every YAML file at build time (vite-plugins/yaml.ts).
const newsFiles = import.meta.glob("./news/*.yaml", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;

/** Every city news post from `data/news/*.yaml`, validated, newest published first. */
export const NEWS_ITEMS: NewsItem[] = sortNews(
  Object.entries(newsFiles).flatMap(([path, raw]) => {
    const month = path.replace(/^.*\//, "").replace(/\.yaml$/, "");
    return parseNewsFile(raw, `data/news/${month}.yaml`, month);
  }),
);
