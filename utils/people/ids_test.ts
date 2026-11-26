import { describe, expect, it } from "vitest";
import { findPerson, newSlug, slugifyName } from "./ids.ts";
import { withNameComments } from "./comments.ts";

describe("slugifyName", () => {
  it("folds case, accents, quotes, and punctuation", () => {
    expect(slugifyName("Dave T. Nuñez")).toBe("dave-t-nunez");
    expect(slugifyName("Alexandria “Queenie” Pahati-Gonzales")).toBe(
      "alexandria-queenie-pahati-gonzales",
    );
    expect(slugifyName("Alex C. Sta. Maria")).toBe("alex-c-sta-maria");
  });
});

describe("newSlug", () => {
  it("uses the name when it's free", () => {
    expect(newSlug("Ana Cruz", "hulo", new Set())).toBe("ana-cruz");
  });

  it("adds the place, then a number, when taken", () => {
    expect(newSlug("Ana Cruz", "hulo", new Set(["ana-cruz"]))).toBe(
      "ana-cruz-hulo",
    );
    expect(
      newSlug("Ana Cruz", "hulo", new Set(["ana-cruz", "ana-cruz-hulo"])),
    ).toBe("ana-cruz-hulo-2");
  });
});

describe("findPerson", () => {
  const known = [
    { id: "A", name: "Ana Cruz", scopes: ["hulo"] },
    { id: "B", name: "Ana Cruz", scopes: ["burol"] },
  ];

  it("reuses someone with the same name in the same place", () => {
    expect(findPerson("Ana Cruz", "burol", known)?.id).toBe("B");
  });

  it("treats the same name elsewhere as someone new", () => {
    expect(findPerson("Ana Cruz", "mauway", known)).toBeUndefined();
    expect(findPerson("Ana  Cruz", "hulo", known)).toBeUndefined();
  });
});

describe("withNameComments", () => {
  const id1 = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
  const id2 = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
  const names: Record<string, string> = { [id1]: "Ana Cruz", [id2]: "Ben Uy" };

  it("adds or refreshes the name after each id", () => {
    const yaml = `council:\n  captain: ${id1}\n  kagawads:\n    - ${id2} # Old Name\n`;
    expect(withNameComments(yaml, (id) => names[id])).toBe(
      `council:\n  captain: ${id1} # Ana Cruz\n  kagawads:\n    - ${id2} # Ben Uy\n`,
    );
  });

  it("handles a list item's first key", () => {
    expect(withNameComments(`  - person: ${id1}`, (id) => names[id])).toBe(
      `  - person: ${id1} # Ana Cruz`,
    );
  });

  it("leaves other lines and unknown ids alone", () => {
    const yaml =
      'name: Hulo\npsgc: "1380500014"\n  - 01ARZ3NDEKTSV4RRFFQ69G5FAX\n';
    expect(withNameComments(yaml, (id) => names[id])).toBe(yaml);
  });
});
