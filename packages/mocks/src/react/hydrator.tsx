"use client";

import { useEffect } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import type { MockStore } from "../store";

type PersistedStore = UseBoundStore<StoreApi<MockStore>> & {
  persist: { rehydrate: () => Promise<void> | void };
};

/** Loads saved demo data from localStorage after the first render. */
export function MockStoreHydrator({ store }: { store: UseBoundStore<StoreApi<MockStore>> }) {
  useEffect(() => {
    void (store as PersistedStore).persist.rehydrate();
  }, [store]);
  return null;
}
