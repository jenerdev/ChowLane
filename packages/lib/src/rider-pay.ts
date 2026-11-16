import type { Centavos, RiderPayRule } from "@chowlane/types";
import { formatPeso } from "./money";
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
  /** undefined while the business hasn't set rider pay (D-061) → ₱0 */
  rule: RiderPayRule | undefined;
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
  if (!rule) return 0;
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
): RiderPayRule;
export function effectiveRiderPayRule(
  tenantRule: RiderPayRule | undefined,
  override?: RiderPayRule,
): RiderPayRule | undefined;
/** The rider's own rule, else the business rule; undefined while a new business hasn't set one (D-061). */
export function effectiveRiderPayRule(
  tenantRule: RiderPayRule | undefined,
  override?: RiderPayRule,
): RiderPayRule | undefined {
  return override ?? tenantRule;
}

/** "₱500 per day", "80% of the delivery fee", "₱40 per delivery" — or "Not set yet" (D-061). */
export function riderPayRuleLabel(rule: RiderPayRule | undefined): string {
  if (!rule) return "Not set yet";
  if (rule.mode === "DAILY") return `${formatPeso(rule.dailyRate)} per day`;
  if (rule.mode === "COMMISSION") return `${rule.percent}% of the delivery fee`;
  return `${formatPeso(rule.ratePerDelivery)} per delivery`;
}
