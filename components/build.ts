/**
 * Which commit this build came from. `vite.config.ts` replaces
 * `__COMMIT_SHA__` at build time (Workers Builds' WORKERS_CI_COMMIT_SHA,
 * GitHub's GITHUB_SHA, or `git rev-parse HEAD`). Outside Vite (unit tests) it
 * is undefined, so read it through `COMMIT_SHA`.
 */
declare global {
  const __COMMIT_SHA__: string | undefined;
}

/** Full commit SHA of this build, or "" when unknown. */
export const COMMIT_SHA: string =
  typeof __COMMIT_SHA__ === "string" ? __COMMIT_SHA__ : "";

/**
 * Shortens a commit SHA to its first 7 characters (git's default), or returns
 * "" if `sha` is not a hex SHA.
 */
export function shortSha(sha: string): string {
  const s = sha.trim().toLowerCase();
  return /^[0-9a-f]{7,40}$/.test(s) ? s.slice(0, 7) : "";
}

/**
 * Builds the GitHub URL of a commit in `repoUrl`, or returns "" if `sha` is
 * not a hex SHA.
 */
export function commitUrl(repoUrl: string, sha: string): string {
  const s = sha.trim().toLowerCase();
  if (!/^[0-9a-f]{7,40}$/.test(s)) return "";
  return `${repoUrl.replace(/\/+$/, "")}/commit/${s}`;
}
