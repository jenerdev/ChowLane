import type { Centavos, ID, ISODateTime } from "./common";

export type PlatformAdmin = {
  id: ID;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: ISODateTime;
};

export const BILLING_MODELS = ["FREE", "MONTHLY", "PER_ORDER", "MONTHLY_PLUS_PER_ORDER"] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

/** How ChowLane charges one tenant (BL-10.4). */
export type TenantBilling = {
  tenantId: ID;
  model: BillingModel;
  monthlyFee?: Centavos;
  perOrderFee?: Centavos;
  trialEndsAt?: ISODateTime;
  effectiveFrom: ISODateTime;
  updatedBy: ID;
};

export type BillingStatementStatus = "UNPAID" | "PAID" | "WAIVED";

/** One calendar month (Asia/Manila) of billing for a tenant (BL-10.5). */
export type BillingStatement = {
  id: ID;
  tenantId: ID;
  periodStart: ISODateTime;
  periodEnd: ISODateTime;
  model: BillingModel;
  deliveredOrders: number;
  amountDue: Centavos;
  status: BillingStatementStatus;
  paidAt?: ISODateTime;
  note?: string;
  createdAt: ISODateTime;
};
