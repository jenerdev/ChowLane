"use client";

import type { ReactNode } from "react";
import { House, ReceiptText, UserRound } from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { customers, forTenant } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** App frame for one tenant: shell + nav, PWA prompts, mock store, dev switcher. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <House />, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: <ReceiptText /> },
    { href: `${base}/profile`, label: "Profile", icon: <UserRound /> },
  ];
  const personas = forTenant(customers, tenant.id).map((c) => ({
    id: c.id,
    label: c.name,
    detail: c.verificationStatus.toLowerCase(),
  }));
  const reset = useMockStore((s) => s.reset);

  return (
    <>
      <OfflineBanner />
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
      <InstallPrompt
        appName={tenantAppName("customer", tenant.businessName)}
        storageKey={`customer:${tenant.slug}`}
        logoUrl={tenant.logoUrl}
      />
      <UpdateBanner />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar
        app="customer"
        tenantSlug={tenant.slug}
        personas={personas}
        personaScope={`customer:${tenant.slug}`}
        onReset={reset}
      />
    </>
  );
}
