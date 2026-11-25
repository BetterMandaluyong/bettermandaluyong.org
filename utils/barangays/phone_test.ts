import { describe, expect, it } from "vitest";
import { displayPhone, parsePhones, telHref } from "./phone.ts";

describe("parsePhones", () => {
  it("splits two landlines on a slash", () => {
    expect(parsePhones("8534-0503 / 8706-1738")).toEqual([
      { text: "(02) 8534-0503", href: "tel:+63285340503" },
      { text: "(02) 8706-1738", href: "tel:+63287061738" },
    ]);
  });

  it("splits without spaces around the slash", () => {
    expect(parsePhones("8722-4258/8238-0321 to 22").map((p) => p.text)).toEqual(
      ["(02) 8722-4258", "(02) 8238-0321 to 22"],
    );
  });

  it("splits a landline from a mobile on an ampersand", () => {
    expect(parsePhones("8516-4308 & 0945-577-0438")).toEqual([
      { text: "(02) 8516-4308", href: "tel:+63285164308" },
      { text: "+63-945-577-0438", href: "tel:+639455770438" },
    ]);
  });

  it("keeps a slash inside an extension", () => {
    const phones = parsePhones("8532-5001 to 28 local 577/578");
    expect(phones).toHaveLength(1);
    expect(phones[0].href).toBe("tel:+63285325001");
  });

  it("reads a plain mobile number", () => {
    expect(parsePhones("09457644743")).toEqual([
      { text: "+63-945-764-4743", href: "tel:+639457644743" },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(parsePhones("")).toEqual([]);
  });
});

describe("telHref", () => {
  it("handles the (02) prefix and the trunk-line extension", () => {
    expect(telHref("(02) 8532-5001 local 758 to 787")).toBe("tel:+63285325001");
    expect(telHref("(02) 85325001 loc. 858")).toBe("tel:+63285325001");
  });

  it("handles the 8-xxx-xxxx form", () => {
    expect(telHref("8-531-9432")).toBe("tel:+63285319432");
  });

  it("returns null when there is no readable number", () => {
    expect(telHref("local 847")).toBeNull();
  });
});

describe("displayPhone", () => {
  it("adds the area code to landlines that start with 8", () => {
    expect(displayPhone("8534-0503")).toBe("(02) 8534-0503");
    expect(displayPhone("8532-5001 local 847")).toBe(
      "(02) 8532-5001 local 847",
    );
  });

  it("leaves numbers that already have one alone", () => {
    expect(displayPhone("(02) 8532-4362")).toBe("(02) 8532-4362");
  });

  it("formats mobile numbers as +63-9XX-XXX-XXXX", () => {
    expect(displayPhone("09457644743")).toBe("+63-945-764-4743");
    expect(displayPhone("0945-577-0438")).toBe("+63-945-577-0438");
    expect(displayPhone("0916-652-0210")).toBe("+63-916-652-0210");
  });
});
