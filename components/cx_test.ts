import { describe, expect, it } from "vitest";
import { cx } from "./cx.ts";

describe("cx", () => {
  it("joins class names with single spaces", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("skips false, null, undefined, and empty strings", () => {
    const off = false as boolean;
    expect(cx("a", off && "b", null, undefined, "", "c")).toBe("a c");
  });

  it("returns an empty string when nothing is left", () => {
    expect(cx()).toBe("");
    expect(cx(false, null, undefined)).toBe("");
  });

  it("keeps conflicting classes as given, without merging", () => {
    expect(cx("p-4", "p-2")).toBe("p-4 p-2");
  });
});
