# ChowLane — Data Model

> Last updated: 2026-11-15 · Version **v0.3 (draft)** — frozen as v1 at end of Phase 1.
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
  deliveryFee:
      { mode: 'PER_KM', baseFee, ratePerKm, includedKm, minFee }   // store → customer distance
    | { mode: 'FIXED', amount }
    | { mode: 'PER_BARANGAY' },                                    // fees in BarangayFee table
  riderPay:
      { mode: 'COMMISSION', percent }          // % of the delivery fee (D-022)
    | { mode: 'DAILY', dailyRate }
    | { mode: 'PER_DELIVERY', ratePerDelivery },
  autoApproveVerifiedCustomers: boolean,       // default false
  dispatchMode: 'AUTO' | 'MANUAL',             // D-021
  riderResponseTimeoutSec,                     // default 60
  acceptedIdTypes: IdType[],                   // default: all (BL-3.3a)
  maxOrderSubtotal,                            // rider cash limit, default ₱2,000
  pinAdjustRadiusM,                            // default 200
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
  | 'admins.manage' | 'reports.view' | 'cash.manage'
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
           addresses: Address[], createdAt }

Verification { id, idType: IdType, idFrontUrl, idBackUrl?, selfieWithIdUrl, submittedAt, orderId?,   // orderId = order it was submitted with, if any
               result?: 'APPROVED' | 'REJECTED', reviewedBy?, reviewedAt?, rejectReason? }

IdType = 'PHILSYS' | 'DRIVERS_LICENSE' | 'PASSPORT' | 'UMID' | 'SSS' | 'GSIS' | 'PRC' | 'POSTAL'
       | 'VOTERS' | 'PHILHEALTH' | 'TIN' | 'SENIOR_CITIZEN' | 'PWD' | 'SCHOOL' | 'OTHER_GOV'

Address { id, label, line1, barangay, cityMunicipality, province, barangayFeeId?, location: LatLng, notes }
```

## Orders

```ts
Order { id, tenantId, orderNumber, customerId, merchantId, riderId?,
        status: 'PENDING_APPROVAL' | 'APPROVED' | 'ASSIGNED' | 'AT_MERCHANT'
              | 'PICKED_UP' | 'DELIVERED' | 'REJECTED' | 'CANCELLED',
        items: OrderItem[],
        deliveryLocation: LatLng, deliveryAddressText, notes,
        distanceKm, deliveryBarangayFeeId?, subtotal, deliveryFee, total,
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

OrderItem  { productId, name, unitPrice, qty, lineTotal, isUnavailable?: boolean }   // marked by rider at store
AssignmentAttempt { riderId, by: 'AUTO' | 'ADMIN', staffId?, offeredAt, respondedAt?,
                    response: 'ACCEPTED' | 'REJECTED' | 'TIMED_OUT' | 'WITHDRAWN', rejectReason? }
OrderEvent { status, actorType: 'CUSTOMER' | 'OWNER' | 'ADMIN' | 'RIDER' | 'SYSTEM', actorId?, at, note? }

LatLng { lat, lng }
```
