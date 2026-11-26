import { describe, expect, it } from "vitest";
import type { OrgNode } from "../components/OrgChart.tsx";
import { BARANGAYS } from "./barangays.ts";
import { CITY_OFFICIALS } from "./city-officials.ts";
import { buildOrgChart } from "./org-chart.ts";
import { personHref } from "./people.ts";

function all(node: OrgNode): OrgNode[] {
  return [node, ...(node.children ?? []).flatMap(all)];
}

describe("buildOrgChart", () => {
  const root = buildOrgChart();
  const nodes = all(root);
  const hrefs = nodes.flatMap((n) => (n.people ?? []).map((p) => p.href));

  it("has Congress, City Hall, and the barangays under the city", () => {
    expect(root.children?.map((c) => c.title)).toEqual([
      "Congress",
      "City Hall",
      "Barangays",
    ]);
  });

  it("links every city official to their page", () => {
    for (const o of CITY_OFFICIALS) {
      expect(hrefs, o.name).toContain(personHref(o.name, o.role));
    }
  });

  it("shows every barangay once, linked, with its captain and SK chair", () => {
    const barangayNodes = nodes.filter((n) =>
      n.href?.startsWith("/barangays/"),
    );
    expect(barangayNodes.map((n) => n.href).sort()).toEqual(
      BARANGAYS.map((b) => `/barangays/${b.slug}`).sort(),
    );
    for (const b of BARANGAYS) {
      const node = barangayNodes.find((n) => n.href === `/barangays/${b.slug}`);
      expect(node?.people?.map((p) => p.name)).toEqual([b.captain, b.skChair]);
      for (const p of node?.people ?? []) expect(p.href, p.name).toBeTruthy();
    }
  });
});
