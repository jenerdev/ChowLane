"use client";

import { useRouter } from "next/navigation";
import type { BarangayFee, Coupon } from "@chowlane/types";
import {
  CHECKOUT_MESSAGES,
  nextOrderNumber,
  normalizeCouponCode,
  offerOrder,
  pickAutoRider,
  placeOrder,
  ridersWithOpenOffers,
  type NewVerification,
} from "@chowlane/lib";
import { toast } from "@chowlane/ui";
import { useCart } from "./cart";
import { useCheckoutDraft } from "./checkout-draft";
import { useCurrentLocation } from "./location";
import { useMockStore } from "./store";
import { newId, useCustomer } from "./use-customer";

/** Builds the checkout input from cart + draft, and places the order with all its bookkeeping. */
export function useCheckout() {
  const router = useRouter();
  const ctx = useCustomer();
  const { db, tenant, settings, me, slug, base } = ctx;
  const { cart, clear: clearCart } = useCart(slug);
  const { draft, clear: clearDraft } = useCheckoutDraft(slug);
  const here = useCurrentLocation(slug);
  const insert = useMockStore((s) => s.insert);
  const patch = useMockStore((s) => s.patch);

  const merchant = db.merchants.find((m) => m.id === cart.merchantId);
  const products = db.products.filter((p) => p.tenantId === tenant.id);
  const fallback = me?.addresses[0]?.location ?? settings.serviceArea.center;
  const current = here ?? fallback;
  const pin = draft.pin ?? current;
  const code = normalizeCouponCode(draft.couponCode);
  const coupon: Coupon | undefined = code
    ? db.coupons.find((c) => c.tenantId === tenant.id && c.code === code)
    : undefined;
  const customerCouponUses = coupon
    ? db.couponRedemptions.filter(
        (r) => r.couponId === coupon.id && r.customerId === me?.id && !r.released,
      ).length
    : 0;
  const barangayFee: BarangayFee | undefined = db.barangayFees.find(
    (b) => b.id === draft.barangayFeeId && b.tenantId === tenant.id,
  );

  const input =
    merchant && me
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
          customerCouponUses,
          useFreeDeliveryReward: draft.useFreeDelivery,
          claimFreeGift: draft.claimGift,
          pointsToRedeem: draft.usePoints ? draft.points : 0,
          changeFor: draft.changeFor,
          now: new Date().toISOString(),
        }
      : null;

  function place(verification?: NewVerification) {
    if (!input || !me) return false;
    const orderId = newId("o");
    const addressText = [
      draft.addressText.trim(),
      barangayFee ? `${barangayFee.barangay}, ${barangayFee.cityMunicipality}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    const r = placeOrder({
      ...input,
      now: new Date().toISOString(),
      tenantId: tenant.id,
      orderId,
      orderNumber: nextOrderNumber(
        db.orders.filter((o) => o.tenantId === tenant.id).map((o) => o.orderNumber),
        slug,
      ),
      addressText,
      notes: draft.notes,
      verification: verification ? { ...verification, id: newId("v") } : undefined,
    });
    if (!r.ok) {
      toast(r.reason ?? CHECKOUT_MESSAGES[r.problems[0]!], "error");
      return false;
    }
    let order = r.order;
    // Auto-approved + AUTO dispatch → offer to the nearest free rider (BL-5.5), like the console does.
    if (r.autoApproved && settings.dispatchMode === "AUTO") {
      const riders = db.riders.filter((x) => x.tenantId === tenant.id);
      const rider = pickAutoRider(riders, merchant!.location, ridersWithOpenOffers(db.orders));
      if (rider) {
        const o = offerOrder(
          order,
          rider.id,
          "AUTO",
          undefined,
          order.createdAt,
          settings.riderResponseTimeoutSec,
        );
        if (o.ok) order = o.order;
      }
    }
    insert("orders", order);
    patch("customers", me.id, r.customer);
    if (r.redemption && coupon) {
      insert("couponRedemptions", { id: newId("cr"), ...r.redemption });
      patch("coupons", coupon.id, { usedCount: r.couponUsedCount! });
    }
    for (const t of r.transactions) insert("loyaltyTransactions", { id: newId("lt"), ...t });
    clearCart();
    clearDraft();
    toast(r.autoApproved ? "Order confirmed!" : "Order placed");
    router.replace(`${base}/orders/${order.id}`);
    return true;
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
  };
}
