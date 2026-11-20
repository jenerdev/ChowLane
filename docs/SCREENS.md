# ChowLane — Screen Inventory (Phase 1 tracker)

> Last updated: 2026-11-18
> All screens are designed **mobile-first** (375px), then scaled up.
> Console, rider and customer are installable PWAs; all their routes live under `/[tenant]/`.
> Status: ⬜ Not started · 🟨 In progress · ✅ Done · ⏸️ Blocked
> Perm = permission needed (Owner always has all).

## apps/landing
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-001 | Landing page | `/` | LND-001 | ✅ |
| S-002 | Owner signup wizard (6 steps + done) | `/signup` | LND-002, LND-003 | ✅ |
| S-003 | Find your console (business link → console login) | `/login` | LND-004 | ✅ |

## Shared PWA screens (built once in `packages/ui`, used by console, rider, customer)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-010 | Install app sheet (Android install button / iOS "Add to Home Screen" steps) | overlay | FND-011 | ✅ |
| S-011 | Offline screen | `/~offline` | FND-010 | ✅ |
| S-012 | "New version available" banner | overlay | FND-012 | ✅ |

## Dev tools (Phase 1 only)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-900 | Phone preview — every app side by side at 360/390/430 px | landing `/preview` | FND-002 | ✅ |

## apps/console (Owner & Admin)
> **Live on Supabase (Phase 2):** S-118, S-119, S-107–S-109 (2.3); **2.4:** S-101 home, S-104/S-105 verification
> (view), S-106 customers (+ points adjust), S-111–S-117, S-122, S-123, S-125–S-128, and the dispatch-mode switch on
> S-121; **2.5:** S-102/S-103 orders (approve / reject / cancel), ID approve / reject on S-105; **2.6:** S-121 dispatch
> lists + assign sheet, assign / reassign on S-103, S-110 live map, S-124 cash, S-120 rider pay report. Orders, dispatch,
> map and cash update via Realtime. **No mock data left in the console** (the mock store and its settings mirror are gone).

| # | Screen | Route | Reqs | Perm | Status |
|---|---|---|---|---|---|
| S-100 | Login | `/[tenant]/login` | LND-004 | — | ✅ |
| S-101 | Home: setup checklist (owner) + ops counters | `/[tenant]` | OWN-001, ADM-008 | — | ✅ |
| S-102 | Orders list (status filters) | `/[tenant]/orders` | ADM-003 | `orders.view` | ✅ |
| S-103 | Order detail: approve/reject, assign, cancel, timeline | `/[tenant]/orders/[id]` | ADM-002, ADM-003, ADM-004, ADM-007 | `orders.*` | ✅ |
| S-104 | Customer verification queue | `/[tenant]/customers/verify` | ADM-001 | `customers.verify` | ✅ |
| S-105 | Customer verification detail (ID + selfie side by side) | `/[tenant]/customers/verify/[id]` | ADM-001 | `customers.verify` | ✅ |
| S-106 | Customers list & detail (incl. loyalty balance + adjust) | `/[tenant]/customers`, `/[tenant]/customers/[id]` | ADM-009, ADM-013 | `customers.view` | ✅ |
| S-107 | Riders list (on shift / off) | `/[tenant]/riders` | ADM-005, ADM-006 | `riders.view` | ✅ |
| S-108 | Rider add / edit | `/[tenant]/riders/new`, `/[tenant]/riders/[id]/edit` | ADM-006 | `riders.manage` | ✅ |
| S-109 | Rider detail (shifts, orders, earnings) | `/[tenant]/riders/[id]` | ADM-005, OWN-012 | `riders.view` | ✅ |
| S-110 | Live map (riders + active orders) | `/[tenant]/map` | ADM-005 | `riders.view` | ✅ |
| S-111 | Merchants list (Owner/Admin set up merchants — no merchant portal) | `/[tenant]/merchants` | OWN-003 | `merchants.manage` | ✅ |
| S-112 | Merchant add / edit | `/[tenant]/merchants/new`, `/[tenant]/merchants/[id]` | OWN-003 | `merchants.manage` | ✅ |
| S-113 | Products of a merchant + add / edit product | `/[tenant]/merchants/[id]/products` | OWN-004 | `products.manage` | ✅ |
| S-114 | Settings — Business & branding (+ accepted ID types) | `/[tenant]/settings/business` | OWN-002, OWN-015 | `settings.business` | ✅ |
| S-115 | Settings — Service area | `/[tenant]/settings/area` | OWN-010 | `settings.business` | ✅ |
| S-116 | Settings — Delivery fee (PER_KM / FIXED / PER_BARANGAY + calculator) | `/[tenant]/settings/pricing` | OWN-005, OWN-011 | `settings.pricing` | ✅ |
| S-122 | Settings — Barangay price list | `/[tenant]/settings/pricing/barangays` | OWN-014 | `settings.pricing` | ✅ |
| S-123 | Settings — ChowLane billing (plan + statements, read-only) | `/[tenant]/settings/billing` | OWN-016 | Owner | ✅ |
| S-124 | Cash remittances (record received cash per shift) | `/[tenant]/cash` | ADM-012 | `cash.manage` | ✅ |
| S-125 | Coupons list (status, uses left, validity) | `/[tenant]/coupons` | OWN-017, OWN-018 | `coupons.manage` | ✅ |
| S-126 | Coupon add / edit + usage history | `/[tenant]/coupons/new`, `/[tenant]/coupons/[id]` | OWN-017, OWN-018 | `coupons.manage` | ✅ |
| S-128 | Settings index (grouped, filtered by permission) | `/[tenant]/settings` | — | any settings perm | ✅ |
| S-127 | Settings — Loyalty program (on/off, rules) | `/[tenant]/settings/loyalty` | OWN-019 | `settings.loyalty` | ✅ |
| S-117 | Settings — Rider income (DAILY / % of delivery fee / PER_DELIVERY) | `/[tenant]/settings/rider-pay` | OWN-006 | `settings.riderPay` | ✅ |
| S-121 | Dispatch: mode switch (AUTO / MANUAL) + "Needs rider" list | `/[tenant]/dispatch` | ADM-004, ADM-010 | `settings.dispatch`, `orders.assign` | ✅ |
| S-118 | Admin users list + invite / edit | `/[tenant]/settings/admins` | OWN-007 | Owner | ✅ |
| S-125 | Accept admin invite — set password (Phase 2.3) | `/[tenant]/invite` | OWN-007 | — | ✅ |
| S-119 | Roles & permissions editor | `/[tenant]/settings/roles` | OWN-008, OWN-009 | Owner | ✅ |
| S-120 | Rider pay report | `/[tenant]/reports/rider-pay` | OWN-012 | `reports.view` | ✅ |

