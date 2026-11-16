import { describe, expect, it, vi } from "vitest";
import { parseSupabaseEnv } from "./env";
import { checkSupabaseHealth } from "./health";

describe("parseSupabaseEnv", () => {
  it("accepts a URL and key and trims a trailing slash", () => {
    expect(parseSupabaseEnv({ url: " http://127.0.0.1:54321/ ", anonKey: " key " })).toEqual({
      url: "http://127.0.0.1:54321",
      anonKey: "key",
    });
  });

  it("names the missing variable", () => {
    expect(() => parseSupabaseEnv({ anonKey: "k" })).toThrow("NEXT_PUBLIC_SUPABASE_URL");
    expect(() => parseSupabaseEnv({ url: "http://x", anonKey: "  " })).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("rejects malformed or non-http URLs", () => {
    expect(() => parseSupabaseEnv({ url: "not a url", anonKey: "k" })).toThrow("not a valid URL");
    expect(() => parseSupabaseEnv({ url: "ftp://x", anonKey: "k" })).toThrow("must be http(s)");
  });
});

describe("checkSupabaseHealth", () => {
  const env = { url: "http://127.0.0.1:54321", anonKey: "k" };

  it("calls the auth health endpoint with the key", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 200 }));
    await expect(checkSupabaseHealth(env, fetchImpl)).resolves.toEqual({
      ok: true,
      url: env.url,
      authStatus: 200,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://127.0.0.1:54321/auth/v1/health",
      expect.objectContaining({ headers: { apikey: "k" } }),
    );
  });

  it("reports a bad status or a network error without throwing", async () => {
    const bad = await checkSupabaseHealth(env, async () => new Response("", { status: 401 }));
    expect(bad).toMatchObject({ ok: false, authStatus: 401 });
    const down = await checkSupabaseHealth(env, async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(down).toMatchObject({ ok: false, authStatus: null, error: "ECONNREFUSED" });
  });
});
