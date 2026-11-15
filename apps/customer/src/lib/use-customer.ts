"use client";

import { useParams } from "next/navigation";
import { useSession, useStoreHydrated as useSharedStoreHydrated } from "@chowlane/mocks/react";
import { useMockStore } from "./store";

/** true once this browser's saved demo data has loaded (avoids redirecting new customers to login). */
export function useStoreHydrated(): boolean {
  return useSharedStoreHydrated(useMockStore);
}

/**
 * Everything a customer screen needs: tenant + settings (live from the mock store), the logged-in customer
 * (mock Facebook session, scope `customer:<slug>`), and `ready` once session + data are loaded.
 * Phase 2: Supabase Auth (Facebook provider) + queries.
 */
export function useCustomer() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const hydrated = useStoreHydrated();
  const session = useSession(`customer:${slug}`);
  const tenant = db.tenants.find((t) => t.slug === slug)!;
  const settings = db.tenantSettings.find((s) => s.tenantId === tenant.id)!;
  const me = db.customers.find((c) => c.id === session.staffId && c.tenantId === tenant.id);
  return {
    slug,
    base: `/${slug}`,
    db,
    tenant,
    settings,
    me,
    ready: session.ready && hydrated,
    signIn: session.signIn,
    signOut: session.signOut,
  };
}

export { useNow } from "@chowlane/ui";
export { newId } from "@chowlane/mocks/store";
