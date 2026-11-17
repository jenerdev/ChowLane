"use client";

import { useCallback } from "react";
import type { TenantSettings } from "@chowlane/types";
import { fromTenantSettings, toTenantSettings } from "@chowlane/db/mappers";
import { useMockStore } from "./store";
import { useConsole } from "./use-console";
import { must, useLive } from "./use-live";

/** The business's settings from Supabase (2.4). */
export function useSettings() {
  const { live } = useConsole();
  return useLive(`settings:${live.id}`, async (sb) =>
    toTenantSettings(
      must(await sb.from("tenant_settings").select("*").eq("tenant_id", live.id).single()),
    ),
  );
}

/**
 * Saves one settings group to Supabase (RLS + the per-permission guard decide). Until orders, dispatch and cash move
 * to Supabase (2.5–2.6), the change is mirrored into the mock store of a demo business so those screens agree.
 * Returns an error message, or null when saved.
 */
export function useSaveSettings() {
  const { live, supabase, hasMockData, settings: mockSettings } = useConsole();
  const setTenantRow = useMockStore((s) => s.setTenantRow);
  return useCallback(
    async (patch: Partial<TenantSettings>): Promise<string | null> => {
      const { data, error } = await supabase
        .from("tenant_settings")
        .update(fromTenantSettings(patch))
        .eq("tenant_id", live.id)
        .select("tenant_id");
      if (error) return error.message;
      if (!data?.length) return "You can't change settings right now.";
      if (hasMockData) setTenantRow("tenantSettings", { ...mockSettings, ...patch });
      return null;
    },
    [supabase, live.id, hasMockData, mockSettings, setTenantRow],
  );
}
