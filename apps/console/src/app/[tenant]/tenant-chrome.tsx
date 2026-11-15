"use client";

import type { ReactNode } from "react";
import type { Tenant } from "@chowlane/types";
import { forTenant, roles, staff } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { useMockStore } from "@/lib/store";

/** Tenant-wide chrome (every page incl. login): PWA prompts, mock store, DEV switcher. Shell + nav live in (app)/. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
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
      {children}
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
