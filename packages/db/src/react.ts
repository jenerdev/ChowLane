"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { AuthApp } from "./auth";
import { createBrowserSupabase } from "./browser";
import type { Database } from "./database.types";

export type AppSupabase = SupabaseClient<Database>;

export type AuthIdentityState<T> = {
  /** false until the first check of the session (and the identity lookup) has finished */
  ready: boolean;
  user: User | null;
  /** what this app knows about the signed-in user (staff row, rider row, …) or null */
  identity: T | null;
};

/**
 * Client-side session for one app: loads the signed-in Supabase user, resolves it to the app's own identity
 * (e.g. the staff row of this tenant) with `resolve`, and re-resolves on sign-in / sign-out.
 */
export function useAuthIdentity<T>(
  app: AuthApp,
  resolve: (supabase: AppSupabase, user: User) => Promise<T | null>,
) {
  const supabase = useMemo(() => createBrowserSupabase(app), [app]);
  const [state, setState] = useState<AuthIdentityState<T>>({
    ready: false,
    user: null,
    identity: null,
  });
  const resolveRef = useRef(resolve);
  useEffect(() => {
    resolveRef.current = resolve;
  }, [resolve]);

  const refresh = useCallback(async (): Promise<T | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const identity = user ? await resolveRef.current(supabase, user) : null;
    setState({ ready: true, user, identity });
    return identity;
  }, [supabase]);

  useEffect(() => {
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Don't call Supabase inside this callback (it can deadlock the auth lock) — defer it.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => void refresh(), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ ready: true, user: null, identity: null });
  }, [supabase]);

  return { ...state, supabase, refresh, signOut };
}

/** A table to watch: changes the signed-in user may read (RLS) on `table`, optionally `filter`ed ("tenant_id=eq.…"). */
export type RealtimeWatch = { table: string; filter?: string };

/**
 * Supabase Realtime (2.6): calls `onChange` (debounced) whenever a watched row changes, so a screen reloads its data
 * instead of polling. Realtime only delivers rows the user may read (RLS). Also reloads when the window regains focus
 * and every `fallbackMs` as a safety net for a dropped connection. `enabled: false` (e.g. signed out) stops it.
 */
export function useRealtimeReload(
  supabase: AppSupabase,
  channel: string,
  watch: RealtimeWatch[],
  onChange: () => void,
  { enabled = true, fallbackMs = 60_000 }: { enabled?: boolean; fallbackMs?: number } = {},
) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  const key = JSON.stringify(watch);
  // supabase-js reuses a channel with the same topic — each hook gets its own
  const topic = `${channel}:${useId()}`;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onChangeRef.current(), 250);
    };
    let ch = supabase.channel(topic);
    for (const w of JSON.parse(key) as RealtimeWatch[]) {
      ch = ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: w.table, ...(w.filter ? { filter: w.filter } : {}) },
        fire,
      );
    }
    ch.subscribe();
    window.addEventListener("focus", fire);
    const poll = setInterval(fire, fallbackMs);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("focus", fire);
      void supabase.removeChannel(ch);
    };
  }, [supabase, topic, key, enabled, fallbackMs]);
}