## apps/rider
> **Live on Supabase since 2.6:** every screen — time in / out (`rider_time_in` / `rider_time_out` with cash summary),
> offers (`my_offer`: area only before accepting), accept / decline, store → items unavailable → pickup with receipt
> photo → delivered with proof, history, earnings, profile; Realtime pushes new offers. No mock data left in this app.
> The "Simulate a new offer" prototype button is gone (real offers now).
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-200 | Login (mobile number + password since 2.3, Q-30) | `/[tenant]/login` | RID-001 | ✅ |
| S-201 | Home: time in/out + incoming order offer | `/[tenant]` | RID-002, RID-003, RID-004 | ✅ |
| S-202 | Order offer detail (countdown, accept / reject with reason) | `/[tenant]/orders/[id]` | RID-004 | ✅ |
| S-203 | Active delivery (steps + map + call) | `/[tenant]/active` | RID-005, RID-006 | ✅ |
| S-204 | Proof of delivery | `/[tenant]/active/complete` | RID-007 | ✅ |
| S-205 | Shifts & earnings | `/[tenant]/earnings` | RID-008 | ✅ |
| S-207 | Time out — cash summary & remit | `/[tenant]/time-out` | RID-014 | ✅ |
| S-206 | Profile | `/[tenant]/profile` | RID-009 | ✅ |

## apps/customer (branded per tenant)
> **Live on Supabase since 2.5:** every screen (menu, cart, checkout → `place_order`, ID upload to private Storage,
> tracking — live via Realtime since 2.6 — cancel, rewards, profile). No mock data left in this app.

| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-300 | Splash + Continue with Facebook | `/[tenant]/login` | CUS-001 | ✅ |
| S-301 | Location permission gate (+ denied state) | `/[tenant]/location` | CUS-002 | ✅ |
| S-302 | Home (merchants) | `/[tenant]` | CUS-003 | ✅ |
| S-303 | Merchant products | `/[tenant]/m/[merchantId]` | CUS-004 | ✅ |
| S-304 | Cart | `/[tenant]/cart` | CUS-004 | ✅ |
| S-305 | Checkout (+ coupon code, rewards, points) | `/[tenant]/checkout` | CUS-005, CUS-013, CUS-014 | ✅ |
| S-306 | ID verification: ID type, ID photo, selfie holding ID (first order / re-submit) | `/[tenant]/checkout/verify-id` | CUS-006, CUS-012 | ✅ |
| S-307 | Order status / tracking (incl. waiting-for-approval & rejected states) | `/[tenant]/orders/[id]` | CUS-007, CUS-008 | ✅ |
| S-308 | My orders | `/[tenant]/orders` | CUS-009 | ✅ |
| S-309 | Profile & addresses | `/[tenant]/profile` | CUS-010 | ✅ |
| S-310 | Rewards (points, progress, free delivery / free gift) | `/[tenant]/rewards` | CUS-014 | ✅ |

## apps/platform (Platform Admin — ChowLane-branded, not a tenant PWA)
| # | Screen | Route | Reqs | Status |
|---|---|---|---|---|
| S-500 | Login | `/login` | PLT-001 | ✅ |
| S-501 | Overview (all tenants stats) | `/` | PLT-002 | ✅ |
| S-502 | Tenants list | `/tenants` | PLT-003 | ✅ |
| S-503 | Tenant detail — overview stats + status (suspend / reactivate) | `/tenants/[id]` | PLT-004, PLT-009 | ✅ |
| S-504 | Tenant — riders | `/tenants/[id]/riders` | PLT-005 | ✅ |
| S-505 | Tenant — orders (+ order detail) | `/tenants/[id]/orders` | PLT-006 | ✅ |
| S-506 | Tenant — customers | `/tenants/[id]/customers` | PLT-006 | ✅ |
| S-507 | Tenant — merchants & products | `/tenants/[id]/merchants` | PLT-006 | ✅ |
| S-508 | Tenant — admins & settings | `/tenants/[id]/settings` | PLT-006 | ✅ |
| S-509 | Tenant — billing config + statements | `/tenants/[id]/billing` | PLT-007, PLT-008 | ✅ |
| S-510 | Billing overview (all tenants) | `/billing` | PLT-010 | ✅ |

**Progress: 65 / 65 screens ✅** (+ dev tool S-900) — landing 3 · shared PWA 3 · console 30 · rider 8 · customer 11 · platform 11
