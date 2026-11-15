# ChowLane — Product Overview

> Last updated: 2026-11-15 (v1 — rewritten from user requirements)

## 1. Vision

ChowLane is a **tenant-based (multi-tenant) delivery platform**. A business owner signs up and gets
their **own delivery business** — their own brand and business name — without building software.
The owner sets up merchants and products, decides how delivery is priced and how riders are paid,
adds admins and riders, and customers order through an app branded as the owner's business.

> Think: "Shopify, but for launching your own local **food** delivery business."
>
> **Market: Philippines, prices in Philippine Peso (₱)** (D-018).
>
> **Scope: food delivery only** — restaurants, food stalls, cafés. No groceries, parcels or errands (D-017).

## 2. Users

| # | User | Logs in with | What they do |
|---|---|---|---|
| U0 | **Platform Admin** (ChowLane owner — you) | Email / password | Monitors **all tenants**: stats, riders and all tenant records. Sets each tenant's **billing** (free / monthly / per order…). Suspends / reactivates tenants. |
| U1 | **Owner** | Email / password | Signs up the business. Creates and sets up the app: initial settings, branding, merchants, products & prices, delivery fee (per km / fixed / per barangay), rider income (fixed daily / % of delivery fee / fixed per delivery). Creates **coupons** and sets up the **loyalty program** (free delivery / free gift after N orders, points). Manages admin users and **decides what each admin can do**. Can do everything. |
| U2 | **Admin** | Email / password (invited by Owner) | Sets up merchants & products. Sets delivery fees. Manages coupons & customer points. Approves/rejects **first-time customers**. Approves orders. Monitors orders. Manually assigns orders to riders. Monitors riders. Riders CRUD. *Only what the Owner allows.* |
| U3 | **Rider** | Email or phone / password (added by Owner/Admin) | Time in / time out. Accepts orders and delivers them. |
| U4 | **Customer** | **Facebook** | Orders from the owner's branded app. Must allow **current-location tracking** to order. **First order requires an ID.** Tracks order status. |

**Not app users (for now):**
- **Merchant** — a restaurant / food stall / café record set up by the **Owner or an Admin** (name, address, products,
  prices). **There is no merchant portal** — merchants never log in. *(DECISIONS D-006.)*
  The **rider buys and pays at the store** ("pabili" style), then collects from the customer *(D-020)*.

## 3. Apps (Turborepo, all mobile-first web)

| App | Users | Purpose | Installable PWA |
|---|---|---|---|
| `apps/landing` | Visitors, Owners | Landing page explaining ChowLane + Owner signup | No (website) |
| `apps/console` | Owner, Admin | Setup & operations dashboard | ✅ branded per tenant |
| `apps/rider` | Rider | Time in/out, accept & deliver orders | ✅ branded per tenant |
| `apps/customer` | Customer | Tenant-branded ordering app | ✅ branded per tenant |
| `apps/platform` | Platform Admin | ChowLane console: monitor all tenants, billing | Not required (ChowLane-branded) |

**Every tenant app can be installed as a PWA** ("Add to Home Screen"). When installed it opens
full-screen like a native app and shows the **tenant's** name, logo and color — e.g. a customer of
FastBite gets a "FastBite" icon on their phone, not "ChowLane".

## 4. Tenancy model

- **Tenant** = one delivery business (e.g. "FastBite Delivery"), created when an Owner signs up.
- Each tenant has its own branding, settings, merchants, products, admins, riders, customers, orders.
- Data is **fully isolated** between tenants.
- Every tenant app is reached per tenant: `<app>/<tenant-slug>/…` (e.g. `customer/fastbite`,
  `rider/fastbite`, `console/fastbite`) so each tenant gets its own installable PWA. Subdomain / custom domain later.

## 5. Glossary

| Term | Meaning |
|---|---|
| Tenant | A delivery business running on ChowLane |
| Owner | The person who created the tenant; has all permissions |
| Role (admin role) | A named set of permissions the Owner creates and assigns to admins |
| Customer verification | One-time ID check of a first-time customer, approved/rejected by an Admin |
| Order approval | Admin step that approves a placed order before it goes to riders |
| Time in / time out | Rider starting / ending a shift; only timed-in riders get orders |
| Delivery fee mode | `PER_KM` (store → customer distance), `FIXED` amount, or `PER_BARANGAY` (price list) |
| Barangay | Smallest PH local government unit; used for the per-barangay delivery price list |
| Coupon | Tenant promo code: % off food or free delivery, limited uses, validity period |
| Loyalty program | Optional tenant rewards: free delivery or free gift after N successful orders, points to pay for food |
| Rider pay mode | `DAILY` (fixed daily), `COMMISSION` (% of delivery fee), or `PER_DELIVERY` (fixed per delivery) |
| PWA | Progressive Web App — a website that can be installed on the phone home screen and runs like an app |
| Manifest | File that tells the phone the installed app's name, icon and color (one per tenant) |
