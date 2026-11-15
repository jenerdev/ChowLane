"use client";

import type { ReactNode } from "react";
import { Bike, History, UserRound, Wallet } from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";

/** Shell + navigation for signed-in pages. */
export function AppFrame({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <Bike />, exact: true },
    { href: `${base}/earnings`, label: "Earnings", icon: <Wallet /> },
    { href: `${base}/history`, label: "History", icon: <History /> },
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
