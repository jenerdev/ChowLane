/**
 * Rider app business logic (Milestone 1.6) — pure functions only, tested in rider-app.test.ts.
 * Rules: BL-5 (offers), BL-6 (shifts), BL-8 (pay), BL-11 (rider buys at the store), BL-12 (cash remittance).
 */
import type {
  Centavos,
  Coupon,
  ID,
  LatLng,
  Order,
  OrderStatus,
  Rider,
  RiderPayRule,
  Shift,
} from "@chowlane/types";
import { computeCouponDiscount } from "./coupons";
import { allItemsUnavailable, computeSubtotal } from "./order-totals";
import { canTransition } from "./order-status";
import { computeExpectedRemit } from "./remittance";
import { riderEarningForOrder } from "./rider-pay";

export type RiderResult<T> = { ok: true; value: T } | { ok: false; reason: string };

const event = (
  order: Order,
  status: OrderStatus,
  riderId: ID,
  at: string,
  note?: string,
): Order => ({
  ...order,
  status,
  timeline: [...order.timeline, { status, actorType: "RIDER", actorId: riderId, at, note }],
});

// ------------------------------------------------------------------ shifts (BL-6)

/** Time in → new OPEN shift; rider goes on shift (BL-6.1, BL-6.4). */
export function startShift(
  rider: Rider,
  shiftId: ID,
  now: string,
  location?: LatLng,
): RiderResult<{ rider: Rider; shift: Shift }> {
  if (rider.status !== "ACTIVE")
    return { ok: false, reason: "Your account is turned off. Ask your admin." };
  if (rider.isOnShift) return { ok: false, reason: "You're already on shift." };
  const shift: Shift = {
    id: shiftId,
    tenantId: rider.tenantId,
    riderId: rider.id,
    timeIn: now,
    timeInLocation: location,
    cashCollected: 0,
    storePaid: 0,
    expectedRemit: 0,
    remitStatus: "OPEN",
  };
  return {
    ok: true,
    value: {
      rider: {
        ...rider,
        isOnShift: true,
        currentShiftId: shiftId,
        lastLocation: location ?? rider.lastLocation,
      },
      shift,
    },
  };
}

/** Time out is blocked while holding an active order or an open offer (BL-6.3). */
export function canTimeOut(rider: Rider, orders: Order[]): RiderResult<true> {
  if (!rider.isOnShift) return { ok: false, reason: "You're not on shift." };
  if (rider.activeOrderId)
    return { ok: false, reason: "Finish your current delivery before timing out." };
  if (orders.some((o) => o.pendingOffer?.riderId === rider.id))
    return { ok: false, reason: "Accept or reject the order offer before timing out." };
  return { ok: true, value: true };
}

/** Orders delivered by this rider during the shift (cash collected between time in and time out/now). */
export function shiftDeliveries(shift: Shift, orders: Order[], now: string): Order[] {
  const from = Date.parse(shift.timeIn);
  const to = Date.parse(shift.timeOut ?? now);
  return orders.filter((o) => {
    if (o.riderId !== shift.riderId || o.status !== "DELIVERED") return false;
    const at = Date.parse(o.cashCollectedAt ?? o.timeline.at(-1)!.at);
    return at >= from && at <= to;
  });
}

/** Cash summary of a shift: collected − paid at stores = to hand over (BL-12.2). */
export function shiftSummary(shift: Shift, orders: Order[], now: string) {
  const delivered = shiftDeliveries(shift, orders, now);
  return { deliveries: delivered.length, ...computeExpectedRemit(delivered) };
}

/** Time out → shift closed with cash summary, remittance PENDING, rider off shift (BL-12.3). */
export function endShift(
  rider: Rider,
  shift: Shift,
  orders: Order[],
  now: string,
  location?: LatLng,
): RiderResult<{ rider: Rider; shift: Shift }> {
  const check = canTimeOut(rider, orders);
  if (!check.ok) return check;
  const sum = shiftSummary(shift, orders, now);
  return {
    ok: true,
    value: {
      rider: {
        ...rider,
        isOnShift: false,
        currentShiftId: undefined,
        lastLocation: location ?? rider.lastLocation,
      },
      shift: {
        ...shift,
        timeOut: now,
        timeOutLocation: location,
        cashCollected: sum.cashCollected,
        storePaid: sum.storePaid,
        expectedRemit: sum.expectedRemit,
        remitStatus: "PENDING",
      },
    },
  };
}

// ------------------------------------------------------------------ offers (BL-5)

/** The order currently offered to this rider, if any. */
export function offerFor(orders: Order[], riderId: ID): Order | undefined {
  return orders.find((o) => o.status === "APPROVED" && o.pendingOffer?.riderId === riderId);
}

/** Whole seconds left before the offer expires (0 when expired) — drives the countdown (BL-5.6). */
export function offerSecondsLeft(order: Order, nowMs: number): number {
  if (!order.pendingOffer) return 0;
  return Math.max(0, Math.ceil((Date.parse(order.pendingOffer.expiresAt) - nowMs) / 1000));
}

/** What the rider earns for this order, or null when paid by the day (BL-8.1). */
export function offerEarning(rule: RiderPayRule, deliveryFee: Centavos): Centavos | null {
  return rule.mode === "DAILY" ? null : riderEarningForOrder(rule, deliveryFee);
}

