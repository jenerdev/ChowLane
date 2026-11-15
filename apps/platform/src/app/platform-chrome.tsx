"use client";

import type { ReactNode } from "react";
import { Building2, LayoutDashboard, ReceiptText } from "lucide-react";
import { platformAdmins } from "@chowlane/mocks";
import { DevToolbar, MockStoreHydrator } from "@chowlane/mocks/react";
import { AppShell, ChowLaneLogo, TopBar, type NavItem } from "@chowlane/ui";
import { useMockStore } from "@/lib/store";

const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: <LayoutDashboard />, exact: true },
  { href: "/tenants", label: "Tenants", icon: <Building2 /> },
  { href: "/billing", label: "Billing", icon: <ReceiptText /> },
];

/** ChowLane Platform Admin frame (ChowLane-branded, not a tenant PWA). */
export function PlatformChrome({ children }: { children: ReactNode }) {
  const reset = useMockStore((s) => s.reset);
  return (
    <>
      <AppShell
        nav={NAV}
        sideHeader={<ChowLaneLogo />}
        topBar={<TopBar className="md:hidden" title={<ChowLaneLogo />} />}
      >
        {children}
      </AppShell>
      <MockStoreHydrator store={useMockStore} />
      <DevToolbar
        app="platform"
        personas={platformAdmins.map((p) => ({ id: p.id, label: p.name }))}
        onReset={reset}
      />
    </>
  );
}
