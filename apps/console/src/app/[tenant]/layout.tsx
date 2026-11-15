import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { findMockTenant } from "@chowlane/mocks";

/** Tenant scope: applies the tenant's brand color to everything under /[tenant]. */
export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const config = findMockTenant(tenant);
  if (!config) notFound();
  return <div style={{ "--brand": config.primaryColor } as CSSProperties}>{children}</div>;
}
