# ChowLane — Business Logic

> Last updated: 2026-11-17
> Each rule is tagged **[CONFIRMED]** (stated/approved by user) or **[PROPOSED]** (Claude's default — needs OK).
> When a rule changes: edit it here + add a line to the change log at the bottom.

## BL-1 Tenancy

- BL-1.1 **[CONFIRMED]** An Owner signs up and creates a tenant = their own delivery business, own brand, own business name.
- BL-1.2 **[PROPOSED]** All tenant data is scoped by `tenantId`; nothing is visible across tenants.
- BL-1.3 **[CONFIRMED]** One Owner per tenant. Admins, riders and customers belong to one tenant.
- BL-1.4 **[CONFIRMED]** There is **no merchant portal**. Merchants never log in. The **Owner or an Admin** (with `merchants.manage` / `products.manage`) sets up merchants, products and prices.
- BL-1.6 **[CONFIRMED]** ChowLane is **food delivery only**. Merchants are food businesses; products are menu items.
- BL-1.5 **[PROPOSED]** Console, customer & rider apps show the tenant's branding, not ChowLane (incl. the installed PWA — BL-9).

## BL-2 Users, roles & permissions

- BL-2.1 **[CONFIRMED]** Owner can do everything. Owner's permissions can't be removed.
- BL-2.2 **[CONFIRMED]** Owner manages admin users and decides what each admin can do.
- BL-2.3 **[CONFIRMED]** Owner creates **roles** (e.g. "Dispatcher", "Verifier"), each a set of permissions, and assigns one role per admin. A default role **"Admin"** is pre-created with the user's listed admin abilities.
- BL-2.4 **[PROPOSED]** Permissions are checked in UI (hide/disable) now, and enforced server-side (RLS / functions) in Phase 2.
  **Phase 2.2:** reads and direct edits are enforced by Row Level Security (`supabase/migrations/*_rls.sql`, tested in
  `supabase/tests/database/rls.test.sql`); orders, shifts, ID reviews, coupon uses and loyalty change only through
  server functions (2.3–2.7).
- BL-2.7 **[CONFIRMED]** Settings permissions per group (same split as the console settings screens): delivery area +
  accepted IDs → `settings.business`; delivery fee, max order and auto-approve → `settings.pricing`; rider income and a
  rider's personal pay rule → `settings.riderPay`; dispatch mode and rider response time → `settings.dispatch`; loyalty
  program → `settings.loyalty`.
- BL-2.8 **[CONFIRMED]** A rider sees the customer's name and phone, and the customer sees the rider, only while the
  order is ASSIGNED / AT_MERCHANT / PICKED_UP (as on the current screens). Staff see customers, riders and orders
  only with a related permission (e.g. `orders.view` shows the customer on an order; ID photos need `customers.verify`).
- BL-2.5 **[PROPOSED]** Role rules: role names are unique per tenant; the default **Admin** role can be edited but not deleted; a role with admins assigned can't be deleted; `admins.manage` can't be given to a role (owner-only).
- BL-2.9 **[PROPOSED]** Invites: the invited admin gets an email link, sets a password and becomes ACTIVE; if the email already has a ChowLane login, they just log in and are linked. "Resend invite" sends a fresh link (an unused earlier invite is replaced). Removing an admin keeps their past actions in history (shown without a name link).
- BL-2.6 **[PROPOSED]** Admin rules: email unique within the tenant; new admins start as INVITED (invite can be resent); the Owner can't be edited or removed from the admins screen; turning an admin off blocks login but keeps history.

### Permission keys

| Key | Meaning | Default "Admin" role |
|---|---|---|
| `customers.view` | See customers | ✅ |
| `customers.verify` | Approve / reject first-time customers | ✅ |
| `orders.view` | Monitor orders | ✅ |
| `orders.approve` | Approve / reject orders | ✅ |
| `orders.assign` | Assign / reassign rider | ✅ |
| `orders.cancel` | Cancel orders | ⬜ |
| `riders.view` | Monitor riders | ✅ |
| `riders.manage` | Riders create / edit / delete | ✅ |
| `merchants.manage` | Merchants CRUD | ✅ |
| `products.manage` | Products & prices CRUD | ✅ |
| `settings.pricing` | Delivery fee settings (incl. barangay price list) | ✅ |
| `settings.riderPay` | Rider income settings | Owner only (by default) |
| `settings.dispatch` | Switch dispatch mode AUTO / MANUAL | ✅ |
| `settings.business` | Branding / business settings | ⬜ |
| `admins.manage` | Manage admins & roles | Owner only |
| `reports.view` | Reports & payroll summaries | ⬜ |
| `cash.manage` | Record rider cash remittances | ✅ |
| `coupons.manage` | Create / edit / deactivate coupons | ✅ |
| `loyalty.manage` | View & adjust customer loyalty points | ✅ |
| `settings.loyalty` | Turn the loyalty program & rules on/off, configure them | ⬜ |

## BL-3 Customer sign-up & verification

- BL-3.1 **[CONFIRMED]** Customers sign up with **Facebook**.
- BL-3.2 **[CONFIRMED]** A customer can only order if they allow tracking of their current location.
  - Location permission denied → ordering blocked; screen explains how to enable it.
  - **[CONFIRMED]** The current location is captured when the order is placed and used as the delivery pin. Customer can adjust the pin **within 200 m** of their current location.
- BL-3.3 **[CONFIRMED]** The **first order requires an ID**. **[CONFIRMED]** Admin approves/rejects first-time customers.
- BL-3.3a **[CONFIRMED]** Accepted: **valid Philippine IDs**. **[PROPOSED]** default list:
  PhilSys National ID (PhilID / ePhilID) · Driver's License · Passport · UMID · SSS ID · GSIS ID · PRC ID ·
  Postal ID · Voter's ID · PhilHealth ID · TIN ID · Senior Citizen ID · PWD ID · **School ID** · Other government-issued ID.
  **[PROPOSED]** Owner can turn ID types on/off for their business (all on by default).
- BL-3.3b **[CONFIRMED]** Customer must also upload a **selfie holding the ID**.
- BL-3.3c **[PROPOSED]** Submission = ID type + **photo of ID (front)** + **selfie holding the ID**. Back of ID optional. All photos taken with the camera or uploaded from gallery.
- BL-3.3d **[PROPOSED]** Admin compares the selfie with the ID photo (and the Facebook profile photo) side by side before approving.
- BL-3.4 **[PROPOSED]** Customer `verificationStatus`:
  ```
  UNVERIFIED ──uploads ID on first checkout──▶ PENDING ──admin approves──▶ VERIFIED
                                                  └──admin rejects (reason)──▶ REJECTED
  REJECTED ──re-submits a new ID──▶ PENDING
  ```
- BL-3.5 **[PROPOSED]** The first order is placed together with the ID upload and waits; it can only be approved after the customer is VERIFIED. Rejecting the customer auto-rejects that order.
- BL-3.6 **[CONFIRMED]** A REJECTED customer **can re-submit a new ID** → status back to `PENDING` for admin review.
  - **[PROPOSED]** They see the reject reason + **"Upload new ID"** button (status screen and profile). Re-submitting can be done at the next checkout (order waits, like the first order) or from the profile without an order.
  - **[PROPOSED]** While REJECTED (not yet re-submitted) they cannot place orders.
  - **[PROPOSED]** No limit on re-submissions; every submission is kept in history so admins can compare.
- BL-3.9 **[PROPOSED]** Signed-in customer pages need a session **and** allowed location; otherwise the customer is sent to login or the location gate.
- BL-3.10 **[PROPOSED]** Prototype only: the location gate offers "use a sample location" when the browser blocks location. Removed in Phase 2.
- BL-3.7 **[PROPOSED]** ID images and selfies are visible only to users with `customers.verify` and the Owner.

## BL-4 Order lifecycle **[PROPOSED]**

```
PENDING_APPROVAL ──admin approves──▶ APPROVED ──offered (auto/manual) + rider accepts──▶ ASSIGNED
       │                                                                          │
       ├─admin rejects─▶ REJECTED                                rider at merchant ▼
       └─customer cancels─▶ CANCELLED                                    AT_MERCHANT
                                                                                  │
                         admin cancels (any time before PICKED_UP) ─▶ CANCELLED   ▼
                                                                PICKED_UP ──▶ DELIVERED
```

- BL-4.1 **[CONFIRMED]** Admin approves orders. **Every order** starts at `PENDING_APPROVAL`. Owner can enable *auto-approve for verified customers* (default OFF).
- BL-4.2 **[PROPOSED]** Customer can cancel only while `PENDING_APPROVAL`.
- BL-4.3 **[PROPOSED]** Every status change is added to the order timeline (status, who, when, note).
- BL-4.5 **[PROPOSED]** An order from a verified customer when auto-approve is on starts `APPROVED` (timeline: "Verified customer — auto-approved"); in AUTO dispatch it is offered to the nearest free rider right away.
- BL-4.6 **[PROPOSED]** Order numbers continue the tenant's sequence (e.g. FB-10233); a tenant's first order uses the first two letters of the slug + 1001.
- BL-4.4 **[CONFIRMED]** The merchant learns about the order when the **rider orders at the counter**, and the **rider pays the store** (see BL-11). `AT_MERCHANT` = rider has arrived and ordered; `PICKED_UP` = rider has paid and has the food.

## BL-5 Assigning orders to riders

- BL-5.1 **[CONFIRMED]** Tenant setting **dispatch mode** = `AUTO` or `MANUAL`. Owner or Admin (with `settings.dispatch`) can switch it any time.
- BL-5.2 **[CONFIRMED]** Orders are only assigned to **online riders** (timed in, ACTIVE). There is no open "first come, first served" pool.
- BL-5.3 **[CONFIRMED]** The rider **accepts or rejects** an assigned order.
- BL-5.4 **[CONFIRMED]** On reject: **AUTO mode** → system reassigns to the next online rider; **MANUAL mode** → order goes back to the admin's "Needs rider" list for manual reassignment.
- BL-5.5 **[PROPOSED]** **AUTO assign rule**: when an order becomes `APPROVED`, offer it to the **nearest online rider with no active order** who has not already rejected it (distance = rider's last location → merchant; Phase 1 straight-line).
- BL-5.6 **[CONFIRMED]** The rider has **60 seconds** to respond (Owner can change); no response = rejected (reason "No response").
- BL-5.7 **[PROPOSED]** Reject requires a reason: *Not enough cash · Too far · Vehicle problem · Other (text)*. Every offer/accept/reject is logged on the order (`assignmentAttempts`).
- BL-5.8 **[CONFIRMED]** AUTO mode, no eligible rider left (all rejected / none online) → order shows **"Needs rider"** + admin alert; admin assigns manually, or AUTO retries when a rider times in / finishes a delivery.
- BL-5.9 **[PROPOSED]** Even in AUTO mode, Owner/Admin (`orders.assign`) can manually assign or reassign any order until `PICKED_UP`.
- BL-5.10 **[CONFIRMED]** A rider holds **one active order** at a time, so only riders without an active order get offers.
- BL-5.11 **[PROPOSED]** Order is `ASSIGNED` only after the rider **accepts**; while waiting for a response the order stays `APPROVED` with a pending offer.
- BL-5.15 **[PROPOSED]** Before accepting, the offer shows only the drop-off area (barangay, city) — full address and customer phone appear after accepting.
- BL-5.12 **[PROPOSED]** A rider who holds an open offer can't get a second one (counts as busy for auto and manual assign). A new offer on the same order withdraws the previous one.
- BL-5.13 **[PROPOSED]** Reassigning an `ASSIGNED` / `AT_MERCHANT` order puts it back to `APPROVED` until the new rider accepts; the previous rider is freed.
- BL-5.14 **[PROPOSED]** Offer expiry (BL-5.6) runs on the server from Phase 2/3. In the Phase 1 prototype an expired offer is labelled and an admin marks it "no response", which triggers the next auto offer.

## BL-6 Rider shifts (time in / time out)

- BL-6.1 **[CONFIRMED]** Riders time in and time out.
- BL-6.2 **[PROPOSED]** Only timed-in, ACTIVE riders can see, accept or be assigned orders.
- BL-6.3 **[PROPOSED]** A rider cannot time out while holding an active order.
- BL-6.5 **[PROPOSED]** A rider can't log out while on shift. Time in records the location if the phone allows it; without it the shift still starts with a reminder to turn location on.
- BL-6.6 **[CONFIRMED]** A rider's mobile number is unique within the business (it is their login — Q-30).
- BL-6.7 **[PROPOSED]** Riders log in with mobile number + a password the admin sets (`riders.manage`) in the rider form; same password rule as owners (BL-15.2); a forgotten password is reset by the admin. Changing the number changes the login. Inactive riders can't log in.
- BL-6.4 **[PROPOSED]** Each time-in/out creates a **Shift** record (start, end, location at both). Shifts feed DAILY pay and admin monitoring.

## BL-7 Pricing

- BL-7.1 **[CONFIRMED]** Owner or Admin sets up merchants, products and product prices.
- BL-7.2 **[CONFIRMED]** Owner **or Admin** (`settings.pricing`) chooses the delivery fee mode:
  - **PER_KM** — based on location: distance from the **store location → customer address**.
    `deliveryFee = max(minFee, baseFee + ratePerKm × max(0, distanceKm − includedKm))` **[PROPOSED formula]**
  - **FIXED** — `deliveryFee = fixedAmount` for every order.
  - **PER_BARANGAY** — manual price list: Owner/Admin enters a fee per barangay.
    - **[CONFIRMED]** Fee is looked up by the **customer's barangay** only.
    - **[CONFIRMED]** Customer picks their barangay at checkout from the tenant's list; location pin is still captured.
    - **[PROPOSED]** A barangay not in the list (or inactive) = **not deliverable** — in this mode the barangay list *is* the service area.
- BL-7.2a **[PROPOSED]** Only one mode is active at a time. Changing it affects new orders only (fee is frozen on the order — BL-7.5).
- BL-7.3 **[PROPOSED]** `distanceKm` = merchant → customer. Phase 1: straight-line estimate; Phase 3: road distance from map provider. Round up to 0.1 km.
- BL-7.4 **[PROPOSED]** Order total:
  ```
  subtotal    = Σ product price × qty
  total       = subtotal + deliveryFee
  ```
- BL-7.5 **[PROPOSED]** Fee is calculated at checkout and frozen on the order.
- BL-7.11 **[CONFIRMED]** A barangay (barangay + city/municipality + province) can appear only once in a business's price list.
- BL-7.12 **[CONFIRMED]** A new business has no delivery fee or rider pay yet (D-061). Until the delivery fee is set, checkout is closed ("This business isn't taking orders yet"); rider pay shows "Not set yet" and computes to ₱0.
- BL-7.9 **[PROPOSED]** Checkout delivery fee uses the distance store → delivery pin; the service area is checked against the pin (in PER_BARANGAY mode only the chosen active barangay counts).
- BL-7.10 **[PROPOSED]** Checkout lists every blocking problem: empty cart, store closed, item sold out, outside area / barangay not listed, over the maximum order, "change for" below the total.
- BL-7.6 **[PROPOSED]** Delivery blocked if the customer is outside the tenant's service area (PER_KM / FIXED) or their barangay isn't listed (PER_BARANGAY).
- BL-7.8 **[CONFIRMED]** Country **Philippines**, currency **Philippine Peso (PHP)**.
  - Display: `₱1,234.50` (`Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`).
  - Stored as integer **centavos** (₱1.00 = 100).
  - **[PROPOSED]** Prices shown with 2 decimals; delivery fee rounded **up** to the nearest whole peso.
  - Timezone `Asia/Manila` for all day boundaries (DAILY rider pay, reports, store hours).
  - Phone numbers: PH mobile, stored as `+639XXXXXXXXX`, users may type `09XXXXXXXXX`.
- BL-7.7 **[CONFIRMED]** Payment is **Cash on Delivery (COD) only** for MVP (D-019).
  - Customer pays the rider the order `total` in cash on delivery.
  - **[PROPOSED]** Checkout has optional **"Change for"** amount (e.g. ₱1,000) so the rider brings change; must be ≥ total.
  - **[PROPOSED]** Rider must tap **"Cash collected ₱X"** before marking the order `DELIVERED`.
  - **[PROPOSED]** Order `paymentStatus`: `UNPAID` → `COLLECTED` (on delivery).
  - Rider hands the cash over at the end of every shift (BL-12). Paying the merchant = rider pays at store (BL-11).
  - Online payments (GCash / Maya / card via PayMongo or Xendit) = post-MVP.

## BL-8 Rider pay

- BL-8.1 **[CONFIRMED]** The **Owner** sets the rider income configuration — one of:
  | Mode | Meaning **[CONFIRMED]** | Calculation |
  |---|---|---|
  | **DAILY** | Fixed daily rate | `dailyRate` × number of days with **at least one shift** (no minimum hours) |
  | **COMMISSION** | Percentage of the delivery fee | `percent × deliveryFee` per delivered order |
  | **PER_DELIVERY** | Fixed amount per delivery | `ratePerDelivery` × number of delivered orders |
- BL-8.2 **[PROPOSED]** Pay mode is set tenant-wide; Owner can override mode/rate per rider.
- BL-8.3 **[PROPOSED]** Only `DELIVERED` orders count toward COMMISSION and PER_DELIVERY.
- BL-8.4 **[PROPOSED]** Phase 1 shows computed earnings only; no actual payouts.

## BL-11 Rider buys at the store ("pabili")

- BL-11.1 **[CONFIRMED]** The rider goes to the merchant, orders, and **pays the store with their own cash**.
- BL-11.2 **[CONFIRMED]** The customer pays the rider the order `total` (subtotal + delivery fee) in cash on delivery.
- BL-11.3 **[CONFIRMED]** Merchants are not partners: **no merchant commission and no merchant payouts**. The tenant earns from the delivery fee (and any markup the Owner puts on product prices — **[PROPOSED]** optional `storePrice` field to track it).
- BL-11.4 **[PROPOSED]** Before accepting, the rider sees **"Cash needed at store: ₱X"** (= order subtotal at store prices) so they know if they have enough cash.
- BL-11.5 **[CONFIRMED]** Owner sets a **maximum order subtotal** (default ₱2,000) to limit how much cash a rider must front. Checkout is blocked above it.
- BL-11.6 **[PROPOSED]** At pickup the rider records **amount paid at store** + **receipt photo** before marking `PICKED_UP`.
- BL-11.7 **[PROPOSED]** If an item is unavailable at the store, the rider marks it unavailable; the order subtotal/total is recalculated and the customer sees the updated total in tracking. If **all** items are unavailable → order `CANCELLED` (reason "Items unavailable").
- BL-11.10 **[PROPOSED]** The amount paid at the store defaults to the expected store cost (it follows the items marked unavailable until the rider edits it); a receipt photo is required to mark Picked up.
- BL-11.11 **[PROPOSED]** When items are marked unavailable, a percent coupon is recalculated on the new subtotal and points are capped to the remaining food; the delivery fee and a free-delivery reward stay.
- BL-11.12 **[PROPOSED]** "Delivered" needs the cash-collected confirmation plus a proof photo or a note.
- BL-11.8 **[CONFIRMED]** Price differences (store price ≠ app price): the **business absorbs** the difference. The customer always pays the app total; the rider records the actual amount paid and is **reimbursed** through the cash remittance (BL-12).
- BL-11.9 Rider's cash flow per order: `+ total collected from customer − amount paid at store`. Handed to the business at the end of each shift (BL-12).

## BL-12 Cash remittance (end of shift)

- BL-12.1 **[CONFIRMED]** The rider hands the cash over **at the end of every shift**, and an **Admin records** what was received.
- BL-12.2 **[PROPOSED]** Per shift: `expectedRemit = Σ cash collected from customers − Σ amount paid at stores` (DELIVERED orders in that shift). Because the actual store amount is used, the rider is automatically reimbursed for price differences (BL-11.8).
- BL-12.3 **[PROPOSED]** At **Time out** the rider sees a cash summary (collected, paid at stores, amount to remit) and confirms → shift remittance status `PENDING`.
- BL-12.4 **[PROPOSED]** Admin (`cash.manage`) enters the **amount received** → status `RECEIVED` (matches) or `SHORT` / `OVER` (variance shown, note required).
- BL-12.5 **[PROPOSED]** Rider income is **not** deducted from the remittance; it is paid separately (BL-8).
- BL-12.7 **[PROPOSED]** Shift cash counts only DELIVERED orders whose cash was collected between time in and time out.
- BL-12.6 **[PROPOSED]** A rider with an unrecorded (`PENDING`) remittance can still time in again; the console highlights pending remittances.

## BL-15 Owner signup & login

- BL-15.1 **[PROPOSED]** Business link (slug): 3–30 chars, lowercase letters/numbers, single dashes, not at start/end; unique; reserved words blocked (admin, api, app, console, rider, customer, platform, login, signup, chowlane, …). Suggested from the business name; alternatives offered when taken.
- BL-15.2 **[PROPOSED]** Owner password: at least 8 characters with letters and a number. Mobile must be a valid PH mobile number.
- BL-15.3 **[PROPOSED]** Signup asks for city + delivery radius (1–15 km, default 5 km) as the starting service area; delivery fees and rider pay are set later in the console setup checklist.
- BL-15.4 **[PROPOSED]** New tenant starts on the FREE billing plan (BL-10.7).
- BL-15.6 **[PROPOSED]** A new business's home-screen label (short name, ≤12 characters) is its name if it fits, else its first word if that fits, else the name cut to 12; its app background is a light tint of the brand color. Both can be changed later.
- BL-15.7 **[PROPOSED]** Signup creates the owner's login and the business together; if creating the business fails, the login is removed again. A taken business link is caught while typing and again on submit.
- BL-15.5 **[PROPOSED]** Console login: only ACTIVE staff can log in; INVITED → "accept the invite first"; INACTIVE → "account turned off". Password reset is done by the Owner (self-service reset in Phase 2).

## BL-13 Coupons

- BL-13.1 **[CONFIRMED]** Each tenant manages its own coupons (Owner, or Admin with `coupons.manage`).
- BL-13.2 **[CONFIRMED]** Coupon type is either:
  - **PERCENT_OFF** — a percentage off. **[PROPOSED]** applies to the **food subtotal only** (not the delivery fee), optional **max discount** cap, rounded **down** to the whole peso.
  - **FREE_DELIVERY** — the delivery fee is waived.
- BL-13.3 **[CONFIRMED]** **Max usage** (total times the coupon can be used) and a **validity period** (valid from → valid until, Asia/Manila). A coupon is usable only when: active · inside the validity period · uses left · customer limit not reached · minimum order met.
- BL-13.4 **[PROPOSED]** Extra optional settings: **minimum order subtotal**, **uses per customer** (default 1), **active on/off** switch, description shown to customers.
- BL-13.5 **[PROPOSED]** Code: 3–20 letters/digits, unique per tenant, case-insensitive (stored uppercase). Customer types the code at checkout and sees the discount line before placing the order.
- BL-13.6 **[CONFIRMED]** The order keeps the original `deliveryFee`; discounts are separate lines. **Rider pay is based on the original delivery fee** — promos never reduce rider income.
- BL-13.7 **[PROPOSED]** A use is counted when the order is placed and **given back** if the order is REJECTED or CANCELLED.
- BL-13.8 **[PROPOSED]** The customer pays the discounted total in cash; the rider still pays the store's full price → the business absorbs the discount (remittance BL-12 handles it automatically).
- BL-13.9 **[PROPOSED]** If the rider marks items unavailable, a percent coupon is recalculated on the new subtotal; the coupon stays applied even if the subtotal drops below its minimum.
- BL-13.10 **[PROPOSED]** Coupons can't be deleted once used — only turned off. Code and discount can't change after first use; limits, dates and description can.
- BL-13.12 **[PROPOSED]** At checkout, applying a coupon switches off the free-delivery reward (one promo per order); remove the coupon to use the reward.
- BL-13.11 **[PROPOSED]** Coupon status shown to staff: *Active · Scheduled* (not started) · *Expired* · *Used up* · *Turned off*.

## BL-14 Loyalty program

- BL-14.1 **[CONFIRMED]** The tenant can turn the loyalty program **on/off**, and **chooses which rules to enable** and how they are configured.
- BL-14.2 **[CONFIRMED]** Available rules (each with its own on/off switch):
  | Rule | Setting | Reward |
  |---|---|---|
  | **Free delivery** | every **N** successful orders (e.g. 10) | 1 free-delivery reward |
  | **Free gift** | every **X** successful orders + gift name (e.g. "Free Halo-Halo") | 1 free gift |
  | **Points** | earn per order **or** per ₱ spent; point value; min points to redeem; max % of food payable with points | points to spend on food |
- BL-14.3 **[CONFIRMED]** Only **successful (DELIVERED)** orders count. **[PROPOSED]** Progress counters reset after each reward; unused rewards stay on the account.
  - BL-14.3a **[PROPOSED]** Free-delivery reward: the customer chooses to use it at checkout → the delivery fee is waived on that order.
  - BL-14.3b **[CONFIRMED]** Free gift: claimed at checkout → added to the order as a ₱0 item; the rider buys it at the store and the business absorbs the cost. The gift may be linked to a menu item; then it can only be claimed on orders from **that item's merchant**.
- BL-14.4 **[CONFIRMED]** Points are earned on each successful order. **[PROPOSED]** earn modes: **PER_ORDER** (fixed points per order) or **PER_PESO** (1 point per ₱X of food actually paid, after discounts). Points are credited when the order is DELIVERED.
- BL-14.5 **[CONFIRMED]** Points can be used to pay for food. **[PROPOSED]** 1 point = tenant-set value (default ₱1); minimum points per redemption (default 50); max % of the food subtotal payable with points (default 50%); points never pay the delivery fee.
- BL-14.6 **[CONFIRMED]** **One promo per order**: a coupon **or** a free-delivery reward. Points and a free gift can be combined with either.
- BL-14.7 **[PROPOSED]** Every change is a **loyalty transaction** (earned / redeemed / used / refunded / adjusted). If an order using points or rewards is REJECTED or CANCELLED, they are **refunded**.
- BL-14.8 **[PROPOSED]** Owner/Admin with `loyalty.manage` can manually adjust a customer's points (reason required). Program settings need `settings.loyalty` (Owner by default).
- BL-14.9 **[CONFIRMED]** Points don't expire in the MVP.
- BL-14.10 **[PROPOSED]** The points slider runs from the minimum to the allowed maximum and starts at the maximum when switched on.
- BL-14.11 **[PROPOSED]** A free gift linked to another restaurant's item is shown but disabled, with an explanation.
- BL-14.12 **[PROPOSED]** Loyalty balances update when the rider marks the order DELIVERED; PER_PESO points use food actually paid (subtotal − percent coupon − points). Turning the program or a rule off hides it from customers but keeps balances; turning it back on restores them.

## BL-9 Installable apps (PWA)

- BL-9.1 **[CONFIRMED]** Every tenant app (console, rider, customer) can be installed as a PWA.
- BL-9.2 **[PROPOSED]** The installed app uses the **tenant's** business name, logo and color — never "ChowLane".
- BL-9.3 **[CONFIRMED]** Each tenant + app is a separate installable app (scope `/[tenant]/`), so one phone can have e.g. "FastBite" (customer) and "FastBite Rider" installed.
- BL-9.4 **[PROPOSED]** Installing is optional — everything also works in the browser. Install prompt is shown after login / first visit, dismissible, and not shown again for 7 days after dismissal.
- BL-9.5 **[CONFIRMED]** Rider app asks riders to install it and keep it open during their shift (location is only shared while the app is open — PWA limit).
- BL-9.6 **[CONFIRMED]** Offline: app opens and shows an offline screen; actions that need the server (place order, accept order, time in/out) are disabled with a "You're offline" message — no offline queueing.
- BL-9.7 **[PROPOSED]** Installed app naming: customer = `<Business name>`, rider = `<Business name> Rider`, console = `<Business name> Admin`.

## BL-10 Platform (ChowLane ↔ tenants)

- BL-10.1 **[CONFIRMED]** There is a **Platform Admin** (the ChowLane owner) with its own console (`apps/platform`).
- BL-10.2 **[CONFIRMED]** Platform Admin can **monitor all tenants**: stats, riders, and all tenant records (orders, customers, merchants & products, admins, settings).
- BL-10.3 **[CONFIRMED]** Tenant records are **read-only** for the Platform Admin (D-028). Platform Admin can only change: tenant **billing config** and tenant **status** (suspend / reactivate).
- BL-10.4 **[CONFIRMED]** How ChowLane charges a tenant is **configured per tenant**. **[PROPOSED]** billing models:
  | Model | Amount due per period (calendar month, Asia/Manila) |
  |---|---|
  | `FREE` | ₱0 |
  | `MONTHLY` | `monthlyFee` |
  | `PER_ORDER` | `perOrderFee × delivered orders in the month` |
  | `MONTHLY_PLUS_PER_ORDER` | `monthlyFee + perOrderFee × delivered orders` |
  Optional **free trial** end date: ₱0 until then.
- BL-10.5 **[PROPOSED]** A **billing statement** is generated per tenant per month (Phase 1: computed from mock data). Payment is collected outside the app; Platform Admin marks a statement **PAID** manually.
- BL-10.6 **[PROPOSED]** Tenant Owner can see their own billing plan and statements (console → Settings → Billing), read-only.
- BL-10.7 **[PROPOSED]** New tenants start as `FREE` (or trial) until the Platform Admin sets their billing.
- BL-10.8 **[PROPOSED]** **Suspended** tenant → customer & rider apps show "temporarily unavailable"; console is read-only; Platform Admin can reactivate.
- BL-10.9 **[PROPOSED]** Only `DELIVERED` orders count for `PER_ORDER` billing.
- BL-10.10 **[PROPOSED]** A statement covers one Asia/Manila calendar month; one statement per tenant per month. It may be created during the month and counts delivered orders up to that moment.
- BL-10.11 **[PROPOSED]** A ₱0 statement (free plan or trial month) is created as WAIVED with note "Free plan" / "Free trial", so it never shows as unpaid.
- BL-10.12 **[PROPOSED]** An UNPAID statement can be marked PAID (optional payment note) or WAIVED (reason required); PAID / WAIVED are final.
- BL-10.13 **[PROPOSED]** A billing change applies from now (sets effectiveFrom / updatedBy) and never changes existing statements; fields the plan doesn't use are cleared; FREE has no trial.
- BL-10.14 **[PROPOSED]** Platform stats: "active customers" = customers with ≥1 order this Manila month; "delivery fees charged" = delivery fees of delivered orders.

---

## Change log
| Date | Rule | Change |
|---|---|---|
| 2026-11-17 | BL-2.9, BL-6.7, BL-7.12, BL-15.6, BL-15.7 (new) | Milestone 2.3 auth: invites, rider password login, new business starts without fee / pay (D-061), short name + tint, signup rollback |
| 2026-11-17 | BL-2.4 (note), BL-2.7, BL-2.8, BL-6.6, BL-7.11 (new) | Phase 2.2 database: server-side permissions via RLS; settings permission groups and rider ↔ customer visibility written down as enforced; rider phone and barangay uniqueness; new rules confirmed by the user |
| 2026-11-15 | All | Initial draft (v0) |
| 2026-11-15 | All | v1 rewrite from user requirements: Owner/Admin/Rider/Customer; merchants no longer log in; permissions; Facebook signup; location gate; first-order ID verification; order approval; time in/out; FIXED/PER_KM pricing; COMMISSION/DAILY/PER_DELIVERY rider pay |
| 2026-11-15 | BL-3.9, 3.10, 4.5, 4.6, 5.15, 6.5, 7.9, 7.10, 10.10–10.14, 11.10–11.12, 12.7, 13.12, 14.10–14.12 (new) | Rules from building the customer, rider and platform apps (Milestones 1.5–1.7) |
| 2026-11-15 | BL-5.12…5.14 (new) | Open offers count as busy; reassignment rules; prototype handling of offer expiry |
| 2026-11-15 | BL-2.5, BL-2.6, BL-13.10, BL-13.11 | Role/admin rules and coupon editing/status rules from Milestone 1.3 |
| 2026-11-15 | BL-15 (new) | Owner signup (link rules, password, starting service area) and console login rules |
| 2026-11-15 | BL-13.6, BL-14.3b, BL-14.6, BL-14.9 | Confirmed (Q-26…Q-29, D-037) |
| 2026-11-15 | BL-13 (new), BL-14 (new), BL-2 | **Coupons** (percent off / free delivery, max uses, validity) and **loyalty program** (on/off; free delivery after N orders, free gift after X orders, points earn/redeem). New permissions `coupons.manage`, `loyalty.manage`, `settings.loyalty` |
| 2026-11-15 | BL-1.3, BL-3.2, BL-4.1, BL-5, BL-7.2, BL-8.1, BL-10.3, BL-11.5, BL-11.8, BL-12 (new) | All remaining questions answered with Claude's suggestions; new cash remittance rules; new permission `cash.manage` |
| 2026-11-15 | BL-10 (rewritten) | Platform Admin console in scope; monitor all tenant records; billing configurable per tenant (Q-10) |
| 2026-11-15 | BL-3.3a–d | Valid PH IDs (incl. school ID) + selfie holding the ID required (Q-09) |
| 2026-11-15 | BL-3.4, BL-3.6 | Rejected customers can re-submit a new ID → PENDING (Q-08) |
| 2026-11-15 | BL-7.2, BL-7.6, BL-8.1, BL-2 | Rider income = DAILY / % of delivery fee / PER_DELIVERY set by Owner (Q-06). Delivery fee = PER_KM (store → customer) / FIXED / **PER_BARANGAY** set by Owner or Admin; default Admin role gets `settings.pricing` |
| 2026-11-15 | BL-5 (rewritten), BL-2 | Dispatch mode AUTO/MANUAL, rider can reject, auto/manual reassign to online riders (Q-05); open pool removed; new permission `settings.dispatch` |
| 2026-11-15 | BL-4.4, BL-11 (new) | Rider buys & pays at the store (Q-04); no merchant commission; cash-needed, max order amount, receipt, unavailable items proposed |
| 2026-11-15 | BL-7.7 | COD only for MVP (Q-03); proposed "change for" + cash-collected step |
| 2026-11-15 | BL-7.8 (new) | Philippines / PHP / Asia/Manila / +63 phone format (Q-02) |
| 2026-11-15 | BL-1.6 (new) | Food delivery only (Q-01) |
| 2026-11-15 | BL-2.3, BL-9.3, BL-9.5, BL-9.6, BL-10.1 | Confirmed via decision log D-010, D-014, D-016, D-011 |
| 2026-11-15 | BL-1.4, BL-2, BL-7.1 | Confirmed: no merchant portal; Owner **or Admin** sets up merchants/products. Default Admin role now includes `merchants.manage` + `products.manage` |
| 2026-11-15 | BL-9 (new), BL-10 | Every tenant app installable as PWA (confirmed) + PWA rules; Platform renumbered BL-9 → BL-10 |
