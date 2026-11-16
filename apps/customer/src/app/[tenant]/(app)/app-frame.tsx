"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, Hourglass, House, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import type { PublicTenant } from "@chowlane/db";
import { AppShell, EmptyState, TenantLogo, TenantTheme, TopBar, type NavItem } from "@chowlane/ui";
import { useCart, useCartStore } from "@/lib/cart";
import { useDraftStore } from "@/lib/checkout-draft";
import { useCustomer } from "@/lib/use-customer";

type Persisted = { persist: { rehydrate: () => void } };

/** Shell for signed-in customers. Guards: no session → login (S-300); location not allowed → gate (S-301, BL-3.2). */
export function AppFrame({
  tenant: initial,
  children,
}: {
  tenant: PublicTenant;
  children: ReactNode;
}) {
  const router = useRouter();
  const { me, ready, tenant, settings, base, db, signedIn } = useCustomer();
  const { count } = useCart(initial.slug);

  useEffect(() => {
    (useCartStore as unknown as Persisted).persist.rehydrate();
    (useDraftStore as unknown as Persisted).persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) router.replace(`/${initial.slug}/login`);
    else if (!me)
      return; // business not in the demo data yet — notice below
    else if (me.locationPermission !== "GRANTED") router.replace(`/${initial.slug}/location`);
  }, [ready, me, signedIn, router, initial.slug]);

  const t = tenant ?? initial;
  const allowed = ready && me && me.locationPermission === "GRANTED";
  const activeOrders = me
    ? db.orders.filter(
        (o) =>
          o.customerId === me.id &&
          ["PENDING_APPROVAL", "APPROVED", "ASSIGNED", "AT_MERCHANT", "PICKED_UP"].includes(
            o.status,
          ),
      ).length
    : 0;

  const nav: NavItem[] = [
    { href: base, label: "Home", icon: <House />, exact: true },
    {
      href: `${base}/orders`,
      label: "Orders",
      icon: <ReceiptText />,
      badge: activeOrders || undefined,
    },
    ...(settings?.loyalty.enabled
      ? [{ href: `${base}/rewards`, label: "Rewards", icon: <Gift /> }]
      : []),
    { href: `${base}/profile`, label: "Profile", icon: <UserRound /> },
  ];

  return (
    <TenantTheme color={t.primaryColor}>
      <AppShell
        layout="phone"
        nav={nav}
        topBar={
          <TopBar
            title={t.businessName}
            leading={<TenantLogo name={t.businessName} logoUrl={t.logoUrl} />}
            actions={
              <Link
                href={`${base}/cart`}
                aria-label={`Cart, ${count} items`}
                className="relative -mr-2 rounded-full p-2 hover:bg-muted"
              >
                <ShoppingBag className="size-5" />
                {count ? (
                  <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-brand px-1 text-center text-[10px] leading-4 font-medium text-brand-foreground">
                    {count}
                  </span>
                ) : null}
              </Link>
            }
          />
        }
      >
        {allowed ? (
          children
        ) : ready && signedIn && !me ? (
          <EmptyState
            icon={<Hourglass />}
            title="You're logged in"
            description={`${t.businessName} opens for orders here soon. Check back in a little while.`}
          />
        ) : null}
      </AppShell>
    </TenantTheme>
  );
}
