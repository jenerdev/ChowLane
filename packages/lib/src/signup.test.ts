import { describe, expect, it } from "vitest";
import {
  brandTint,
  checkPassword,
  checkSlug,
  isHexColor,
  isValidEmail,
  shortNameFor,
  slugify,
  suggestSlugs,
} from "./index";

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

describe("new business defaults", () => {
  it("short name fits the home screen (BL-15.6)", () => {
    expect(shortNameFor("Kain Express")).toBe("Kain Express");
    expect(shortNameFor("FastBite Delivery")).toBe("FastBite");
    expect(shortNameFor("Supercalifragilistic Eats")).toBe("Supercalifra");
  });
  it("background is a light tint of the brand color", () => {
    expect(brandTint("#E4572E")).toMatch(/^#[0-9A-F]{6}$/);
    expect(brandTint("#000000", 0.5)).toBe("#808080");
    expect(brandTint("#ffffff")).toBe("#FFFFFF");
  });
});
