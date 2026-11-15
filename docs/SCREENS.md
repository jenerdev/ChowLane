# ChowLane — Screen Inventory (Phase 1 tracker)

> Last updated: 2026-11-15
> All screens are designed **mobile-first** (375px), then scaled up.
> Console, rider and customer are installable PWAs; all their routes live under `/[tenant]/`.
> Status: ⬜ Not started · 🟨 In progress · ✅ Done · ⏸️ Blocked
> Perm = permission needed (Owner always has all).

## apps/landing
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-001 | Landing page | `/` | LND-001 | ⬜ |
| S-002 | Owner signup wizard | `/signup` | LND-002, LND-003 | ⬜ |

## Shared PWA screens (built once in `packages/ui`, used by console, rider, customer)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-010 | Install app sheet (Android install button / iOS "Add to Home Screen" steps) | overlay | FND-011 | ⬜ |
| S-011 | Offline screen | `/[tenant]/~offline` | FND-010 | ⬜ |
| S-012 | "New version available" banner | overlay | FND-012 | ⬜ |

## apps/console (Owner & Admin)
| # | Screen | Route | Reqs | Perm | Status |
|---|---|---|---|---|---|
| S-100 | Login | `/[tenant]/login` | LND-004 | — | ⬜ |
| S-101 | Home: setup checklist (owner) + ops counters | `/[tenant]` | OWN-001, ADM-008 | — | ⬜ |
| S-102 | Orders list (status filters) | `/[tenant]/orders` | ADM-003 | `orders.view` | ⬜ |
| S-103 | Order detail: approve/reject, assign, cancel, timeline | `/[tenant]/orders/[id]` | ADM-002, ADM-003, ADM-004, ADM-007 | `orders.*` | ⬜ |
| S-104 | Customer verification queue | `/[tenant]/customers/verify` | ADM-001 | `customers.verify` | ⬜ |
| S-105 | Customer verification detail (ID + selfie side by side) | `/[tenant]/customers/verify/[id]` | ADM-001 | `customers.verify` | ⬜ |
| S-106 | Customers list & detail | `/[tenant]/customers`, `/[tenant]/customers/[id]` | ADM-009 | `customers.view` | ⬜ |
| S-107 | Riders list (on shift / off) | `/[tenant]/riders` | ADM-005, ADM-006 | `riders.view` | ⬜ |
| S-108 | Rider add / edit | `/[tenant]/riders/new`, `/[tenant]/riders/[id]/edit` | ADM-006 | `riders.manage` | ⬜ |
| S-109 | Rider detail (shifts, orders, earnings) | `/[tenant]/riders/[id]` | ADM-005, OWN-012 | `riders.view` | ⬜ |
| S-110 | Live map (riders + active orders) | `/[tenant]/map` | ADM-005 | `riders.view` | ⬜ |
| S-111 | Merchants list (Owner/Admin set up merchants — no merchant portal) | `/[tenant]/merchants` | OWN-003 | `merchants.manage` | ⬜ |
| S-112 | Merchant add / edit | `/[tenant]/merchants/new`, `/[tenant]/merchants/[id]` | OWN-003 | `merchants.manage` | ⬜ |
| S-113 | Products of a merchant + add / edit product | `/[tenant]/merchants/[id]/products` | OWN-004 | `products.manage` | ⬜ |
| S-114 | Settings — Business & branding (+ accepted ID types) | `/[tenant]/settings/business` | OWN-002, OWN-015 | `settings.business` | ⬜ |
| S-115 | Settings — Service area | `/[tenant]/settings/area` | OWN-010 | `settings.business` | ⬜ |
| S-116 | Settings — Delivery fee (PER_KM / FIXED / PER_BARANGAY + calculator) | `/[tenant]/settings/pricing` | OWN-005, OWN-011 | `settings.pricing` | ⬜ |
| S-122 | Settings — Barangay price list | `/[tenant]/settings/pricing/barangays` | OWN-014 | `settings.pricing` | ⬜ |
| S-123 | Settings — ChowLane billing (plan + statements, read-only) | `/[tenant]/settings/billing` | OWN-016 | Owner | ⬜ |
| S-124 | Cash remittances (record received cash per shift) | `/[tenant]/cash` | ADM-012 | `cash.manage` | ⬜ |
| S-117 | Settings — Rider income (DAILY / % of delivery fee / PER_DELIVERY) | `/[tenant]/settings/rider-pay` | OWN-006 | `settings.riderPay` | ⬜ |
| S-121 | Dispatch: mode switch (AUTO / MANUAL) + "Needs rider" list | `/[tenant]/dispatch` | ADM-004, ADM-010 | `settings.dispatch`, `orders.assign` | ⬜ |
| S-118 | Admin users list + invite / edit | `/[tenant]/admins` | OWN-007 | Owner | ⬜ |
| S-119 | Roles & permissions editor | `/[tenant]/admins/roles` | OWN-008, OWN-009 | Owner | ⬜ |
| S-120 | Rider pay report | `/[tenant]/reports/rider-pay` | OWN-012 | `reports.view` | ⬜ |

