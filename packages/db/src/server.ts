import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting as the signed-in user
 * (session cookie) so Row Level Security applies. Create one per request.
 */
export async function createServerSupabase() {
  const env = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only. Session refresh moves to the
          // proxy/middleware with real auth (Milestone 2.3).
        }
      },
    },
  });
}
