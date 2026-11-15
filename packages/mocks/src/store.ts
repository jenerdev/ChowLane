/**
 * Client-side mock "backend" for Phase 1 (FND-004): a Zustand store seeded from mockDb and
 * persisted to localStorage per app. Screens read/write it; Phase 2 swaps it for Supabase.
 *
 * Each app runs on its own origin, so stores do NOT sync across apps (D-008).
 *
 * ⚠ Selectors must return stable values: select a collection, then filter OUTSIDE the selector —
 *   `useMockStore((s) => s.orders).filter(...)`. Returning a new array from the selector
 *   (`(s) => s.orders.filter(...)`) causes an infinite render loop (React error #185).
 */
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockDb, type MockDb } from "./index";

type Row = { id: string };
type Collections = { [K in keyof MockDb as MockDb[K] extends Row[] ? K : never]: MockDb[K] };
export type CollectionName = keyof Collections;
type RowOf<C extends CollectionName> = Collections[C][number];

export type MockStore = MockDb & {
  /** Merge fields into one row. */
  patch: <C extends CollectionName>(collection: C, id: string, patch: Partial<RowOf<C>>) => void;
  insert: <C extends CollectionName>(collection: C, row: RowOf<C>) => void;
  remove: <C extends CollectionName>(collection: C, id: string) => void;
  /** Replace tenant settings / billing (keyed by tenantId, not id). */
  setTenantRow: <K extends "tenantSettings" | "tenantBilling">(
    key: K,
    row: MockDb[K][number],
  ) => void;
  reset: () => void;
};

const seed = (): MockDb => structuredClone(mockDb);

const STORE_VERSION = 1;

export function createMockStore(appKey: string): UseBoundStore<StoreApi<MockStore>> {
  return create<MockStore>()(
    persist(
      (set) => ({
        ...seed(),
        patch: (collection, id, patch) =>
          set((s) => ({
            [collection]: (s[collection] as Row[]).map((r) =>
              r.id === id ? { ...r, ...patch } : r,
            ),
          })),
        insert: (collection, row) =>
          set((s) => ({ [collection]: [...(s[collection] as Row[]), row] })),
        remove: (collection, id) =>
          set((s) => ({ [collection]: (s[collection] as Row[]).filter((r) => r.id !== id) })),
        setTenantRow: (key, row) =>
          set((s) => ({
            [key]: [
              ...(s[key] as { tenantId: string }[]).filter((r) => r.tenantId !== row.tenantId),
              row,
            ],
          })),
        reset: () => set(seed()),
      }),
      {
        name: `chowlane-mock-${appKey}`,
        version: STORE_VERSION,
        storage: createJSONStorage(() => localStorage),
        // Rehydrate manually after mount (see <MockStoreHydrator>) to avoid SSR hydration mismatches.
        skipHydration: true,
        partialize: (s) => {
          const { patch: _p, insert: _i, remove: _r, setTenantRow: _t, reset: _x, ...data } = s;
          return data;
        },
      },
    ),
  );
}

/** New id for a mock row, e.g. newId("o") → "o-1a2b3c4d". Phase 2: database ids. */
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
