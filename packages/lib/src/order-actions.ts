/**
 * Order state changes used by the console (Milestone 1.4) — pure functions returning a new Order.
 * Rules: BL-4 (lifecycle), BL-5 (dispatch), BL-3.5 (first order waits for verification).
 */
import type {
  ActorType,
  AssignedBy,
  Customer,
  ID,
  Order,
  OrderStatus,
  RiderRejectReason,
} from "@chowlane/types";
import { canCancel, canTransition } from "./order-status";

export type ActionResult = { ok: true; order: Order } | { ok: false; reason: string };

const event = (
  order: Order,
  status: OrderStatus,
  actorType: ActorType,
  at: string,
  actorId?: ID,
  note?: string,
): Order => ({
  ...order,
  status,
  timeline: [...order.timeline, { status, actorType, actorId, at, note }],
});

/** Approve (BL-4.1). A first order can only be approved once the customer is VERIFIED (BL-3.5). */
export function approveOrder(
  order: Order,
  customer: Customer,
  staffId: ID,
  actor: ActorType,
  now: string,
): ActionResult {
  if (!canTransition(order.status, "APPROVED"))
    return { ok: false, reason: "This order can't be approved now." };
  if (customer.verificationStatus !== "VERIFIED")
    return { ok: false, reason: "Verify the customer's ID first." };
  return {
    ok: true,
    order: { ...event(order, "APPROVED", actor, now, staffId), approvedBy: staffId },
  };
}

export function rejectOrder(
  order: Order,
  staffId: ID,
  actor: ActorType,
  reason: string,
  now: string,
): ActionResult {
  if (!canTransition(order.status, "REJECTED"))
    return { ok: false, reason: "Only orders waiting for approval can be rejected." };
  if (!reason.trim()) return { ok: false, reason: "Give a reason." };
  return {
    ok: true,
    order: {
      ...event(order, "REJECTED", actor, now, staffId, reason),
      rejectReason: reason,
      pendingOffer: undefined,
    },
  };
}

export function cancelOrder(
  order: Order,
  actorId: ID,
  actor: ActorType,
  reason: string,
  now: string,
): ActionResult {
  if (!canCancel(order.status, actor))
    return { ok: false, reason: "This order can't be cancelled anymore." };
  if (!reason.trim()) return { ok: false, reason: "Give a reason." };
  return {
    ok: true,
    order: {
      ...event(order, "CANCELLED", actor, now, actorId, reason),
      cancelReason: reason,
      pendingOffer: undefined,
    },
  };
}

/**
 * Offer the order to a rider (BL-5). Any open offer is withdrawn. If the order was ASSIGNED / AT_MERCHANT
 * (reassignment before pickup, BL-5.9) it goes back to APPROVED until the new rider accepts.
 */
export function offerOrder(
  order: Order,
  riderId: ID,
  by: AssignedBy,
  staffId: ID | undefined,
  now: string,
  timeoutSec: number,
): ActionResult {
  if (!["APPROVED", "ASSIGNED", "AT_MERCHANT"].includes(order.status))
    return { ok: false, reason: "This order can't be assigned now." };
  const attempts = order.assignmentAttempts.map((a) =>
    !a.response ? { ...a, response: "WITHDRAWN" as const, respondedAt: now } : a,
  );
  const reassign = order.status !== "APPROVED";
  const base: Order = reassign
    ? {
        ...event(
          order,
          "APPROVED",
          by === "ADMIN" ? "ADMIN" : "SYSTEM",
          now,
          staffId,
          "Rider reassigned",
        ),
        riderId: undefined,
      }
    : order;
  return {
    ok: true,
    order: {
      ...base,
      assignmentAttempts: [...attempts, { riderId, by, staffId, offeredAt: now }],
      pendingOffer: {
        riderId,
        by,
        staffId,
        offeredAt: now,
        expiresAt: new Date(Date.parse(now) + timeoutSec * 1000).toISOString(),
      },
    },
  };
}

