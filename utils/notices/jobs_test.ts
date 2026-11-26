import { describe, expect, it } from "vitest";
import {
  kindsByLink,
  runNoticesJob,
  type NoticeDeps,
  type NoticeRecords,
} from "./jobs.ts";
import { categoryPageUrl, documentsUrl, pesoJobsUrl } from "./sources.ts";

const DOC = (slug: string) => `https://mandaluyong.gov.ph/download/${slug}/`;

const api = (id: number, slug: string, date = "2026-11-09T10:00:00") => ({
  id,
  link: DOC(slug),
  title: { rendered: slug.toUpperCase() },
  date,
});

const archive = (slugs: string[], category: string, lastPage = 1) =>
  slugs
    .map((s) => `<h3 class="blog-post_title"><a href="${DOC(s)}">${s}</a></h3>`)
    .join("\n") +
  (lastPage > 1
    ? `<a href="https://mandaluyong.gov.ph/download-category/${category}/page/${lastPage}/">${lastPage}</a>`
    : "");

type Site = Record<string, { body: string; pages?: number } | number>;

/** A fake city site: a URL maps to a body (with an optional X-WP-TotalPages) or an HTTP status. Unlisted URLs are empty archive pages. */
function fakeDeps(site: Site, now = "2026-11-26T12:00:00Z") {
  const requested: string[] = [];
  const deps: NoticeDeps = {
    fetch: async (input) => {
      const url = String(input);
      requested.push(url);
      const hit = site[url];
      if (typeof hit === "number") return new Response("", { status: hit });
      if (!hit) return new Response("<p>no posts</p>");
      return new Response(hit.body, {
        headers: { "X-WP-TotalPages": String(hit.pages ?? 1) },
      });
    },
    now: () => new Date(now),
    sleep: async () => {},
  };
  return { deps, requested };
}

const empty = (): NoticeRecords => ({ bids: new Map(), jobs: new Map() });

/** A site with two bids, one vacancy bulletin, one ordinance, and one PESO job. */
const baseSite = (): Site => ({
  [documentsUrl(1)]: {
    body: JSON.stringify([
      api(10, "itb-plastic-storage"),
      api(11, "noa-repair"),
      api(12, "bulletin-of-vacancy-june"),
      api(13, "ordinance-2026-01"),
    ]),
  },
  [categoryPageUrl("itb_bac", 1)]: {
    body: archive(["itb-plastic-storage"], "itb_bac"),
  },
  [categoryPageUrl("noa", 1)]: { body: archive(["noa-repair"], "noa") },
  [categoryPageUrl("invitation-to-bid", 1)]: {
    body: archive(["itb-plastic-storage", "noa-repair"], "invitation-to-bid"),
  },
  [categoryPageUrl("bulletin-of-vacancies", 1)]: {
    body: archive(["bulletin-of-vacancy-june"], "bulletin-of-vacancies"),
  },
  [pesoJobsUrl(1)]: {
    body: JSON.stringify([
      {
        id: 55847,
        link: "https://mandaluyong.gov.ph/jobs-peso/branch-inventory/",
        title: { rendered: "BRANCH INVENTORY &#8211; GREEN PASTURE" },
        date: "2026-06-25T14:54:12",
      },
    ]),
  },
});

describe("kindsByLink", () => {
  it("prefers the specific category over the section's parent", () => {
    const kinds = kindsByLink([
      { slug: "invitation-to-bid", urls: ["a", "b"] },
      { slug: "noa", urls: ["a"] },
      { slug: "unknown", urls: ["c"] },
    ]);
    expect([...kinds].sort()).toEqual([
      ["a", "noa"],
      ["b", "other"],
    ]);
  });
});

