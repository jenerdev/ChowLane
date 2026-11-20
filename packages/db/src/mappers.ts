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
  Order,
  PermissionKey,
  Product,
  Rider,
  RiderPayRule,
  Role,
  Shift,
  StaffUser,
  Tenant,
  TenantBilling,
  TenantSettings,
  Verification,
} from "@chowlane/types";
import type { Database, Json } from "./database.types";

type Tables = Database["public"]["Tables"];
export type TenantRow = Tables["tenants"]["Row"];
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
export type OrderRow = Tables["orders"]["Row"];
export type OrderItemRow = Tables["order_items"]["Row"];
export type OrderEventRow = Tables["order_events"]["Row"];
export type AttemptRow = Tables["assignment_attempts"]["Row"];
export type PublicSettingsRow = Database["public"]["Views"]["tenant_settings_public"]["Row"];

const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const latLng = (lat: number | null, lng: number | null) =>
  lat === null || lng === null ? undefined : { lat, lng };

/** A full tenant row (platform admin, 2.7). Branding for the tenant apps comes from `tenants_public`. */
export function toTenant(r: TenantRow): Tenant {
  return {
    id: r.id,
    slug: r.slug,
    businessName: r.business_name,
    shortName: r.short_name,
    logoUrl: r.logo_url,
    primaryColor: r.primary_color,
    backgroundColor: r.background_color,
    currency: "PHP",
    timezone: "Asia/Manila",
    pwaIcons: (r.pwa_icons ?? {}) as Tenant["pwaIcons"],
    status: r.status,
    suspendReason: u(r.suspend_reason),
    ownerId: r.owner_id ?? "",
    createdAt: r.created_at,
  };
}

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

/** Checkout settings as customers see them (no rider pay or dispatch — tenant_settings_public). */
export function toPublicSettings(r: PublicSettingsRow): TenantSettings {
  return {
    tenantId: r.tenant_id,
    serviceArea: {
      center: { lat: r.service_area_lat, lng: r.service_area_lng },
      radiusKm: Number(r.service_area_radius_km),
    },
    deliveryFee: (r.delivery_fee ?? undefined) as DeliveryFeeRule | undefined,
    riderPay: undefined,
    autoApproveVerifiedCustomers: r.auto_approve_verified_customers,
    dispatchMode: "MANUAL",
    riderResponseTimeoutSec: 60,
    acceptedIdTypes: r.accepted_id_types,
    maxOrderSubtotal: r.max_order_subtotal,
    pinAdjustRadiusM: r.pin_adjust_radius_m,
    loyalty: r.loyalty as unknown as LoyaltySettings,
  };
}

/** An order with its items, timeline and rider offers (child rows of any order; filtered by order id here). */
export function toOrder(
  r: OrderRow,
  items: OrderItemRow[] = [],
  events: OrderEventRow[] = [],
  attempts: AttemptRow[] = [],
): Order {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    orderNumber: r.order_number,
    customerId: r.customer_id,
    merchantId: r.merchant_id,
    riderId: u(r.rider_id),
    status: r.status,
    items: items
      .filter((i) => i.order_id === r.id)
      .sort((a, b) => a.line_no - b.line_no)
      .map((i) => ({
        productId: i.product_id ?? "",
        name: i.name,
        unitPrice: i.unit_price,
        storeUnitPrice: u(i.store_unit_price),
        qty: i.qty,
        lineTotal: i.line_total,
        isUnavailable: i.is_unavailable || undefined,
        isFreeGift: i.is_free_gift || undefined,
      })),
    deliveryLocation: { lat: r.delivery_location_lat, lng: r.delivery_location_lng },
    deliveryAddressText: r.delivery_address_text,
    notes: u(r.notes),
    distanceKm: Number(r.distance_km),
    deliveryBarangayFeeId: u(r.delivery_barangay_fee_id),
    subtotal: r.subtotal,
    deliveryFee: r.delivery_fee,
    couponId: u(r.coupon_id),
    couponCode: u(r.coupon_code),
    couponDiscount: r.coupon_discount,
    usedFreeDeliveryReward: r.used_free_delivery_reward,
    usedFreeGiftReward: r.used_free_gift_reward,
    freeDeliveryDiscount: r.free_delivery_discount,
    pointsRedeemed: r.points_redeemed,
    pointsDiscount: r.points_discount,
    discountTotal: r.discount_total,
    total: r.total,
    pointsEarned: u(r.points_earned),
    deliveryFeeSnapshot: r.delivery_fee_snapshot as unknown as DeliveryFeeRule,
    riderEarning: u(r.rider_earning),
    paymentMethod: "COD",
    paymentStatus: r.payment_status,
    changeFor: u(r.change_for),
    cashCollectedAt: u(r.cash_collected_at),
    storeAmountPaid: u(r.store_amount_paid),
    storeReceiptPhotoUrl: u(r.store_receipt_photo_url),
    approvedBy: u(r.approved_by),
    pendingOffer:
      r.offer_rider_id && r.offer_offered_at && r.offer_expires_at && r.offer_by
        ? {
            riderId: r.offer_rider_id,
            offeredAt: r.offer_offered_at,
            expiresAt: r.offer_expires_at,
            by: r.offer_by,
            staffId: u(r.offer_staff_id),
          }
        : undefined,
    assignmentAttempts: attempts
      .filter((a) => a.order_id === r.id)
      .sort((a, b) => Date.parse(a.offered_at) - Date.parse(b.offered_at))
      .map((a) => ({
        riderId: a.rider_id,
        by: a.by,
        staffId: u(a.staff_id),
        offeredAt: a.offered_at,
        respondedAt: u(a.responded_at),
        response: u(a.response),
        rejectReason: u(a.reject_reason),
        rejectNote: u(a.reject_note),
      })),
    rejectReason: u(r.reject_reason),
    cancelReason: u(r.cancel_reason),
    proofOfDelivery:
      r.proof_photo_url || r.proof_note
        ? { photoUrl: u(r.proof_photo_url), note: u(r.proof_note) }
        : undefined,
    timeline: events
      .filter((e) => e.order_id === r.id)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .map((e) => ({
        status: e.status,
        actorType: e.actor_type,
        actorId: u(e.actor_id),
        at: e.at,
        note: u(e.note),
      })),
    createdAt: r.created_at,
  };
}

