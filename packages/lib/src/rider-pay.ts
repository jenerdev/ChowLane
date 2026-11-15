import type { Centavos, RiderPayRule } from "@chowlane/types";
import { manilaDateKey } from "./time";

/** Earning for ONE delivered order (COMMISSION / PER_DELIVERY). DAILY pays per day, not per order → 0. */
export function riderEarningForOrder(rule: RiderPayRule, deliveryFee: Centavos): Centavos {
  switch (rule.mode) {
    case "COMMISSION":
      return Math.round((deliveryFee * rule.percent) / 100);
    case "PER_DELIVERY":
      return rule.ratePerDelivery;
    case "DAILY":
      return 0;
  }
}

export type RiderPayPeriodInput = {
  rule: RiderPayRule;
  /** Delivery fees of DELIVERED orders in the period (BL-8.3). */
  deliveredOrderFees: Centavos[];
  /** timeIn of every shift in the period. */
  shiftTimeIns: string[];
};

/** Rider income for a period (BL-8.1). DAILY = rate × distinct Manila days with ≥1 shift (no minimum hours). */
export function computeRiderPay({
  rule,
  deliveredOrderFees,
  shiftTimeIns,
}: RiderPayPeriodInput): Centavos {
  if (rule.mode === "DAILY") {
    const days = new Set(shiftTimeIns.map(manilaDateKey));
    return rule.dailyRate * days.size;
  }
  return deliveredOrderFees.reduce((sum, fee) => sum + riderEarningForOrder(rule, fee), 0);
}

/** Effective rule for a rider: per-rider override wins over the tenant rule (BL-8.2). */
export function effectiveRiderPayRule(
  tenantRule: RiderPayRule,
  override?: RiderPayRule,
): RiderPayRule {
  return override ?? tenantRule;
}
