// A small client for the BetterGov.ph Budget API (https://budget.bettergov.ph/docs):
// read-only, no auth. Used by scripts/budget_refresh.ts only; the site never
// calls the API, it reads the snapshot in data/budget/. `fetch` is passed in
// so tests can answer from fixtures.

/** The API's base address. */
export const BUDGET_API = "https://budget.bettergov.ph/api/v1";

/** Sent with every request, as the API asks of automated clients. */
export const BUDGET_USER_AGENT =
  "BetterMandaluyong.org budget snapshot (+https://github.com/BetterMandaluyong/bettermandaluyong.org)";

/** The 2027 lists are paged at this size, the API's maximum. */
const PROJECT_PAGE = 200;
/** No single place should match more lines than this; more means a bad query. */
export const PROJECT_CAP = 4000;
/** The GAA program lists are paged at this size, the API's maximum. */
const GAA_PAGE = 500;

/** A `fetch` with the global signature. */
export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/** A disclaimer as the API sends it. */
export type ApiDisclaimer = {
  id: string;
  title: string;
  body: string;
  url: string;
};

/** The parts of a 2027 project row the snapshot keeps. */
export type ApiProjectRow = {
  id: string;
  dataset: string;
  title: string;
  program: string | null;
  region_key: string | null;
  office: string | null;
  status_label: string;
  bridge_group: string;
  held: boolean;
  nep_php: number | null;
  house_php: number | null;
  delta_php: number | null;
  pdf_url: { nep: string | null; hgab2: string | null; hgab3: string | null };
  lat: number | null;
  lon: number | null;
  url: string;
};

/** The `/hgab/2027` overview: labels, source, disclaimers. */
export type ApiOverview = {
  meta: { source_commit: string; built_at: string; notice: string };
  disclaimers: ApiDisclaimer[];
  data: { datasets: { key: string; label: string }[] };
};

/** One office on a district card. */
export type ApiOffice = {
  name: string;
  kind_label: string;
  tier: string;
  tier_text: string;
  /** Every district the office serves, this one included. */
  district_ids: string[];
};

/** A district card in full (`/hgab/2027/districts/{id}` → `data`). */
export type ApiDistrict = {
  id: string;
  label: string;
  url: string;
  attribution: { code: string; label: string };
  offices: ApiOffice[];
  headline: {
    fy2026_gaa_php: number | null;
    fy2027_nep_php: number | null;
    fy2027_hgab3_php: number | null;
  };
  fy2027_vs_proposal: {
    nep_php: number | null;
    hgab3_php: number | null;
    delta_php: number | null;
  };
  co_served_districts: { id: string; label: string }[];
};

/** A GAA department from `/gaa/departments`. */
export type ApiDepartment = { id: string; description: string };

/** A GAA program family from `/gaa/departments/{id}/programs`. */
export type ApiGaaProgram = {
  department_id: string;
  fam_key: string;
  name: string;
  years: Record<string, { count: number; amount: number }>;
};

/** Fetches one API path and returns its JSON. Throws with the path and status on failure. */
export async function getJson<T>(fetchFn: FetchLike, path: string): Promise<T> {
  const res = await fetchFn(`${BUDGET_API}${path}`, {
    headers: { "User-Agent": BUDGET_USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Budget API ${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Every 2027 line in one program whose text matches `q`, every page. Throws past `PROJECT_CAP`. */
export async function allProjects(
  fetchFn: FetchLike,
  program: string,
  q: string,
): Promise<ApiProjectRow[]> {
  const rows: ApiProjectRow[] = [];
  let offset: number | null = 0;
  while (offset !== null) {
    const path: string = `/hgab/2027/datasets/${program}/projects?q=${encodeURIComponent(q)}&limit=${PROJECT_PAGE}&offset=${offset}`;
    const body: {
      data: { rows: ApiProjectRow[]; next_offset: number | null };
    } = await getJson<{
      data: { rows: ApiProjectRow[]; next_offset: number | null };
    }>(fetchFn, path);
    rows.push(...body.data.rows);
    if (rows.length > PROJECT_CAP) {
      throw new Error(
        `Budget API: "${q}" matches more than ${PROJECT_CAP} ${program} lines; narrow the place name`,
      );
    }
    offset = body.data.next_offset;
  }
  return rows;
}

/** Every GAA program family in one department whose name matches `q`, every page. */
export async function allGaaPrograms(
  fetchFn: FetchLike,
  department: string,
  q: string,
): Promise<ApiGaaProgram[]> {
  const rows: ApiGaaProgram[] = [];
  let cursor: string | null = null;
  do {
    const path: string =
      `/gaa/departments/${department}/programs?q=${encodeURIComponent(q)}&limit=${GAA_PAGE}` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "");
    const body: { data: ApiGaaProgram[]; next_cursor: string | null } =
      await getJson<{
        data: ApiGaaProgram[];
        next_cursor: string | null;
      }>(fetchFn, path);
    rows.push(...body.data);
    cursor = body.next_cursor;
  } while (cursor);
  return rows;
}

/** The API's own total for a GAA program search in one year (`meta.matched_amount`). */
export async function gaaMatchedAmount(
  fetchFn: FetchLike,
  department: string,
  q: string,
  year: number,
): Promise<number> {
  const body = await getJson<{ meta: { matched_amount: number | null } }>(
    fetchFn,
    `/gaa/departments/${department}/programs?q=${encodeURIComponent(q)}&year=${year}&limit=1`,
  );
  return body.meta.matched_amount ?? 0;
}
