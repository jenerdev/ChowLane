# ChowLane — User Flows

> Last updated: 2026-11-15
> Flow status: ⬜ Draft · 🟨 Clickable in UI · ✅ Signed off by user

## F-01 Owner discovers ChowLane & signs up  🟨 (clickable)
1. Visitor opens the landing page → hero **brand builder**: types their business name, picks a color → phone preview of
   *their* customer app re-brands live → **Start "<name>" for free** (name + color carried into signup)
2. Signup step 1 — **Your account**: full name, email, PH mobile, password (show/hide)
3. Step 2 — **Business name** (link is suggested from it)
4. Step 3 — **Your link** `chowlane.app/<slug>`: live check (format, reserved words, taken) + available suggestions
5. Step 4 — **Your brand**: logo (optional) + color; preview updates
6. Step 5 — **Delivery area**: city + radius (fine-tuned on a map later in Settings → Service area)
7. Step 6 — **Review** with Edit links → **Create my business**
8. Done screen: next steps (restaurant & menu, rider, fees & rider pay, share link) → **Open my console** → console login
   (prototype: opens the FastBite demo console — nothing is saved, D-038)

## F-01b Owner / Admin logs in  🟨 (clickable)
1. Console link `…/<slug>` while signed out → redirected to `/<slug>/login` (tenant-branded)
2. Email + password → **Log in** → console home. Errors: unknown email, invite not accepted, account turned off
3. From the ChowLane site: **Log in** → enter business link → taken to that console's login
4. **Log out** (sidebar / top bar) → back to login

## F-02 Owner initial setup  🟨 (clickable)
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

## F-03 Owner manages admins & permissions  🟨 (clickable)
1. Console → Settings → **Roles & permissions** → **New role** "Dispatcher" → tick permissions (e.g. `orders.view`, `orders.assign`, `riders.view`)
2. Settings → **Admins** → **Invite** (name, email, role) → status *Invited* (resend / remove possible)
3. Admin logs in → sees only menus allowed by their role
4. Owner can change role, deactivate or delete the admin anytime

## F-03b Owner or Admin sets up a merchant  🟨 (clickable)  *(no merchant portal — `merchants.manage`, `products.manage`)*
1. Console → Merchants → **Add merchant**: name, category, address + map pin, photo, contact
2. Merchant → Products → **Add product**: name, category, price, photo, description
3. Toggle merchant **Open / Closed** and product **Available / Sold out** as needed

## F-04 Add a rider  🟨 (clickable)  *(Owner or Admin with `riders.manage`)*
1. Riders → **Add rider**: name, phone, vehicle, plate, (optional) pay override
2. Rider gets login (mock credentials in Phase 1)

## F-05 Rider shift  🟨 (clickable)
1. Rider opens `rider/<tenant>` → logs in → (first time) prompted to **install "<Business> Rider"** (F-10) → home shows **Time in** button
2. **Time in** → status "On shift" → Available orders list appears
3. Receives an **order offer** (auto-assigned, or assigned by admin): merchant, drop-off area, distance, earning, **cash needed at store ₱X**, 60s countdown → **Accept** → `ASSIGNED` · or **Reject** (reason) → order goes to next rider (AUTO) or back to admin (MANUAL)
4. Go to merchant → **Arrived & ordered** at the counter (`AT_MERCHANT`) → mark any unavailable items → **pay the store with own cash** → enter amount paid + receipt photo → **Picked up** (`PICKED_UP`)
5. Go to customer (map / navigation link, call customer) → collect cash (amount + change shown) → **Cash collected** → **Delivered** + proof photo → `DELIVERED`
6. Next offer … → **Time out** (blocked if an order is active) → **cash summary**: collected from customers − paid at stores = **amount to remit** → hand cash to admin → remittance `PENDING` until admin records it
7. Earnings & shift history show today's totals per pay mode