/** Rider accepts / rejects / lets the offer time out (BL-5.3, BL-5.6, BL-5.7). */
export function respondToOffer(
  order: Order,
  response: "ACCEPTED" | "REJECTED" | "TIMED_OUT",
  now: string,
  rejectReason?: RiderRejectReason,
  rejectNote?: string,
): ActionResult {
  const offer = order.pendingOffer;
  if (!offer) return { ok: false, reason: "There's no open offer." };
  const attempts = order.assignmentAttempts.map((a) =>
    a.riderId === offer.riderId && !a.response
      ? {
          ...a,
          response,
          respondedAt: now,
          rejectReason: response === "TIMED_OUT" ? ("NO_RESPONSE" as const) : rejectReason,
          rejectNote,
        }
      : a,
  );
  const cleared = { ...order, assignmentAttempts: attempts, pendingOffer: undefined };
  if (response !== "ACCEPTED") return { ok: true, order: cleared };
  return {
    ok: true,
    order: { ...event(cleared, "ASSIGNED", "RIDER", now, offer.riderId), riderId: offer.riderId },
  };
}

/** Riders who already rejected / timed out on this order (excluded from auto-assign, BL-5.5). */
export function declinedRiderIds(order: Order): ID[] {
  return order.assignmentAttempts
    .filter((a) => a.response === "REJECTED" || a.response === "TIMED_OUT")
    .map((a) => a.riderId);
}

/** Order is approved, no rider and no open offer → shows in "Needs rider" (BL-5.8). */
export function needsRider(order: Order): boolean {
  return order.status === "APPROVED" && !order.pendingOffer;
}

export const RIDER_REJECT_LABELS: Record<RiderRejectReason, string> = {
  NOT_ENOUGH_CASH: "Not enough cash",
  TOO_FAR: "Too far",
  VEHICLE_PROBLEM: "Vehicle problem",
  NO_RESPONSE: "No response",
  OTHER: "Other",
};

// ------------------------------------------------------------------ customer verification (BL-3)
export function approveCustomer(customer: Customer, staffId: ID, now: string): Customer {
  const v = customer.verification
    ? {
        ...customer.verification,
        result: "APPROVED" as const,
        reviewedBy: staffId,
        reviewedAt: now,
      }
    : undefined;
  return {
    ...customer,
    verificationStatus: "VERIFIED",
    verification: v,
    verificationHistory: customer.verificationHistory.map((h) => (v && h.id === v.id ? v : h)),
  };
}

export function rejectCustomer(
  customer: Customer,
  staffId: ID,
  reason: string,
  now: string,
): Customer {
  const v = customer.verification
    ? {
        ...customer.verification,
        result: "REJECTED" as const,
        reviewedBy: staffId,
        reviewedAt: now,
        rejectReason: reason,
      }
    : undefined;
  return {
    ...customer,
    verificationStatus: "REJECTED",
    verification: v,
    verificationHistory: customer.verificationHistory.map((h) => (v && h.id === v.id ? v : h)),
  };
}

export const ID_REJECT_REASONS = [
  "ID photo is blurry or cut off",
  "Selfie doesn't clearly show the person holding the ID",
  "Name on the ID doesn't match the account",
  "ID type isn't accepted",
  "ID is expired",
];

// ------------------------------------------------------------------ time
/** "just now", "12 min ago", "3 h ago", "2 d ago". */
export function timeAgo(iso: string, now: string): string {
  const mins = Math.max(0, Math.floor((Date.parse(now) - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
}

/** Riders who currently hold an open offer (they can't get a second one — BL-5.10). */
export function ridersWithOpenOffers(orders: Order[], exceptOrderId?: ID): ID[] {
  return orders
    .filter((o) => o.pendingOffer && o.id !== exceptOrderId)
    .map((o) => o.pendingOffer!.riderId);
}

/** The rider didn't answer within the time limit (BL-5.6). Phase 2/3: a backend timer handles this. */
export function isOfferExpired(order: Order, now: string): boolean {
  return Boolean(order.pendingOffer && Date.parse(order.pendingOffer.expiresAt) < Date.parse(now));
}

/** Give back a coupon use when an order is rejected / cancelled (BL-13.7). null = nothing to release. */
export function couponRelease(
  order: Order,
  coupons: { id: ID; usedCount: number }[],
  redemptions: { id: ID; orderId: ID; released: boolean }[],
): { couponId: ID; usedCount: number; redemptionId?: ID } | null {
  if (!order.couponId) return null;
  const coupon = coupons.find((c) => c.id === order.couponId);
  if (!coupon) return null;
  const red = redemptions.find((r) => r.orderId === order.id && !r.released);
  return {
    couponId: coupon.id,
    usedCount: Math.max(0, coupon.usedCount - 1),
    redemptionId: red?.id,
  };
}
