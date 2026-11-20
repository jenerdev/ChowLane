"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { PublicTenant } from "@chowlane/db";
import { DevToolbar } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { ConsoleIdentityProvider } from "@/lib/identity";

/**
 * Tenant-wide chrome (every page incl. login): Supabase session, PWA prompts and the DEV app switcher. Every screen
 * reads Supabase since 2.6. Shell + nav live in (app)/.
 */
export function TenantChrome({ tenant, children }: { tenant: PublicTenant; children: ReactNode }) {
  const pathname = usePathname();
  const onGate = /\/(login|invite)(\/|$)/.test(pathname);

  return (
    <ConsoleIdentityProvider tenant={tenant}>
      <OfflineBanner />
      {children}
      {onGate ? null : (
        <InstallPrompt
          appName={tenantAppName("console", tenant.businessName)}
          storageKey={`console:${tenant.slug}`}
          logoUrl={tenant.logoUrl}
        />
      )}
      <UpdateBanner />
      <Toaster />
      <DevToolbar app="console" tenantSlug={tenant.slug} />
    </ConsoleIdentityProvider>
  );
}
