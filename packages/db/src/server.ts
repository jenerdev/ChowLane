import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sessionCookieName, type AuthApp } from "./auth";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the signed-in user of this
 * app (session cookie) so Row Level Security applies. Create one per request. Sessions are refreshed by the app's
 * proxy (`updateSupabaseSession`).
 */
export async function createServerSupabase(app: AuthApp) {
  const env = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookieOptions: { name: sessionCookieName(app) },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Signed-out client for public reads (tenants_public, menus) in Server Components and route handlers. */
export async function createPublicSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const env = supabaseEnv();
  return createClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
