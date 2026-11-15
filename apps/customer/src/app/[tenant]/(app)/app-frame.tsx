"use client";

import type { ReactNode } from "react";
import { House, ReceiptText, UserRound } from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";

/** Shell + navigation for signed-in pages. */
export function AppFrame({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <House />, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: <ReceiptText /> },
    { href: `${base}/profile`, label: "Profile", icon: <UserRound /> },
  ];

  return (
    <AppShell
      layout="phone"
      nav={nav}
      topBar={
        <TopBar
          title={tenant.businessName}
          leading={<TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />}
        />
      }
    >
      {children}
    </AppShell>
  );
}
