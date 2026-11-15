"use client";

import { useState } from "react";
import { useSession } from "@chowlane/mocks/react";
import { useMockStore } from "./store";

export const SESSION_SCOPE = "platform";

/**
 * Everything a platform screen needs: the whole mock DB (all tenants), the signed-in platform admin and a
 * `now` captured once per screen (keeps render pure). Phase 2: Supabase with platform-admin read-all RLS.
 */
export function usePlatform() {
  const db = useMockStore();
  const { staffId } = useSession(SESSION_SCOPE);
  const me = db.platformAdmins.find((a) => a.id === staffId && a.status === "ACTIVE");
  const [now] = useState(() => new Date().toISOString());
  return { db, me, now };
}

export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
