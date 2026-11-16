import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/** Supabase client for Client Components. `@supabase/ssr` keeps one instance per browser tab. */
export function createBrowserSupabase() {
  const env = supabaseEnv();
  return createBrowserClient<Database>(env.url, env.anonKey);
}
