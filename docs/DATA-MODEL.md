# ChowLane — Data Model

> Last updated: 2026-11-15 · Version **v1.1** — v1 frozen at Phase 1 sign-off (D-053); v1.1 (2026-11-17, D-061): `TenantSettings.deliveryFee` and `riderPay` optional on a new business. Phase 2 builds the database from this.
> Changes after the freeze need a decision in DECISIONS.md and a note here. `packages/types` must stay in sync.
> Phase 1: TypeScript types in `packages/types` + mocks in `packages/mocks`.
> Phase 2: Supabase tables (snake_case), every tenant table has `tenant_id` + RLS.
> Money = **integer centavos** (PHP; ₱1.00 = 100). Phones = E.164 `+639XXXXXXXXX`. Timestamps = ISO-8601 UTC. Rules for fields → BUSINESS-LOGIC.md.

## Platform (no tenantId)

```ts
PlatformAdmin { id, name, email, status: 'ACTIVE' | 'INACTIVE', createdAt }

TenantBilling { tenantId,
  model: 'FREE' | 'MONTHLY' | 'PER_ORDER' | 'MONTHLY_PLUS_PER_ORDER',
  monthlyFee?, perOrderFee?, trialEndsAt?, effectiveFrom, updatedBy }

BillingStatement { id, tenantId, periodStart, periodEnd,          // calendar month, Asia/Manila
  model, deliveredOrders, amountDue, status: 'UNPAID' | 'PAID' | 'WAIVED',
  paidAt?, note?, createdAt }
```

## Tenant

```ts
Tenant { id, slug, businessName, shortName,      // shortName = PWA home-screen label (≤12 chars)
         logoUrl, primaryColor, backgroundColor,
         currency: 'PHP', timezone: 'Asia/Manila',   // fixed for now (D-018)
         pwaIcons: { icon192Url, icon512Url, maskableUrl, appleTouchUrl },  // generated from logo
         status: 'ACTIVE' | 'SUSPENDED', suspendReason?, ownerId, createdAt }

TenantSettings { tenantId,
  serviceArea: { center: LatLng, radiusKm },
  deliveryFee?:                                                   // v1.1: unset on a new business (D-061)
      { mode: 'PER_KM', baseFee, ratePerKm, includedKm, minFee }   // store → customer distance
    | { mode: 'FIXED', amount }
    | { mode: 'PER_BARANGAY' },                                    // fees in BarangayFee table
  riderPay?:                                   // v1.1: unset on a new business (D-061)
      { mode: 'COMMISSION', percent }          // % of the delivery fee (D-022)
    | { mode: 'DAILY', dailyRate }
    | { mode: 'PER_DELIVERY', ratePerDelivery },
  autoApproveVerifiedCustomers: boolean,       // default false
  dispatchMode: 'AUTO' | 'MANUAL',             // D-021
  riderResponseTimeoutSec,                     // default 60
  acceptedIdTypes: IdType[],                   // default: all (BL-3.3a)
  maxOrderSubtotal,                            // rider cash limit, default ₱2,000
  pinAdjustRadiusM,                            // default 200
  loyalty: LoyaltySettings,                    // BL-14
}
```

BarangayFee { id, tenantId, barangay, cityMunicipality, province, fee, isActive }   // PER_BARANGAY price list

## Staff (console users)

```ts
StaffUser { id, tenantId, name, email, avatarUrl,
            type: 'OWNER' | 'ADMIN',
            roleId?,                            // null for OWNER (has all permissions)
            status: 'INVITED' | 'ACTIVE' | 'INACTIVE', createdAt }

Role { id, tenantId, name, permissions: PermissionKey[], isDefault }

PermissionKey = 'customers.view' | 'customers.verify' | 'orders.view' | 'orders.approve'
  | 'orders.assign' | 'orders.cancel' | 'riders.view' | 'riders.manage' | 'merchants.manage'
  | 'products.manage' | 'settings.pricing' | 'settings.riderPay' | 'settings.dispatch' | 'settings.business'
  | 'admins.manage' | 'reports.view' | 'cash.manage' | 'coupons.manage' | 'loyalty.manage' | 'settings.loyalty'
```

## Catalog

```ts
Merchant { id, tenantId, name, category,           // cuisine/type, e.g. "Filipino", "Burgers", "Café"
           phone, address, location: LatLng, photoUrl,
           isOpen, status: 'ACTIVE' | 'INACTIVE', createdAt }

Product  { id, tenantId, merchantId, name, category,   // menu category, e.g. "Rice Meals", "Drinks"
           description, price, storePrice?,     // price = customer pays; storePrice = expected cost at store (optional, for markup)
           imageUrl,
           isAvailable, sortOrder }
```

