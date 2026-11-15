"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Centavos, LatLng } from "@chowlane/types";

export type CheckoutDraft = {
  pin?: LatLng;
  addressText: string;
  notes: string;
  barangayFeeId?: string;
  couponCode: string;
  useFreeDelivery: boolean;
  claimGift: boolean;
  usePoints: boolean;
  points: number;
  changeFor?: Centavos;
};

export const EMPTY_DRAFT: CheckoutDraft = {
  addressText: "",
  notes: "",
  couponCode: "",
  useFreeDelivery: false,
  claimGift: false,
  usePoints: false,
  points: 0,
};

type DraftState = {
  drafts: Record<string, CheckoutDraft>;
  setDraft: (slug: string, d: CheckoutDraft) => void;
  clearDraft: (slug: string) => void;
};

/** Checkout choices kept while the customer goes to the ID step and back (session only). */
export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (slug, d) => set((s) => ({ drafts: { ...s.drafts, [slug]: d } })),
      clearDraft: (slug) =>
        set((s) => {
          const drafts = { ...s.drafts };
          delete drafts[slug];
          return { drafts };
        }),
    }),
    {
      name: "chowlane-customer-checkout",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);

export function useCheckoutDraft(slug: string) {
  const draft = useDraftStore((s) => s.drafts[slug]) ?? EMPTY_DRAFT;
  const setDraft = useDraftStore((s) => s.setDraft);
  const clearDraft = useDraftStore((s) => s.clearDraft);
  return {
    draft,
    update: (patch: Partial<CheckoutDraft>) => setDraft(slug, { ...draft, ...patch }),
    clear: () => clearDraft(slug),
  };
}
