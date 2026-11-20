"use client";

import { useEffect, type ReactNode } from "react";
import {
  Banknote,
  Bike,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Route,
  Settings,
  Store,
  Ticket,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { PermissionKey } from "@chowlane/types";
import type { PublicTenant } from "@chowlane/db";
import { AppShell, TenantLogo, TenantTheme, TopBar, type NavItem } from "@chowlane/ui";
import { useConsole } from "@/lib/use-console";

type Item = NavItem & { perm?: PermissionKey };

/** Shell + navigation for signed-in pages (redirects to /login when signed out — LND-004). */
export function AppFrame({ tenant: t, children }: { tenant: PublicTenant; children: ReactNode }) {
  const router = useRouter();
  const { can, me, ready, signOut } = useConsole();
  const signedIn = ready && Boolean(me);

  useEffect(() => {
    if (ready && !me) router.replace(`/${t.slug}/login`);
  }, [ready, me, router, t.slug]);

  const signOutNow = async () => {
    await signOut();
    router.replace(`/${t.slug}/login`);
  };

  const base = `/${t.slug}`;
  const items: Item[] = [
    { href: base, label: "Home", icon: <LayoutDashboard />, exact: true },
    { href: `${base}/orders`, label: "Orders", icon: <ReceiptText />, perm: "orders.view" },
    { href: `${base}/dispatch`, label: "Dispatch", icon: <Route />, perm: "orders.assign" },
    { href: `${base}/riders`, label: "Riders", icon: <Bike />, perm: "riders.view" },
    { href: `${base}/customers`, label: "Customers", icon: <Users />, perm: "customers.view" },
    { href: `${base}/merchants`, label: "Merchants", icon: <Store />, perm: "merchants.manage" },
    { href: `${base}/coupons`, label: "Coupons", icon: <Ticket />, perm: "coupons.manage" },
    { href: `${base}/cash`, label: "Cash", icon: <Banknote />, perm: "cash.manage" },
    { href: `${base}/settings`, label: "Settings", icon: <Settings /> },
  ];
  const SETTINGS_PERMS: PermissionKey[] = [
    "settings.business",
    "settings.pricing",
    "settings.riderPay",
    "settings.loyalty",
    "admins.manage",
  ];
  const hasSettings = me?.type === "OWNER" || SETTINGS_PERMS.some(can);
  const nav = items.filter((i) => (i.label === "Settings" ? hasSettings : !i.perm || can(i.perm)));

  return (
    <TenantTheme color={t.primaryColor} global>
      <AppShell
        layout="app"
        nav={nav}
        topBar={
          <TopBar
            className="md:hidden"
            title={t.businessName}
            leading={<TenantLogo name={t.businessName} logoUrl={t.logoUrl} />}
            actions={<SignOutButton onClick={signOutNow} />}
          />
        }
        sideHeader={
          <div className="flex items-center gap-2.5">
            <TenantLogo name={t.businessName} logoUrl={t.logoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{t.businessName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {me?.name ?? "Admin console"}
              </p>
            </div>
            <SignOutButton onClick={signOutNow} />
          </div>
        }
      >
        {signedIn ? children : null}
      </AppShell>
    </TenantTheme>
  );
}

function SignOutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Log out"
      title="Log out"
      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      <LogOut className="size-4" />
    </button>
  );
}
