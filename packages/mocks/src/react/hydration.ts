"use client";

import { useSyncExternalStore } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { MockStore } from "../store";

type PersistApi = {
  persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
};

/** true once this browser's saved demo data has loaded — wait for it before redirecting on missing data. */
export function useStoreHydrated(store: UseBoundStore<StoreApi<MockStore>>): boolean {
  const api = (store as unknown as PersistApi).persist;
  return useSyncExternalStore(
    (cb) => api.onFinishHydration(cb),
    () => api.hasHydrated(),
    () => false,
  );
}
