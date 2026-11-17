"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PublicTenant } from "@chowlane/db";
import { DevToolbar } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { CustomerDataProvider } from "@/lib/customer-data";
import { CustomerIdentityProvider } from "@/lib/identity";

/**
 * Tenant-wide chrome (every page incl. login): Supabase session + this business's data (2.5), PWA prompts, DEV
 * app switcher. Shell + nav live in (app)/.
 */
export function TenantChrome({ tenant, children }: { tenant: PublicTenant; children: ReactNode }) {
  const pathname = usePathname();
  const onGate = /\/(login|location)(\/|$)/.test(pathname);

  return (
    <CustomerIdentityProvider tenant={tenant}>
      <CustomerDataProvider>
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
        <DevToolbar app="customer" tenantSlug={tenant.slug} />
      </CustomerDataProvider>
    </CustomerIdentityProvider>
  );
}
