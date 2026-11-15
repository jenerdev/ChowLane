import type { Centavos, ID, ISODateTime } from "./common";

export type CouponType = "PERCENT_OFF" | "FREE_DELIVERY";

/** Tenant-managed coupon (BL-13). */
export type Coupon = {
  id: ID;
  tenantId: ID;
  /** Unique per tenant, stored uppercase, e.g. "WELCOME20". */
  code: string;
  description?: string;
  type: CouponType;
  /** PERCENT_OFF only: 1–100, applied to the food subtotal. */
  percentOff?: number;
  /** PERCENT_OFF only: optional cap on the discount. */
  maxDiscount?: Centavos;
  /** Optional minimum food subtotal to use the coupon. */
  minOrderSubtotal?: Centavos;
  /** Total number of times the coupon can be used (all customers). */
  maxUses: number;
  /** Times used by orders that are not REJECTED / CANCELLED. */
  usedCount: number;
  /** Uses allowed per customer (default 1). */
  perCustomerLimit: number;
  validFrom: ISODateTime;
  validUntil: ISODateTime;
  isActive: boolean;
  createdBy: ID;
  createdAt: ISODateTime;
};

/** One use of a coupon by an order. */
export type CouponRedemption = {
  id: ID;
  tenantId: ID;
  couponId: ID;
  orderId: ID;
  customerId: ID;
  discount: Centavos;
  redeemedAt: ISODateTime;
  /** true when the order was rejected / cancelled → the use is given back. */
  released: boolean;
};
