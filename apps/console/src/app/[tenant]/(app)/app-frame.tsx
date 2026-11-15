"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@chowlane/mocks/react";
import {
  Banknote,
  Bike,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Route,
  Settings,
  Store,
  Users,
} from "lucide-react";
import type { Tenant } from "@chowlane/types";
import { AppShell, TenantLogo, TopBar, type NavItem } from "@chowlane/ui";

/** Shell + navigation for signed-in pages (redirects to /login when signed out — LND-004). */
export function AppFrame({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  const base = `/${tenant.slug}`;
  const nav: NavItem[] = [
    { href: `${base}`, label: "Home", icon: <LayoutDashboard />, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: <ReceiptText /> },
    { href: `${base}/dispatch`, label: "Dispatch", icon: <Route /> },
    { href: `${base}/riders`, label: "Riders", icon: <Bike /> },
    { href: `${base}/customers`, label: "Customers", icon: <Users /> },
    { href: `${base}/merchants`, label: "Merchants", icon: <Store /> },
    { href: `${base}/cash`, label: "Cash", icon: <Banknote /> },
    { href: `${base}/settings`, label: "Settings", icon: <Settings /> },
  ];

  const router = useRouter();
  const { staffId, ready, signOut } = useSession(`console:${tenant.slug}`);
  const signedIn = ready && Boolean(staffId);
  useEffect(() => {
    if (ready && !staffId) router.replace(`/${tenant.slug}/login`);
  }, [ready, staffId, router, tenant.slug]);
  const signOutNow = () => {
    signOut();
    router.replace(`/${tenant.slug}/login`);
  };

  return (
    <AppShell
      layout="app"
      nav={nav}
      topBar={
        <TopBar
          className="md:hidden"
          title={`${tenant.businessName} Admin`}
          leading={<TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />}
          actions={<SignOutButton onClick={signOutNow} />}
        />
      }
      sideHeader={
        <div className="flex items-center gap-2">
          <TenantLogo name={tenant.businessName} logoUrl={tenant.logoUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{tenant.businessName}</p>
            <p className="text-xs text-muted-foreground">Admin console</p>
          </div>
          <SignOutButton onClick={signOutNow} />
        </div>
      }
    >
      {signedIn ? children : null}
    </AppShell>
  );
}

function SignOutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Log out"
      title="Log out"
      className="ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4" />
    </button>
  );
}
