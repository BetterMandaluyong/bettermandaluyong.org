import { describe, expect, it } from "vitest";
import { decodeEntities, toManilaIso } from "./text.ts";

describe("toManilaIso", () => {
  it("renders a UTC instant in Manila time with a +08:00 offset", () => {
    expect(toManilaIso(new Date("2026-10-27T03:08:46Z"))).toBe(
      "2026-10-27T11:08:46+08:00",
    );
  });

  it("rolls the date over across midnight", () => {
    expect(toManilaIso(new Date("2026-12-31T20:00:00Z"))).toBe(
      "2027-01-01T04:00:00+08:00",
    );
  });
});

describe("decodeEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("A &amp; B &#8211; C&#8217;s")).toBe("A & B – C’s");
  });

  it("decodes hex entities and leaves unknown ones alone", () => {
    expect(decodeEntities("&#x2013; &nope;")).toBe("– &nope;");
  });

  it("does not double-decode", () => {
    expect(decodeEntities("&amp;lt;")).toBe("&lt;");
  });
});
