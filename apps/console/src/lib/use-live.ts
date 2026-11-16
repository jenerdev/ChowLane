"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppSupabase } from "@chowlane/db/react";
import { useConsole } from "./use-console";

/**
 * Loads data for a screen that runs on Supabase (as the signed-in user, so RLS applies). `key` identifies the
 * query — it reloads when the key changes; call `reload()` after a save.
 */
export function useLive<T>(key: string, load: (supabase: AppSupabase) => Promise<T>) {
  const { supabase, ready } = useConsole();
  const [state, setState] = useState<{ data?: T; error?: string; loading: boolean }>({
    loading: true,
  });
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const reload = useCallback(async () => {
    try {
      const data = await loadRef.current(supabase);
      setState({ data, loading: false });
    } catch (e) {
      setState((s) => ({
        ...s,
        error: e instanceof Error ? e.message : String(e),
        loading: false,
      }));
    }
  }, [supabase]);

  useEffect(() => {
    if (ready) void reload();
  }, [ready, reload, key]);

  return { ...state, reload };
}

/** Throws the Supabase error so useLive shows it. */
export function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}
