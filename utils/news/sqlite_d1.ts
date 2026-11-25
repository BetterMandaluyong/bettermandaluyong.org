// Test-only D1 stand-in; never import from app code.
import type { SQLInputValue } from "node:sqlite";
import type { SqlDb, SqlStatement } from "./types.ts";

// node:sqlite still emits an ExperimentalWarning on some Node versions; drop
// only that one so test output stays clean.
const emitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const text = typeof warning === "string" ? warning : warning.message;
  if (text.includes("SQLite is an experimental feature")) return;
  return (emitWarning as (...a: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;

// Loaded after the filter above: a static import would warn before it is installed.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite");

type Prepared = SqlStatement & { exec(): void };

/** Opens a fresh in-memory SQLite database shaped like the slice of D1 the news store uses. */
export function openTestDb(): SqlDb {
  const sqlite = new DatabaseSync(":memory:");
  const prepare = (sql: string, values: unknown[] = []): Prepared => ({
    bind: (...next) => prepare(sql, next),
    exec: () => {
      sqlite.prepare(sql).run(...(values as SQLInputValue[]));
    },
    run: async () => {
      sqlite.prepare(sql).run(...(values as SQLInputValue[]));
      return {};
    },
    all: async <T>() => ({
      results: sqlite.prepare(sql).all(...(values as SQLInputValue[])) as T[],
    }),
    first: async <T>() =>
      ((sqlite.prepare(sql).get(...(values as SQLInputValue[])) as
        T | undefined) ?? null) as T | null,
  });
  return {
    prepare: (sql) => prepare(sql),
    batch: async (statements) => {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) (s as Prepared).exec();
        sqlite.exec("COMMIT");
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
      return statements.map(() => ({}));
    },
  };
}

/** Wraps a test database and counts every statement run, including each statement inside a batch. */
export function countingDb(db: SqlDb): { db: SqlDb; count(): number } {
  let n = 0;
  type Wrapped = SqlStatement & { inner: SqlStatement };
  const wrap = (stmt: SqlStatement): Wrapped => ({
    inner: stmt,
    bind: (...values) => wrap(stmt.bind(...values)),
    run: () => {
      n += 1;
      return stmt.run();
    },
    all: <T>() => {
      n += 1;
      return stmt.all<T>();
    },
    first: <T>() => {
      n += 1;
      return stmt.first<T>();
    },
  });
  // Batched statements stay unwrapped (the test db executes them directly) and are counted here.
  return {
    db: {
      prepare: (sql) => wrap(db.prepare(sql)),
      batch: (statements) => {
        n += statements.length;
        return db.batch(statements.map((s) => (s as Wrapped).inner));
      },
    },
    count: () => n,
  };
}
