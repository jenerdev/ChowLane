import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName, type AuthApp } from "./auth";
import type { Database } from "./database.types";
import { parseSupabaseEnv } from "./env";

/**
 * Call from an app's `src/proxy.ts`: refreshes the Supabase session cookie on each request so Server Components
 * see a valid session. Does not redirect — pages decide what a signed-out user sees.
 */
export async function updateSupabaseSession(
  request: NextRequest,
  app: AuthApp,
): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  let env;
  try {
    env = parseSupabaseEnv({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  } catch {
    return response; // not configured (e.g. a build without env) — nothing to refresh
  }
  const supabase = createServerClient<Database>(env.url, env.anonKey, {
    cookieOptions: { name: sessionCookieName(app) },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  // Validates and refreshes the token; must run before anything else reads the session.
  await supabase.auth.getUser();
  return response;
}
