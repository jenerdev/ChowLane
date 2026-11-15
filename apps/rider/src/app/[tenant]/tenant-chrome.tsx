"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Tenant } from "@chowlane/types";
import { forTenant, riders } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { tenantAppName } from "@chowlane/pwa";
import { InstallPrompt, OfflineBanner, UpdateBanner } from "@chowlane/pwa/react";
import { Toaster } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

/** Tenant-wide chrome (every page incl. login): PWA prompts, mock store, DEV switcher. Shell + nav live in (app)/. */
export function TenantChrome({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const pathname = usePathname();
  const onGate = /\/(login|location)(\/|$)/.test(pathname);
  const personas = forTenant(riders, tenant.id)
    .filter((r) => r.status === "ACTIVE")
    .map((r) => ({ id: r.id, label: r.name, detail: r.isOnShift ? "on shift" : "off shift" }));
  const reset = useMockStore((s) => s.reset);

  return (
    <>
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
