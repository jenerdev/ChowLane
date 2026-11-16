import { createBrowserClient } from "@supabase/ssr";
import { sessionCookieName, type AuthApp } from "./auth";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/** Supabase client for Client Components, using this app's session cookie. One instance per tab. */
export function createBrowserSupabase(app: AuthApp) {
  const env = supabaseEnv();
  return createBrowserClient<Database>(env.url, env.anonKey, {
    cookieOptions: { name: sessionCookieName(app) },
  });
}
