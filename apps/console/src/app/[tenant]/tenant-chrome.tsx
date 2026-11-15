"use client";

import type { ReactNode } from "react";
import {
  Banknote,
  Bike,
  LayoutDashboard,
  ReceiptText,
  Route,
  Settings,
  Store,
  Users,
} from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { forTenant, roles, staff } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** App frame for one tenant: shell + nav, PWA prompts, mock store, dev switcher. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <LayoutDashboard />, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: <ReceiptText /> },
    { href: `${base}/dispatch`, label: "Dispatch", icon: <Route /> },
    { href: `${base}/riders`, label: "Riders", icon: <Bike /> },
    { href: `${base}/customers`, label: "Customers", icon: <Users /> },
    { href: `${base}/merchants`, label: "Merchants", icon: <Store /> },
    { href: `${base}/cash`, label: "Cash", icon: <Banknote /> },
    { href: `${base}/settings`, label: "Settings", icon: <Settings /> },
  ];
  const personas = forTenant(staff, tenant.id)
    .filter((s) => s.status === "ACTIVE")
    .map((s) => ({
      id: s.id,
      label: s.name,
      detail:
        s.type === "OWNER" ? "Owner" : (roles.find((r) => r.id === s.roleId)?.name ?? "Admin"),
    }));
  const reset = useMockStore((s) => s.reset);

  return (
    <>
      <OfflineBanner />
      <AppShell
        layout="app"
        nav={nav}
        topBar={
          <TopBar
            className="md:hidden"
            title={`${tenant.businessName} Admin`}
            leading={<TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />}
          />
        }
        sideHeader={
          <div className="flex items-center gap-2">
            <TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{tenant.businessName}</p>
              <p className="text-xs text-muted-foreground">Admin console</p>
            </div>
          </div>
        }
      >
        {children}
      </AppShell>
      <InstallPrompt
        appName={tenantAppName("console", tenant.businessName)}
        storageKey={`console:${tenant.slug}`}
        logoUrl={tenant.logoUrl}
      />
      <UpdateBanner />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar
        app="console"
        tenantSlug={tenant.slug}
        personas={personas}
        personaScope={`console:${tenant.slug}`}
        onReset={reset}
      />
    </>
  );
}