/** ID photos sent with a first order: storage paths in the id-documents bucket. */
export type VerificationUpload = {
  idType: Verification["idType"];
  idFrontUrl: string;
  selfieWithIdUrl: string;
};

/**
 * The `place_order` payload from an order priced by packages/lib (placeOrder). The database sets the order id,
 * number, status and timeline itself and re-checks coupon limits, balances and totals.
 */
export function toPlaceOrderPayload(o: Order, verification?: VerificationUpload): Json {
  return {
    tenant_id: o.tenantId,
    customer_id: o.customerId,
    merchant_id: o.merchantId,
    delivery_location_lat: o.deliveryLocation.lat,
    delivery_location_lng: o.deliveryLocation.lng,
    delivery_address_text: o.deliveryAddressText,
    notes: o.notes ?? null,
    distance_km: o.distanceKm,
    delivery_barangay_fee_id: o.deliveryBarangayFeeId ?? null,
    subtotal: o.subtotal,
    delivery_fee: o.deliveryFee,
    coupon_id: o.couponId ?? null,
    coupon_discount: o.couponDiscount,
    used_free_delivery_reward: o.usedFreeDeliveryReward,
    free_delivery_discount: o.freeDeliveryDiscount,
    used_free_gift_reward: o.usedFreeGiftReward,
    points_redeemed: o.pointsRedeemed,
    points_discount: o.pointsDiscount,
    discount_total: o.discountTotal,
    total: o.total,
    change_for: o.changeFor ?? null,
    items: o.items.map((i) => ({
      product_id:
        i.isFreeGift && !i.productId.match(/^[0-9a-f-]{36}$/) ? null : i.productId || null,
      name: i.name,
      unit_price: i.unitPrice,
      store_unit_price: i.storeUnitPrice ?? null,
      qty: i.qty,
      line_total: i.lineTotal,
      is_free_gift: Boolean(i.isFreeGift),
    })),
    verification: verification
      ? {
          id_type: verification.idType,
          id_front_url: verification.idFrontUrl,
          selfie_with_id_url: verification.selfieWithIdUrl,
        }
      : null,
  };
}

/** What `my_offer` returns: the order a rider is offered, without address, notes or customer (BL-5.15). */
export type OfferJson = {
  id: string;
  tenant_id: string;
  order_number: string;
  merchant_id: string;
  distance_km: number;
  /** "Barangay, City" when the order has a barangay price entry; null otherwise. */
  drop_off_area: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  change_for: number | null;
  created_at: string;
  offer_offered_at: string;
  offer_expires_at: string;
  offer_by: "AUTO" | "ADMIN";
  items: {
    line_no: number;
    name: string;
    qty: number;
    unit_price: number;
    store_unit_price: number | null;
    line_total: number;
    is_free_gift: boolean;
  }[];
};

/**
 * `my_offer` → an APPROVED Order with a pending offer for `riderId`, so the offer card works like before. The street
 * address isn't sent before accepting: `deliveryAddressText` says so and ends with the area (when known), which
 * `dropOffArea` shows; without an area there is no comma and `dropOffArea` shows the whole sentence.
 */
export function toOfferOrder(j: OfferJson, riderId: string): Order {
  return {
    id: j.id,
    tenantId: j.tenant_id,
    orderNumber: j.order_number,
    customerId: "",
    merchantId: j.merchant_id,
    status: "APPROVED",
    items: [...j.items]
      .sort((a, b) => a.line_no - b.line_no)
      .map((i) => ({
        productId: "",
        name: i.name,
        unitPrice: i.unit_price,
        storeUnitPrice: u(i.store_unit_price),
        qty: i.qty,
        lineTotal: i.line_total,
        isFreeGift: i.is_free_gift || undefined,
      })),
    deliveryLocation: { lat: 0, lng: 0 },
    deliveryAddressText: j.drop_off_area
      ? `Address shown after you accept, ${j.drop_off_area}`
      : "Address shown after you accept",
    distanceKm: Number(j.distance_km),
    subtotal: j.subtotal,
    deliveryFee: j.delivery_fee,
    couponDiscount: 0,
    usedFreeDeliveryReward: false,
    usedFreeGiftReward: false,
    freeDeliveryDiscount: 0,
    pointsRedeemed: 0,
    pointsDiscount: 0,
    discountTotal: j.discount_total,
    total: j.total,
    deliveryFeeSnapshot: { mode: "FIXED", amount: j.delivery_fee },
    paymentMethod: "COD",
    paymentStatus: "UNPAID",
    changeFor: u(j.change_for),
    pendingOffer: {
      riderId,
      offeredAt: j.offer_offered_at,
      expiresAt: j.offer_expires_at,
      by: j.offer_by,
    },
    assignmentAttempts: [],
    timeline: [],
    createdAt: j.created_at,
  };
}
