# ChowLane — Functional Requirements

> Last updated: 2026-11-15 (v1 — rebuilt from user requirements; v0 draft IDs retired before any implementation)
> ID format: `<AREA>-<NNN>`. From now on never reuse or renumber an ID; mark dropped ones ❌.
> Status: ⬜ Not started · 🟨 In progress · ✅ Done · ⏸️ Blocked · ❌ Dropped
> **UI** = Phase 1 (mock). **BE** = Phase 2+ (Supabase).
> Source: **U** = stated by user · **P** = proposed by Claude (needs OK)

## FND — Foundation

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| FND-001 | Turborepo with apps `landing`, `console`, `rider`, `customer`, `platform` + shared packages | U | ✅ | — |
| FND-002 | **Mobile-first** responsive design across all apps | U | ✅ | — |
| FND-003 | Shared design system in `packages/ui` | P | ✅ | — |
| FND-004 | Tenant theming (business name, logo, primary color) in customer & rider apps | P | ✅ | ✅ |
| FND-005 | Typed mock data + seeded scenarios matching DATA-MODEL.md | P | ✅ | — |
| FND-006 | Shared business logic in `packages/lib` (fee calc, rider pay calc, order status machine, permission check) | P | ✅ | ⬜ |
| FND-007 | Dev-only role/scenario switcher for walkthroughs | P | ✅ | — |
| FND-008 | **Every tenant app (console, rider, customer) is installable as a PWA** | U | ✅ | — |
| FND-009 | Per-tenant manifest: tenant name, icon, theme color, scope `/[tenant]/` | P | ✅ | ✅ |
| FND-010 | Service worker: cached app shell + offline fallback page | P | ✅ | — |
| FND-011 | Install prompt: "Install app" button (Android/desktop) + "Add to Home Screen" guide (iOS) | P | ✅ | — |
| FND-012 | "New version available" update banner | P | ✅ | — |
| FND-013 | PWA icons generated from tenant's uploaded logo | P | — | ⬜ |

## LND — Landing & Owner Signup

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| LND-001 | Landing page that shows what ChowLane is about (hero, how it works, features for owner/admin/rider/customer, CTA) — placeholder ChowLane brand designed by Claude | U | ✅ | — |
| LND-002 | Business owner can sign up (account → business name → storefront link → logo & color → delivery area → review) | U | ✅ | ✅ |
| LND-003 | Storefront slug availability check | P | ✅ | ✅ |
| LND-004 | Owner / Admin login (console `/[tenant]/login`; landing `/login` finds the console by business link) | U | ✅ | ✅ |

## OWN — Owner (console)

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| OWN-001 | Initial setup checklist after signup (branding, service area, pricing, rider pay, merchants, products, riders) | U | ✅ | ⬜ |
| OWN-002 | Business profile & branding settings | U | ✅ | ⬜ |
| OWN-003 | Merchants CRUD (name, address + map pin, photo, contact, open/closed) — **Owner or Admin** (`merchants.manage`); no merchant portal | U | ✅ | ⬜ |
| OWN-004 | Products CRUD per merchant (name, category, price, photo, description, available toggle) — **Owner or Admin** (`products.manage`) | U | ✅ | ⬜ |
| OWN-005 | Delivery fee (Owner **or Admin**): choose **PER_KM** (store → customer distance; base fee, rate/km, included km, min fee), **FIXED** (amount), or **PER_BARANGAY** | U | ✅ | ⬜ |
| OWN-014 | Barangay price list: add / edit / deactivate barangays with a delivery fee each | U | ✅ | ⬜ |
| OWN-006 | Rider income (Owner): **fixed DAILY** rate, **% of delivery fee**, or **fixed amount PER_DELIVERY** | U | ✅ | ⬜ |
| OWN-007 | Admin users: invite, edit, deactivate, delete | U | ✅ | ✅ |
| OWN-008 | Roles & permissions: create roles, toggle permissions per role, assign role to admin | U | ✅ | ✅ |
| OWN-009 | Owner has every permission; owner's access can't be restricted | U | ✅ | ⬜ |
| OWN-010 | Service area (center + radius) — orders outside are blocked | P | ✅ | ⬜ |
| OWN-011 | Order approval setting: auto-approve orders from verified customers (on/off) | P | ✅ | ⬜ |
| OWN-013 | Setting: maximum order subtotal (rider cash limit) | P | ✅ | ⬜ |
| OWN-015 | Setting: accepted ID types (on/off per type) | P | ✅ | ⬜ |
| OWN-016 | Owner sees own ChowLane billing plan & statements (read-only) | P | ✅ | ⬜ |
| OWN-017 | **Coupons**: create / edit / deactivate — code, type **% off** or **free delivery**, **max usage**, **validity period** (+ optional cap, minimum order, uses per customer) | U | ✅ | ⬜ |
| OWN-018 | Coupon list with status (active / scheduled / expired / used up) and usage history | P | ✅ | ⬜ |
| OWN-019 | **Loyalty program settings**: master on/off; rules each on/off + config — free delivery after N orders, **free gift after X orders**, points (earn mode, point value, min redeem, max %) | U | ✅ | ⬜ |
| OWN-012 | Rider pay summary / payroll report per rider per period | P | ✅ | ⬜ |