describe("runNoticesJob", () => {
  it("records bids by kind, vacancies, and PESO jobs; skips other documents", async () => {
    const records = empty();
    const { deps } = fakeDeps(baseSite());
    const report = await runNoticesJob(records, deps, { backfill: false });
    expect(report.ok).toBe(true);
    expect(report.problems).toEqual([]);
    expect(
      [...records.bids.values()].map((b) => [b.id, b.kind]).sort(),
    ).toEqual([
      [10, "itb"],
      [11, "noa"],
    ]);
    expect(
      [...records.jobs.values()].map((j) => [j.id, j.kind]).sort(),
    ).toEqual([
      [12, "vacancy"],
      [55847, "peso"],
    ]);
    expect(records.jobs.get(55847)).toMatchObject({
      title: "BRANCH INVENTORY – GREEN PASTURE",
      publishedAt: "2026-06-25T14:54:12+08:00",
      firstSeenAt: "2026-11-26T20:00:00+08:00",
    });
    expect(report.bids.added).toHaveLength(2);
    expect(report.jobs.added).toHaveLength(2);
  });

  it("reads every API page and, on a backfill, every archive page", async () => {
    const site = baseSite();
    site[documentsUrl(1)] = {
      body: JSON.stringify([api(10, "itb-plastic-storage")]),
      pages: 2,
    };
    site[documentsUrl(2)] = {
      body: JSON.stringify([api(20, "itb-old-one", "2024-01-05T09:00:00")]),
    };
    site[categoryPageUrl("itb_bac", 1)] = {
      body: archive(["itb-plastic-storage"], "itb_bac", 3),
    };
    site[categoryPageUrl("itb_bac", 3)] = {
      body: archive(["itb-old-one"], "itb_bac"),
    };

    const normal = fakeDeps(site);
    const records = empty();
    await runNoticesJob(records, normal.deps, { backfill: false });
    expect(normal.requested).not.toContain(categoryPageUrl("itb_bac", 3));
    expect(records.bids.has(20)).toBe(false);

    const full = fakeDeps(site);
    await runNoticesJob(records, full.deps, { backfill: true });
    expect(full.requested).toContain(categoryPageUrl("itb_bac", 3));
    expect(records.bids.get(20)?.kind).toBe("itb");
  });

  it("reports category links the document list doesn't have", async () => {
    const site = baseSite();
    site[categoryPageUrl("rfq_bac", 1)] = {
      body: archive(["rfq-ghost"], "rfq_bac"),
    };
    const { deps } = fakeDeps(site);
    const report = await runNoticesJob(empty(), deps, { backfill: false });
    expect(report.unmatched).toEqual([DOC("rfq-ghost")]);
  });

  it("refreshes known entries' titles from the API without re-reading their category", async () => {
    const records = empty();
    await runNoticesJob(records, fakeDeps(baseSite()).deps, {
      backfill: false,
    });
    const site = baseSite();
    site[documentsUrl(1)] = {
      body: JSON.stringify([
        { ...api(10, "itb-plastic-storage"), title: { rendered: "Fixed" } },
        api(11, "noa-repair"),
        api(12, "bulletin-of-vacancy-june"),
      ]),
    };
    delete site[categoryPageUrl("itb_bac", 1)];
    delete site[categoryPageUrl("invitation-to-bid", 1)];
    await runNoticesJob(records, fakeDeps(site).deps, { backfill: false });
    expect(records.bids.get(10)).toMatchObject({ title: "Fixed", kind: "itb" });
  });

  it("marks entries gone from the city site missing, then removed", async () => {
    const records = empty();
    await runNoticesJob(records, fakeDeps(baseSite()).deps, {
      backfill: false,
    });
    const site = baseSite();
    site[documentsUrl(1)] = {
      body: JSON.stringify([
        api(10, "itb-plastic-storage"),
        api(12, "bulletin-of-vacancy-june"),
      ]),
    };
    const first = await runNoticesJob(
      records,
      fakeDeps(site, "2026-11-27T12:00:00Z").deps,
      { backfill: false },
    );
    expect(first.bids.missing.map((b) => b.id)).toEqual([11]);
    const second = await runNoticesJob(
      records,
      fakeDeps(site, "2026-11-28T12:00:00Z").deps,
      { backfill: false },
    );
    expect(second.bids.removed.map((b) => b.id)).toEqual([11]);
    expect(records.bids.get(11)?.removedAt).toBe("2026-11-28T20:00:00+08:00");
  });

  it("skips the presence check when the listing is incomplete or mostly empty", async () => {
    const records = empty();
    await runNoticesJob(records, fakeDeps(baseSite()).deps, {
      backfill: false,
    });

    const partial = baseSite();
    partial[documentsUrl(1)] = {
      body: JSON.stringify([api(13, "ordinance-2026-01")]),
      pages: 2,
    };
    partial[documentsUrl(2)] = 503;
    const r1 = await runNoticesJob(records, fakeDeps(partial).deps, {
      backfill: false,
    });
    expect(r1.problems).toContain("documents: http_503");
    expect(r1.bids.missing).toEqual([]);

    const sparse = baseSite();
    sparse[documentsUrl(1)] = {
      body: JSON.stringify([api(13, "ordinance-2026-01")]),
    };
    const r2 = await runNoticesJob(records, fakeDeps(sparse).deps, {
      backfill: false,
    });
    expect(r2.bids.missing).toEqual([]);
    expect(r2.problems.join("\n")).toMatch(
      /bids: only 0 of 2 known entries listed/,
    );
  });

  it("is not ok, and changes nothing, when the document list can't be read", async () => {
    const site = baseSite();
    site[documentsUrl(1)] = 500;
    const records = empty();
    const report = await runNoticesJob(records, fakeDeps(site).deps, {
      backfill: false,
    });
    expect(report.ok).toBe(false);
    expect(report.problems).toEqual(["documents: http_500"]);
    expect(records.bids.size + records.jobs.size).toBe(0);
  });

  it("keeps going when one category page fails", async () => {
    const site = baseSite();
    site[categoryPageUrl("noa", 1)] = 502;
    const records = empty();
    const report = await runNoticesJob(records, fakeDeps(site).deps, {
      backfill: false,
    });
    expect(report.problems).toEqual(["category noa: http_502"]);
    expect(records.bids.get(11)?.kind).toBe("other");
  });

  it("never downgrades a known kind to other", async () => {
    const records = empty();
    await runNoticesJob(records, fakeDeps(baseSite()).deps, {
      backfill: false,
    });
    const site = baseSite();
    site[categoryPageUrl("noa", 1)] = 502;
    await runNoticesJob(records, fakeDeps(site).deps, { backfill: false });
    expect(records.bids.get(11)?.kind).toBe("noa");
  });
});
