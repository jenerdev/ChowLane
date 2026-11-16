"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PublicTenant } from "@chowlane/db";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { RiderIdentityProvider } from "@/lib/identity";
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
    <RiderIdentityProvider tenant={tenant}>
      <OfflineBanner />
      {children}
      {onGate ? null : (
        <InstallPrompt
          appName={tenantAppName("rider", tenant.businessName)}
          storageKey={`rider:${tenant.slug}`}
          logoUrl={tenant.logoUrl}
          note={"Keep this app open during your shift so dispatch can see your location."}
        />
      )}
      <UpdateBanner />
      <Toaster />
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar app="rider" tenantSlug={tenant.slug} onReset={reset} />
    </RiderIdentityProvider>
  );
}