## Riders

```ts
Rider { id, tenantId, name, phone, email, photoUrl,
        vehicleType: 'BICYCLE' | 'MOTORCYCLE' | 'CAR', plateNumber,
        payOverride?: TenantSettings['riderPay'],
        isOnShift, currentShiftId?, activeOrderId?, lastLocation?: LatLng,
        status: 'ACTIVE' | 'INACTIVE', createdAt }

Shift { id, tenantId, riderId, timeIn, timeOut?, timeInLocation?: LatLng, timeOutLocation?: LatLng,
        cashCollected, storePaid, expectedRemit,                      // computed at time out (BL-12.2)
        remittedAmount?, remitStatus: 'OPEN' | 'PENDING' | 'RECEIVED' | 'SHORT' | 'OVER',
        remitReceivedBy?, remitReceivedAt?, remitNote? }
```

## Customers

```ts
Customer { id, tenantId, facebookId, name, email?, phone?, avatarUrl,
           verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED',
           verification?: Verification,              // latest submission
           verificationHistory: Verification[],       // all submissions incl. rejected (re-submit allowed — D-024)
           locationPermission: 'GRANTED' | 'DENIED' | 'UNKNOWN',
           addresses: Address[], loyalty: CustomerLoyalty, createdAt }

Verification { id, idType: IdType, idFrontUrl, idBackUrl?, selfieWithIdUrl, submittedAt, orderId?,   // orderId = order it was submitted with, if any
               result?: 'APPROVED' | 'REJECTED', reviewedBy?, reviewedAt?, rejectReason? }

IdType = 'PHILSYS' | 'DRIVERS_LICENSE' | 'PASSPORT' | 'UMID' | 'SSS' | 'GSIS' | 'PRC' | 'POSTAL'
       | 'VOTERS' | 'PHILHEALTH' | 'TIN' | 'SENIOR_CITIZEN' | 'PWD' | 'SCHOOL' | 'OTHER_GOV'

Address { id, label, line1, barangay, cityMunicipality, province, barangayFeeId?, location: LatLng, notes }
```

## Coupons & loyalty

```ts
Coupon { id, tenantId, code,                       // unique per tenant, uppercase
         description?, type: 'PERCENT_OFF' | 'FREE_DELIVERY',
         percentOff?, maxDiscount?, minOrderSubtotal?,
         maxUses, usedCount, perCustomerLimit,       // perCustomerLimit default 1
         validFrom, validUntil, isActive, createdBy, createdAt }

CouponRedemption { id, tenantId, couponId, orderId, customerId, discount, redeemedAt,
                   released }                        // true when order rejected/cancelled (use given back)

LoyaltySettings { enabled,                           // master switch
  freeDelivery: { enabled, ordersRequired },         // every N delivered orders → 1 free delivery
  freeGift:     { enabled, ordersRequired, giftName, productId? },
  points:       { enabled, earnMode: 'PER_ORDER' | 'PER_PESO', pointsPerOrder,
                  centavosPerPoint, pointValue, minRedeemPoints, maxRedeemPercent } }

CustomerLoyalty { deliveredOrders, ordersTowardFreeDelivery, freeDeliveryRewards,
                  ordersTowardFreeGift, freeGiftRewards, points }

LoyaltyTransaction { id, tenantId, customerId, orderId?,
  kind: 'POINTS_EARNED' | 'POINTS_REDEEMED' | 'POINTS_REFUNDED' | 'POINTS_ADJUSTED'
      | 'FREE_DELIVERY_EARNED' | 'FREE_DELIVERY_USED' | 'FREE_DELIVERY_REFUNDED'
      | 'FREE_GIFT_EARNED' | 'FREE_GIFT_USED' | 'FREE_GIFT_REFUNDED',
  points, rewards,                                   // signed changes
  at, staffId?, note? }
```

## Orders

