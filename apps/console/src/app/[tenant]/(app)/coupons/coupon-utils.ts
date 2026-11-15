import type { Coupon } from "@chowlane/types";
import { formatPeso, type CouponStatus } from "@chowlane/lib";
import type { BadgeProps } from "@chowlane/ui";

export const STATUS_TONE: Record<CouponStatus, BadgeProps["tone"]> = {
  ACTIVE: "success",
  SCHEDULED: "info",
  EXPIRED: "neutral",
  USED_UP: "neutral",
  INACTIVE: "neutral",
};

export function couponSummary(c: Coupon) {
  if (c.type === "FREE_DELIVERY") return "Free delivery";
  return `${c.percentOff}% off food${c.maxDiscount ? `, up to ${formatPeso(c.maxDiscount)}` : ""}`;
}
