"use client";

import { Building2 } from "lucide-react";
import { EmptyState, PageHeader, TenantLogo, TenantTheme } from "@chowlane/ui";
import { SubNav } from "@/components/sub-nav";
import { TenantStatusBadge } from "@/components/tenant-status-badge";
import { usePlatform } from "@/lib/use-platform";

/** Shared header + section links for one tenant (S-503…S-509). */
export function TenantHeader({ id }: { id: string }) {
  const { db } = usePlatform();
  const t = db.tenants.find((x) => x.id === id);
  if (!t) return <EmptyState icon={<Building2 />} title="Business not found" />;
  const base = `/tenants/${t.id}`;
  return (
    <>
      <PageHeader
        back={{ href: "/tenants", label: "Tenants" }}
        title={t.businessName}
        description={`chowlane.app/${t.slug}`}
        actions={
          <>
            <TenantStatusBadge status={t.status} />
            <TenantTheme color={t.primaryColor}>
              <TenantLogo name={t.businessName} logoUrl={t.logoUrl} />
            </TenantTheme>
          </>
        }
      />
      <SubNav
        items={[
          { href: base, label: "Overview", exact: true },
          { href: `${base}/orders`, label: "Orders" },
          { href: `${base}/riders`, label: "Riders" },
          { href: `${base}/customers`, label: "Customers" },
          { href: `${base}/merchants`, label: "Merchants" },
          { href: `${base}/settings`, label: "Admins & settings" },
          { href: `${base}/billing`, label: "Billing" },
        ]}
      />
    </>
  );
}
