import { notFound } from "next/navigation";
import { findTenantBySlug } from "@chowlane/mocks";

/** Resolve /[tenant] → Tenant, or 404 (unknown slug). */
export async function resolveTenant(params: Promise<{ tenant: string }>) {
  const { tenant: slug } = await params;
  const tenant = findTenantBySlug(slug);
  if (!tenant) notFound();
  return tenant;
}
