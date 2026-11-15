import { describe, expect, it } from "vitest";
import type { Coupon, Order, Rider, Shift } from "@chowlane/types";
import {
  arriveAtStore,
  canTimeOut,
  cancelAllUnavailable,
  changeToGive,
  completeDelivery,
  directionsUrl,
  dropOffArea,
  endShift,
  offerEarning,
  offerFor,
  offerSecondsLeft,
  orderFoodPaid,
  pickUpOrder,
  setItemsUnavailable,
  shiftSummary,
  startShift,
} from "./index";

const now = "2026-11-15T05:00:00.000Z";

const rider: Rider = {
  id: "rd1",
  tenantId: "t1",
  name: "Jomar",
  phone: "+639201230001",
  photoUrl: "",
  vehicleType: "MOTORCYCLE",
  isOnShift: false,
  status: "ACTIVE",
  createdAt: "",
};

const baseOrder: Order = {
  id: "o1",
  tenantId: "t1",
  orderNumber: "FB-1",
  customerId: "c1",
  merchantId: "m1",
  riderId: "rd1",
  status: "ASSIGNED",
  items: [
    {
      productId: "p1",
      name: "Adobo",
      unitPrice: 15000,
      storeUnitPrice: 12000,
      qty: 2,
      lineTotal: 30000,
    },
    { productId: "p2", name: "Iced tea", unitPrice: 5000, qty: 1, lineTotal: 5000 },
  ],
  deliveryLocation: { lat: 14.55, lng: 121.02 },
  deliveryAddressText: "12 Jupiter St, Bel-Air, Makati",
  distanceKm: 2,
  subtotal: 35000,
  deliveryFee: 6000,
  couponDiscount: 0,
  usedFreeDeliveryReward: false,
  usedFreeGiftReward: false,
  freeDeliveryDiscount: 0,
  pointsRedeemed: 0,
  pointsDiscount: 0,
  discountTotal: 0,
  total: 41000,
  deliveryFeeSnapshot: { mode: "FIXED", amount: 6000 },
  paymentMethod: "COD",
  paymentStatus: "UNPAID",
  assignmentAttempts: [],
  timeline: [
    { status: "ASSIGNED", actorType: "RIDER", actorId: "rd1", at: "2026-11-15T04:00:00.000Z" },
  ],
  createdAt: "2026-11-15T03:50:00.000Z",
};

describe("shifts", () => {
  it("starts a shift and blocks time out while busy", () => {
    const r = startShift(rider, "sh1", now, { lat: 1, lng: 2 });
    if (!r.ok) throw new Error(r.reason);
    expect(r.value.rider).toMatchObject({
      isOnShift: true,
      currentShiftId: "sh1",
      lastLocation: { lat: 1, lng: 2 },
    });
    expect(r.value.shift).toMatchObject({ remitStatus: "OPEN", timeIn: now });
    expect(startShift({ ...rider, status: "INACTIVE" }, "x", now).ok).toBe(false);

    const onShift = r.value.rider;
    expect(canTimeOut(onShift, []).ok).toBe(true);
    expect(canTimeOut({ ...onShift, activeOrderId: "o1" }, []).ok).toBe(false);
    const offered = {
      ...baseOrder,
      status: "APPROVED" as const,
      riderId: undefined,
      pendingOffer: { riderId: "rd1", offeredAt: now, expiresAt: now, by: "AUTO" as const },
    };
    expect(canTimeOut(onShift, [offered]).ok).toBe(false);
  });

  it("summarises cash and ends the shift as PENDING", () => {
    const shift: Shift = {
      id: "sh1",
      tenantId: "t1",
      riderId: "rd1",
      timeIn: "2026-11-15T01:00:00.000Z",
      cashCollected: 0,
      storePaid: 0,
      expectedRemit: 0,
      remitStatus: "OPEN",
    };
    const delivered: Order = {
      ...baseOrder,
      status: "DELIVERED",
      cashCollectedAt: "2026-11-15T04:30:00.000Z",
      storeAmountPaid: 29000,
    };
    const before: Order = { ...delivered, id: "o0", cashCollectedAt: "2026-11-14T04:30:00.000Z" };
    expect(shiftSummary(shift, [delivered, before], now)).toEqual({
      deliveries: 1,
      cashCollected: 41000,
      storePaid: 29000,
      expectedRemit: 12000,
    });
    const r = endShift(
      { ...rider, isOnShift: true, currentShiftId: "sh1" },
      shift,
      [delivered],
      now,
    );
    if (!r.ok) throw new Error(r.reason);
    expect(r.value.shift).toMatchObject({
      remitStatus: "PENDING",
      timeOut: now,
      expectedRemit: 12000,
    });
    expect(r.value.rider.isOnShift).toBe(false);
  });
});

