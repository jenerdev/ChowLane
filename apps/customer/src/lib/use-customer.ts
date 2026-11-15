"use client";

import { useState, useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@chowlane/mocks/react";
import { useMockStore } from "./store";

type PersistApi = {
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
};
const persistApi = () => (useMockStore as unknown as PersistApi).persist;

/** true once the demo data saved in this browser has been loaded (avoids redirecting new customers to login). */
export function useStoreHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => persistApi().onFinishHydration(cb),
    () => persistApi().hasHydrated(),
    () => false,
  );
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

/** Current time, captured once when the screen mounts (keeps render pure). */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
