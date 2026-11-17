/**
 * Database rows (snake_case, null) → @chowlane/types shapes (camelCase, undefined), per DATA-MODEL "Phase 2 —
 * database mapping". Screens keep using the domain types; only data loading changes.
 */
import type {
  Address,
  BarangayFee,
  BillingStatement,
  Coupon,
  CouponRedemption,
  Customer,
  DeliveryFeeRule,
  LoyaltySettings,
  LoyaltyTransaction,
  Merchant,
  PermissionKey,
  Product,
  Rider,
  RiderPayRule,
  Role,
  Shift,
  StaffUser,
  TenantBilling,
  TenantSettings,
  Verification,
} from "@chowlane/types";
import type { Database, Json } from "./database.types";

type Tables = Database["public"]["Tables"];
export type StaffRow = Tables["staff_users"]["Row"];
export type RoleRow = Tables["roles"]["Row"];
export type RiderRow = Tables["riders"]["Row"];
export type ShiftRow = Tables["shifts"]["Row"];
export type SettingsRow = Tables["tenant_settings"]["Row"];
export type SettingsUpdate = Tables["tenant_settings"]["Update"];
export type MerchantRow = Tables["merchants"]["Row"];
export type ProductRow = Tables["products"]["Row"];
export type BarangayFeeRow = Tables["barangay_fees"]["Row"];
export type CouponRow = Tables["coupons"]["Row"];
export type CouponRedemptionRow = Tables["coupon_redemptions"]["Row"];
export type CustomerRow = Tables["customers"]["Row"];
export type AddressRow = Tables["customer_addresses"]["Row"];
export type VerificationRow = Tables["verifications"]["Row"];
export type LoyaltyRow = Tables["loyalty_transactions"]["Row"];
export type BillingRow = Tables["tenant_billing"]["Row"];
export type StatementRow = Tables["billing_statements"]["Row"];

const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const latLng = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? undefined : { lat, lng };

export function toStaffUser(r: StaffRow): StaffUser {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    email: r.email,
    avatarUrl: u(r.avatar_url),
    type: r.type,
    roleId: u(r.role_id),
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toRole(r: RoleRow): Role {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    permissions: r.permissions as PermissionKey[],
    isDefault: r.is_default,
  };
}

export function toRider(r: RiderRow): Rider {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    phone: r.phone,
    email: u(r.email),
    photoUrl: r.photo_url,
    vehicleType: r.vehicle_type,
    plateNumber: u(r.plate_number),
    payOverride: (r.pay_override ?? undefined) as RiderPayRule | undefined,
    isOnShift: r.is_on_shift,
    currentShiftId: u(r.current_shift_id),
    activeOrderId: u(r.active_order_id),
    lastLocation: latLng(r.last_location_lat, r.last_location_lng),
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toShift(r: ShiftRow): Shift {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    riderId: r.rider_id,
    timeIn: r.time_in,
    timeOut: u(r.time_out),
    timeInLocation: latLng(r.time_in_lat, r.time_in_lng),
    timeOutLocation: latLng(r.time_out_lat, r.time_out_lng),
    cashCollected: r.cash_collected,
    storePaid: r.store_paid,
    expectedRemit: r.expected_remit,
    remittedAmount: u(r.remitted_amount),
    remitStatus: r.remit_status,
    remitReceivedBy: u(r.remit_received_by),
    remitReceivedAt: u(r.remit_received_at),
    remitNote: u(r.remit_note),
  };
}