## F-06 First-time customer orders  🟨 (clickable)
1. Customer opens tenant link → branded splash → **Continue with Facebook**
2. **Allow location** prompt → denied = blocked screen with "how to enable"; allowed → continue
3. Home → (optional) **Install "<Business>" app** banner (F-10) → pick merchant → add products → cart
4. Checkout: delivery pin (current location), barangay (picked from list if PER_BARANGAY), notes, fee breakdown (subtotal + delivery fee), optional **coupon code** / **rewards** (free delivery, free gift, points), payment **Cash on Delivery**, optional "change for ₱___"
5. **First order → ID required**: select ID type (valid PH ID, e.g. school ID, driver's license, passport, UMID) → photo of the ID → **selfie holding the ID** → **Place order**
6. Status screen: "We're verifying your account" (customer `PENDING`, order `PENDING_APPROVAL`)
7. Admin approves customer (F-08) → admin approves order → order `APPROVED`
8. Order assigned to an online rider (auto or manual) → rider accepts → tracking shows rider, status timeline, map → `DELIVERED`

## F-07 Verified customer orders  🟨 (clickable)
1. Open app → (already logged in, location allowed) → browse → cart → checkout (no ID step; coupon / rewards optional) → **Place order**
2. `PENDING_APPROVAL` → admin approves (or auto-approved if Owner enabled it) → rider → tracking → delivered

## F-08 Admin daily operations  🟨 (clickable)
1. Console home: counters — customers to verify, orders to approve, active orders, riders on shift
2. **Verify customers**: open queue → view Facebook profile + ID photo + selfie with ID side by side → **Approve** / **Reject (reason)**
3. **Approve orders**: open order → check items, location, fee → **Approve** / **Reject (reason)**
4. **Monitor orders**: list filtered by status; open detail → timeline
5. **Dispatch** (Console → Dispatch): switch mode **AUTO / MANUAL** anytime. AUTO offers an approved order to the nearest free rider at approval; In MANUAL (or for orders in "Needs rider") → **Assign rider** → choose an online rider (distance, has active order?) → rider gets offer → accepts → `ASSIGNED`
6. **Monitor riders**: map + list of timed-in riders, their current order, shift start time
7. **Cash remittances**: rider timed out → admin counts cash → enters amount received → `RECEIVED` or `SHORT` / `OVER` (note)

## F-09 Exceptions  🟨 (clickable)
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

## F-11 Platform Admin monitors tenants  🟨 (clickable)  *(ChowLane owner, `apps/platform`)*
1. Log in → **Overview**: total tenants (active / suspended), orders today & this month, riders online, billing due
2. **Tenants** list → search / filter → open a tenant
3. Tenant detail tabs: **Overview stats · Riders · Orders · Customers · Merchants & products · Admins & settings · Billing** (all read-only except billing & status)
4. **Suspend** (reason) / **Reactivate** a tenant

## F-12 Platform Admin sets a tenant's billing  🟨 (clickable)
1. Tenant → **Billing** → choose model: FREE / MONTHLY / PER_ORDER / MONTHLY + PER_ORDER → amounts → optional trial end date → Save
2. Monthly statement is computed (delivered orders × per-order fee + monthly fee)
3. After the tenant pays (outside the app) → **Mark as paid** (note)
4. Tenant Owner sees plan & statements in console → Settings → Billing

## F-13 Owner / Admin creates a coupon  🟨 (clickable)  *(`coupons.manage`)*
1. Console → **Coupons** → **New coupon**
2. Code (e.g. `WELCOME20`), description, type **% off** (percent, optional max discount) or **Free delivery**
3. **Max usage**, uses per customer, optional minimum order, **valid from → valid until**, Active on
4. Save → list shows status: *Scheduled · Active · Expired · Used up · Inactive* and uses left
5. Later: open coupon → see usage history → **Deactivate** (used coupons can't be deleted)

## F-14 Owner sets up the loyalty program  🟨 (clickable)  *(`settings.loyalty`)*
1. Console → Settings → **Loyalty program** → switch **On**
2. Turn on the rules wanted, each with its settings:
   - **Free delivery** every **N** successful orders
   - **Free gift** every **X** successful orders — gift name (+ optional menu item)
   - **Points** — earn per order or per ₱ spent, point value, min points to redeem, max % of food
3. Save → customers see their progress in **Rewards**; turning a rule off hides it but keeps balances

## F-15 Customer earns & uses rewards  🟨 (clickable)
1. Order **DELIVERED** → points credited, progress counters move (e.g. "3 more orders for free delivery")
2. Reward reached → customer notified (Phase 3) and sees it in **Rewards**
3. Next checkout → **Use free delivery** / **Claim free gift** / **Pay with points** (slider up to the allowed max)
4. Totals update; one promo per order (coupon **or** free-delivery reward); points and a free gift can combine
5. Order rejected / cancelled → used points & rewards are refunded

