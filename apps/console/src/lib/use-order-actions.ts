"use client";

import type { Customer, Order, RiderRejectReason } from "@chowlane/types";
import {
  approveCustomer,
  approveOrder,
  cancelOrder,
  declinedRiderIds,
  offerOrder,
  pickAutoRider,
  rejectCustomer,
  rejectOrder,
  respondToOffer,
  ridersWithOpenOffers,
  type ActionResult,
} from "@chowlane/lib";
import { toast } from "@chowlane/ui";
import { useMockStore } from "./store";
import { newId, useConsole } from "./use-console";

/**
 * Console order/customer actions = pure rules from @chowlane/lib + their side effects on the mock store
 * (rider availability, coupon uses, loyalty refunds, auto-assign). Phase 2: one server function each.
 */
export function useOrderActions() {
  const { db, settings, me, tenant } = useConsole();
  const patch = useMockStore((s) => s.patch);
  const insert = useMockStore((s) => s.insert);
  const actor = me?.type === "OWNER" ? ("OWNER" as const) : ("ADMIN" as const);
  const now = () => new Date().toISOString();

  const commit = (r: ActionResult, message: string) => {
    if (!r.ok) {
      toast(r.reason, "error");
      return false;
    }
    patch("orders", r.order.id, r.order);
    toast(message);
    return true;
  };

  /** AUTO mode: offer to the nearest eligible rider (BL-5.5). */
  const autoOffer = (order: Order): Order => {
    if (settings.dispatchMode !== "AUTO" || order.status !== "APPROVED" || order.pendingOffer)
      return order;
    const merchant = db.merchants.find((m) => m.id === order.merchantId)!;
    const riders = db.riders.filter((r) => r.tenantId === tenant.id);
    const busy = [...declinedRiderIds(order), ...ridersWithOpenOffers(db.orders, order.id)];
    const rider = pickAutoRider(riders, merchant.location, busy);
    if (!rider) return order; // → "Needs rider" (BL-5.8)
    const r = offerOrder(
      order,
      rider.id,
      "AUTO",
      undefined,
      now(),
      settings.riderResponseTimeoutSec,
    );
    return r.ok ? r.order : order;
  };

  const freeRider = (riderId?: string) => {
    if (riderId) patch("riders", riderId, { activeOrderId: undefined });
  };

  /** Give back coupon use, points and rewards of a rejected/cancelled order (BL-13.7, BL-14.7). */
  const releasePromos = (order: Order) => {
    const at = now();
    if (order.couponId) {
      const red = db.couponRedemptions.find((r) => r.orderId === order.id && !r.released);
      if (red) patch("couponRedemptions", red.id, { released: true });
      const c = db.coupons.find((x) => x.id === order.couponId);
      if (c) patch("coupons", c.id, { usedCount: Math.max(0, c.usedCount - 1) });
    }
    const customer = db.customers.find((c) => c.id === order.customerId);
    if (!customer) return;
    const l = { ...customer.loyalty };
    const add = (
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
      add("POINTS_REFUNDED", order.pointsRedeemed, 0);
    }
    if (order.usedFreeDeliveryReward) {
      l.freeDeliveryRewards += 1;
      add("FREE_DELIVERY_REFUNDED", 0, 1);
    }
    if (order.usedFreeGiftReward) {
      l.freeGiftRewards += 1;
      add("FREE_GIFT_REFUNDED", 0, 1);
    }
    patch("customers", customer.id, { loyalty: l });
  };

  return {
    approve(order: Order) {
      const customer = db.customers.find((c) => c.id === order.customerId)!;
      const r = approveOrder(order, customer, me!.id, actor, now());
      if (!r.ok) return commit(r, "");
      const next = autoOffer(r.order);
      return commit(
        { ok: true, order: next },
        next.pendingOffer ? "Approved — offered to the nearest rider" : "Order approved",
      );
    },
    reject(order: Order, reason: string) {
      const ok = commit(rejectOrder(order, me!.id, actor, reason, now()), "Order rejected");
      if (ok) releasePromos(order);
      return ok;
    },
    cancel(order: Order, reason: string) {
      const ok = commit(cancelOrder(order, me!.id, actor, reason, now()), "Order cancelled");
      if (ok) {
        freeRider(order.riderId);
        releasePromos(order);
      }
      return ok;
    },
    assign(order: Order, riderId: string) {
      const r = offerOrder(
        order,
        riderId,
        "ADMIN",
        me!.id,
        now(),
        settings.riderResponseTimeoutSec,
      );
      const rider = db.riders.find((x) => x.id === riderId);
      const ok = commit(r, `Sent to ${rider?.name ?? "rider"} — waiting for them to accept`);
      if (ok && order.riderId && order.riderId !== riderId) freeRider(order.riderId);
      return ok;
    },
    /** Prototype only: play the rider's side of an offer (the rider app is a separate app in Phase 1). */
    simulateResponse(
      order: Order,
      response: "ACCEPTED" | "REJECTED" | "TIMED_OUT",
      reason?: RiderRejectReason,
    ) {
      const offer = order.pendingOffer;
      const r = respondToOffer(order, response, now(), reason);
      if (!r.ok) return commit(r, "");
      if (response === "ACCEPTED") {
        patch("riders", offer!.riderId, { activeOrderId: order.id });
        return commit(r, "Rider accepted");
      }
      const next = autoOffer(r.order);
      return commit(
        { ok: true, order: next },
        next.pendingOffer
          ? "Rider declined — offered to the next nearest rider"
          : "Rider declined — order needs a rider",
      );
    },
    approveCustomer(customer: Customer) {
      patch("customers", customer.id, approveCustomer(customer, me!.id, now()));
      toast(`${customer.name} verified`);
    },
    /** Reject the ID; their waiting first order is auto-rejected (BL-3.5). */
    rejectCustomer(customer: Customer, reason: string) {
      patch("customers", customer.id, rejectCustomer(customer, me!.id, reason, now()));
      for (const o of db.orders.filter(
        (x) => x.customerId === customer.id && x.status === "PENDING_APPROVAL",
      )) {
        const r = rejectOrder(o, me!.id, actor, "Customer verification rejected", now());
        if (r.ok) {
          patch("orders", o.id, r.order);
          releasePromos(o);
        }
      }
      toast(`${customer.name}'s ID rejected`);
    },
  };
}
