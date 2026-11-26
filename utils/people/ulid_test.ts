import { describe, expect, it } from "vitest";
import { ULID, ulid, ulidTime } from "./ulid.ts";

describe("ulid", () => {
  it("makes valid ULIDs that carry their time", () => {
    const id = ulid(1_700_000_000_000);
    expect(id).toMatch(ULID);
    expect(ulidTime(id)).toBe(1_700_000_000_000);
  });

  it("draws fresh random characters even within one millisecond", () => {
    const ids = Array.from({ length: 200 }, () => ulid(5));
    expect(new Set(ids).size).toBe(200);
    // No shared random prefix: the 16 random characters start differently.
    const starts = new Set(ids.map((id) => id.slice(10, 13)));
    expect(starts.size).toBeGreaterThan(150);
  });

  it("reads back the time of the spec's example ULID", () => {
    const example = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
    expect(ulid(ulidTime(example)).slice(0, 10)).toBe("01ARZ3NDEK");
  });

  it("rejects lowercase and the letters I, L, O, U", () => {
    expect("01arz3ndektsv4rrffq69g5fav").not.toMatch(ULID);
    expect("01ARZ3NDEKTSV4RRFFQ69G5FAI").not.toMatch(ULID);
    expect("01ARZ3NDEKTSV4RRFFQ69G5FAV").toMatch(ULID);
  });

  it("rejects a time out of range", () => {
    expect(() => ulid(-1)).toThrow(/out of range/);
  });
});
