import { describe, expect, it } from "vitest";
import { formatSourceDate } from "./format.ts";

describe("formatSourceDate", () => {
  it("writes a calendar date out in full", () => {
    expect(formatSourceDate("2026-02-20")).toBe("February 20, 2026");
  });

  it("returns the input when it is not a date", () => {
    expect(formatSourceDate("soon")).toBe("soon");
  });
});
