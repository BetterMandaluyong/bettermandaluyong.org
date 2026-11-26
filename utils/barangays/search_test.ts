import { describe, expect, it } from "vitest";
import { BARANGAYS } from "../../data/barangays.ts";
import { normalize, searchBarangays } from "./search.ts";

const slugs = (q: string) =>
  searchBarangays(BARANGAYS, q).map((h) => h.barangay.slug);

describe("normalize", () => {
  it("lowercases and folds accents and punctuation", () => {
    expect(normalize("  Zañiga, Old-Zaniga ")).toBe("zaniga old zaniga");
  });
});

describe("searchBarangays", () => {
  it("returns every barangay for an empty query", () => {
    expect(slugs("")).toHaveLength(27);
    expect(slugs("   ")).toHaveLength(27);
  });

  it("matches the start of a name word, ignoring case", () => {
    expect(slugs("HULO")).toEqual(["hulo"]);
    expect(slugs("barangka")).toEqual([
      "barangka-drive",
      "barangka-ibaba",
      "barangka-ilaya",
      "barangka-itaas",
    ]);
  });

  it("finds Zañiga without typing the ñ", () => {
    expect(slugs("zaniga").sort()).toEqual(["new-zaniga", "old-zaniga"]);
  });

  it("matches ZIP codes", () => {
    expect(slugs("1551")).toEqual(["vergara"]);
    expect(slugs("1552").sort()).toEqual([
      "addition-hills",
      "highway-hills",
      "pleasant-hills",
    ]);
  });

  it("matches 'district 1' without matching every ZIP that contains a 1", () => {
    const d1 = slugs("district 1");
    expect(d1).toHaveLength(14);
    expect(slugs("district 2")).toHaveLength(13);
  });

  it("finds a barangay through an official and says who matched", () => {
    const hits = searchBarangays(BARANGAYS, "jose parong");
    expect(hits.map((h) => h.barangay.slug)).toEqual(["hulo"]);
    expect(hits[0].official).toEqual({
      name: "Joseph Parong Jose",
      role: "Barangay Captain",
    });
  });

  it("matches accented official names without the accent", () => {
    const hits = searchBarangays(BARANGAYS, "dave nunez");
    expect(hits[0]?.barangay.slug).toBe("hagdang-bato-libis");
    expect(hits[0].official?.role).toBe("SK Kagawad");
  });

  it("does not report an official when the barangay itself matched", () => {
    expect(searchBarangays(BARANGAYS, "hulo")[0].official).toBeUndefined();
  });

  it("returns nothing when no word matches", () => {
    expect(slugs("zzzz")).toEqual([]);
  });
});
