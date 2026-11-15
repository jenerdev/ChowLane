# ChowLane — User Flows

> Last updated: 2026-11-15
> Flow status: ⬜ Draft · 🟨 Clickable in UI · ✅ Signed off by user

## F-01 Owner discovers ChowLane & signs up  ⬜
1. Visitor opens landing page → reads what ChowLane is (how it works, features) → **Start your delivery business**
2. Create Owner account (name, email, password)
3. Business name (e.g. "FastBite Delivery")
4. Storefront slug `fastbite` (availability check)
5. Logo + primary color (live preview of customer app)
6. → Console with **Setup checklist** (F-02)

## F-02 Owner initial setup  ⬜
Checklist on console home; each item links to its screen:
1. Business & branding ✔ (from signup)
2. Service area — set center + radius on map
3. **Delivery fee** *(Owner or Admin)* — choose **PER_KM** (store → customer distance: base, rate/km, included km, min fee), **FIXED** (amount), or **PER_BARANGAY** (enter a fee for each barangay) → preview calculator
4. **Rider income** *(Owner)* — choose **fixed DAILY** rate / **% of delivery fee** / **fixed PER_DELIVERY** amount → preview
5. **Merchants** — add first merchant (name, address pin, photo, contact)
6. **Products** — add products with prices for that merchant
7. **Riders** — add first rider
8. (Optional) **Admins** — create a role & invite an admin (F-03)
9. Share customer app link `…/fastbite`

## F-03 Owner manages admins & permissions  ⬜
1. Console → Admins → Roles → **New role** "Dispatcher" → tick permissions (e.g. `orders.view`, `orders.assign`, `riders.view`)
2. Admins → **Invite admin** (name, email, role)
3. Admin logs in → sees only menus allowed by their role
4. Owner can change role, deactivate or delete the admin anytime

## F-03b Owner or Admin sets up a merchant  ⬜  *(no merchant portal — `merchants.manage`, `products.manage`)*
1. Console → Merchants → **Add merchant**: name, category, address + map pin, photo, contact
2. Merchant → Products → **Add product**: name, category, price, photo, description
3. Toggle merchant **Open / Closed** and product **Available / Sold out** as needed

## F-04 Add a rider  ⬜  *(Owner or Admin with `riders.manage`)*
1. Riders → **Add rider**: name, phone, vehicle, plate, (optional) pay override
2. Rider gets login (mock credentials in Phase 1)

## F-05 Rider shift  ⬜
1. Rider opens `rider/<tenant>` → logs in → (first time) prompted to **install "<Business> Rider"** (F-10) → home shows **Time in** button
2. **Time in** → status "On shift" → Available orders list appears
3. Receives an **order offer** (auto-assigned, or assigned by admin): merchant, drop-off area, distance, earning, **cash needed at store ₱X**, 60s countdown → **Accept** → `ASSIGNED` · or **Reject** (reason) → order goes to next rider (AUTO) or back to admin (MANUAL)
4. Go to merchant → **Arrived & ordered** at the counter (`AT_MERCHANT`) → mark any unavailable items → **pay the store with own cash** → enter amount paid + receipt photo → **Picked up** (`PICKED_UP`)
5. Go to customer (map / navigation link, call customer) → collect cash (amount + change shown) → **Cash collected** → **Delivered** + proof photo → `DELIVERED`
6. Next offer … → **Time out** (blocked if an order is active) → **cash summary**: collected from customers − paid at stores = **amount to remit** → hand cash to admin → remittance `PENDING` until admin records it
7. Earnings & shift history show today's totals per pay mode

