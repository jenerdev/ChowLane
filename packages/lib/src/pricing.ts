import type { Centavos, Coupon, LoyaltySettings } from "@chowlane/types";
import { computeCouponDiscount } from "./coupons";
import { maxRedeemablePoints } from "./loyalty";

export type OrderPricingInput = {
  subtotal: Centavos;
  deliveryFee: Centavos;
  /** Already validated with checkCoupon(). */
  coupon?: Coupon;
  /** Use one loyalty free-delivery reward. */
  useFreeDeliveryReward?: boolean;
  /** Points the customer wants to spend. */
  pointsToRedeem?: number;
  pointsBalance?: number;
  loyalty?: LoyaltySettings;
};

export type OrderPricing = {
  subtotal: Centavos;
  deliveryFee: Centavos;
  couponDiscount: Centavos;
  freeDeliveryDiscount: Centavos;
  pointsRedeemed: number;
  pointsDiscount: Centavos;
  discountTotal: Centavos;
  /** Part of the discounts that reduces the food (percent coupon + points). */
  foodDiscount: Centavos;
  /** What the customer pays the rider in cash. */
  total: Centavos;
};

export type OrderPricingResult =
  { ok: true; pricing: OrderPricing } | { ok: false; reason: "ONE_PROMO_ONLY" };

/**
 * Checkout price breakdown (BL-13, BL-14):
 *  1. at most ONE promo: a coupon OR a loyalty free-delivery reward (BL-14.6);
 *  2. points are applied last, on the food left after the coupon, capped by maxRedeemPercent.
 * The delivery fee itself stays unchanged on the order — discounts are separate lines, so rider pay
 * (based on the delivery fee) is not affected by promos (BL-13.6).
 */
export function computeOrderPricing(input: OrderPricingInput): OrderPricingResult {
  const { subtotal, deliveryFee, coupon, useFreeDeliveryReward = false } = input;
  if (coupon && useFreeDeliveryReward) return { ok: false, reason: "ONE_PROMO_ONLY" };

  const couponDiscount = coupon ? computeCouponDiscount(coupon, subtotal, deliveryFee) : 0;
  const freeDeliveryDiscount = useFreeDeliveryReward ? deliveryFee : 0;
  const couponFoodPart = coupon?.type === "PERCENT_OFF" ? couponDiscount : 0;
  const foodLeft = subtotal - couponFoodPart;

  let pointsRedeemed = 0;
  let pointsDiscount = 0;
  if (input.loyalty && input.pointsToRedeem && input.pointsToRedeem > 0) {
    const max = maxRedeemablePoints(input.loyalty, input.pointsBalance ?? 0, foodLeft);
    pointsRedeemed = Math.min(input.pointsToRedeem, max);
    if (pointsRedeemed < input.loyalty.points.minRedeemPoints) pointsRedeemed = 0;
    pointsDiscount = pointsRedeemed * input.loyalty.points.pointValue;
  }

  const discountTotal = couponDiscount + freeDeliveryDiscount + pointsDiscount;
  return {
    ok: true,
    pricing: {
      subtotal,
      deliveryFee,
      couponDiscount,
      freeDeliveryDiscount,
      pointsRedeemed,
      pointsDiscount,
      discountTotal,
      foodDiscount: couponFoodPart + pointsDiscount,
      total: Math.max(0, subtotal + deliveryFee - discountTotal),
    },
  };
}

/** Food amount actually paid (basis for PER_PESO points): subtotal minus food discounts. */
export function foodPaid(p: OrderPricing): Centavos {
  return Math.max(0, p.subtotal - p.foodDiscount);
}
