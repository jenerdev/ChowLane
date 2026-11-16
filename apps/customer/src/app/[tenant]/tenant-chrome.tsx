"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PublicTenant } from "@chowlane/db";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { CustomerIdentityProvider } from "@/lib/identity";
import { useMockStore } from "@/lib/store";

/**
 * Tenant-wide chrome (every page incl. login): Supabase session, PWA prompts, mock store (screens not yet on
 * Supabase), DEV switcher (no fake logins since 2.3). Shell + nav live in (app)/.
 */
export function TenantChrome({ tenant, children }: { tenant: PublicTenant; children: ReactNode }) {
  const pathname = usePathname();
  const onGate = /\/(login|location)(\/|$)/.test(pathname);
  const reset = useMockStore((s) => s.reset);

  return (
    <CustomerIdentityProvider tenant={tenant}>
      <OfflineBanner />
      {children}
      {onGate ? null : (
        <InstallPrompt
          appName={tenantAppName("customer", tenant.businessName)}
          storageKey={`customer:${tenant.slug}`}
          logoUrl={tenant.logoUrl}
        />
      )}
      <UpdateBanner />
      <Toaster />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar app="customer" tenantSlug={tenant.slug} onReset={reset} />
    </CustomerIdentityProvider>
  );
}