/** Before accepting, only the area (barangay, city) is shown — not the street address. */
export function dropOffArea(order: Order): string {
  const parts = order.deliveryAddressText.split(",").map((p) => p.trim());
  return parts.length > 1 ? parts.slice(1).join(", ") : order.deliveryAddressText;
}

// ------------------------------------------------------------------ delivery steps (BL-4.4, BL-11)

/** "Arrived & ordered" at the counter → AT_MERCHANT. */
export function arriveAtStore(order: Order, riderId: ID, now: string): RiderResult<Order> {
  if (order.riderId !== riderId || !canTransition(order.status, "AT_MERCHANT"))
    return { ok: false, reason: "This order isn't waiting for you at the store." };
  return { ok: true, value: event(order, "AT_MERCHANT", riderId, now) };
}

/**
 * Mark item lines (by index) unavailable / available again and recompute the money (BL-11.7, BL-13.9):
 * subtotal from available items; percent coupon recalculated on the new subtotal; points discount capped
 * by the remaining food; delivery fee and free-delivery reward unchanged.
 */
export function setItemsUnavailable(
  order: Order,
  unavailableIdx: number[],
  coupon?: Coupon,
): Order {
  const items = order.items.map((i, idx) => ({
    ...i,
    isUnavailable: unavailableIdx.includes(idx) || undefined,
  }));
  const subtotal = computeSubtotal(items);
  const couponDiscount =
    coupon && coupon.type === "PERCENT_OFF"
      ? computeCouponDiscount(coupon, subtotal, order.deliveryFee)
      : order.couponDiscount;
  const couponFood = coupon?.type === "PERCENT_OFF" ? couponDiscount : 0;
  const pointsDiscount = Math.min(order.pointsDiscount, Math.max(0, subtotal - couponFood));
  const discountTotal = couponDiscount + order.freeDeliveryDiscount + pointsDiscount;
  return {
    ...order,
    items,
    subtotal,
    couponDiscount,
    pointsDiscount,
    discountTotal,
    total: Math.max(0, subtotal + order.deliveryFee - discountTotal),
  };
}

/** Every item unavailable → the order is cancelled (BL-11.7). */
export function cancelAllUnavailable(order: Order, riderId: ID, now: string): RiderResult<Order> {
  if (!allItemsUnavailable(order.items))
    return { ok: false, reason: "Some items are still available." };
  if (!canTransition(order.status, "CANCELLED"))
    return { ok: false, reason: "This order can't be cancelled now." };
  return {
    ok: true,
    value: {
      ...event(order, "CANCELLED", riderId, now, "Items unavailable"),
      cancelReason: "Items unavailable",
    },
  };
}

/** Paid the store and has the food → PICKED_UP; amount paid + receipt photo required (BL-11.6). */
export function pickUpOrder(
  order: Order,
  riderId: ID,
  storeAmountPaid: Centavos | undefined,
  receiptPhotoUrl: string | undefined,
  now: string,
): RiderResult<Order> {
  if (order.riderId !== riderId || !canTransition(order.status, "PICKED_UP"))
    return { ok: false, reason: "Mark that you've arrived and ordered first." };
  if (!storeAmountPaid || storeAmountPaid <= 0)
    return { ok: false, reason: "Enter the amount you paid at the store." };
  if (!receiptPhotoUrl) return { ok: false, reason: "Add a photo of the receipt." };
  return {
    ok: true,
    value: {
      ...event(order, "PICKED_UP", riderId, now),
      storeAmountPaid,
      storeReceiptPhotoUrl: receiptPhotoUrl,
    },
  };
}

/** Change the rider gives back when the customer pays with a bigger bill (0 when none). */
export function changeToGive(order: Order): Centavos {
  return order.changeFor && order.changeFor > order.total ? order.changeFor - order.total : 0;
}

/** Food amount the customer actually paid — basis for PER_PESO points (BL-14.4). */
export function orderFoodPaid(order: Order, coupon?: Coupon): Centavos {
  const couponFood = coupon?.type === "PERCENT_OFF" ? order.couponDiscount : 0;
  return Math.max(0, order.subtotal - couponFood - order.pointsDiscount);
}

export type DeliveryProof = { photoUrl?: string; note?: string };

/**
 * Cash collected + proof → DELIVERED (RID-007, RID-010). Rider earning uses the ORIGINAL delivery fee
 * (BL-13.6); pointsEarned is passed in (computed from the tenant's loyalty settings).
 */
export function completeDelivery(
  order: Order,
  riderId: ID,
  rule: RiderPayRule,
  proof: DeliveryProof,
  cashCollected: boolean,
  pointsEarned: number,
  now: string,
): RiderResult<Order> {
  if (order.riderId !== riderId || !canTransition(order.status, "DELIVERED"))
    return { ok: false, reason: "Pick up the order first." };
  if (!cashCollected) return { ok: false, reason: "Confirm you collected the cash." };
  if (!proof.photoUrl && !proof.note?.trim())
    return { ok: false, reason: "Add a photo or a note as proof of delivery." };
  return {
    ok: true,
    value: {
      ...event(order, "DELIVERED", riderId, now),
      paymentStatus: "COLLECTED",
      cashCollectedAt: now,
      riderEarning: riderEarningForOrder(rule, order.deliveryFee),
      pointsEarned: pointsEarned || undefined,
      proofOfDelivery: { photoUrl: proof.photoUrl, note: proof.note?.trim() || undefined },
    },
  };
}

/** Google Maps directions link (opens the phone's maps app). */
export function directionsUrl(to: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}`;
}
