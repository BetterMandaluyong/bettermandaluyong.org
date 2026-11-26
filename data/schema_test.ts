import { describe, expect, it } from "vitest";
import { parseBarangay, parseCityOfficials, parseNewsFile } from "./schema.ts";

const good = () => ({
  name: "Hulo",
  psgc: "1380500014",
  district: 2,
  zip: "1550",
  hall: { address: "Coronado Street", phones: ["8533-2505"], email: null },
  council: { captain: "A B", kagawads: ["1", "2", "3", "4", "5", "6", "7"] },
  sk: { chair: "C D", kagawads: ["8"] },
  source: { url: "https://mandaluyong.gov.ph/x/", updated: "2026-02-20" },
});

const bad = (change: (d: any) => void, message: RegExp) => {
  const d = good();
  change(d);
  expect(() => parseBarangay(d, "data/barangays/hulo.yaml", "hulo")).toThrow(
    message,
  );
};

describe("parseBarangay", () => {
  it("accepts a good document and flattens it", () => {
    const b = parseBarangay(good(), "hulo.yaml", "hulo");
    expect(b).toMatchObject({
      slug: "hulo",
      code: "1380500014",
      district: 2,
      address: "Coronado Street",
      captain: "A B",
      skChair: "C D",
      sourceModified: "2026-02-20",
    });
    expect(b.email).toBeUndefined();
  });

  it("names the file and field when something is wrong", () => {
    bad((d) => (d.district = 3), /hulo\.yaml: district must be 1 or 2/);
    bad((d) => (d.zip = "1000"), /zip must be a Mandaluyong ZIP/);
    bad((d) => (d.psgc = "123"), /psgc must be a Mandaluyong PSGC code/);
    bad((d) => (d.name = ""), /name must be a non-empty string/);
    bad((d) => (d.hall.phones = []), /hall\.phones must have 1/);
    bad(
      (d) => (d.council.kagawads = ["only one"]),
      /council\.kagawads must have 7/,
    );
    bad((d) => (d.sk.kagawads = []), /sk\.kagawads must have 1/);
    bad(
      (d) => (d.council.kagawads[2] = ""),
      /council\.kagawads\[2\] must be a non-empty string/,
    );
    bad((d) => (d.source.url = "http://x"), /source\.url must be an https/);
    bad(
      (d) => (d.source.updated = "yesterday"),
      /source\.updated must be a YYYY-MM-DD/,
    );
    bad((d) => delete d.hall, /hall must be a mapping/);
  });
});

describe("parseCityOfficials", () => {
  const official = (extra = {}) => ({
    name: "X",
    role: "Mayor",
    office: "Somewhere",
    phones: ["8000-0000"],
    emails: ["x@example.com"],
    source_url: "https://mandaluyong.gov.ph/team/x/",
    ...extra,
  });
  const doc = () => ({
    as_of: "2026-03-12",
    source_url: "https://mandaluyong.gov.ph/government/elected-officials/",
    representative: official(),
    mayor: official(),
    vice_mayor: official(),
    councilors: [official({ district: 1 })],
  });

  it("accepts a good document", () => {
    expect(parseCityOfficials(doc(), "c.yaml").councilors).toHaveLength(1);
  });

  it("requires a district on every councilor", () => {
    const d = doc();
    d.councilors = [official()];
    expect(() => parseCityOfficials(d, "c.yaml")).toThrow(
      /councilors\[0\]\.district/,
    );
  });

  it("rejects a bad email", () => {
    const d = doc();
    d.mayor = official({ emails: ["not an email"] });
    expect(() => parseCityOfficials(d, "c.yaml")).toThrow(
      /mayor\.emails has an invalid email/,
    );
  });
});

describe("parseNewsFile", () => {
  const post = (over: Record<string, unknown> = {}) => ({
    id: 41237,
    url: "https://mandaluyong.gov.ph/some-post/",
    title: "Some post",
    published_at: "2026-11-25T14:00:00+08:00",
    categories: ["News"],
    first_seen_at: "2026-11-25T17:07:00+08:00",
    ...over,
  });
  const parse = (raw: unknown, month = "2026-11") =>
    parseNewsFile(raw, `data/news/${month}.yaml`, month);

  it("accepts a good file and fills the optional fields with null", () => {
    expect(parse([post()])[0]).toEqual({
      id: 41237,
      url: "https://mandaluyong.gov.ph/some-post/",
      title: "Some post",
      publishedAt: "2026-11-25T14:00:00+08:00",
      categories: ["News"],
      firstSeenAt: "2026-11-25T17:07:00+08:00",
      archive: null,
      missingSince: null,
      removedAt: null,
    });
  });

  it("reads archive and removal fields", () => {
    const [item] = parse([
      post({
        archive: {
          status: "ok",
          url: "https://web.archive.org/web/2026/x",
          requested_at: "2026-11-25T17:37:00+08:00",
          attempts: 1,
        },
        missing_since: "2026-11-26T06:07:00+08:00",
        removed_at: "2026-11-27T06:07:00+08:00",
      }),
    ]);
    expect(item?.archive).toEqual({
      status: "ok",
      url: "https://web.archive.org/web/2026/x",
      requestedAt: "2026-11-25T17:37:00+08:00",
      attempts: 1,
    });
    expect(item?.removedAt).toBe("2026-11-27T06:07:00+08:00");
  });

  it("accepts an empty file", () => {
    expect(parse([])).toEqual([]);
  });

  it.each([
    ["not a list", { id: 1 }, /must be a list/],
    [
      "a bad id",
      [post({ id: "41237" })],
      /\[0\]\.id must be a positive whole number/,
    ],
    ["a duplicate id", [post(), post()], /appears twice/],
    [
      "a link off the city site",
      [post({ url: "https://example.com/x" })],
      /mandaluyong\.gov\.ph/,
    ],
    [
      "a date without the Manila offset",
      [post({ published_at: "2026-11-25T14:00:00Z" })],
      /published_at must be a Manila-time/,
    ],
    [
      "a post in the wrong month",
      [post({ published_at: "2026-10-31T23:00:00+08:00" })],
      /is not in 2026-11/,
    ],
    [
      "an archive link off the archive",
      [post({ archive: { status: "ok", url: "https://example.com/" } })],
      /web\.archive\.org/,
    ],
    [
      "an empty title",
      [post({ title: " " })],
      /title must be a non-empty string/,
    ],
  ])("rejects %s", (_name, raw, message) => {
    expect(() => parse(raw)).toThrow(message);
  });

  it("rejects a bad file name", () => {
    expect(() => parse([], "2026-13")).toThrow(/YYYY-MM/);
  });
});
