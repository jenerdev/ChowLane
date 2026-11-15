"use client";

import type { ReactNode } from "react";
import type { Tenant } from "@chowlane/types";
import { customers, forTenant } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { useMockStore } from "@/lib/store";

/** Tenant-wide chrome (every page incl. login): PWA prompts, mock store, DEV switcher. Shell + nav live in (app)/. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const personas = forTenant(customers, tenant.id).map((c) => ({
    id: c.id,
    label: c.name,
    detail: c.verificationStatus.toLowerCase(),
  }));
  const reset = useMockStore((s) => s.reset);

  return (
    <>
      <OfflineBanner />
      {children}
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
