"use client";

import { useParams } from "next/navigation";
import type { PermissionKey } from "@chowlane/types";
import { useConsoleIdentity } from "./identity";
import { useMockStore } from "./store";

/**
 * Everything a console screen needs. The signed-in staff member, their role and `can()` come from Supabase
 * (BL-2). Screens not yet moved to Supabase still read the tenant, settings and records from the mock store
 * (`db`, `tenant`, `settings`) until Milestones 2.4–2.7; `live` is the business as stored in Supabase.
 */
export function useConsole() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const auth = useConsoleIdentity();
  const staff = auth.identity?.staff;
  const active = staff?.status === "ACTIVE" ? staff : undefined;

  const mockTenant = db.tenants.find((t) => t.slug === slug);
  // Mock screens keep their own ids: the mock staff member with the same email, else the real row.
  const me = active
    ? (db.staff.find(
        (s) =>
          s.tenantId === mockTenant?.id && s.email.toLowerCase() === active.email.toLowerCase(),
      ) ?? active)
    : undefined;
  const perms = active ? (auth.identity?.perms ?? []) : [];
  const can = (key: PermissionKey) => perms.includes(key);

  return {
    slug,
    base: `/${slug}`,
    db,
    /** Mock tenant (screens on mock data). Only use when `hasMockData`. */
    tenant: mockTenant!,
    settings: db.tenantSettings.find((s) => s.tenantId === mockTenant?.id)!,
    hasMockData: Boolean(mockTenant),
    /** The business in Supabase. */
    live: auth.tenant,
    me,
    /** The signed-in staff row in Supabase (any status). */
    staff,
    role: auth.identity?.role,
    perms,
    can,
    isOwner: active?.type === "OWNER",
    ready: auth.ready,
    supabase: auth.supabase,
    refresh: auth.refresh,
    signOut: auth.signOut,
  };
}

export { newId } from "@chowlane/mocks/store";

export { useNow } from "@chowlane/ui";