## F-06 First-time customer orders  ⬜
1. Customer opens tenant link → branded splash → **Continue with Facebook**
2. **Allow location** prompt → denied = blocked screen with "how to enable"; allowed → continue
3. Home → (optional) **Install "<Business>" app** banner (F-10) → pick merchant → add products → cart
4. Checkout: delivery pin (current location), barangay (picked from list if PER_BARANGAY), notes, fee breakdown (subtotal + delivery fee), payment **Cash on Delivery**, optional "change for ₱___"
5. **First order → ID required**: select ID type (valid PH ID, e.g. school ID, driver's license, passport, UMID) → photo of the ID → **selfie holding the ID** → **Place order**
6. Status screen: "We're verifying your account" (customer `PENDING`, order `PENDING_APPROVAL`)
7. Admin approves customer (F-08) → admin approves order → order `APPROVED`
8. Order assigned to an online rider (auto or manual) → rider accepts → tracking shows rider, status timeline, map → `DELIVERED`

## F-07 Verified customer orders  ⬜
1. Open app → (already logged in, location allowed) → browse → cart → checkout (no ID step) → **Place order**
2. `PENDING_APPROVAL` → admin approves (or auto-approved if Owner enabled it) → rider → tracking → delivered

## F-08 Admin daily operations  ⬜
1. Console home: counters — customers to verify, orders to approve, active orders, riders on shift
2. **Verify customers**: open queue → view Facebook profile + ID photo + selfie with ID side by side → **Approve** / **Reject (reason)**
3. **Approve orders**: open order → check items, location, fee → **Approve** / **Reject (reason)**
4. **Monitor orders**: list filtered by status; open detail → timeline
5. **Dispatch**: switch mode **AUTO / MANUAL** anytime. In MANUAL (or for orders in "Needs rider") → **Assign rider** → choose an online rider (distance, has active order?) → rider gets offer → accepts → `ASSIGNED`
6. **Monitor riders**: map + list of timed-in riders, their current order, shift start time
7. **Cash remittances**: rider timed out → admin counts cash → enters amount received → `RECEIVED` or `SHORT` / `OVER` (note)

## F-09 Exceptions  ⬜
- Location denied → customer cannot order (F-06 step 2)
- Customer rejected → customer sees reason; first order auto-rejected → **Upload new ID** (from status screen, profile, or next checkout) → `PENDING` → admin reviews again
- Order rejected → customer sees reason
- Customer cancels while `PENDING_APPROVAL`
- Admin cancels before pickup (reason)
- Rider rejects an assigned order (reason) or doesn't respond in time → AUTO: offered to next nearest online rider · MANUAL: back to "Needs rider" for admin
- AUTO mode, no online rider accepts → "Needs rider" + admin alert
- Admin reassigns rider before pickup
- Rider tries to time out with active order → blocked with message
- Delivery pin outside service area → checkout blocked
- Item unavailable at store → rider marks it → total recalculated, customer sees update; all items unavailable → order cancelled
- Device offline → offline screen; order / accept / time in disabled until back online

## F-10 Install a tenant app (PWA)  ⬜  *(console, rider, customer)*
1. User opens the tenant link in the phone browser (e.g. `customer/fastbite`)
2. App shows **Install app** sheet (after login / first visit; dismissible)
   - **Android / Chrome:** tap **Install** → system prompt → icon "FastBite" on home screen
   - **iPhone / Safari:** sheet shows steps: Share ↑ → **Add to Home Screen** → Add
3. Open from home screen → full-screen app with tenant name, logo, color; same login session
4. When a new version is deployed → "New version available — Reload" banner

## F-11 Platform Admin monitors tenants  ⬜  *(ChowLane owner, `apps/platform`)*
1. Log in → **Overview**: total tenants (active / suspended), orders today & this month, riders online, billing due
2. **Tenants** list → search / filter → open a tenant
3. Tenant detail tabs: **Overview stats · Riders · Orders · Customers · Merchants & products · Admins & settings · Billing** (all read-only except billing & status)
4. **Suspend** (reason) / **Reactivate** a tenant

## F-12 Platform Admin sets a tenant's billing  ⬜
1. Tenant → **Billing** → choose model: FREE / MONTHLY / PER_ORDER / MONTHLY + PER_ORDER → amounts → optional trial end date → Save
2. Monthly statement is computed (delivered orders × per-order fee + monthly fee)
3. After the tenant pays (outside the app) → **Mark as paid** (note)
4. Tenant Owner sees plan & statements in console → Settings → Billing