export function toTenantSettings(r: SettingsRow): TenantSettings {
  return {
    tenantId: r.tenant_id,
    serviceArea: {
      center: { lat: r.service_area_lat, lng: r.service_area_lng },
      radiusKm: Number(r.service_area_radius_km),
    },
    deliveryFee: (r.delivery_fee ?? undefined) as DeliveryFeeRule | undefined,
    riderPay: (r.rider_pay ?? undefined) as RiderPayRule | undefined,
    autoApproveVerifiedCustomers: r.auto_approve_verified_customers,
    dispatchMode: r.dispatch_mode,
    riderResponseTimeoutSec: r.rider_response_timeout_sec,
    acceptedIdTypes: r.accepted_id_types,
    maxOrderSubtotal: r.max_order_subtotal,
    pinAdjustRadiusM: r.pin_adjust_radius_m,
    loyalty: r.loyalty as LoyaltySettings,
  };
}

/** Settings fields → columns, for a partial update (each settings screen saves its own group). */
export function fromTenantSettings(s: Partial<TenantSettings>): SettingsUpdate {
  const row: SettingsUpdate = {};
  if (s.serviceArea) {
    row.service_area_lat = s.serviceArea.center.lat;
    row.service_area_lng = s.serviceArea.center.lng;
    row.service_area_radius_km = s.serviceArea.radiusKm;
  }
  if ("deliveryFee" in s) row.delivery_fee = (s.deliveryFee ?? null) as Json;
  if ("riderPay" in s) row.rider_pay = (s.riderPay ?? null) as Json;
  if (s.autoApproveVerifiedCustomers !== undefined)
    row.auto_approve_verified_customers = s.autoApproveVerifiedCustomers;
  if (s.dispatchMode) row.dispatch_mode = s.dispatchMode;
  if (s.riderResponseTimeoutSec !== undefined)
    row.rider_response_timeout_sec = s.riderResponseTimeoutSec;
  if (s.acceptedIdTypes) row.accepted_id_types = s.acceptedIdTypes;
  if (s.maxOrderSubtotal !== undefined) row.max_order_subtotal = s.maxOrderSubtotal;
  if (s.pinAdjustRadiusM !== undefined) row.pin_adjust_radius_m = s.pinAdjustRadiusM;
  if (s.loyalty) row.loyalty = s.loyalty as unknown as NonNullable<Json>;
  return row;
}

export function toMerchant(r: MerchantRow): Merchant {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    name: r.name,
    category: r.category,
    phone: r.phone,
    address: r.address,
    location: { lat: r.location_lat, lng: r.location_lng },
    photoUrl: r.photo_url,
    isOpen: r.is_open,
    status: r.status,
    createdAt: r.created_at,
  };
}

export function toProduct(r: ProductRow): Product {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    merchantId: r.merchant_id,
    name: r.name,
    category: r.category,
    description: r.description,
    price: r.price,
    storePrice: u(r.store_price),
    imageUrl: r.image_url,
    isAvailable: r.is_available,
    sortOrder: r.sort_order,
  };
}

export function toBarangayFee(r: BarangayFeeRow): BarangayFee {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    barangay: r.barangay,
    cityMunicipality: r.city_municipality,
    province: r.province,
    fee: r.fee,
    isActive: r.is_active,
  };
}

export function toCoupon(r: CouponRow): Coupon {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    code: r.code,
    description: u(r.description),
    type: r.type,
    percentOff: u(r.percent_off),
    maxDiscount: u(r.max_discount),
    minOrderSubtotal: u(r.min_order_subtotal),
    maxUses: r.max_uses,
    usedCount: r.used_count,
    perCustomerLimit: r.per_customer_limit,
    validFrom: r.valid_from,
    validUntil: r.valid_until,
    isActive: r.is_active,
    createdBy: r.created_by ?? "",
    createdAt: r.created_at,
  };
}

/** Coupon fields the console edits → columns (code / discount are locked by a trigger after first use). */
export function fromCoupon(
  c: Omit<Coupon, "id" | "tenantId" | "usedCount" | "createdBy" | "createdAt">,
) {
  return {
    code: c.code,
    description: c.description ?? null,
    type: c.type,
    percent_off: c.type === "PERCENT_OFF" ? (c.percentOff ?? null) : null,
    max_discount: c.type === "PERCENT_OFF" ? (c.maxDiscount ?? null) : null,
    min_order_subtotal: c.minOrderSubtotal ?? null,
    max_uses: c.maxUses,
    per_customer_limit: c.perCustomerLimit,
    valid_from: c.validFrom,
    valid_until: c.validUntil,
    is_active: c.isActive,
  };
}

