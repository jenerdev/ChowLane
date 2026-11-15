"use client";

import type { ReactNode } from "react";
import { Bike, History, UserRound, Wallet } from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { forTenant, riders } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** App frame for one tenant: shell + nav, PWA prompts, mock store, dev switcher. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <Bike />, exact: true },
    { href: `${base}/earnings`, label: "Earnings", icon: <Wallet /> },
    { href: `${base}/history`, label: "History", icon: <History /> },
    { href: `${base}/profile`, label: "Profile", icon: <UserRound /> },
  ];
  const personas = forTenant(riders, tenant.id)
    .filter((r) => r.status === "ACTIVE")
    .map((r) => ({ id: r.id, label: r.name, detail: r.isOnShift ? "on shift" : "off shift" }));
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
        appName={tenantAppName("rider", tenant.businessName)}
        storageKey={`rider:${tenant.slug}`}
        logoUrl={tenant.logoUrl}
        note={"Keep this app open during your shift so dispatch can see your location."}
      />
      <UpdateBanner />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar
        app="rider"
        tenantSlug={tenant.slug}
        personas={personas}
        personaScope={`rider:${tenant.slug}`}
        onReset={reset}
      />
    </>
  );
}
