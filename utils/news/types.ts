/** A link-only entry from the city's news feed. Never carries article text. */
export type FeedItem = {
  source: "city-website";
  sourceId: string;
  url: string;
  title: string;
  /** ISO 8601 timestamp in Manila time (+08:00). */
  publishedAt: string;
  categories: string[];
};
