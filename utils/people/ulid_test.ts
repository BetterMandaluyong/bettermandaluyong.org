import { describe, expect, it } from "vitest";
import { ULID, ulidFactory, ulidTime } from "./ulid.ts";

describe("ulidFactory", () => {
  it("makes valid ULIDs that carry their time", () => {
    const id = ulidFactory(() => 1_700_000_000_000)();
    expect(id).toMatch(ULID);
    expect(ulidTime(id)).toBe(1_700_000_000_000);
  });

  it("sorts ids made in the same millisecond in order", () => {
    const bytes = new Uint8Array(16).fill(31);
    bytes[14] = 0;
    const make = ulidFactory(
      () => 5,
      () => bytes,
    );
    const a = make();
    const b = make();
    expect(a.slice(-2)).toBe("0Z");
    expect(b > a).toBe(true);
    expect(b.slice(-2)).toBe("10");
  });

  it("throws rather than wrap when the random part is used up", () => {
    const make = ulidFactory(
      () => 5,
      () => new Uint8Array(16).fill(31),
    );
    make();
    expect(() => make()).toThrow(/overflowed/);
  });

  it("reads back the time of the spec's example ULID", () => {
    const example = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
    const id = ulidFactory(() => ulidTime(example))();
    expect(id.slice(0, 10)).toBe("01ARZ3NDEK");
  });

  it("rejects lowercase and the letters I, L, O, U", () => {
    expect("01arz3ndektsv4rrffq69g5fav").not.toMatch(ULID);
    expect("01ARZ3NDEKTSV4RRFFQ69G5FAI").not.toMatch(ULID);
    expect("01ARZ3NDEKTSV4RRFFQ69G5FAV").toMatch(ULID);
  });
});
