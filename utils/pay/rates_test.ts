import { describe, expect, it } from "vitest";
import type { Office, OfficePay, Pay } from "../../data/schema.ts";
import { officeRate, trancheFor } from "./rates.ts";

const cite = (title: string) => ({
  title,
  url: `https://example.com/${title}`,
});
const office = (grade: number, extra: Partial<OfficePay> = {}): OfficePay => ({
  grade,
  cap: false,
  schedule: "local",
  basis: "Sample Act",
  url: "https://example.com/act",
  unconfirmed: false,
  ...extra,
});

const pay: Pay = {
  checked: "2026-01-01",
  law: cite("law"),
  tranches: [
    {
      year: 2024,
      national: cite("n24"),
      local: cite("l24"),
      step1: { 10: 100, 30: 300 },
    },
    {
      year: 2026,
      national: cite("n26"),
      local: cite("l26"),
      step1: { 10: 110, 30: 330 },
    },
  ],
  offices: {
    representative: office(30, { schedule: "national" }),
    mayor: office(30),
    "vice-mayor": office(30),
    councilor: office(30, { unconfirmed: true }),
    captain: office(10, { cap: true }),
    kagawad: office(10, { cap: true }),
    "sk-chair": office(10, { cap: true }),
    "sk-kagawad": office(10, { cap: true }),
  } satisfies Record<Office, OfficePay>,
};

describe("trancheFor", () => {
  it("picks the latest schedule that has started", () => {
    expect(trancheFor(pay.tranches, 2024)?.year).toBe(2024);
    expect(trancheFor(pay.tranches, 2025)?.year).toBe(2024);
    expect(trancheFor(pay.tranches, 2026)?.year).toBe(2026);
  });
  it("keeps the last schedule after it, and has none before the first", () => {
    expect(trancheFor(pay.tranches, 2030)?.year).toBe(2026);
    expect(trancheFor(pay.tranches, 2023)).toBeUndefined();
  });
});

describe("officeRate", () => {
  it("gives the monthly and yearly basic pay for the office's grade", () => {
    const r = officeRate(pay, "mayor", 2026)!;
    expect(r).toMatchObject({
      grade: 30,
      monthly: 330,
      yearly: 3960,
      year: 2026,
      cap: false,
    });
    expect(r.circular.title).toBe("l26");
    expect(r.basis).toEqual({
      title: "Sample Act",
      url: "https://example.com/act",
    });
  });
  it("uses the national circular for the House", () => {
    expect(officeRate(pay, "representative", 2025)!.circular.title).toBe("n24");
  });
  it("marks honoraria as caps and unconfirmed grades as such", () => {
    expect(officeRate(pay, "kagawad", 2026)).toMatchObject({
      cap: true,
      monthly: 110,
    });
    expect(officeRate(pay, "councilor", 2026)!.unconfirmed).toBe(true);
  });
  it("has nothing before the first schedule", () => {
    expect(officeRate(pay, "mayor", 2020)).toBeUndefined();
  });
});
