import { cache } from "react";
import { toPublicTenant, type PublicTenant } from "./auth";
import { createPublicSupabase } from "./server";

/**
 * Server-side: the public branding of a tenant by its link (tenants_public), or null when no business uses it.
 * Cached per request, so layouts, manifests and pages share one query.
 */
export const getPublicTenant = cache(async (slug: string): Promise<PublicTenant | null> => {
  const supabase = await createPublicSupabase();
  const { data, error } = await supabase
    .from("tenants_public")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load business "${slug}": ${error.message}`);
  return data ? toPublicTenant(data) : null;
});
