# ChowLane — Phase 1 Walkthrough & Sign-off

> Milestone 1.8. Walk each flow, tick it, note anything to change. When every flow is ✅ (or its changes are
> logged), Phase 1 is signed off and `DATA-MODEL.md` is frozen as v1 for Phase 2 (Supabase).
> Last updated: 2026-11-15

## Before you start

1. Run `pnpm dev` (all 5 apps).
2. In each app open **DEV → Reset demo data** once (the apps keep demo data in your browser).
3. Phone view: open **http://localhost:3000/preview** — every app side by side at phone width (360 / 390 / 430 px).
4. Remember (D-049): each app has its **own copy** of the demo data in Phase 1. An order you place in the customer app
   does not appear in the console or rider app — that comes with the real backend in Phase 2. Use the prototype
   buttons ("Simulate…", "Mark as no response") to play the other side.

| App | URL | Demo login |
|---|---|---|
| Landing & signup | http://localhost:3000 | — |
| Console (Owner / Admin) | http://localhost:3001/fastbite | `marco@fastbite.ph` (Owner), `liza@fastbite.ph` (Admin), `jun@fastbite.ph` (Dispatcher) — any password |
| Rider | http://localhost:3002/fastbite | `0920 123 0001` … `0920 123 0004` — any 6-digit code |
| Customer | http://localhost:3003/fastbite | "Continue with Facebook" → pick a demo person |
| Platform Admin | http://localhost:3004 | `owner@chowlane.app` — any password |

Second tenant: replace `fastbite` with `kainexpress` (per-barangay fees, daily rider pay, manual dispatch).
Suspended tenant: `pasabuyqc`.

## Flows

Mark each: ✅ OK · ✏️ change needed (write it in Notes) · ⏭ skip for now.

| # | Flow | Where | What to try | Result | Notes |
|---|---|---|---|---|---|
| F-01 | Owner signs up | Landing | Type a name + pick a color in the hero → Start → 6 signup steps → done screen | | |
| F-01b | Owner / Admin logs in | Landing `/login`, Console | Find console by link `fastbite` → log in → log out | | |
| F-02 | Owner setup | Console → Home, Settings | Setup checklist · business & branding · delivery area · delivery fee (try the calculator) · rider income | | |
| F-03 | Admins & roles | Console → Settings → Admins / Roles | Invite an admin · change role · edit the Dispatcher role · log in as Jun to see the limited menu | | |
| F-03b | Merchants & menu | Console → Merchants | Add a merchant with a map pin · add menu items · mark sold out | | |
| F-04 | Add a rider | Console → Riders → Add | Vehicle, plate, own pay rate | | |
| F-05 | Rider shift | Rider app | Log in · Time in · Simulate a new offer · accept · store step (mark an item unavailable, receipt photo) · deliver (cash collected, proof) · Time out cash summary | | |
| F-06 | First-time customer orders | Customer app | "Someone new" · allow location · order · ID + selfie · see "waiting for verification" | | |
| F-07 | Verified customer orders | Customer app | As Bea or Andrea · coupon `WELCOME20` · pay with points · place order · track · cancel | | |
| F-08 | Admin daily operations | Console | Verify Miguel's ID → approve his order · approve FB-10232 (auto-assign) · simulate decline → assign · dispatch AUTO/MANUAL · record cash (try a short amount) | | |
| F-09 | Exceptions | All | Reject an order · reject an ID · rider declines · item unavailable · time out blocked with an active order · location blocked | | |
| F-10 | Install as an app | Phone (see below) | Install customer, rider and console apps on Android + iPhone | | needs HTTPS |
| F-11 | Platform monitors tenants | Platform | Overview · tenants · tenant tabs · suspend Pasabuy / reactivate | | |
| F-12 | Platform billing | Platform → Tenant → Billing, Billing | Change a plan · create this month's statement · mark paid / waive | | |
| F-13 | Coupons | Console → Coupons | Create a coupon · try an invalid code · turn one off | | |
| F-14 | Loyalty setup | Console → Settings → Loyalty | Turn rules on/off · free gift linked to a menu item | | |
| F-15 | Customer rewards | Customer → Rewards, checkout | See progress · use free delivery / free gift / points | | |

Also check: Console → Riders → **Pay** (rider pay report) and Settings → **Plan & billing** (owner only).

## F-10 — installing on real phones

Installing a PWA needs **HTTPS** (localhost is fine on the same computer, but a phone can't reach `localhost`). Options:

1. **Deploy a preview** (e.g. Vercel) — recommended; gives HTTPS URLs for all apps.
2. Or a tunnel (`cloudflared tunnel --url http://localhost:3003`) for one app at a time.

Then on **Android / Chrome**: open the tenant link → "Install FastBite Delivery" card → Install.
On **iPhone / Safari**: open the link → Share → Add to Home Screen. Check: icon + name = the business, opens
full-screen, works offline (shows the offline page).

## Sign-off

| | |
|---|---|
| Flows OK | ☐ all ✅ or changes logged |
| Changes requested | (list → added to REQUIREMENTS / BUSINESS-LOGIC and built) |
| Signed off by / date | |
| DATA-MODEL frozen as v1 | ☐ |
