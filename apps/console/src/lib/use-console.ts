"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { PermissionKey } from "@chowlane/types";
import { permissionsOf } from "@chowlane/lib";
import { useSession } from "@chowlane/mocks/react";
import { useMockStore } from "./store";

/**
 * Everything a console screen needs: tenant (live from the mock store), its settings, the signed-in
 * staff member, their role and a `can()` permission check (BL-2). Phase 2: Supabase session + queries.
 */
export function useConsole() {
  const { tenant: slug } = useParams<{ tenant: string }>();
  const db = useMockStore();
  const { staffId } = useSession(`console:${slug}`);

  const tenant = db.tenants.find((t) => t.slug === slug)!;
  const settings = db.tenantSettings.find((s) => s.tenantId === tenant.id)!;
  const me = db.staff.find((s) => s.id === staffId && s.tenantId === tenant.id);
  const role = db.roles.find((r) => r.id === me?.roleId);
  const perms = me ? permissionsOf(me, role) : [];
  const can = (key: PermissionKey) => perms.includes(key);
  const isOwner = me?.type === "OWNER";

  return { slug, base: `/${slug}`, db, tenant, settings, me, role, perms, can, isOwner };
}

/** New id for mock rows. */
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

/** Current time, captured once when the screen mounts (keeps render pure). */
export function useNow(): number {
  const [now] = useState(() => Date.now());
  return now;
}
