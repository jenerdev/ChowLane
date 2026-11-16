import type { SupabaseEnv } from "./env";

export interface SupabaseHealth {
  ok: boolean;
  url: string;
  /** HTTP status of the Auth health endpoint, or null when the request itself failed. */
  authStatus: number | null;
  error?: string;
}

/** Pings Supabase Auth (`/auth/v1/health`) — a cheap check that the app can reach the project with its key. */
export async function checkSupabaseHealth(
  env: SupabaseEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<SupabaseHealth> {
  try {
    const res = await fetchImpl(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.anonKey },
      cache: "no-store",
    });
    return res.ok
      ? { ok: true, url: env.url, authStatus: res.status }
      : {
          ok: false,
          url: env.url,
          authStatus: res.status,
          error: `Auth health returned ${res.status}`,
        };
  } catch (err) {
    return {
      ok: false,
      url: env.url,
      authStatus: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
