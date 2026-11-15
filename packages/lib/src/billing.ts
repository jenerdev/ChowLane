import type { Centavos, TenantBilling } from "@chowlane/types";

/** Amount ChowLane bills a tenant for one month (BL-10.4). Trial → ₱0 while periodStart < trialEndsAt. */
export function computeBillingAmount(
  billing: TenantBilling,
  deliveredOrders: number,
  periodStart: string,
): Centavos {
  if (billing.trialEndsAt && new Date(periodStart) < new Date(billing.trialEndsAt)) return 0;
  const monthly = billing.monthlyFee ?? 0;
  const perOrder = (billing.perOrderFee ?? 0) * deliveredOrders;
  switch (billing.model) {
    case "FREE":
      return 0;
    case "MONTHLY":
      return monthly;
    case "PER_ORDER":
      return perOrder;
    case "MONTHLY_PLUS_PER_ORDER":
      return monthly + perOrder;
  }
}
