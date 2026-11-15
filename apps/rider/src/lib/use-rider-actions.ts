"use client";

import { useRouter } from "next/navigation";
import type { Coupon, Order, RiderRejectReason } from "@chowlane/types";
import {
  applyDeliveredOrder,
  arriveAtStore,
  cancelAllUnavailable,
  completeDelivery,
  endShift,
  formatPeso,
  offerOrder,
  orderFoodPaid,
  pickUpOrder,
  respondToOffer,
  setItemsUnavailable,
  startShift,
  type DeliveryProof,
  type RiderResult,
} from "@chowlane/lib";
import { toast } from "@chowlane/ui";
import { getLocation } from "./device";
import { useMockStore } from "./store";
import { newId, useRider } from "./use-rider";

/**
 * Rider actions = pure rules from @chowlane/lib + side effects on this app's mock store.
 * (The console runs on another origin with its own storage in Phase 1 — D-008.)
 */
export function useRiderActions() {
  const router = useRouter();
  const { db, me, settings, tenant, base, rule, shift } = useRider();
  const patch = useMockStore((s) => s.patch);
  const insert = useMockStore((s) => s.insert);
  const now = () => new Date().toISOString();
  const couponOf = (o: Order): Coupon | undefined => db.coupons.find((c) => c.id === o.couponId);

  const fail = (r: RiderResult<unknown>) => {
    if (!r.ok) toast(r.reason, "error");
    return !r.ok;
  };

  /** Give back coupon use, points and rewards when an order is cancelled (BL-13.7, BL-14.7). */
  const releasePromos = (order: Order) => {
    const at = now();
    if (order.couponId) {
      const red = db.couponRedemptions.find((r) => r.orderId === order.id && !r.released);
      if (red) patch("couponRedemptions", red.id, { released: true });
      const c = couponOf(order);
      if (c) patch("coupons", c.id, { usedCount: Math.max(0, c.usedCount - 1) });
    }
    const customer = db.customers.find((c) => c.id === order.customerId);
    if (!customer) return;
    const l = { ...customer.loyalty };
    const log = (
      kind: "POINTS_REFUNDED" | "FREE_DELIVERY_REFUNDED" | "FREE_GIFT_REFUNDED",
      points: number,
      rewards: number,
    ) =>
      insert("loyaltyTransactions", {
        id: newId("lt"),
        tenantId: order.tenantId,
        customerId: customer.id,
        orderId: order.id,
        kind,
        points,
        rewards,
        at,
      });
    if (order.pointsRedeemed > 0) {
      l.points += order.pointsRedeemed;
      log("POINTS_REFUNDED", order.pointsRedeemed, 0);
    }
    if (order.usedFreeDeliveryReward) {
      l.freeDeliveryRewards += 1;
      log("FREE_DELIVERY_REFUNDED", 0, 1);
    }
    if (order.usedFreeGiftReward) {
      l.freeGiftRewards += 1;
      log("FREE_GIFT_REFUNDED", 0, 1);
    }
    patch("customers", customer.id, { loyalty: l });
  };

  return {
    async timeIn() {
      if (!me) return;
      const location = await getLocation();
      const r = startShift(me, newId("sh"), now(), location);
      if (fail(r) || !r.ok) return;
      insert("shifts", r.value.shift);
      patch("riders", me.id, r.value.rider);
      toast(
        location ? "You're on shift" : "You're on shift — turn on location so dispatch can see you",
      );
    },

    async timeOut() {
      if (!me || !shift) return;
      const location = await getLocation();
      const r = endShift(me, shift, db.orders, now(), location);
      if (fail(r) || !r.ok) return;
      patch("shifts", shift.id, r.value.shift);
      patch("riders", me.id, r.value.rider);
      toast(`Shift ended — hand over ${formatPeso(r.value.shift.expectedRemit)} to your admin`);
      router.replace(base);
    },

    accept(order: Order) {
      if (!me) return;
      if (me.activeOrderId) return void toast("Finish your current delivery first.", "error");
      const r = respondToOffer(order, "ACCEPTED", now());
      if (!r.ok) return void toast(r.reason, "error");
      patch("orders", order.id, r.order);
      patch("riders", me.id, { activeOrderId: order.id });
      toast("Order accepted — head to the store");
      router.push(`${base}/active`);
    },

    reject(order: Order, reason: RiderRejectReason, note?: string) {
      const r = respondToOffer(order, "REJECTED", now(), reason, note);
      if (!r.ok) return void toast(r.reason, "error");
      patch("orders", order.id, r.order);
      toast("Offer declined");
    },

    /** Countdown reached 0 (BL-5.6). */
    expire(order: Order) {
      const r = respondToOffer(order, "TIMED_OUT", now());
      if (!r.ok) return;
      patch("orders", order.id, r.order);
      toast("The offer expired", "error");
    },

    /** Prototype only: take an approved order that has no rider and offer it to me. */
    simulateOffer() {
      if (!me) return;
      const candidate = db.orders.find(
        (o) => o.tenantId === tenant.id && o.status === "APPROVED" && !o.pendingOffer && !o.riderId,
      );
      if (!candidate) return void toast("No approved orders are waiting for a rider", "error");
      const r = offerOrder(
        candidate,
        me.id,
        "AUTO",
        undefined,
        now(),
        settings.riderResponseTimeoutSec,
      );
      if (!r.ok) return void toast(r.reason, "error");
      patch("orders", candidate.id, r.order);
    },

    arrive(order: Order) {
      if (!me) return;
      const r = arriveAtStore(order, me.id, now());
      if (fail(r) || !r.ok) return;
      patch("orders", order.id, r.value);
    },

    setUnavailable(order: Order, idx: number[]) {
      patch("orders", order.id, setItemsUnavailable(order, idx, couponOf(order)));
    },

    cancelUnavailable(order: Order) {
      if (!me) return;
      const r = cancelAllUnavailable(order, me.id, now());
      if (fail(r) || !r.ok) return;
      patch("orders", order.id, r.value);
      patch("riders", me.id, { activeOrderId: undefined });
      releasePromos(order);
      toast("Order cancelled — nothing was available");
      router.replace(base);
    },

    pickUp(order: Order, amount: number | undefined, receipt: string | undefined) {
      if (!me) return false;
      const r = pickUpOrder(order, me.id, amount, receipt, now());
      if (fail(r) || !r.ok) return false;
      patch("orders", order.id, r.value);
      toast("Picked up — head to the customer");
      return true;
    },

    deliver(order: Order, proof: DeliveryProof, cashCollected: boolean) {
      if (!me) return;
      const at = now();
      const customer = db.customers.find((c) => c.id === order.customerId);
      const loyalty = customer
        ? applyDeliveredOrder(
            customer.loyalty,
            settings.loyalty,
            orderFoodPaid(order, couponOf(order)),
          )
        : undefined;
      const r = completeDelivery(
        order,
        me.id,
        rule,
        proof,
        cashCollected,
        loyalty?.pointsEarned ?? 0,
        at,
      );
      if (fail(r) || !r.ok) return;
      patch("orders", order.id, r.value);
      patch("riders", me.id, { activeOrderId: undefined });
      if (customer && loyalty) {
        patch("customers", customer.id, { loyalty: loyalty.loyalty });
        const log = (
          kind: "POINTS_EARNED" | "FREE_DELIVERY_EARNED" | "FREE_GIFT_EARNED",
          points: number,
          rewards: number,
        ) =>
          insert("loyaltyTransactions", {
            id: newId("lt"),
            tenantId: order.tenantId,
            customerId: customer.id,
            orderId: order.id,
            kind,
            points,
            rewards,
            at,
          });
        if (loyalty.pointsEarned > 0) log("POINTS_EARNED", loyalty.pointsEarned, 0);
        if (loyalty.freeDeliveryEarned) log("FREE_DELIVERY_EARNED", 0, 1);
        if (loyalty.freeGiftEarned) log("FREE_GIFT_EARNED", 0, 1);
      }
      toast(
        rule.mode === "DAILY"
          ? "Delivered — nice work!"
          : `Delivered — you earned ${formatPeso(r.value.riderEarning ?? 0)}`,
      );
      router.replace(base);
    },
  };
}
