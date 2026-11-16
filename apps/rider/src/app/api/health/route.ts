import { checkSupabaseHealth, supabaseEnv } from "@chowlane/db";

export const dynamic = "force-dynamic";

/** GET /api/health — confirms this app can reach Supabase with its configured URL + key. */
export async function GET() {
  let env;
  try {
    env = supabaseEnv();
  } catch (err) {
    return Response.json({ ok: false, error: (err as Error).message }, { status: 503 });
  }
  const health = await checkSupabaseHealth(env);
  return Response.json(health, { status: health.ok ? 200 : 503 });
}
