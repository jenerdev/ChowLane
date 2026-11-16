import { notFound } from "next/navigation";
import { getPublicTenant } from "@chowlane/db/tenant";

/** Resolve /[tenant] → the business's public branding from Supabase, or 404 (unknown link). */
export async function resolveTenant(params: Promise<{ tenant: string }>) {
  const { tenant: slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) notFound();
  return tenant;
}
