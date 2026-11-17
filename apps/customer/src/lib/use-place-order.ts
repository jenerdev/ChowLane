"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BarangayFee, Coupon } from "@chowlane/types";
import { normalizeCouponCode } from "@chowlane/lib";
import type { VerificationUpload } from "@chowlane/db/mappers";
import { toast } from "@chowlane/ui";
import { useCart } from "./cart";
import { useCheckoutDraft } from "./checkout-draft";
import { useCurrentLocation } from "./location";
import { placeOrderAction } from "./order-actions";
import { useCustomer } from "./use-customer";

type CouponLookup = { code: string; coupon?: Coupon; myUses: number };

/**
 * Builds the checkout quote input from cart + draft (shown live on the checkout screen) and places the order through
 * the server (`placeOrderAction`), which prices it again with the same rules on server-side data.
 */
export function useCheckout() {
  const router = useRouter();
  const ctx = useCustomer();
  const { db, tenant, settings, me, slug, base, supabase, reload } = ctx;
  const { cart, clear: clearCart } = useCart(slug);
  const { draft, clear: clearDraft } = useCheckoutDraft(slug);
  const here = useCurrentLocation(slug);
  const [busy, setBusy] = useState(false);

  // Coupons aren't readable by customers: look the typed code up with check_coupon (BL-13.5).
  const code = normalizeCouponCode(draft.couponCode);
  const [lookup, setLookup] = useState<CouponLookup>();
  useEffect(() => {
    if (!code || lookup?.code === code) return;
    let stale = false;
    void supabase.rpc("check_coupon", { p_tenant: tenant.id, p_code: code }).then(({ data }) => {
      if (stale) return;
      const row = data?.[0];
      setLookup({
        code,
        myUses: row?.my_uses ?? 0,
        coupon: row
          ? {
              id: row.id,
              tenantId: tenant.id,
              code: row.code,
              description: row.description ?? undefined,
              type: row.type,
              percentOff: row.percent_off ?? undefined,
              maxDiscount: row.max_discount ?? undefined,
              minOrderSubtotal: row.min_order_subtotal ?? undefined,
              maxUses: row.max_uses,
              usedCount: row.used_count,
              perCustomerLimit: row.per_customer_limit,
              validFrom: row.valid_from,
              validUntil: row.valid_until,
              isActive: row.is_active,
              createdBy: "",
              createdAt: row.valid_from,
            }
          : undefined,
      });
    });
    return () => {
      stale = true;
    };
  }, [code, lookup?.code, supabase, tenant.id]);
  const coupon = code && lookup?.code === code ? lookup.coupon : undefined;

  const merchant = db.merchants.find((m) => m.id === cart.merchantId);
  const products = db.products;
  const fallback = me?.addresses[0]?.location ?? settings?.serviceArea.center;
  const current = here ?? fallback!;
  const pin = draft.pin ?? current;
  const barangayFee: BarangayFee | undefined = db.barangayFees.find(
    (b) => b.id === draft.barangayFeeId,
  );

  const input =
    merchant && me && settings
      ? {
          lines: cart.lines,
          products,
          merchant,
          settings,
          customer: me,
          pin,
          barangayFee,
          couponCode: code || undefined,
          coupon,
          customerCouponUses: lookup?.myUses ?? 0,
          useFreeDeliveryReward: draft.useFreeDelivery,
          claimFreeGift: draft.claimGift,
          pointsToRedeem: draft.usePoints ? draft.points : 0,
          changeFor: draft.changeFor,
          now: new Date().toISOString(),
        }
      : null;

  async function place(verification?: VerificationUpload) {
    if (!input || !merchant || busy) return false;
    setBusy(true);
    try {
      const addressText = [
        draft.addressText.trim(),
        barangayFee ? `${barangayFee.barangay}, ${barangayFee.cityMunicipality}` : null,
      ]
        .filter(Boolean)
        .join(", ");
      const r = await placeOrderAction({
        tenantId: tenant.id,
        merchantId: merchant.id,
        lines: cart.lines,
        pin,
        addressText,
        notes: draft.notes,
        barangayFeeId: barangayFee?.id,
        couponCode: code || undefined,
        useFreeDelivery: draft.useFreeDelivery,
        claimGift: draft.claimGift,
        points: draft.usePoints ? draft.points : 0,
        changeFor: draft.changeFor,
        verification,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return false;
      }
      clearCart();
      clearDraft();
      await reload();
      toast(r.autoApproved ? "Order confirmed!" : "Order placed");
      router.replace(`${base}/orders/${r.orderId}`);
      return true;
    } finally {
      setBusy(false);
    }
  }

  return {
    ...ctx,
    cart,
    draft,
    merchant,
    products,
    pin,
    current,
    coupon,
    barangayFee,
    input,
    place,
    busy,
  };
}
