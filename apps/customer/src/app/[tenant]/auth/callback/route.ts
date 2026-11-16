import { NextResponse } from "next/server";
import { createServerSupabase } from "@chowlane/db/server";

/**
 * Facebook login returns here (PKCE): exchange the code for a session cookie, then open the business's app.
 * The customer row for this business is created on arrival (ensure_customer, Q-31).
 */
export async function GET(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createServerSupabase("customer");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/${tenant}/login?error=facebook`, url.origin));
  }
  return NextResponse.redirect(new URL(`/${tenant}`, url.origin));
}
