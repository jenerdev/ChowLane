"use client";

import { createContext, useCallback, useContext, useEffect, type ReactNode } from "react";
import { EMPTY_LOYALTY } from "@chowlane/lib";
import type { PublicTenant } from "@chowlane/db";
import { useAuthIdentity, type AppSupabase } from "@chowlane/db/react";
import type { User } from "@supabase/supabase-js";
import { useMockStore } from "./store";

/** The signed-in customer of this tenant (one row per tenant per login — Q-31). */
export type CustomerIdentity = {
  customerId: string;
  facebookId: string;
  name: string;
  avatarUrl: string;
};

type Ctx = ReturnType<typeof useAuthIdentity<CustomerIdentity>> & { tenant: PublicTenant };
const IdentityContext = createContext<Ctx | null>(null);

export function CustomerIdentityProvider({
  tenant,
  children,
}: {
  tenant: PublicTenant;
  children: ReactNode;
}) {
  const resolve = useCallback(
    async (supabase: AppSupabase, _user: User): Promise<CustomerIdentity | null> => {
      // First visit to this business creates the customer row from the Facebook profile.
      const { data: id, error } = await supabase.rpc("ensure_customer", { p_tenant: tenant.id });
      if (error || !id) return null;
      const { data } = await supabase
        .from("customers")
        .select("id, facebook_id, name, avatar_url")
        .eq("id", id)
        .single();
      return data
        ? {
            customerId: data.id,
            facebookId: data.facebook_id,
            name: data.name,
            avatarUrl: data.avatar_url,
          }
        : null;
    },
    [tenant.id],
  );
  const auth = useAuthIdentity("customer", resolve);
  return (
    <IdentityContext.Provider value={{ ...auth, tenant }}>
      <MockCustomerSync />
      {children}
    </IdentityContext.Provider>
  );
}

/**
 * Screens still run on the mock store until Milestone 2.5: make sure a mock customer with the same Facebook id
 * exists (a brand-new customer isn't in the demo data yet).
 */
function MockCustomerSync() {
  const ctx = useContext(IdentityContext)!;
  const id = ctx.identity;
  const slug = ctx.tenant.slug;
  const mockTenant = useMockStore((s) => s.tenants).find((t) => t.slug === slug);
  const exists = useMockStore((s) => s.customers).some(
    (c) => c.tenantId === mockTenant?.id && c.facebookId === id?.facebookId,
  );
  const insert = useMockStore((s) => s.insert);
  useEffect(() => {
    if (!id || !mockTenant || exists) return;
    insert("customers", {
      id: `c-${id.customerId}`,
      tenantId: mockTenant.id,
      facebookId: id.facebookId,
      name: id.name,
      avatarUrl: id.avatarUrl,
      verificationStatus: "UNVERIFIED",
      verificationHistory: [],
      locationPermission: "UNKNOWN",
      addresses: [],
      loyalty: EMPTY_LOYALTY,
      createdAt: new Date().toISOString(),
    });
  }, [id, mockTenant, exists, insert]);
  return null;
}

export function useCustomerIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useCustomerIdentity needs <CustomerIdentityProvider>");
  return ctx;
}
