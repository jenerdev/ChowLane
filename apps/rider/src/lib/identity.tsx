"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { Rider } from "@chowlane/types";
import type { PublicTenant } from "@chowlane/db";
import { toRider } from "@chowlane/db/mappers";
import { useAuthIdentity, type AppSupabase } from "@chowlane/db/react";
import type { User } from "@supabase/supabase-js";

/** The signed-in rider of this tenant, from Supabase (any status — the app checks ACTIVE). */
export type RiderIdentity = { rider: Rider };

type Ctx = ReturnType<typeof useAuthIdentity<RiderIdentity>> & { tenant: PublicTenant };
const IdentityContext = createContext<Ctx | null>(null);

export function RiderIdentityProvider({
  tenant,
  children,
}: {
  tenant: PublicTenant;
  children: ReactNode;
}) {
  const resolve = useCallback(
    async (supabase: AppSupabase, user: User): Promise<RiderIdentity | null> => {
      const { data } = await supabase
        .from("riders")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("auth_user_id", user.id)
        .maybeSingle();
      return data ? { rider: toRider(data) } : null;
    },
    [tenant.id],
  );
  const auth = useAuthIdentity("rider", resolve);
  return (
    <IdentityContext.Provider value={{ ...auth, tenant }}>{children}</IdentityContext.Provider>
  );
}

export function useRiderIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useRiderIdentity needs <RiderIdentityProvider>");
  return ctx;
}