```ts
Order { id, tenantId, orderNumber, customerId, merchantId, riderId?,
        status: 'PENDING_APPROVAL' | 'APPROVED' | 'ASSIGNED' | 'AT_MERCHANT'
              | 'PICKED_UP' | 'DELIVERED' | 'REJECTED' | 'CANCELLED',
        items: OrderItem[],
        deliveryLocation: LatLng, deliveryAddressText, notes,
        distanceKm, deliveryBarangayFeeId?, subtotal, deliveryFee,
        couponId?, couponCode?, couponDiscount,                // BL-13
        usedFreeDeliveryReward, freeDeliveryDiscount,          // BL-14.3a
        usedFreeGiftReward,                                    // BL-14.3b (gift = ₱0 OrderItem)
        pointsRedeemed, pointsDiscount, discountTotal,         // BL-14.5
        total,                                                 // subtotal + deliveryFee − discountTotal (cash to collect)
        pointsEarned?,                                         // set when DELIVERED
        deliveryFeeSnapshot: TenantSettings['deliveryFee'],   // rule used at checkout
        riderEarning?,                                         // computed on DELIVERED
        paymentMethod: 'COD',                                  // only COD for MVP (D-019)
        paymentStatus: 'UNPAID' | 'COLLECTED',
        changeFor?,                                            // cash amount customer will pay with
        cashCollectedAt?,
        storeAmountPaid?, storeReceiptPhotoUrl?,               // recorded by rider at pickup (BL-11.6)
        approvedBy?,
        pendingOffer?: { riderId, offeredAt, expiresAt, by: 'AUTO' | 'ADMIN', staffId? },
        assignmentAttempts: AssignmentAttempt[],
        rejectReason?, cancelReason?,
        proofOfDelivery?: { photoUrl, note },
        timeline: OrderEvent[], createdAt }

OrderItem  { productId, name, unitPrice, storeUnitPrice?, qty, lineTotal,
             isUnavailable?: boolean,   // marked by rider at store
             isFreeGift?: boolean }     // loyalty gift, unitPrice 0
AssignmentAttempt { riderId, by: 'AUTO' | 'ADMIN', staffId?, offeredAt, respondedAt?,
                    response?: 'ACCEPTED' | 'REJECTED' | 'TIMED_OUT' | 'WITHDRAWN',   // empty while waiting
                    rejectReason?: 'NOT_ENOUGH_CASH' | 'TOO_FAR' | 'VEHICLE_PROBLEM' | 'NO_RESPONSE' | 'OTHER',
                    rejectNote? }
OrderEvent { status, actorType: 'CUSTOMER' | 'OWNER' | 'ADMIN' | 'RIDER' | 'SYSTEM', actorId?, at, note? }

LatLng { lat, lng }
```

## Phase 2 — database mapping (D-057)

Not a model change: how v1 is stored in Supabase (`supabase/migrations/`). Column names = snake_case of the fields.

| Model | Table(s) / columns |
|---|---|
| `Tenant.pwaIcons`, rule objects (`deliveryFee`, `riderPay`, `loyalty`, `Rider.payOverride`, `Order.deliveryFeeSnapshot`) | JSONB, same camelCase keys as `packages/types`, checked by `is_valid_*` functions |
| `LatLng` fields | `<field>_lat`, `<field>_lng` (e.g. `merchants.location_lat`, `tenant_settings.service_area_lat` + `service_area_radius_km`) |
| `Customer.addresses` | `customer_addresses` |
| `Customer.verification` / `verificationHistory` | `verifications` (latest = newest `submitted_at`) |
| `Customer.loyalty` | `customers.loyalty_*` columns (rebuildable from `loyalty_transactions`) |
| `Order.items` / `timeline` / `assignmentAttempts` | `order_items` (+ `line_no`), `order_events`, `assignment_attempts` |
| `Order.pendingOffer` | `orders.offer_rider_id`, `offer_offered_at`, `offer_expires_at`, `offer_by`, `offer_staff_id` |
| `Order.proofOfDelivery` | `orders.proof_photo_url`, `proof_note` |
| `TenantBilling` | `tenant_billing` (one row per tenant) |
| Logins | `auth_user_id` on `platform_admins`, `staff_users`, `riders`, `customers` (one customer row per tenant — Q-31) |
| `Tenant.logoUrl` | public URL of a file in the `tenant-logos` Storage bucket, path `<tenant id>/logo-<time>.png` (2.4, D-066) |
| `Verification.idFrontUrl` / `selfieWithIdUrl` | storage path in the private `id-documents` bucket, `<tenant id>/<customer id>/<kind>-<time>.jpg` (2.5, D-067) |
| `Order.storeReceiptPhotoUrl` / `proofOfDelivery.photoUrl` | storage path in the private `delivery-photos` bucket, `<tenant id>/<order id>/<receipt\|proof>-<time>.jpg` (2.6, D-068) — no schema change |

Public read-only views: `tenants_public`, `tenant_settings_public` (no rider pay), `products_public` (no store price).
Types: `packages/db/src/database.types.ts` (generated, `pnpm db:types`); `schema-sync.test.ts` checks the enums match
`packages/types`.
