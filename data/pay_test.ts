import { describe, expect, it } from "vitest";
import { OFFICES } from "./schema.ts";
import { PAY, payYear } from "./pay.ts";
import { officeRate } from "../utils/pay/rates.ts";

describe("data/pay.yaml", () => {
  it("covers every office for 2026 with the LBC 172 / NBC 601 rates", () => {
    const monthly = Object.fromEntries(
      OFFICES.map((o) => [o, officeRate(PAY, o, 2026)?.monthly]),
    );
    // Step 1 rates as printed in the DBM circulars' 2026 schedules.
    expect(monthly).toEqual({
      representative: 300961,
      mayor: 210718,
      "vice-mayor": 167129,
      councilor: 148940,
      captain: 38764,
      kagawad: 26917,
      "sk-chair": 26917,
      "sk-kagawad": 24329,
    });
  });
  it("uses the year in Manila", () => {
    // 2025-12-31 16:30 UTC is already 2026-01-01 in Manila.
    expect(payYear(new Date("2025-12-31T16:30:00Z"))).toBe(2026);
  });
});