## ADM — Admin (console; each gated by a permission)

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| ADM-001 | Customer verification queue: view ID + **selfie with ID** side by side (+ Facebook photo, previous submissions), **approve / reject** first-time customers (reject needs reason) | U | ✅ | ⬜ |
| ADM-002 | **Approve / reject orders** (reject needs reason) | U | ✅ | ⬜ |
| ADM-003 | **Monitor orders**: list with status filters, order detail with timeline | U | ✅ | ⬜ |
| ADM-004 | **Manually assign / reassign** an order to an online rider; "Needs rider" list of rejected/unassigned orders | U | ✅ | ⬜ |
| ADM-010 | **Dispatch mode** switch AUTO / MANUAL (Owner or Admin) | U | ✅ | ⬜ |
| ADM-011 | Order assignment history (offers, accepts, rejects + reasons) on order detail | P | ✅ | ⬜ |
| ADM-013 | Customer loyalty: balances, progress, history; manual points adjustment (reason) | P | ✅ | ⬜ |
| ADM-012 | **Cash remittances**: list of shifts with expected cash; record amount received; flag short / over | U | ✅ | ⬜ |
| ADM-005 | **Monitor riders**: timed-in/out status, current order, location on map | U | ✅ | 🟨 |
| ADM-006 | **Riders CRUD** (name, phone, vehicle, plate, pay override, active/inactive) | U | ✅ | ✅ |
| ADM-007 | Cancel an order with reason | P | ✅ | ⬜ |
| ADM-008 | Dashboard overview (pending approvals, active orders, riders on shift) | P | ✅ | ⬜ |
| ADM-009 | Customers list & detail | P | ✅ | ⬜ |

## RID — Rider app

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| RID-001 | Rider login (account created by Owner/Admin) | P | ✅ | ✅ |
| RID-002 | **Time in / time out** | U | ✅ | ⬜ |
| RID-003 | Only online (timed-in) riders receive orders | U | ✅ | ⬜ |
| RID-004 | **Incoming order offer** (auto or admin-assigned): details + countdown → **Accept** / **Reject (reason)** | U | ✅ | ⬜ |
| RID-005 | Delivery steps: Going to merchant → Picked up → Delivered | P | ✅ | ⬜ |
| RID-006 | Map + "open in navigation" link; call customer | P | ✅ | ⬜ |
| RID-007 | Proof of delivery (photo and/or note) | P | ✅ | ⬜ |
| RID-008 | Shift history & earnings (by pay mode) | P | ✅ | ⬜ |
| RID-015 | Order shows discounts (amount to collect = discounted total) and any **free gift** item to buy | P | ✅ | ⬜ |
| RID-014 | **Time out cash summary**: collected, paid at stores, amount to remit; remittance status per shift | U | ✅ | ⬜ |
| RID-009 | Profile | P | ✅ | ⬜ |
| RID-011 | Order card shows **"Cash needed at store ₱X"** before accepting | P | ✅ | ⬜ |
| RID-012 | At store: order at counter → record **amount paid** + **receipt photo** → Picked up | U | ✅ | ⬜ |
| RID-013 | Mark items unavailable at store → total recalculated | P | ✅ | ⬜ |
| RID-010 | Show amount to collect (+ change needed); confirm **"Cash collected"** before Delivered | P | ✅ | ⬜ |