## apps/rider
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-200 | Login | `/[tenant]/login` | RID-001 | ⬜ |
| S-201 | Home: time in/out + incoming order offer | `/[tenant]` | RID-002, RID-003, RID-004 | ⬜ |
| S-202 | Order offer detail (countdown, accept / reject with reason) | `/[tenant]/orders/[id]` | RID-004 | ⬜ |
| S-203 | Active delivery (steps + map + call) | `/[tenant]/active` | RID-005, RID-006 | ⬜ |
| S-204 | Proof of delivery | `/[tenant]/active/complete` | RID-007 | ⬜ |
| S-205 | Shifts & earnings | `/[tenant]/earnings` | RID-008 | ⬜ |
| S-207 | Time out — cash summary & remit | `/[tenant]/time-out` | RID-014 | ⬜ |
| S-206 | Profile | `/[tenant]/profile` | RID-009 | ⬜ |

## apps/customer (branded per tenant)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-300 | Splash + Continue with Facebook | `/[tenant]/login` | CUS-001 | ⬜ |
| S-301 | Location permission gate (+ denied state) | `/[tenant]/location` | CUS-002 | ⬜ |
| S-302 | Home (merchants) | `/[tenant]` | CUS-003 | ⬜ |
| S-303 | Merchant products | `/[tenant]/m/[merchantId]` | CUS-004 | ⬜ |
| S-304 | Cart | `/[tenant]/cart` | CUS-004 | ⬜ |
| S-305 | Checkout | `/[tenant]/checkout` | CUS-005 | ⬜ |
| S-306 | ID verification: ID type, ID photo, selfie holding ID (first order / re-submit) | `/[tenant]/checkout/verify-id` | CUS-006, CUS-012 | ⬜ |
| S-307 | Order status / tracking (incl. waiting-for-approval & rejected states) | `/[tenant]/orders/[id]` | CUS-007, CUS-008 | ⬜ |
| S-308 | My orders | `/[tenant]/orders` | CUS-009 | ⬜ |
| S-309 | Profile & addresses | `/[tenant]/profile` | CUS-010 | ⬜ |

## apps/platform (Platform Admin — ChowLane-branded, not a tenant PWA)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-500 | Login | `/login` | PLT-001 | ⬜ |
| S-501 | Overview (all tenants stats) | `/` | PLT-002 | ⬜ |
| S-502 | Tenants list | `/tenants` | PLT-003 | ⬜ |
| S-503 | Tenant detail — overview stats + status (suspend / reactivate) | `/tenants/[id]` | PLT-004, PLT-009 | ⬜ |
| S-504 | Tenant — riders | `/tenants/[id]/riders` | PLT-005 | ⬜ |
| S-505 | Tenant — orders (+ order detail) | `/tenants/[id]/orders` | PLT-006 | ⬜ |
| S-506 | Tenant — customers | `/tenants/[id]/customers` | PLT-006 | ⬜ |
| S-507 | Tenant — merchants & products | `/tenants/[id]/merchants` | PLT-006 | ⬜ |
| S-508 | Tenant — admins & settings | `/tenants/[id]/settings` | PLT-006 | ⬜ |
| S-509 | Tenant — billing config + statements | `/tenants/[id]/billing` | PLT-007, PLT-008 | ⬜ |
| S-510 | Billing overview (all tenants) | `/billing` | PLT-010 | ⬜ |

**Progress: 0 / 59 screens** (landing 2 · shared PWA 3 · console 25 · rider 8 · customer 10 · platform 11)
