"use client";

import { useParams } from "next/navigation";
import type { PermissionKey } from "@chowlane/types";
import { useConsoleIdentity } from "./identity";

/**
 * Everything a console screen needs: the signed-in staff member, their role and `can()` (BL-2), the business
 * (`live`, from Supabase) and the Supabase client. Every screen loads its own data from Supabase (RLS applies) —
 * the Phase 1 mock store is gone since 2.6.
 */
export function useConsole() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const auth = useConsoleIdentity();
  const staff = auth.identity?.staff;
  const me = staff?.status === "ACTIVE" ? staff : undefined;
  const perms = me ? (auth.identity?.perms ?? []) : [];
  const can = (key: PermissionKey) => perms.includes(key);

  return {
    slug,
    base: `/${slug}`,
    /** The business in Supabase. */
    live: auth.tenant,
    /** The signed-in ACTIVE staff member. */
    me,
    /** The signed-in staff row in Supabase (any status). */
    staff,
    role: auth.identity?.role,
    perms,
    can,
    isOwner: me?.type === "OWNER",
    ready: auth.ready,
    supabase: auth.supabase,
    refresh: auth.refresh,
    signOut: auth.signOut,
  };
}

export { useNow } from "@chowlane/ui";
