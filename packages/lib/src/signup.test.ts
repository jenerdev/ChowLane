import { describe, expect, it } from "vitest";
import { checkPassword, checkSlug, isHexColor, isValidEmail, slugify, suggestSlugs } from "./index";

describe("signup helpers", () => {
  it("slugifies business names", () => {
    expect(slugify("Lola's Kitchen & Co.")).toBe("lolas-kitchen-co");
    expect(slugify("  Kain Express!! ")).toBe("kain-express");
    expect(slugify("Café Niña")).toBe("cafe-nina");
  });

  it("checks slugs", () => {
    const taken = ["fastbite"];
    expect(checkSlug("ab", taken)).toBe("TOO_SHORT");
    expect(checkSlug("a".repeat(31), taken)).toBe("TOO_LONG");
    expect(checkSlug("bad--slug", taken)).toBe("INVALID");
    expect(checkSlug("-bad", taken)).toBe("INVALID");
    expect(checkSlug("Upper", taken)).toBe("INVALID");
    expect(checkSlug("admin", taken)).toBe("RESERVED");
    expect(checkSlug("fastbite", taken)).toBe("TAKEN");
    expect(checkSlug("lutong-bahay", taken)).toBeNull();
  });

  it("suggests free alternatives", () => {
    expect(suggestSlugs("fastbite", ["fastbite", "fastbite-ph"])).toEqual([
      "fastbite-delivery",
      "fastbite-eats",
      "fastbite-2",
    ]);
  });

  it("validates email, password and color", () => {
    expect(isValidEmail("owner@lutong.ph")).toBe(true);
    expect(isValidEmail("owner@lutong")).toBe(false);
    expect(checkPassword("short1")).not.toBeNull();
    expect(checkPassword("longenough")).not.toBeNull();
    expect(checkPassword("longenough1")).toBeNull();
    expect(isHexColor("#E4572E")).toBe(true);
    expect(isHexColor("E4572E")).toBe(false);
  });
});
