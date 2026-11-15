"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartLine } from "@chowlane/lib";

export type Cart = { merchantId?: string; lines: CartLine[] };
type CartState = {
  carts: Record<string, Cart>;
  setCart: (slug: string, cart: Cart) => void;
  clearCart: (slug: string) => void;
};

/** Cart per tenant, saved in this browser (one merchant per cart — BL-6). */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      setCart: (slug, cart) => set((s) => ({ carts: { ...s.carts, [slug]: cart } })),
      clearCart: (slug) =>
        set((s) => {
          const carts = { ...s.carts };
          delete carts[slug];
          return { carts };
        }),
    }),
    {
      name: "chowlane-customer-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

const EMPTY: Cart = { lines: [] };

export function useCart(slug: string) {
  const cart = useCartStore((s) => s.carts[slug]) ?? EMPTY;
  const setCart = useCartStore((s) => s.setCart);
  const clearCart = useCartStore((s) => s.clearCart);
  const count = cart.lines.reduce((n, l) => n + l.qty, 0);

  return {
    cart,
    count,
    qtyOf: (productId: string) => cart.lines.find((l) => l.productId === productId)?.qty ?? 0,
    /** Returns false when the cart holds another merchant's items (caller asks to start over). */
    add(merchantId: string, productId: string, qty: number) {
      if (cart.merchantId && cart.merchantId !== merchantId && cart.lines.length) return false;
      const existing = cart.lines.find((l) => l.productId === productId);
      const lines = existing
        ? cart.lines.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
        : [...cart.lines, { productId, qty }];
      setCart(slug, { merchantId, lines });
      return true;
    },
    setQty(productId: string, qty: number) {
      const lines =
        qty <= 0
          ? cart.lines.filter((l) => l.productId !== productId)
          : cart.lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
      if (lines.length === 0) clearCart(slug);
      else setCart(slug, { ...cart, lines });
    },
    replace(merchantId: string, lines: CartLine[]) {
      setCart(slug, { merchantId, lines });
    },
    clear: () => clearCart(slug),
  };
}
