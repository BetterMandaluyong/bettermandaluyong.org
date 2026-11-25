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

/** The scheduled jobs that make up the news pipeline. */
export type JobName = "feed" | "archive" | "removal";

/** The slice of a prepared SQL statement the news store uses. D1 satisfies it structurally. */
export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
  first<T>(): Promise<T | null>;
}

/** The slice of a SQL database the news store uses. D1 satisfies it structurally. */
export interface SqlDb {
  prepare(sql: string): SqlStatement;
  batch(statements: SqlStatement[]): Promise<unknown[]>;
}
