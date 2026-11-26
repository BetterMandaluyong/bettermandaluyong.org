import { describe, expect, it } from "vitest";
import { hrefKey } from "./keys.ts";

describe("hrefKey", () => {
  it("joins barangay, role, and name with |", () => {
    expect(hrefKey("hulo", "Barangay Captain", "Ana Cruz")).toBe(
      "hulo|Barangay Captain|Ana Cruz",
    );
    expect(hrefKey("city", "Mayor", "Ben Uy")).toBe("city|Mayor|Ben Uy");
  });

  it("tells apart the same name in two places or roles", () => {
    const keys = new Set([
      hrefKey("hulo", "Barangay Kagawad", "Ana Cruz"),
      hrefKey("plainview", "Barangay Kagawad", "Ana Cruz"),
      hrefKey("hulo", "SK Kagawad", "Ana Cruz"),
    ]);
    expect(keys.size).toBe(3);
  });
});
