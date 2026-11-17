# ChowLane — Phase 2 Plan: Supabase Backend

> Created 2026-11-15 · Status: **in progress — 2.1 ✅, 2.2 ✅, 2.3 ✅ (D-059…D-064), 2.4 ✅ (D-066), 2.5 ✅ (D-067), 2.6 next**; Q-30…Q-35 answered (D-055); hosted project + Facebook ready
> Input: `DATA-MODEL.md` **v1 (frozen)**, `BUSINESS-LOGIC.md`, `packages/lib` (tested rules), the 65 Phase 1 screens.

## Goal

Replace the per-browser mock data with **one real backend** so that everything the apps do is shared:
an order placed in the customer app appears in the console and is offered to a rider; the rider's steps update the
customer's tracking; the platform admin sees it all.

**Exit criteria (Phase 2 done when):**
1. All Phase 1 flows (F-01 … F-15) work against Supabase with **real logins** and **shared data** across the 5 apps.
2. Each tenant's data is isolated by **Row Level Security** (tested), and permissions are enforced on the server, not
   only hidden in the UI (BL-2.4).
3. Money-changing actions (place order, coupon use, points, approve, assign, deliver, cash) run **server-side** with the
   same rules as `packages/lib`.
4. Prototype helpers are removed: DEV switcher, mock logins, "Simulate…" buttons, sample location (D-045, D-047).
5. Preview deployment on HTTPS; the three tenant apps install as PWAs on Android + iPhone (F-10).

Live rider location, push notifications and Google Maps road distance stay in **Phase 3**.

## Before we start — what you need to set up

| # | What | Why | Give Claude |
|---|---|---|---|
| 1 | ✅ **Supabase project** — region **Southeast Asia (Singapore)**, free tier is fine to start | Database, auth, storage, realtime | Project URL + anon key in a local `.env.local` (never paste keys in chat; never share the service-role key) |
| 2 | ✅ **Supabase CLI** login on this computer (`npx supabase login`) | Migrations, local dev database, type generation | — |
| 3 | ✅ **Meta developer app** with "Facebook Login" | Customer "Continue with Facebook" (CUS-001) | App ID + secret go into Supabase → Auth → Providers (you paste them there) |
| 4 | **Vercel account** connected to this repo (GitHub) | HTTPS preview URLs for the 5 apps; phone install test | — |
| 5 | ✅ Decide **Q-30…Q-35** below — defaults accepted 2026-11-17 (D-055) | Auth and hosting choices | — |

## Architecture

```
apps/*  (Next.js)          ── server components + server actions ──┐
  └─ browser: @supabase/ssr client (anon key, user session cookie)   │
packages/db (NEW)                                                     ├──► Supabase
  ├─ typed client (generated types: supabase gen types)              │     Postgres (+ RLS, functions, pg_cron)
  ├─ queries per screen (replaces @chowlane/mocks reads)             │     Auth (email, Facebook, phone?)
  └─ actions (call Postgres functions / server actions)              │     Storage (logos, IDs, receipts)
packages/lib  (unchanged) — same rules run in server actions          │     Realtime (orders, offers)
supabase/ (NEW) migrations · seed.sql (from mocks) · tests (RLS) ────┘
```

- **Reads:** server components / `packages/db` queries with the user's session → RLS decides what they see.
- **Writes:** server actions validate input (zod) and call **Postgres functions** for multi-row changes so they are
  atomic (e.g. `place_order` locks the coupon row, inserts the order, redemption and loyalty rows in one transaction).
- **`packages/lib` stays the single source of business rules**: server actions use it to compute prices, fees, pay;
  Postgres functions re-check the critical invariants (totals, coupon limits, status transitions).
- **`@chowlane/mocks`** stays only for tests and the seed script.

## Database (from DATA-MODEL v1)

| Table | Notes |
|---|---|
| `platform_admins` | linked to `auth.users` |
| `tenants`, `tenant_settings`, `tenant_billing`, `billing_statements` | settings as typed columns + JSONB for rules (`delivery_fee`, `rider_pay`, `loyalty`) checked by constraints |
| `staff_users`, `roles` | `staff_users.auth_user_id`; role permissions `text[]` |
| `merchants`, `products`, `barangay_fees` | |
| `riders`, `shifts` | `riders.auth_user_id` |
| `customers`, `customer_addresses`, `verifications` | one customer row **per tenant** per auth user (BL-1.5) |
| `orders`, `order_items`, `order_events`, `assignment_attempts` | timeline + attempts as child tables |
| `coupons`, `coupon_redemptions`, `loyalty_transactions` | ledger tables are insert-only |

Conventions: snake_case, `id uuid default gen_random_uuid()`, `tenant_id uuid not null` on every tenant table,
money `integer` centavos, `timestamptz`, enums as Postgres enums, indexes on `(tenant_id, status, created_at)`.

## Security — RLS model

Helper SQL functions (security definer, stable):
- `auth_staff(tenant_id)` → the caller's staff row; `has_perm(tenant_id, key)` → owner or role contains key.
- `auth_rider(tenant_id)`, `auth_customer(tenant_id)`, `is_platform_admin()`.

