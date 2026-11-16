"use client";

import { useParams } from "next/navigation";
import { useStoreHydrated as useSharedStoreHydrated } from "@chowlane/mocks/react";
import { useCustomerIdentity } from "./identity";
import { useMockStore } from "./store";

/** true once this browser's saved demo data has loaded (avoids redirecting new customers to login). */
export function useStoreHydrated(): boolean {
  return useSharedStoreHydrated(useMockStore);
}

/**
 * Everything a customer screen needs. The login is Supabase (Facebook; local demo logins — D-060) and the
 * customer row per business comes from `ensure_customer`; screens still read tenant, settings, menu and orders
 * from the mock store until Milestone 2.5, so `me` is the mock customer with the same Facebook id.
 */
export function useCustomer() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const hydrated = useStoreHydrated();
  const auth = useCustomerIdentity();
  const tenant = db.tenants.find((t) => t.slug === slug)!;
  const settings = db.tenantSettings.find((s) => s.tenantId === tenant?.id)!;
  const live = auth.identity;
  const me = live
    ? db.customers.find((c) => c.tenantId === tenant?.id && c.facebookId === live.facebookId)
    : undefined;
  return {
    slug,
    base: `/${slug}`,
    db,
    tenant,
    settings,
    me,
    live,
    /** signed in (Supabase) — `me` can lag one render behind while the mock record is created */
    signedIn: Boolean(live),
    ready: auth.ready && hydrated && (!live || Boolean(me) || !tenant),
    supabase: auth.supabase,
    refresh: auth.refresh,
    signOut: auth.signOut,
  };
}

export { useNow } from "@chowlane/ui";
export { newId } from "@chowlane/mocks/store";
