"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
