/** Supabase connection settings shared by every app (public values only — never the service-role key). */
export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface RawSupabaseEnv {
  url?: string;
  anonKey?: string;
}

const HINT =
  "Run `pnpm db:start` then `pnpm db:env` to write apps/*/.env.local (see docs/TECH-STACK.md).";

/** Validates raw env values; throws a readable error when something is missing or malformed. */
export function parseSupabaseEnv(raw: RawSupabaseEnv): SupabaseEnv {
  const url = raw.url?.trim();
  const anonKey = raw.anonKey?.trim();
  if (!url) throw new Error(`Missing NEXT_PUBLIC_SUPABASE_URL. ${HINT}`);
  if (!anonKey) throw new Error(`Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. ${HINT}`);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}"`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must be http(s): "${url}"`);
  }
  return { url: url.replace(/\/+$/, ""), anonKey };
}

/**
 * Reads the Supabase settings from the environment. The `process.env.NEXT_PUBLIC_…` names are written out in full
 * so Next.js can inline them into browser bundles. Call it lazily (inside a function), never at module load, so
 * `next build` works without a database.
 */
export function supabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
