# ChowLane — Decisions & Open Questions

> Last updated: 2026-11-17

## Decision log

| ID | Date | Decision | Status |
|---|---|---|---|
| D-000 | 2026-11-15 | Build in phases; **Phase 1 = UI only** (no DB, no API) to finalize flows first | ✅ Confirmed |
| D-001 | 2026-11-15 | **Next.js in a Turborepo** monorepo | ✅ Confirmed |
| D-002 | 2026-11-15 | **Supabase** backend (Postgres, Auth, Storage, Realtime) from Phase 2 | ✅ Confirmed |
| D-003 | 2026-11-15 | **Mobile-first web** design for all apps | ✅ Confirmed |
| D-004 | 2026-11-15 | Users are **Owner, Admin, Rider, Customer** | ✅ Confirmed |
| D-005 | 2026-11-15 | Docs in `/docs` are source of truth; updated every session (CLAUDE.md) | ✅ Confirmed |
| D-006 | 2026-11-15 | **No merchant portal.** Merchants are records set up by the **Owner or Admin**; merchants never log in | ✅ Confirmed |
| D-007 | 2026-11-15 | 4 apps: `landing`, `console` (Owner+Admin), `rider`, `customer` + shared packages | ✅ Confirmed |
| D-008 | 2026-11-15 | Phase 1 uses seeded mock scenarios per app; live cross-app sync comes with Supabase | ✅ Confirmed |
| D-009 | 2026-11-15 | Phase 1 maps: Leaflet + OpenStreetMap; real map provider chosen in Phase 3 | ✅ Confirmed |
| D-010 | 2026-11-15 | Admin access controlled by **Owner-defined roles** made of permission keys | ✅ Confirmed |
| D-011 | 2026-11-15 | ~~ChowLane Platform Admin (all tenants) deferred to Phase 5~~ | ❌ Superseded by D-027 |
| D-012 | 2026-11-15 | v0 merchant portal & v0 requirement IDs retired (pre-implementation) | ✅ Done |
| D-013 | 2026-11-15 | **Every tenant app (console, rider, customer) is installable as a PWA**; built in Phase 1 (answers Q-12: PWA, not native) | ✅ Confirmed |
| D-014 | 2026-11-15 | All tenant apps routed under `/[tenant]/…` with a per-tenant manifest, so each tenant's app installs with its own name/icon/color | ✅ Confirmed |
| D-015 | 2026-11-15 | Service worker via **Serwist** (`@serwist/next`) | ✅ Confirmed |
| D-016 | 2026-11-15 | Accept PWA limits: rider location only while app open; no offline ordering | ✅ Confirmed |
| D-017 | 2026-11-15 | **Food delivery only** — merchants are restaurants / food stalls / cafés; no groceries, parcels or errands (answers Q-01) | ✅ Confirmed |
| D-018 | 2026-11-15 | **Launch country: Philippines. Currency: Philippine Peso (₱, PHP)**. Timezone `Asia/Manila`, PH mobile numbers (+63), money stored in centavos (answers Q-02) | ✅ Confirmed |
| D-019 | 2026-11-15 | **Payment = Cash on Delivery (COD) only for MVP.** No payment gateway. Online payments (GCash / Maya / card) are post-MVP (answers Q-03) | ✅ Confirmed |
| D-020 | 2026-11-15 | **Rider buys & pays at the store ("pabili" style).** Rider uses own cash to pay the merchant, then collects the full order total from the customer (COD). Merchants are not partners — no merchant commission, no merchant payouts (answers Q-04) | ✅ Confirmed |
| D-021 | 2026-11-15 | **Dispatch mode setting: AUTO assign or MANUAL assign**, switchable by Owner or Admin. Orders are **assigned** to online riders (no open "first come" pool). **Rider can reject** an assigned order; it is then **auto-reassigned** (AUTO mode) or **manually reassigned** (MANUAL mode) to another online rider (answers Q-05) | ✅ Confirmed |
| D-022 | 2026-11-15 | **Rider income** is set by the Owner: (1) **fixed daily**, (2) **percentage of the delivery fee**, or (3) **fixed amount per delivery** (answers Q-06) | ✅ Confirmed |
| D-023 | 2026-11-15 | **Delivery fee** can be set by Owner **or Admin**: (1) **per kilometer** — store location → customer address, (2) **fixed** value, or (3) **manual price per barangay** | ✅ Confirmed |
| D-024 | 2026-11-15 | **Rejected customers can re-submit a new ID**; they go back to PENDING for admin review (answers Q-08) | ✅ Confirmed |
| D-025 | 2026-11-15 | Customer verification accepts **valid Philippine IDs** (incl. school ID, driver's license, passport, UMID…) and requires a **selfie holding the ID** (answers Q-09) | ✅ Confirmed |
| D-026 | 2026-11-15 | **ChowLane billing is configurable per tenant** (e.g. free, monthly plan, per order) — set by the Platform Admin (answers Q-10) | ✅ Confirmed |
| D-027 | 2026-11-15 | **Platform Admin console is in scope now (Phase 1 UI)**: ChowLane owner monitors all tenants — stats, riders, all tenant records — and sets each tenant's billing. New app `apps/platform` (replaces D-011) | ✅ Confirmed |
| D-028 | 2026-11-15 | Platform Admin sees tenant records **read-only** (except billing config + suspend/reactivate) | ✅ Confirmed |
| D-029 | 2026-11-15 | All remaining open questions (Q-07, Q-11, Q-13…Q-18, Q-20…Q-25) resolved by accepting Claude's suggestions | ✅ Confirmed |
| D-031 | 2026-11-15 | Use **TypeScript 5.9** (not 7.0) — TS 7 is the new native compiler and Next.js build-time type checking relies on the TS 5 JS API; revisit when Next.js officially supports TS 7 | ✅ Done |
| D-032 | 2026-11-15 | **Light theme only** in Phase 1 (dark mode later); system font stack (no web-font download) | ✅ Done |
| D-033 | 2026-11-15 | **Coupons per tenant**: % off or free delivery, max usage, validity period | ✅ Confirmed |
| D-034 | 2026-11-15 | **Loyalty program per tenant**, on/off; tenant picks rules: free delivery after N orders, free gift after X orders, points earned per successful order and redeemable for food | ✅ Confirmed |
| D-035 | 2026-11-15 | PWA via **`@serwist/turbopack`** (Next 16 builds with Turbopack); service worker disabled in `next dev` — test PWA with `build` + `start` | ✅ Done |
| D-036 | 2026-11-15 | Phase 1 mock backend = **Zustand store per app** seeded from `@chowlane/mocks`, persisted in localStorage; "acting as" persona chosen in the DEV switcher | ✅ Done |
| D-037 | 2026-11-15 | Q-26…Q-29 resolved with Claude's recommendations: rider pay unaffected by promos; one promo per order (points & free gift combine); free gift optionally tied to a menu item/merchant; points don't expire (MVP) | ✅ Confirmed |
| D-038 | 2026-11-15 | Phase 1 signup creates nothing (no backend): the done screen opens the **FastBite demo console**; signup draft kept in sessionStorage (never the password or logo) | ✅ Done |
| ~~D-039~~ | 2026-11-15 | ChowLane's own pages (landing, signup) use **Archivo** (variable width: expanded for display, normal for body) on the teal/amber placeholder brand; tenant apps keep the system font | ❌ Superseded by D-041 |
| D-040 | 2026-11-15 | Phase 1 console login = mock: email of an ACTIVE staff member of that tenant, any password; session stored per tenant in localStorage (same store as the DEV "acting as"). Console pages redirect to login when signed out | ✅ Done |
| D-041 | 2026-11-15 | **UI style for all apps: simple, minimalist, modern** (docs/DESIGN.md): neutral zinc palette, brand color only for primary action/active/focus, flat (borders, no shadows), **Geist** 400–600 everywhere. Supersedes the font part of D-032 and D-039 (Archivo) | ✅ Confirmed |
| D-042 | 2026-11-15 | Console navigation: items hidden when the role lacks the permission; on phones, >5 items → 4 tabs + **More** sheet. All settings live under `/[tenant]/settings/*` (incl. admins & roles) | ✅ Done |
| D-043 | 2026-11-15 | Phase 1 logo upload is resized to a 256 px PNG data URL so it survives reloads in the mock store (Phase 2: Supabase Storage) | ✅ Done |
| D-044 | 2026-11-15 | Order/customer state changes are **pure functions** in `packages/lib/order-actions.ts`; the console's `useOrderActions` applies side effects (rider availability, coupon uses, loyalty refunds, auto-assign). Phase 2 moves the same rules into server functions | ✅ Done |
| D-045 | 2026-11-15 | Console prototype shows **"Simulate: rider accepts / declines"** and **"Mark as no response"** buttons, because the rider app is a separate app with no shared backend in Phase 1. Remove in Phase 2 | ✅ Done |
| D-046 | 2026-11-15 | Milestones 1.5–1.7 built in parallel (one fork per app, each limited to its app + its own `packages/lib` file) and integrated afterwards | ✅ Done |
| D-047 | 2026-11-15 | More prototype-only helpers (removed in Phase 2): rider app **"Simulate a new offer"**, customer **"use a sample location"**, mock Facebook account picker, rider any-6-digit login code | ✅ Done |
| D-048 | 2026-11-15 | `TenantTheme global` mirrors the tenant color onto `<html>` so sheets/dialogs (portals) use it; only the tenant apps' outer frame sets `global` — logo tiles don't | ✅ Done |
| D-049 | 2026-11-15 | Phase 1 limitation accepted: each app keeps its own copy of demo data, so a platform suspend, a customer order or a rider action is not seen by the other apps until Phase 2 (D-008) | ✅ Confirmed |
| D-050 | 2026-11-15 | Phone-width review via a dev **phone preview** page (landing `/preview`, iframes at 360/390/430 px) because the review browser can't be resized; Next.js dev badge turned off in all apps | ✅ Done |
| D-051 | 2026-11-15 | Shared helpers consolidated: `useNow`, `useTicker`, `PhotoInput`, `photoToDataUrl`, `ReasonSheet` in `@chowlane/ui`; `newId` in `@chowlane/mocks/store`; `useStoreHydrated` in `@chowlane/mocks/react`; `couponRelease` + `promoRefunds` in lib (console & rider no longer copy the give-back logic) | ✅ Done |
| D-052 | 2026-11-15 | Installing the PWAs on real phones (F-10) needs HTTPS → a preview deployment (e.g. Vercel) or a tunnel; scheduled as part of the walkthrough | 🟨 Proposed |
| D-053 | 2026-11-15 | **Phase 1 signed off.** User walked F-01…F-05 (no changes) and chose to skip F-06…F-15 (clickable, browser-tested during the build). F-10 (phone install) moves to Phase 2.8. **DATA-MODEL frozen as v1.** | ✅ Confirmed |
| D-054 | 2026-11-15 | **Phase 2 plan** (docs/PHASE-2-PLAN.md): Supabase (Singapore), new `packages/db`, multi-row actions as Postgres functions, RLS with `has_perm()`, `packages/lib` stays the rule source, 8 milestones 2.1…2.8 | 🟨 Proposed |
| D-055 | 2026-11-17 | **Phase 2 defaults accepted** (answers Q-30…Q-35): rider login = phone + password set by the admin (OTP later); one Facebook login with a separate customer profile per tenant; SMS provider decided in Phase 3; subdomains per app for the MVP (custom tenant domains Phase 4); Supabase free tier in Singapore while building, Pro before launch; customer ID images deleted 90 days after review, verification record kept | ✅ Confirmed |
| D-056 | 2026-11-17 | **Milestone 2.1 setup choices**: Supabase CLI as a pinned root dev dependency (`pnpm db:*` scripts); local stack in Docker; each app reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from its own `.env.local`, written by `pnpm db:env`; `@chowlane/db` is source-only like the other packages (`createServerSupabase` / `createBrowserSupabase` via `@supabase/ssr`, generated `Database` types); `/api/health` in console, rider, customer, platform; GitHub Actions CI runs format, lint, typecheck, test, build | ✅ Done |
| D-057 | 2026-11-17 | **Phase 2.2 database** (from DATA-MODEL v1, no entity changes): nested fields become child tables (`order_items`, `order_events`, `assignment_attempts`, `verifications`, `customer_addresses`); `pendingOffer` → `offer_*` columns on orders; customer loyalty balances → `loyalty_*` columns on customers; LatLng → `_lat`/`_lng`; rule objects (delivery fee, rider pay, loyalty, fee snapshot, pay override) stay JSONB with the `packages/types` keys and are validated by check functions; composite `(id, tenant_id)` foreign keys block cross-tenant links. **Access:** RLS on all 22 tables via `private.has_perm()` etc.; direct writes only for simple CRUD tables of ACTIVE tenants (+ column grants); orders, shifts, verifications, coupon redemptions and loyalty are function-only; public data through `tenants_public`, `tenant_settings_public` (no rider pay) and `products_public` (no store price). New rules BL-2.7, BL-2.8, BL-6.6, BL-7.11 | 🟨 Proposed (rules) · ✅ Done (build) |
| D-058 | 2026-11-17 | **Seed + RLS tests are generated**: `supabase/seed.sql` from `@chowlane/mocks` (`pnpm db:seed:gen`, stable UUIDs per mock id, local demo logins with password `demo1234`); `supabase/tests/database/rls.test.sql` from a persona × table matrix (`pnpm db:test:gen`, pgTAP, 269 tests: 10 personas × 22 tables, public views and sanity checks, 34 write checks). CI job `database` runs them and fails if generated files are stale | ✅ Done |
| D-059 | 2026-11-17 | **2.3 scope (user):** the console Admins & Roles and Riders screens (list, detail, add/edit) move to Supabase in 2.3, because invites and rider passwords need real rows. Other screens stay on mock data until their milestone; logins map to the mock records by email / mobile number / Facebook id until then, and a business without demo data sees a "moves to live data soon" notice on those screens | ✅ Confirmed |
| D-060 | 2026-11-17 | **Local customer login (user):** against the local Supabase the customer app offers the seeded demo customers (+ "Someone new") with password `demo1234`; real Facebook login is used on the hosted project (OAuth → `/[tenant]/auth/callback`) | ✅ Confirmed |
| D-061 | 2026-11-17 | **New business settings (user):** delivery fee and rider pay start **not set** (DATA-MODEL v1.1: both optional); checkout is closed until the delivery fee is set (BL-7.12); dispatch starts MANUAL, auto-approve off, loyalty off, all IDs accepted, max order ₱2,000 | ✅ Confirmed |
| D-062 | 2026-11-17 | **Rider login without SMS (Q-30):** each rider row gets its own Supabase login whose email is derived from the business link + mobile number (`rider-<digits>@<slug>.riders.chowlane.internal`); the rider types number + password, the admin sets/resets the password in the rider form (server action, Auth admin API) | ✅ Done |
| D-063 | 2026-11-17 | **Sessions:** one Supabase session cookie per app (`chowlane-<app>-auth`), refreshed by each app's `src/proxy.ts`; signup / invites / rider logins are server actions with the service-role key (landing + console only, never in the browser). Locally all apps share `localhost` cookies, so `dev`/`start` raise Node's header limit (`--max-http-header-size=65536`, via cross-env); in production each app has its own subdomain (Q-33) | ✅ Done |
| D-064 | 2026-11-17 | **Auth server functions:** `create_tenant` (service role only), `accept_staff_invite` (first login links an INVITED row), `ensure_customer` (one customer row per business on first visit), `has_permission` (permission check for server actions), `auth_login_status` (service role; lets "Resend invite" replace an unused invite login). Removing an admin keeps history rows (links set to null) | ✅ Done |
| D-065 | 2026-11-18 | **Owner email confirmation (Q-36, user accepted the default):** keep signup without an email step during Phase 2 (owner goes straight to the console); **add email confirmation before launch**, once a real email sender is set up (with the Vercel / hosted setup, by 2.8) | ✅ Confirmed |
| D-066 | 2026-11-18 | **Console on Supabase (2.4):** settings, merchants & menus, barangay fees, coupons, loyalty settings, customers, verification queue (view), billing (view) and home read/write Supabase under RLS; the only new multi-row change is `adjust_points` (BL-14.8, ledger + balance in one transaction, balance ≥ 0). Logos go to the public `tenant-logos` bucket under `<tenant id>/…` (write: `settings.business`). Until orders, dispatch and cash move (2.5–2.6), a settings save is mirrored into the mock store of a demo business and order links open the mock order by its number. ID approve/reject stays on the waiting-order flow and moves with ordering in 2.5 (buttons shown disabled until then) | ✅ Done |
| D-030 | 2026-11-15 | **Cash remittance**: at time out the rider remits net cash (collected from customers − paid at stores); Admin records amount received; business absorbs store price differences | ✅ Confirmed |

## Open questions

> Q-01…Q-36 answered (Q-30…Q-35 by accepting the Phase 2 defaults, D-055; Q-36 by accepting the default, D-065). No open questions.

| # | Question | Affects | Answer |
|---|---|---|---|
| Q-01 | Food only, or also groceries / parcels / "pabili" errands? | Catalog, flows | ✅ **Food only** (D-017) |
| Q-02 | Launch country & currency? | Pricing, phone format, maps | ✅ **Philippines, Philippine Peso (₱ PHP)** (D-018) |
| Q-03 | Payment: cash on delivery, e-wallet, card — which? | Checkout, BL-7.7 | ✅ **Cash on delivery only for MVP** (D-019) |
| Q-04 | ~~Merchants have no app — **how does the merchant learn about an order, and who pays the merchant?** (e.g. rider buys & pays at the store, admin calls the merchant, merchant paid later by owner)~~ | BL-4.4, rider flow | ✅ **Rider buys & pays at the store** ("pabili" style) (D-020) |
| Q-05 | When an admin assigns an order, can the rider decline it? | BL-5.3 | ✅ **Yes, rider can reject.** Dispatch mode AUTO or MANUAL (set by Owner/Admin); rejected orders are auto- or manually reassigned to online riders (D-021) |
| Q-06 | COMMISSION pay: % of the **delivery fee** or of the **whole order**? | BL-8.1 | ✅ **% of the delivery fee** (D-022) |
| Q-07 | DAILY pay: any minimum hours per day to earn the daily rate? | BL-8.1 | ✅ **No minimum — any shift that day earns the daily rate** |
| Q-08 | Rejected customer: can they re-submit a new ID? | BL-3.6 | ✅ **Yes** (D-024) |
| Q-09 | Which ID types are accepted? Also need a selfie holding the ID? | CUS-006 | ✅ **Valid Philippine IDs** (school ID, driver's license, passport, UMID, etc.) + **selfie holding the ID: yes** (D-025) |
| Q-10 | How does ChowLane charge owners (monthly plan / per order / free for now)? | Phase 5 | ✅ **Configurable per tenant** (D-026) |
| Q-11 | Map provider for Phase 3 (road distance + address search): Google Maps or Mapbox? | Tech, per-km pricing | ✅ **Google Maps Platform in Phase 3** (Phase 1 = Leaflet + OSM) |
| Q-12 | Eventually native mobile apps, or PWA is enough? | Phase 4 | ✅ PWA for every tenant app (D-013) |
| Q-13 | Does **every** order need admin approval, or only first-time customers' orders? | BL-4.1 | ✅ **Every order needs approval**; Owner can turn on auto-approve for verified customers (default OFF) |
| Q-14 | Can a rider carry more than one order at a time? | BL-5.4 | ✅ **One active order at a time** |
| Q-15 | Customer login: Facebook only, or also phone/Google as backup? | CUS-001 | ✅ **Facebook only** |
| Q-16 | Is there one Owner per business, or can there be multiple owners? | BL-1.3 | ✅ **One Owner per business** |
| Q-17 | Can the customer adjust the delivery pin, or is it strictly their current location? | BL-3.2 | ✅ **Can adjust within 200 m** of current location |
| Q-18 | ChowLane's own logo / brand colors for the landing page? | LND-001 | ✅ **Claude designs a placeholder brand** (replaceable later) |
| Q-20 | COD cash handling: rider collects the cash — **how and when does the rider hand it over to the Owner** (end of shift / daily / deducted from rider pay)? Does the admin need to record it? | BL-7.7, rider pay, console | ✅ **End of every shift; Admin records the amount received** |
| Q-21 | Store price differs from the app price (price went up), or the rider pays more/less than expected — who absorbs the difference: tenant, rider, or customer pays the actual amount? | BL-11 | ✅ **Business absorbs it; rider is reimbursed** (customer pays the app total) |
| Q-22 | Should Owner set a **maximum order amount** (rider cash limit), e.g. ₱2,000? And what default? | BL-11.5 | ✅ **Yes, default ₱2,000** (Owner can change) |
| Q-23 | Rider response time limit for an assigned order before it counts as rejected? And what happens in AUTO mode when no online rider accepts? | BL-5.6, BL-5.8 | ✅ **60 seconds**, then next rider; nobody left → "Needs rider" + admin alert |
| Q-24 | Per-barangay fee: does the fee depend only on the **customer's barangay**, or on **store barangay → customer barangay** (a from/to table)? | BL-7.2, DATA-MODEL | ✅ **Customer's barangay only** |
| Q-25 | Per-barangay fee: how is the customer's barangay found — **customer picks it** from the list at checkout, or **auto-detected** from their location pin? | CUS-005 | ✅ **Customer picks** from the list (auto-detect maybe later) |
| Q-26 | Coupons / free-delivery rewards: rider pay based on the **original** delivery fee (rider not affected by promos)? | BL-13.6 | ✅ **Yes** — rider pay uses the original delivery fee (D-037) |
| Q-27 | Can a coupon be combined with points / a free gift? | BL-14.6 | ✅ **One promo per order** (coupon OR free-delivery reward); points and free gift combine with either (D-037) |
| Q-28 | Free gift: is it tied to one menu item/merchant (claimable only on orders from that merchant), or a generic gift the rider buys at any store? | BL-14.3b | ✅ **Optional link to a menu item**; if linked, claimable only on that merchant's orders (D-037) |
| Q-29 | Do loyalty points expire? | BL-14.9 | ✅ **No expiry** in MVP (D-037) |
| Q-19 | Rider location only updates while the rider app is open (PWA limit). OK, or is background tracking a must (would need a native rider app later)? | D-016, BL-9.5 | ✅ Accepted — location only while app open (D-016) |
| Q-30 | Rider login: phone + one-time SMS code, or phone + password set by the admin? | Auth | ✅ **Phone + password set by the admin** for MVP; phone OTP later (D-055) |
| Q-31 | Customer account: separate per tenant, or one account across tenants? | Data, auth | ✅ **One Facebook login, separate customer profile per tenant** (D-055) |
| Q-32 | SMS provider (rider OTP, notifications)? | Phase 3 | ✅ **Decide in Phase 3** (e.g. Semaphore) (D-055) |
| Q-33 | Hosting: one domain with paths or subdomains per app? | Deploy | ✅ **Subdomains per app** for MVP; custom tenant domains in Phase 4 (D-055) |
| Q-34 | Supabase plan & region? | Infra | ✅ **Free tier while building, Singapore**; Pro before launch (D-055) |
| Q-35 | How long to keep customer ID photos (Data Privacy Act)? | Privacy | ✅ **Delete ID images 90 days after review**; keep the verification record (D-055) |
| Q-36 | Should a new owner confirm their email before the business is created? | Signup, security | ✅ **No email step while building; add email confirmation before launch** (D-065) |
