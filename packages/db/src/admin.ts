import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * SERVER ONLY — Supabase with the service-role key: bypasses RLS and can use the Auth admin API (create logins,
 * invites, rider passwords). Use only in server actions, after checking the caller's permission
 * (`has_permission` RPC). The key comes from SUPABASE_SERVICE_ROLE_KEY and must never reach a browser bundle.
 */
export function createAdminSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server only). Run `pnpm db:env` for the local stack.",
    );
  }
  return createClient<Database>(supabaseEnv().url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
