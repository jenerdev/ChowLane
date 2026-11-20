"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PublicTenant } from "@chowlane/db";
import { DevToolbar } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { RiderIdentityProvider } from "@/lib/identity";
import { RiderDataProvider } from "@/lib/rider-data";

/**
 * Tenant-wide chrome (every page incl. login): Supabase session + the rider's data (2.6, Realtime), PWA prompts, DEV
 * app switcher. Shell + nav live in (app)/.
 */
export function TenantChrome({ tenant, children }: { tenant: PublicTenant; children: ReactNode }) {
  const pathname = usePathname();
  const onGate = /\/(login|location)(\/|$)/.test(pathname);
  return (
    <RiderIdentityProvider tenant={tenant}>
      <RiderDataProvider>
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
        <DevToolbar app="rider" tenantSlug={tenant.slug} />
      </RiderDataProvider>
    </RiderIdentityProvider>
  );
}
