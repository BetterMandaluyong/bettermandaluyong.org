import { describe, expect, it } from "vitest";
import { COMMIT_SHA, commitUrl, shortSha } from "./build.ts";

const SHA = "64fc7c2a1b2c3d4e5f60718293a4b5c6d7e8f901";
const REPO = "https://github.com/BetterMandaluyong/bettermandaluyong.org";

describe("build", () => {
  it("is empty outside a Vite build", () => {
    expect(COMMIT_SHA).toBe("");
  });

  it("shortens a SHA to 7 characters", () => {
    expect(shortSha(SHA)).toBe("64fc7c2");
    expect(shortSha(` ${SHA.toUpperCase()}\n`)).toBe("64fc7c2");
  });

  it("rejects anything that isn't a hex SHA", () => {
    expect(shortSha("")).toBe("");
    expect(shortSha("main")).toBe("");
    expect(shortSha("abc12")).toBe("");
    expect(commitUrl(REPO, "not-a-sha")).toBe("");
  });

  it("links to the commit on GitHub", () => {
    expect(commitUrl(REPO, SHA)).toBe(`${REPO}/commit/${SHA}`);
    expect(commitUrl(`${REPO}/`, SHA)).toBe(`${REPO}/commit/${SHA}`);
  });
});
