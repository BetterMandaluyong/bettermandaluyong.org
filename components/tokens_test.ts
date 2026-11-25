import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOR_TOKENS, TYPE_UTILITIES } from "./tokens.ts";

const css = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
);

describe("design tokens shown on /storybook", () => {
  it("are all defined in globals.css", () => {
    for (const token of Object.values(COLOR_TOKENS).flat()) {
      expect(css, token.name).toContain(`--color-${token.name}:`);
    }
  });

  it("include every type utility", () => {
    for (const utility of TYPE_UTILITIES) {
      expect(css, utility.name).toContain(`@utility ${utility.name} {`);
    }
  });
});
