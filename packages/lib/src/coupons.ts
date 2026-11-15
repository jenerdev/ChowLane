import type { Centavos, Coupon } from "@chowlane/types";

export type CouponCheckInput = {
  coupon: Coupon | undefined;
  /** ISO time of checkout. */
  now: string;
  subtotal: Centavos;
  /** How many non-released uses this customer already has for this coupon. */
  customerUses: number;
};

export type CouponInvalidReason =
  | "NOT_FOUND"
  | "INACTIVE"
  | "NOT_STARTED"
  | "EXPIRED"
  | "USED_UP"
  | "CUSTOMER_LIMIT"
  | "BELOW_MIN_ORDER";

export const COUPON_ERROR_MESSAGES: Record<CouponInvalidReason, string> = {
  NOT_FOUND: "This coupon code doesn't exist.",
  INACTIVE: "This coupon is no longer active.",
  NOT_STARTED: "This coupon isn't valid yet.",
  EXPIRED: "This coupon has expired.",
  USED_UP: "This coupon has been fully used.",
  CUSTOMER_LIMIT: "You've already used this coupon.",
  BELOW_MIN_ORDER: "Your order doesn't reach this coupon's minimum amount.",
};

/** Can this coupon be applied right now? (BL-13.3) */
export function checkCoupon({
  coupon,
  now,
  subtotal,
  customerUses,
}: CouponCheckInput): { ok: true; coupon: Coupon } | { ok: false; reason: CouponInvalidReason } {
  if (!coupon) return { ok: false, reason: "NOT_FOUND" };
  if (!coupon.isActive) return { ok: false, reason: "INACTIVE" };
  const t = Date.parse(now);
  if (t < Date.parse(coupon.validFrom)) return { ok: false, reason: "NOT_STARTED" };
  if (t > Date.parse(coupon.validUntil)) return { ok: false, reason: "EXPIRED" };
  if (coupon.usedCount >= coupon.maxUses) return { ok: false, reason: "USED_UP" };
  if (customerUses >= coupon.perCustomerLimit) return { ok: false, reason: "CUSTOMER_LIMIT" };
  if (coupon.minOrderSubtotal !== undefined && subtotal < coupon.minOrderSubtotal)
    return { ok: false, reason: "BELOW_MIN_ORDER" };
  return { ok: true, coupon };
}

/**
 * Discount in centavos (BL-13.2):
 *  - PERCENT_OFF: percent of the food subtotal, capped by maxDiscount, rounded down to the whole peso.
 *  - FREE_DELIVERY: the full delivery fee.
 */
export function computeCouponDiscount(
  coupon: Coupon,
  subtotal: Centavos,
  deliveryFee: Centavos,
): Centavos {
  if (coupon.type === "FREE_DELIVERY") return deliveryFee;
  const raw = Math.floor((subtotal * (coupon.percentOff ?? 0)) / 100 / 100) * 100;
  return Math.min(raw, coupon.maxDiscount ?? Infinity, subtotal);
}

/** Codes are case-insensitive and stored uppercase without spaces. */
export function normalizeCouponCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

export function couponUsesLeft(coupon: Coupon): number {
  return Math.max(0, coupon.maxUses - coupon.usedCount);
}
