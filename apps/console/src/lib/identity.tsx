"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import type { PermissionKey, Role, StaffUser } from "@chowlane/types";
import { permissionsOf } from "@chowlane/lib";
import type { PublicTenant } from "@chowlane/db";
import { toRole, toStaffUser } from "@chowlane/db/mappers";
import { useAuthIdentity, type AppSupabase } from "@chowlane/db/react";
import type { User } from "@supabase/supabase-js";

/** The signed-in staff member of this tenant, from Supabase (BL-2). */
export type ConsoleIdentity = { staff: StaffUser; role?: Role; perms: PermissionKey[] };

type Ctx = ReturnType<typeof useAuthIdentity<ConsoleIdentity>> & { tenant: PublicTenant };
const IdentityContext = createContext<Ctx | null>(null);

/** Loads the console session for one tenant. Wraps every /[tenant] page, login included. */
export function ConsoleIdentityProvider({
  tenant,
  children,
}: {
  tenant: PublicTenant;
  children: ReactNode;
}) {
  const resolve = useCallback(
    async (supabase: AppSupabase, user: User): Promise<ConsoleIdentity | null> => {
      const load = () =>
        supabase
          .from("staff_users")
          .select("*, role:roles(*)")
          .eq("tenant_id", tenant.id)
          .eq("auth_user_id", user.id)
          .maybeSingle();
      let { data } = await load();
      if (!data) {
        // First login of an invited admin: link the invite to this login (BL-2.6).
        const { data: accepted } = await supabase.rpc("accept_staff_invite", {
          p_tenant: tenant.id,
        });
        if (accepted) ({ data } = await load());
      }
      if (!data) return null;
      const staff = toStaffUser(data);
      const role = data.role ? toRole(data.role) : undefined;
      return { staff, role, perms: permissionsOf(staff, role) };
    },
    [tenant.id],
  );
  const auth = useAuthIdentity("console", resolve);
  return (
    <IdentityContext.Provider value={{ ...auth, tenant }}>{children}</IdentityContext.Provider>
  );
}

export function useConsoleIdentity(): Ctx {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useConsoleIdentity needs <ConsoleIdentityProvider>");
  return ctx;
}