| Who | Can read | Can write (via policies or functions) |
|---|---|---|
| Public (no login) | tenant branding by slug (`tenants_public` view), active merchants & products of active tenants | — |
| Customer | own customer row, addresses, verifications, own orders, own loyalty, active coupons by code (function) | place / cancel own order (functions), own profile, ID submission |
| Rider | own row & shifts, orders offered/assigned to them (address only after accept — BL-5.15) | time in/out, respond to offer, delivery steps (functions) |
| Staff | tenant rows allowed by permission (`has_perm`) | per permission (e.g. `orders.approve` → `approve_order`) |
| Platform admin | everything (read) | tenant status, billing, statements |

Every policy gets an automated test (local Supabase + Vitest/pgTAP): "user of tenant A cannot read tenant B", one test
per role × table.

## Auth

| User | Method | Notes |
|---|---|---|
| Owner | email + password (signup creates the tenant via `create_tenant` function) | |
| Admin | email invite (Edge Function using the admin API) → sets password | INVITED → ACTIVE on first login |
| Rider | phone + password set by the admin (Q-30, D-055); phone OTP later | |
| Customer | **Facebook** (Supabase provider); customer row created per tenant on first visit | |
| Platform admin | email + password, rows created manually | |

`useSession` / DEV "acting as" are replaced by Supabase sessions (cookies via `@supabase/ssr`).

## Storage

| Bucket | Access |
|---|---|
| `tenant-logos` | public read; write `settings.business` |
| `id-documents` | private; customer uploads own; read `customers.verify` via signed URLs (BL-3.7); retention **Q-35** |
| `delivery-photos` (receipts, proof) | private; rider uploads; staff read |

Images are resized in the browser before upload (`photoToDataUrl` → Blob).

## Server-side operations (Postgres functions / server actions)

`create_tenant` · `place_order` · `cancel_order_by_customer` · `approve_order` / `reject_order` / `cancel_order` ·
`verify_customer` / `reject_customer` (auto-reject waiting order) · `offer_order` (auto-assign nearest free rider) ·
`respond_to_offer` · `expire_offers` (**pg_cron** every 15–30 s, BL-5.6/5.14) · `rider_time_in` / `rider_time_out`
(cash summary) · `arrive_at_store` / `mark_unavailable` / `pick_up` / `complete_delivery` (loyalty) ·
`record_remittance` · `adjust_points` · `generate_billing_statement` (monthly pg_cron + manual) · `suspend_tenant`.

## Realtime

- Console: `orders` changes for the tenant (new orders, status), offers → live lists without refresh.
- Rider: own offers channel (new offer → offer card + countdown).
- Customer: own order row (tracking steps).
(Live rider GPS stays Phase 3.)

## Milestones

| # | Milestone | Scope | Done when |
|---|---|---|---|
| 2.1 | Setup | Supabase CLI, local DB, `packages/db`, env handling, generated types, CI runs lint/type/test | `pnpm dev` talks to local Supabase |
| 2.2 | Schema, RLS & seed | migrations for all tables, RLS + helper functions, `seed.sql` generated from `@chowlane/mocks`, RLS tests | all RLS tests pass; seed loads the 3 demo tenants |
| 2.3 | Auth | owner signup (`create_tenant`), staff login + invites, platform admin login, rider login (Q-30), customer Facebook login; mock sessions removed | every app logs in for real |
| 2.4 | Console on real data | settings, merchants/products, admins/roles, coupons, loyalty, customers, riders — reads + writes | 1.3 screens + customers/riders work on Supabase |
| 2.5 | Ordering | customer catalog, cart, checkout → `place_order`, ID upload + verification, tracking, cancel, rewards | a real order appears in the console |
| 2.6 | Dispatch & delivery | approve → offer → rider accept → steps → deliver, expiry job, realtime, cash remittance, rider pay report | full order lifecycle across 3 apps |
| 2.7 | Platform & billing | platform admin on real data, suspend, billing config, monthly statement job | F-11, F-12 on real data |
| 2.8 | Deploy & exit | Vercel previews (HTTPS), PWA install on phones (F-10), remove prototype helpers, e2e tests (Playwright) for the main flows, exit review | exit criteria met |

## Open questions (answered 2026-11-17 — defaults accepted, D-055)

| # | Question | Proposed |
|---|---|---|
| Q-30 | Rider login: phone + one-time SMS code, or phone + password set by the admin? | Password set by admin for MVP (no SMS cost); OTP later |
| Q-31 | Customer account: separate per tenant, or one account across tenants? | Separate customer profile per tenant on one Facebook login (data stays isolated per tenant) |
| Q-32 | SMS provider for later (rider OTP, notifications)? | Decide in Phase 3 (e.g. Semaphore for PH) |
| Q-33 | Hosting: one domain with paths (`chowlane.app/rider/...`) or subdomains (`rider.chowlane.app`)? | Subdomains for the MVP (no basePath changes); custom tenant domains in Phase 4 |
| Q-34 | Supabase plan & region? | Free tier while building, **Singapore** region; Pro before launch (backups) |
| Q-35 | How long do we keep customer ID photos (PH Data Privacy Act)? | Delete ID images 90 days after approval/rejection; keep the verification record |
