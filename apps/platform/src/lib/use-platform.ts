"use client";

import { useState } from "react";
import { usePlatformIdentity } from "./identity";
import { useMockStore } from "./store";

/**
 * Everything a platform screen needs. The signed-in platform admin comes from Supabase (platform_admins);
 * screens still read all tenants' records from the mock store until Milestone 2.7, so `me` is the mock admin with
 * the same email. `now` is captured once per screen (keeps render pure).
 */
export function usePlatform() {
  const db = useMockStore();
  const auth = usePlatformIdentity();
  const live = auth.identity?.admin;
  const active = live?.status === "ACTIVE" ? live : undefined;
  const me = active
    ? (db.platformAdmins.find((a) => a.email.toLowerCase() === active.email.toLowerCase()) ??
      active)
    : undefined;
  const [now] = useState(() => new Date().toISOString());
  return { db, me, now, ready: auth.ready, signOut: auth.signOut };
}

export { newId } from "@chowlane/mocks/store";