## CUS — Customer app (branded per tenant)

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| CUS-001 | **Sign up / log in with Facebook** | U | ✅ | ✅ |
| CUS-002 | **Location gate**: customer can only order if they allow current-location tracking | U | ✅ | ⬜ |
| CUS-003 | Branded home with merchants | P | ✅ | ⬜ |
| CUS-004 | Merchant page with products; cart (one merchant per cart) | P | ✅ | ⬜ |
| CUS-005 | Checkout: delivery location (current location pin), **barangay** (picked from list in PER_BARANGAY mode), notes, fee breakdown, **payment = Cash on Delivery** with optional "change for" amount | U | ✅ | ⬜ |
| CUS-006 | **First order requires ID**: pick ID type (valid PH IDs incl. school ID) + **photo of ID** + **selfie holding the ID** | U | ✅ | ⬜ |
| CUS-007 | "Waiting for approval" state for verification + order approval; rejection message | P | ✅ | ⬜ |
| CUS-008 | **Track order status** (timeline + rider on map) | U | ✅ | ⬜ |
| CUS-009 | Order history | P | ✅ | ⬜ |
| CUS-011 | Tracking shows updated total if rider marks items unavailable | P | ✅ | ⬜ |
| CUS-013 | Checkout: enter **coupon code** → validation message or discount line | U | ✅ | ⬜ |
| CUS-014 | **Rewards**: see points, progress to free delivery / free gift; use free-delivery reward, claim free gift, pay with points at checkout | U | ✅ | ⬜ |
| CUS-015 | Order details & tracking show discount lines and points earned | P | ✅ | ⬜ |
| CUS-012 | Rejected customer sees reason and can **re-submit a new ID** | U | ✅ | ⬜ |
| CUS-010 | Profile (name/photo from Facebook, phone, saved addresses) | P | ✅ | ⬜ |

## PLT — Platform Admin console (ChowLane owner)

| ID | Requirement | Src | UI | BE |
|---|---|---|---|---|
| PLT-001 | Platform Admin login | P | ✅ | ✅ |
| PLT-002 | Overview: stats across all tenants (tenants active/suspended, orders today/month, delivered, riders online, billing due) | U | ✅ | ⬜ |
| PLT-003 | Tenants list: name, slug, status, billing model, orders this month, riders, created date; search & filter | U | ✅ | ⬜ |
| PLT-004 | Tenant detail: stats (orders, delivered, cancelled, revenue from delivery fees, active customers, riders online) | U | ✅ | ⬜ |
| PLT-005 | Tenant **riders**: list, on-shift status, deliveries, shifts (read-only) | U | ✅ | ⬜ |
| PLT-006 | Tenant **records** (read-only): orders + detail, customers (+ verification), merchants & products, admins & roles, settings | U | ✅ | ⬜ |
| PLT-007 | **Billing config per tenant**: FREE / MONTHLY / PER_ORDER / MONTHLY_PLUS_PER_ORDER, amounts, trial end date | U | ✅ | ⬜ |
| PLT-008 | Monthly billing statements per tenant (computed amount); mark PAID with note | P | ✅ | ⬜ |
| PLT-009 | Suspend / reactivate a tenant (reason required) | P | ✅ | ⬜ |
| PLT-010 | Billing overview: all tenants' amounts due / paid this month | P | ✅ | ⬜ |

**Totals:** 89 requirements (FND 13 · LND 4 · OWN 19 · ADM 13 · RID 15 · CUS 15 · PLT 10) — 88 have a Phase 1 UI part (FND-013 is backend only)

**Backend (Phase 2):** 11 ✅ · 1 🟨 after Milestone 2.3 (logins, signup, tenant branding & manifests, admins/roles, riders CRUD on Supabase).
