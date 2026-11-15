import { describe, expect, it } from "vitest";
import type { Coupon, LoyaltySettings } from "@chowlane/types";
import {
  applyDeliveredOrder,
  canClaimFreeGift,
  checkCoupon,
  computeCouponDiscount,
  computeOrderPricing,
  EMPTY_LOYALTY,
  foodPaid,
  maxRedeemablePoints,
  normalizeCouponCode,
  pointsEarnedForOrder,
} from "./index";

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "cp",
  tenantId: "t",
  code: "WELCOME20",
  type: "PERCENT_OFF",
  percentOff: 20,
  maxDiscount: 10000,
  minOrderSubtotal: 30000,
  maxUses: 10,
  usedCount: 0,
  perCustomerLimit: 1,
  validFrom: "2026-11-01T00:00:00Z",
  validUntil: "2026-11-30T15:59:59Z",
  isActive: true,
  createdBy: "s",
  createdAt: "",
  ...over,
});

const loyalty: LoyaltySettings = {
  enabled: true,
  freeDelivery: { enabled: true, ordersRequired: 3 },
  freeGift: { enabled: true, ordersRequired: 2, giftName: "Free Halo-Halo" },
  points: {
    enabled: true,
    earnMode: "PER_PESO",
    pointsPerOrder: 0,
    centavosPerPoint: 5000,
    pointValue: 100,
    minRedeemPoints: 50,
    maxRedeemPercent: 50,
  },
};

const now = "2026-11-15T04:00:00Z";

describe("coupons", () => {
  it("validates status, period, usage and minimum", () => {
    expect(checkCoupon({ coupon: undefined, now, subtotal: 50000, customerUses: 0 })).toEqual({
      ok: false,
      reason: "NOT_FOUND",
    });
    expect(checkCoupon({ coupon: coupon(), now, subtotal: 50000, customerUses: 0 }).ok).toBe(true);
    expect(
      checkCoupon({ coupon: coupon({ isActive: false }), now, subtotal: 50000, customerUses: 0 }),
    ).toMatchObject({ reason: "INACTIVE" });
    expect(
      checkCoupon({
        coupon: coupon({ validFrom: "2026-12-01T00:00:00Z" }),
        now,
        subtotal: 50000,
        customerUses: 0,
      }),
    ).toMatchObject({ reason: "NOT_STARTED" });
    expect(
      checkCoupon({
        coupon: coupon({ validUntil: "2026-11-10T00:00:00Z" }),
        now,
        subtotal: 50000,
        customerUses: 0,
      }),
    ).toMatchObject({ reason: "EXPIRED" });
    expect(
      checkCoupon({ coupon: coupon({ usedCount: 10 }), now, subtotal: 50000, customerUses: 0 }),
    ).toMatchObject({ reason: "USED_UP" });
    expect(checkCoupon({ coupon: coupon(), now, subtotal: 50000, customerUses: 1 })).toMatchObject({
      reason: "CUSTOMER_LIMIT",
    });
    expect(checkCoupon({ coupon: coupon(), now, subtotal: 29999, customerUses: 0 })).toMatchObject({
      reason: "BELOW_MIN_ORDER",
    });
  });

  it("computes percent (capped, whole peso) and free delivery discounts", () => {
    expect(computeCouponDiscount(coupon(), 33350, 6000)).toBe(6600); // 20% of ₱333.50 = ₱66.70 → ₱66
    expect(computeCouponDiscount(coupon(), 90000, 6000)).toBe(10000); // capped at ₱100
    expect(computeCouponDiscount(coupon({ type: "FREE_DELIVERY" }), 90000, 6000)).toBe(6000);
    expect(normalizeCouponCode(" welcome 20 ")).toBe("WELCOME20");
  });
});

describe("loyalty", () => {
  it("earns points per peso or per order", () => {
    expect(pointsEarnedForOrder(loyalty, 24900)).toBe(4);
    expect(
      pointsEarnedForOrder(
        { ...loyalty, points: { ...loyalty.points, earnMode: "PER_ORDER", pointsPerOrder: 10 } },
        24900,
      ),
    ).toBe(10);
    expect(pointsEarnedForOrder({ ...loyalty, enabled: false }, 24900)).toBe(0);
  });

  it("counts toward free delivery and free gift rewards", () => {
    let state = EMPTY_LOYALTY;
    const earned: string[] = [];
    for (let i = 0; i < 6; i++) {
      const r = applyDeliveredOrder(state, loyalty, 10000);
      state = r.loyalty;
      if (r.freeDeliveryEarned) earned.push(`delivery@${i + 1}`);
      if (r.freeGiftEarned) earned.push(`gift@${i + 1}`);
    }
    expect(earned).toEqual(["gift@2", "delivery@3", "gift@4", "delivery@6", "gift@6"]);
    expect(state).toMatchObject({
      deliveredOrders: 6,
      freeDeliveryRewards: 2,
      freeGiftRewards: 3,
      points: 12,
    });
    expect(canClaimFreeGift(loyalty, state)).toBe(true);
    expect(
      canClaimFreeGift({ ...loyalty, freeGift: { ...loyalty.freeGift, enabled: false } }, state),
    ).toBe(false);
  });

  it("limits redeemable points by minimum, balance and max % of food", () => {
    expect(maxRedeemablePoints(loyalty, 40, 50000)).toBe(0); // below minimum
    expect(maxRedeemablePoints(loyalty, 1000, 50000)).toBe(250); // 50% of ₱500 = ₱250
    expect(maxRedeemablePoints(loyalty, 120, 50000)).toBe(120);
  });
});

describe("order pricing", () => {
  it("allows only one promo (coupon OR free-delivery reward)", () => {
    expect(
      computeOrderPricing({
        subtotal: 50000,
        deliveryFee: 6000,
        coupon: coupon(),
        useFreeDeliveryReward: true,
      }),
    ).toEqual({
      ok: false,
      reason: "ONE_PROMO_ONLY",
    });
  });

  it("applies coupon, then points on the remaining food", () => {
    const r = computeOrderPricing({
      subtotal: 50000,
      deliveryFee: 6000,
      coupon: coupon(),
      pointsToRedeem: 300,
      pointsBalance: 300,
      loyalty,
    });
    if (!r.ok) throw new Error("expected ok");
    // coupon ₱100; food left ₱400 → max 50% = ₱200 = 200 pts
    expect(r.pricing).toMatchObject({
      couponDiscount: 10000,
      pointsRedeemed: 200,
      pointsDiscount: 20000,
      discountTotal: 30000,
      total: 26000,
    });
    expect(foodPaid(r.pricing)).toBe(20000);
  });

  it("free-delivery reward removes the delivery fee from the total but keeps it on the order", () => {
    const r = computeOrderPricing({
      subtotal: 30000,
      deliveryFee: 6000,
      useFreeDeliveryReward: true,
    });
    if (!r.ok) throw new Error("expected ok");
    expect(r.pricing).toMatchObject({
      deliveryFee: 6000,
      freeDeliveryDiscount: 6000,
      total: 30000,
      foodDiscount: 0,
    });
  });
});
