"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bike, History, UserRound, Wallet } from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { AppShell, Badge, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";
import { useRider } from "@/lib/use-rider";

/** Shell + navigation for signed-in riders; redirects to /login when signed out or turned off (RID-001). */
export function AppFrame({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const router = useRouter();
  const { session, me } = useRider();
  const allowed = Boolean(session.staffId && me && me.status === "ACTIVE");
  const signedIn = session.ready && allowed;

  useEffect(() => {
    if (session.ready && !allowed) router.replace(`/${tenant.slug}/login`);
  }, [session.ready, allowed, router, tenant.slug]);

  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: base, label: "Home", icon: <Bike />, exact: true },
    { href: `${base}/earnings`, label: "Earnings", icon: <Wallet /> },
    { href: `${base}/history`, label: "History", icon: <History /> },
    { href: `${base}/profile`, label: "Profile", icon: <UserRound /> },
  ];

  return (
    <AppShell
      layout="phone"
      nav={nav}
      topBar={
        <TopBar
          title={tenant.businessName}
          leading={<TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />}
          actions={
            signedIn && me ? (
              <Badge tone={me.isOnShift ? "success" : "neutral"}>
                {me.isOnShift ? "On shift" : "Off shift"}
              </Badge>
            ) : undefined
          }
        />
      }
    >
      {signedIn ? children : null}
    </AppShell>
  );
}