export function toCouponRedemption(r: CouponRedemptionRow): CouponRedemption {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    couponId: r.coupon_id,
    orderId: r.order_id,
    customerId: r.customer_id,
    discount: r.discount,
    redeemedAt: r.redeemed_at,
    released: r.released,
  };
}

export function toAddress(r: AddressRow): Address {
  return {
    id: r.id,
    label: r.label,
    line1: r.line1,
    barangay: r.barangay,
    cityMunicipality: r.city_municipality,
    province: r.province,
    barangayFeeId: u(r.barangay_fee_id),
    location: { lat: r.location_lat, lng: r.location_lng },
    notes: u(r.notes),
  };
}

export function toVerification(r: VerificationRow): Verification {
  return {
    id: r.id,
    idType: r.id_type,
    idFrontUrl: r.id_front_url,
    idBackUrl: u(r.id_back_url),
    selfieWithIdUrl: r.selfie_with_id_url,
    submittedAt: r.submitted_at,
    orderId: u(r.order_id),
    result: u(r.result),
    reviewedBy: u(r.reviewed_by),
    reviewedAt: u(r.reviewed_at),
    rejectReason: u(r.reject_reason),
  };
}

/** A customer with their addresses and ID submissions (any order; the latest submission is `verification`). */
export function toCustomer(
  r: CustomerRow,
  addresses: AddressRow[] = [],
  verifications: VerificationRow[] = [],
): Customer {
  const history = verifications
    .filter((v) => v.customer_id === r.id)
    .map(toVerification)
    .sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt));
  return {
    id: r.id,
    tenantId: r.tenant_id,
    facebookId: r.facebook_id,
    name: r.name,
    email: u(r.email),
    phone: u(r.phone),
    avatarUrl: r.avatar_url,
    verificationStatus: r.verification_status,
    verification: history[0],
    verificationHistory: history,
    locationPermission: r.location_permission,
    addresses: addresses.filter((a) => a.customer_id === r.id).map(toAddress),
    loyalty: {
      deliveredOrders: r.loyalty_delivered_orders,
      ordersTowardFreeDelivery: r.loyalty_orders_toward_free_delivery,
      freeDeliveryRewards: r.loyalty_free_delivery_rewards,
      ordersTowardFreeGift: r.loyalty_orders_toward_free_gift,
      freeGiftRewards: r.loyalty_free_gift_rewards,
      points: r.loyalty_points,
    },
    createdAt: r.created_at,
  };
}

export function toLoyaltyTransaction(r: LoyaltyRow): LoyaltyTransaction {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    customerId: r.customer_id,
    orderId: u(r.order_id),
    kind: r.kind,
    points: r.points,
    rewards: r.rewards,
    at: r.at,
    staffId: u(r.staff_id),
    note: u(r.note),
  };
}

export function toTenantBilling(r: BillingRow): TenantBilling {
  return {
    tenantId: r.tenant_id,
    model: r.model,
    monthlyFee: u(r.monthly_fee),
    perOrderFee: u(r.per_order_fee),
    trialEndsAt: u(r.trial_ends_at),
    effectiveFrom: r.effective_from,
    updatedBy: r.updated_by ?? "",
  };
}

export function toBillingStatement(r: StatementRow): BillingStatement {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    periodStart: r.period_start,
    periodEnd: r.period_end,
    model: r.model,
    deliveredOrders: r.delivered_orders,
    amountDue: r.amount_due,
    status: r.status,
    paidAt: u(r.paid_at),
    note: u(r.note),
    createdAt: r.created_at,
  };
}
