import { describe, expect, it } from "vitest";
import { displayName, splitName } from "./names.ts";

describe("displayName", () => {
  it("writes first, nickname, middle, last, suffix", () => {
    expect(
      displayName({
        first_name: "Antonio",
        nickname: "Anthony",
        middle_name: "delos Santos",
        last_name: "Suva",
        suffix: "Jr.",
      }),
    ).toBe("Antonio “Anthony” delos Santos Suva Jr.");
    expect(
      displayName({ first_name: "Kristofer", last_name: "Dominguez" }),
    ).toBe("Kristofer Dominguez");
  });
});

describe("splitName", () => {
  it.each([
    [
      "Kristofer Dominguez",
      { first_name: "Kristofer", last_name: "Dominguez" },
    ],
    [
      "Rhuby Rose O. Manlosa",
      { first_name: "Rhuby Rose", middle_name: "O.", last_name: "Manlosa" },
    ],
    [
      "Ma. Consuelo R. Rosal",
      { first_name: "Ma. Consuelo", middle_name: "R.", last_name: "Rosal" },
    ],
    [
      "Hubert DG. De Los Santos",
      { first_name: "Hubert", middle_name: "DG.", last_name: "De Los Santos" },
    ],
    [
      "Fernando Dv. Gavino Jr.",
      {
        first_name: "Fernando",
        middle_name: "Dv.",
        last_name: "Gavino",
        suffix: "Jr.",
      },
    ],
    [
      "Estanislao “Junis” V. Alim III",
      {
        first_name: "Estanislao",
        middle_name: "V.",
        last_name: "Alim",
        suffix: "III",
        nickname: "Junis",
      },
    ],
    [
      "Alexander “Alex” C. Sta. Maria",
      {
        first_name: "Alexander",
        middle_name: "C.",
        last_name: "Sta. Maria",
        nickname: "Alex",
      },
    ],
  ])("splits %s by its shape", (written, name) => {
    expect(splitName(written)).toEqual({ name, certain: true });
    expect(displayName(splitName(written).name)).toBe(written);
  });

  it("says when the shape doesn't decide it", () => {
    expect(splitName("Kent Gajo Faminial")).toEqual({
      name: { first_name: "Kent Gajo", last_name: "Faminial" },
      certain: false,
    });
  });
});
