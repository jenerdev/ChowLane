"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { PublicTenant } from "@chowlane/db";
import { useAuthIdentity, type AppSupabase } from "@chowlane/db/react";
import type { User } from "@supabase/supabase-js";

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
    <IdentityContext.Provider value={{ ...auth, tenant }}>{children}</IdentityContext.Provider>
  );
}

export function useCustomerIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useCustomerIdentity needs <CustomerIdentityProvider>");
  return ctx;
}
