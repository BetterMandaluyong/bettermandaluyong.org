import { describe, expect, it } from "vitest";
import { withNameComments } from "./comments.ts";

describe("withNameComments", () => {
  const id1 = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
  const id2 = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
  const names: Record<string, string> = { [id1]: "Ana Cruz", [id2]: "Ben Uy" };
  const nameOf = (id: string) => names[id];

  it("adds or refreshes the name after each id", () => {
    const yaml = `council:\n  captain: ${id1}\n  kagawads:\n    - ${id2} # Old Name\n`;
    expect(withNameComments(yaml, nameOf)).toBe(
      `council:\n  captain: ${id1} # Ana Cruz\n  kagawads:\n    - ${id2} # Ben Uy\n`,
    );
  });

  it("handles a list item's first key", () => {
    expect(withNameComments(`  - person: ${id1}`, nameOf)).toBe(
      `  - person: ${id1} # Ana Cruz`,
    );
  });

  it("leaves other lines and unknown ids alone", () => {
    const yaml =
      'name: Hulo\npsgc: "1380500014"\n  - 01ARZ3NDEKTSV4RRFFQ69G5FAX\n';
    expect(withNameComments(yaml, nameOf)).toBe(yaml);
  });

  it("keeps an unknown id's old comment", () => {
    const line = "captain: 01ARZ3NDEKTSV4RRFFQ69G5FAX # Someone";
    expect(withNameComments(line, nameOf)).toBe(line);
  });

  it("is stable when run twice", () => {
    const yaml = `captain: ${id1}\nsk_chair: ${id2} # Old\n`;
    const once = withNameComments(yaml, nameOf);
    expect(withNameComments(once, nameOf)).toBe(once);
  });

  it("only touches lines whose whole value is one id", () => {
    const yaml = [
      `note: ${id1} and more`,
      `url: https://x.test/${id1}`,
      `captain: "${id1}"`,
      `captain: ${id1.toLowerCase()}`,
    ].join("\n");
    expect(withNameComments(yaml, nameOf)).toBe(yaml);
  });

  it("skips strings that aren't ULIDs (first char past 7, or I/L/O/U)", () => {
    const yaml = [
      "captain: 81ARZ3NDEKTSV4RRFFQ69G5FAV",
      "captain: 01ARZ3NDEKTSV4RRFFQ69G5FAI",
    ].join("\n");
    expect(withNameComments(yaml, () => "Name")).toBe(yaml);
  });

  it("drops trailing spaces before the old comment", () => {
    expect(withNameComments(`- ${id2}    #   Old`, nameOf)).toBe(
      `- ${id2} # Ben Uy`,
    );
  });
});