describe("offers", () => {
  it("finds my offer, counts down and shows earning / area", () => {
    const o = {
      ...baseOrder,
      status: "APPROVED" as const,
      riderId: undefined,
      pendingOffer: {
        riderId: "rd1",
        offeredAt: now,
        expiresAt: "2026-11-15T05:01:00.000Z",
        by: "AUTO" as const,
      },
    };
    expect(offerFor([o], "rd1")?.id).toBe("o1");
    expect(offerFor([o], "rd2")).toBeUndefined();
    expect(offerSecondsLeft(o, Date.parse(now) + 15_500)).toBe(45);
    expect(offerSecondsLeft(o, Date.parse(now) + 90_000)).toBe(0);
    expect(offerEarning({ mode: "COMMISSION", percent: 80 }, 6000)).toBe(4800);
    expect(offerEarning({ mode: "DAILY", dailyRate: 50000 }, 6000)).toBeNull();
    expect(dropOffArea(o)).toBe("Bel-Air, Makati");
  });
});

describe("delivery steps", () => {
  const coupon: Coupon = {
    id: "cp",
    tenantId: "t1",
    code: "X",
    type: "PERCENT_OFF",
    percentOff: 10,
    maxUses: 9,
    usedCount: 0,
    perCustomerLimit: 1,
    validFrom: "",
    validUntil: "",
    isActive: true,
    createdBy: "",
    createdAt: "",
  };

  it("arrives, recomputes on unavailable items, picks up", () => {
    const a = arriveAtStore(baseOrder, "rd1", now);
    if (!a.ok) throw new Error(a.reason);
    expect(a.value.status).toBe("AT_MERCHANT");
    expect(arriveAtStore(baseOrder, "rd2", now).ok).toBe(false);

    const withCoupon = {
      ...a.value,
      couponId: "cp",
      couponDiscount: 3500,
      discountTotal: 3500,
      total: 37500,
    };
    const u = setItemsUnavailable(withCoupon, [1], coupon);
    expect(u).toMatchObject({ subtotal: 30000, couponDiscount: 3000, total: 33000 });
    expect(u.items[1]!.isUnavailable).toBe(true);
    expect(setItemsUnavailable(u, [], coupon).subtotal).toBe(35000);

    const all = setItemsUnavailable(a.value, [0, 1]);
    const c = cancelAllUnavailable(all, "rd1", now);
    expect(c.ok && c.value).toMatchObject({
      status: "CANCELLED",
      cancelReason: "Items unavailable",
    });
    expect(cancelAllUnavailable(a.value, "rd1", now).ok).toBe(false);

    expect(pickUpOrder(a.value, "rd1", undefined, "x", now).ok).toBe(false);
    expect(pickUpOrder(a.value, "rd1", 29000, undefined, now).ok).toBe(false);
    const p = pickUpOrder(a.value, "rd1", 29000, "data:image/png", now);
    expect(p.ok && p.value).toMatchObject({ status: "PICKED_UP", storeAmountPaid: 29000 });
  });

  it("completes with cash + proof and computes earning", () => {
    const picked: Order = { ...baseOrder, status: "PICKED_UP", changeFor: 50000 };
    expect(changeToGive(picked)).toBe(9000);
    expect(changeToGive({ ...picked, changeFor: undefined })).toBe(0);
    const rule = { mode: "COMMISSION" as const, percent: 80 };
    expect(completeDelivery(picked, "rd1", rule, { note: "Lobby" }, false, 0, now).ok).toBe(false);
    expect(completeDelivery(picked, "rd1", rule, {}, true, 0, now).ok).toBe(false);
    const d = completeDelivery(picked, "rd1", rule, { note: " Handed at lobby " }, true, 7, now);
    expect(d.ok && d.value).toMatchObject({
      status: "DELIVERED",
      paymentStatus: "COLLECTED",
      riderEarning: 4800,
      pointsEarned: 7,
      proofOfDelivery: { note: "Handed at lobby" },
    });
  });

  it("food paid and directions", () => {
    expect(
      orderFoodPaid({ ...baseOrder, couponDiscount: 3500, pointsDiscount: 1000 }, coupon),
    ).toBe(30500);
    expect(
      orderFoodPaid({ ...baseOrder, couponDiscount: 6000 }, { ...coupon, type: "FREE_DELIVERY" }),
    ).toBe(35000);
    expect(directionsUrl({ lat: 14.5, lng: 121 })).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=14.5,121",
    );
  });
});
