/**
 * Generates supabase/seed.sql from @chowlane/mocks (the Phase 1 demo data), so the local database holds the same
 * 3 demo tenants as the prototype. Run: `pnpm db:seed:gen` (then `pnpm db:reset` to load it).
 *
 * - Mock ids ("t-fastbite") become stable UUIDs (uuidFor), so tests and links can rely on them.
 * - Demo logins (LOCAL ONLY — seed.sql never runs against the hosted project unless asked to):
 *   staff + platform admin: their email · riders: their phone · customers: <facebookId>@demo.chowlane.local.
 *   Password for all: DEMO_PASSWORD. INVITED staff get no login.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { mockDb } from "@chowlane/mocks";
import type { LatLng } from "@chowlane/types";
import { authIdFor, uuidFor } from "./ids";

export const DEMO_PASSWORD = "demo1234";
const OUT = join(import.meta.dirname, "..", "..", "..", "supabase", "seed.sql");

// ------------------------------------------------------------------ SQL literals
type Lit = string; // already-rendered SQL
const q = (v: string | undefined | null): Lit =>
  v === undefined || v === null ? "null" : `'${v.replaceAll("'", "''")}'`;
const n = (v: number | undefined | null): Lit =>
  v === undefined || v === null ? "null" : String(v);
const b = (v: boolean | undefined | null): Lit =>
  v === undefined || v === null ? "null" : String(v);
const j = (v: unknown): Lit =>
  v === undefined || v === null ? "null" : `${q(JSON.stringify(v))}::jsonb`;
const id = (v: string | undefined | null): Lit => (v ? q(uuidFor(v)) : "null");
const ts = q;
const arr = (vals: readonly string[], type: string): Lit =>
  `array[${vals.map((v) => q(v)).join(", ")}]::${type}[]`;
const lat = (l: LatLng | undefined) => n(l?.lat);
const lng = (l: LatLng | undefined) => n(l?.lng);

function insert(table: string, rows: Record<string, Lit>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]!);
  const values = rows.map((r) => `  (${cols.map((c) => r[c]).join(", ")})`).join(",\n");
  return `insert into ${table} (${cols.join(", ")}) values\n${values};\n\n`;
}

// ------------------------------------------------------------------ auth users (demo logins)
type DemoLogin = { key: string; email?: string; phone?: string; name: string };
const logins: DemoLogin[] = [];
const authId = authIdFor;

function login(key: string, l: Omit<DemoLogin, "key">): Lit {
  logins.push({ key, ...l });
  return q(authId(key));
}

const db = mockDb;
let sql = "";

// platform
const platformRows = db.platformAdmins.map((p) => ({
  id: id(p.id),
  auth_user_id: login(p.id, { email: p.email, name: p.name }),
  name: q(p.name),
  email: q(p.email),
  status: q(p.status),
  created_at: ts(p.createdAt),
}));

const staffRows = db.staff.map((s) => ({
  id: id(s.id),
  tenant_id: id(s.tenantId),
  auth_user_id: s.status === "INVITED" ? "null" : login(s.id, { email: s.email, name: s.name }),
  name: q(s.name),
  email: q(s.email),
  avatar_url: q(s.avatarUrl),
  type: q(s.type),
  role_id: id(s.roleId),
  status: q(s.status),
  created_at: ts(s.createdAt),
}));

const riderRows = db.riders.map((r) => ({
  id: id(r.id),
  tenant_id: id(r.tenantId),
  auth_user_id: login(r.id, { phone: r.phone, name: r.name }),
  name: q(r.name),
  phone: q(r.phone),
  email: q(r.email),
  photo_url: q(r.photoUrl),
  vehicle_type: q(r.vehicleType),
  plate_number: q(r.plateNumber),
  pay_override: j(r.payOverride),
  is_on_shift: b(r.isOnShift),
  last_location_lat: lat(r.lastLocation),
  last_location_lng: lng(r.lastLocation),
  status: q(r.status),
  created_at: ts(r.createdAt),
}));

const customerRows = db.customers.map((c) => ({
  id: id(c.id),
  tenant_id: id(c.tenantId),
  auth_user_id: login(c.id, { email: `${c.facebookId}@demo.chowlane.local`, name: c.name }),
  facebook_id: q(c.facebookId),
  name: q(c.name),
  email: q(c.email),
  phone: q(c.phone),
  avatar_url: q(c.avatarUrl),
  verification_status: q(c.verificationStatus),
  location_permission: q(c.locationPermission),
  loyalty_delivered_orders: n(c.loyalty.deliveredOrders),
  loyalty_orders_toward_free_delivery: n(c.loyalty.ordersTowardFreeDelivery),
  loyalty_free_delivery_rewards: n(c.loyalty.freeDeliveryRewards),
  loyalty_orders_toward_free_gift: n(c.loyalty.ordersTowardFreeGift),
  loyalty_free_gift_rewards: n(c.loyalty.freeGiftRewards),
  loyalty_points: n(c.loyalty.points),
  created_at: ts(c.createdAt),
}));

// auth.users + identities first (FK targets)
const now = "'2026-11-15T04:00:00.000Z'";
sql += insert(
  "auth.users",
  logins.map((l) => ({
    instance_id: q("00000000-0000-0000-0000-000000000000"),
    id: q(authId(l.key)),
    aud: q("authenticated"),
    role: q("authenticated"),
    email: q(l.email),
    phone: q(l.phone?.replace(/^\+/, "")),
    encrypted_password: `extensions.crypt(${q(DEMO_PASSWORD)}, extensions.gen_salt('bf'))`,
    email_confirmed_at: l.email ? now : "null",
    phone_confirmed_at: l.phone ? now : "null",
    raw_app_meta_data: j({
      provider: l.email ? "email" : "phone",
      providers: [l.email ? "email" : "phone"],
    }),
    raw_user_meta_data: j({ name: l.name }),
    created_at: now,
    updated_at: now,
    confirmation_token: q(""),
    recovery_token: q(""),
    email_change_token_new: q(""),
    email_change: q(""),
  })),
);
sql += insert(
  "auth.identities",
  logins.map((l) => ({
    id: q(uuidFor(`identity:${l.key}`)),
    user_id: q(authId(l.key)),
    provider_id: q(authId(l.key)),
    provider: q(l.email ? "email" : "phone"),
    identity_data: j(
      l.email
        ? { sub: authId(l.key), email: l.email, email_verified: true }
        : { sub: authId(l.key), phone: l.phone!.replace(/^\+/, ""), phone_verified: true },
    ),
    last_sign_in_at: "null",
    created_at: now,
    updated_at: now,
  })),
);

sql += insert("public.platform_admins", platformRows);

sql += insert(
  "public.tenants",
  db.tenants.map((t) => ({
    id: id(t.id),
    slug: q(t.slug),
    business_name: q(t.businessName),
    short_name: q(t.shortName),
    logo_url: q(t.logoUrl),
    primary_color: q(t.primaryColor),
    background_color: q(t.backgroundColor),
    currency: q(t.currency),
    timezone: q(t.timezone),
    pwa_icons: j(t.pwaIcons),
    status: q(t.status),
    suspend_reason: q(t.suspendReason),
    owner_id: id(t.ownerId),
    created_at: ts(t.createdAt),
  })),
);

sql += insert(
  "public.tenant_settings",
  db.tenantSettings.map((s) => ({
    tenant_id: id(s.tenantId),
    service_area_lat: n(s.serviceArea.center.lat),
    service_area_lng: n(s.serviceArea.center.lng),
    service_area_radius_km: n(s.serviceArea.radiusKm),
    delivery_fee: j(s.deliveryFee),
    rider_pay: j(s.riderPay),
    auto_approve_verified_customers: b(s.autoApproveVerifiedCustomers),
    dispatch_mode: q(s.dispatchMode),
    rider_response_timeout_sec: n(s.riderResponseTimeoutSec),
    accepted_id_types: arr(s.acceptedIdTypes, "public.id_type"),
    max_order_subtotal: n(s.maxOrderSubtotal),
    pin_adjust_radius_m: n(s.pinAdjustRadiusM),
    loyalty: j(
      s.loyalty.freeGift.productId
        ? {
            ...s.loyalty,
            freeGift: { ...s.loyalty.freeGift, productId: uuidFor(s.loyalty.freeGift.productId) },
          }
        : s.loyalty,
    ),
  })),
);

sql += insert(
  "public.tenant_billing",
  db.tenantBilling.map((x) => ({
    tenant_id: id(x.tenantId),
    model: q(x.model),
    monthly_fee: n(x.monthlyFee),
    per_order_fee: n(x.perOrderFee),
    trial_ends_at: ts(x.trialEndsAt),
    effective_from: ts(x.effectiveFrom),
    updated_by: id(x.updatedBy),
  })),
);

sql += insert(
  "public.billing_statements",
  db.billingStatements.map((x) => ({
    id: id(x.id),
    tenant_id: id(x.tenantId),
    period_start: ts(x.periodStart),
    period_end: ts(x.periodEnd),
    model: q(x.model),
    delivered_orders: n(x.deliveredOrders),
    amount_due: n(x.amountDue),
    status: q(x.status),
    paid_at: ts(x.paidAt),
    note: q(x.note),
    created_at: ts(x.createdAt),
  })),
);

sql += insert(
  "public.barangay_fees",
  db.barangayFees.map((x) => ({
    id: id(x.id),
    tenant_id: id(x.tenantId),
    barangay: q(x.barangay),
    city_municipality: q(x.cityMunicipality),
    province: q(x.province),
    fee: n(x.fee),
    is_active: b(x.isActive),
  })),
);

sql += insert(
  "public.roles",
  db.roles.map((r) => ({
    id: id(r.id),
    tenant_id: id(r.tenantId),
    name: q(r.name),
    permissions: arr(r.permissions, "public.permission_key"),
    is_default: b(r.isDefault),
  })),
);

sql += insert("public.staff_users", staffRows);

sql += insert(
  "public.merchants",
  db.merchants.map((m) => ({
    id: id(m.id),
    tenant_id: id(m.tenantId),
    name: q(m.name),
    category: q(m.category),
    phone: q(m.phone),
    address: q(m.address),
    location_lat: lat(m.location),
    location_lng: lng(m.location),
    photo_url: q(m.photoUrl),
    is_open: b(m.isOpen),
    status: q(m.status),
    created_at: ts(m.createdAt),
  })),
);

sql += insert(
  "public.products",
  db.products.map((p) => ({
    id: id(p.id),
    tenant_id: id(p.tenantId),
    merchant_id: id(p.merchantId),
    name: q(p.name),
    category: q(p.category),
    description: q(p.description),
    price: n(p.price),
    store_price: n(p.storePrice),
    image_url: q(p.imageUrl),
    is_available: b(p.isAvailable),
    sort_order: n(p.sortOrder),
  })),
);

sql += insert("public.riders", riderRows);

sql += insert(
  "public.shifts",
  db.shifts.map((s) => ({
    id: id(s.id),
    tenant_id: id(s.tenantId),
    rider_id: id(s.riderId),
    time_in: ts(s.timeIn),
    time_out: ts(s.timeOut),
    time_in_lat: lat(s.timeInLocation),
    time_in_lng: lng(s.timeInLocation),
    time_out_lat: lat(s.timeOutLocation),
    time_out_lng: lng(s.timeOutLocation),
    cash_collected: n(s.cashCollected),
    store_paid: n(s.storePaid),
    expected_remit: n(s.expectedRemit),
    remitted_amount: n(s.remittedAmount),
    remit_status: q(s.remitStatus),
    remit_received_by: id(s.remitReceivedBy),
    remit_received_at: ts(s.remitReceivedAt),
    remit_note: q(s.remitNote),
  })),
);

sql += insert("public.customers", customerRows);

sql += insert(
  "public.customer_addresses",
  db.customers.flatMap((c) =>
    c.addresses.map((a) => ({
      id: id(a.id),
      tenant_id: id(c.tenantId),
      customer_id: id(c.id),
      label: q(a.label),
      line1: q(a.line1),
      barangay: q(a.barangay),
      city_municipality: q(a.cityMunicipality),
      province: q(a.province),
      barangay_fee_id: id(a.barangayFeeId),
      location_lat: lat(a.location),
      location_lng: lng(a.location),
      notes: q(a.notes),
    })),
  ),
);

sql += insert(
  "public.coupons",
  db.coupons.map((c) => ({
    id: id(c.id),
    tenant_id: id(c.tenantId),
    code: q(c.code),
    description: q(c.description),
    type: q(c.type),
    percent_off: n(c.percentOff),
    max_discount: n(c.maxDiscount),
    min_order_subtotal: n(c.minOrderSubtotal),
    max_uses: n(c.maxUses),
    used_count: n(c.usedCount),
    per_customer_limit: n(c.perCustomerLimit),
    valid_from: ts(c.validFrom),
    valid_until: ts(c.validUntil),
    is_active: b(c.isActive),
    created_by: id(c.createdBy),
    created_at: ts(c.createdAt),
  })),
);

const productIds = new Set(db.products.map((p) => p.id));
sql += insert(
  "public.orders",
  db.orders.map((o) => ({
    id: id(o.id),
    tenant_id: id(o.tenantId),
    order_number: q(o.orderNumber),
    customer_id: id(o.customerId),
    merchant_id: id(o.merchantId),
    rider_id: id(o.riderId),
    status: q(o.status),
    delivery_location_lat: lat(o.deliveryLocation),
    delivery_location_lng: lng(o.deliveryLocation),
    delivery_address_text: q(o.deliveryAddressText),
    notes: q(o.notes),
    distance_km: n(o.distanceKm),
    delivery_barangay_fee_id: id(o.deliveryBarangayFeeId),
    subtotal: n(o.subtotal),
    delivery_fee: n(o.deliveryFee),
    coupon_id: id(o.couponId),
    coupon_code: q(o.couponCode),
    coupon_discount: n(o.couponDiscount),
    used_free_delivery_reward: b(o.usedFreeDeliveryReward),
    free_delivery_discount: n(o.freeDeliveryDiscount),
    used_free_gift_reward: b(o.usedFreeGiftReward),
    points_redeemed: n(o.pointsRedeemed),
    points_discount: n(o.pointsDiscount),
    discount_total: n(o.discountTotal),
    total: n(o.total),
    points_earned: n(o.pointsEarned),
    delivery_fee_snapshot: j(o.deliveryFeeSnapshot),
    rider_earning: n(o.riderEarning),
    payment_method: q(o.paymentMethod),
    payment_status: q(o.paymentStatus),
    change_for: n(o.changeFor),
    cash_collected_at: ts(o.cashCollectedAt),
    store_amount_paid: n(o.storeAmountPaid),
    store_receipt_photo_url: q(o.storeReceiptPhotoUrl),
    approved_by: id(o.approvedBy),
    offer_rider_id: id(o.pendingOffer?.riderId),
    offer_offered_at: ts(o.pendingOffer?.offeredAt),
    offer_expires_at: ts(o.pendingOffer?.expiresAt),
    offer_by: q(o.pendingOffer?.by),
    offer_staff_id: id(o.pendingOffer?.staffId),
    reject_reason: q(o.rejectReason),
    cancel_reason: q(o.cancelReason),
    proof_photo_url: q(o.proofOfDelivery?.photoUrl),
    proof_note: q(o.proofOfDelivery?.note),
    created_at: ts(o.createdAt),
  })),
);

sql += insert(
  "public.order_items",
  db.orders.flatMap((o) =>
    o.items.map((it, i) => ({
      tenant_id: id(o.tenantId),
      order_id: id(o.id),
      line_no: n(i + 1),
      product_id: productIds.has(it.productId) ? id(it.productId) : "null",
      name: q(it.name),
      unit_price: n(it.unitPrice),
      store_unit_price: n(it.storeUnitPrice),
      qty: n(it.qty),
      line_total: n(it.lineTotal),
      is_unavailable: b(it.isUnavailable ?? false),
      is_free_gift: b(it.isFreeGift ?? false),
    })),
  ),
);

sql += insert(
  "public.order_events",
  db.orders.flatMap((o) =>
    o.timeline.map((e) => ({
      tenant_id: id(o.tenantId),
      order_id: id(o.id),
      status: q(e.status),
      actor_type: q(e.actorType),
      actor_id: id(e.actorId),
      at: ts(e.at),
      note: q(e.note),
    })),
  ),
);

sql += insert(
  "public.assignment_attempts",
  db.orders.flatMap((o) =>
    o.assignmentAttempts.map((a) => ({
      tenant_id: id(o.tenantId),
      order_id: id(o.id),
      rider_id: id(a.riderId),
      by: q(a.by),
      staff_id: id(a.staffId),
      offered_at: ts(a.offeredAt),
      responded_at: ts(a.respondedAt),
      response: q(a.response),
      reject_reason: q(a.rejectReason),
      reject_note: q(a.rejectNote),
    })),
  ),
);

// verifications: latest + history, de-duplicated by id
sql += insert(
  "public.verifications",
  db.customers.flatMap((c) => {
    const all = new Map(
      [...c.verificationHistory, ...(c.verification ? [c.verification] : [])].map((v) => [v.id, v]),
    );
    return [...all.values()].map((v) => ({
      id: id(v.id),
      tenant_id: id(c.tenantId),
      customer_id: id(c.id),
      id_type: q(v.idType),
      id_front_url: q(v.idFrontUrl),
      id_back_url: q(v.idBackUrl),
      selfie_with_id_url: q(v.selfieWithIdUrl),
      submitted_at: ts(v.submittedAt),
      order_id: id(v.orderId),
      result: q(v.result),
      reviewed_by: id(v.reviewedBy),
      reviewed_at: ts(v.reviewedAt),
      reject_reason: q(v.rejectReason),
    }));
  }),
);

sql += insert(
  "public.coupon_redemptions",
  db.couponRedemptions.map((r) => ({
    id: id(r.id),
    tenant_id: id(r.tenantId),
    coupon_id: id(r.couponId),
    order_id: id(r.orderId),
    customer_id: id(r.customerId),
    discount: n(r.discount),
    redeemed_at: ts(r.redeemedAt),
    released: b(r.released),
  })),
);

sql += insert(
  "public.loyalty_transactions",
  db.loyaltyTransactions.map((t) => ({
    id: id(t.id),
    tenant_id: id(t.tenantId),
    customer_id: id(t.customerId),
    order_id: id(t.orderId),
    kind: q(t.kind),
    points: n(t.points),
    rewards: n(t.rewards),
    at: ts(t.at),
    staff_id: id(t.staffId),
    note: q(t.note),
  })),
);

// rider → current shift / active order (rows exist now)
sql += db.riders
  .filter((r) => r.currentShiftId || r.activeOrderId)
  .map(
    (r) =>
      `update public.riders set current_shift_id = ${id(r.currentShiftId)}, active_order_id = ${id(r.activeOrderId)} where id = ${id(r.id)};\n`,
  )
  .join("");

const header = `-- GENERATED by packages/db/scripts/gen-seed.ts from @chowlane/mocks — do not edit by hand.
-- Regenerate: pnpm db:seed:gen · Load: pnpm db:reset (local only).
-- Demo logins (local): staff / platform admin email, rider phone, customer <facebookId>@demo.chowlane.local;
-- password "${DEMO_PASSWORD}".

begin;
set constraints all deferred;

`;
writeFileSync(OUT, `${header}${sql}\ncommit;\n`);
console.log(`wrote ${OUT} (${logins.length} demo logins)`);
