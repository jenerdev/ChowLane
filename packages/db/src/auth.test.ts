import { describe, expect, it } from "vitest";
import { isLocalSupabase, riderLoginEmail, sessionCookieName } from "./auth";

describe("auth helpers", () => {
  it("gives every app its own session cookie", () => {
    const names = (["landing", "console", "rider", "customer", "platform"] as const).map(
      sessionCookieName,
    );
    expect(new Set(names).size).toBe(5);
  });

  it("derives a rider's login email from the business link and mobile number (D-062)", () => {
    expect(riderLoginEmail("fastbite", "+639201230001")).toBe(
      "rider-639201230001@fastbite.riders.chowlane.internal",
    );
    expect(() => riderLoginEmail("fastbite", "+12025550123")).toThrow("Not a PH mobile number");
  });

  it("detects a local Supabase", () => {
    expect(isLocalSupabase("http://127.0.0.1:55321")).toBe(true);
    expect(isLocalSupabase("https://abc.supabase.co")).toBe(false);
    expect(isLocalSupabase("nonsense")).toBe(false);
  });
});
