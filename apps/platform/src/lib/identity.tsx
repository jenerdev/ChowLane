"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { PlatformAdmin } from "@chowlane/types";
import { useAuthIdentity, type AppSupabase } from "@chowlane/db/react";
import type { User } from "@supabase/supabase-js";

/** The signed-in ChowLane platform admin (platform_admins row), any status — the app checks ACTIVE. */
export type PlatformIdentity = { admin: PlatformAdmin };

type Ctx = ReturnType<typeof useAuthIdentity<PlatformIdentity>>;
const IdentityContext = createContext<Ctx | null>(null);

export function PlatformIdentityProvider({ children }: { children: ReactNode }) {
  const resolve = useCallback(
    async (supabase: AppSupabase, user: User): Promise<PlatformIdentity | null> => {
      const { data } = await supabase
        .from("platform_admins")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      return data
        ? {
            admin: {
              id: data.id,
              name: data.name,
              email: data.email,
              status: data.status,
              createdAt: data.created_at,
            },
          }
        : null;
    },
    [],
  );
  const auth = useAuthIdentity("platform", resolve);
  return <IdentityContext.Provider value={auth}>{children}</IdentityContext.Provider>;
}

export function usePlatformIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("usePlatformIdentity needs <PlatformIdentityProvider>");
  return ctx;
}
