# ChowLane — Roadmap

> Last updated: 2026-11-15
> Rule: don't start a phase until the previous phase's exit criteria are met and the user signs off.

## Phase 0 — Planning & Docs  ✅
- [x] Create documentation set
- [x] Update docs from user requirements v1 (users, approach, tech stack)
- [x] User answers open questions in DECISIONS.md
- [x] Scaffold Turborepo (5 Next.js apps + shared packages), git init

**Exit:** docs agreed; `pnpm dev` runs all 5 empty apps. ✅ 2026-11-15

---

## Phase 1 — UI Prototype (no Supabase, no API)  ✅ signed off 2026-11-15
Goal: **every screen built mobile-first with mock data, every flow clickable**, so flows are finalized
before the backend is designed.

| Milestone | Scope | Status |
|---|---|---|
| 1.1 Foundation | Turborepo, `packages/ui` design system, tenant theming, `packages/types` + `packages/mocks`, `packages/lib` (fee / pay / status / permission logic), app shells under `/[tenant]`, **PWA setup for console/rider/customer** (per-tenant manifest, service worker, install prompt, offline page), dev role switcher | ✅ |
| 1.2 Landing & Owner Signup | Landing page with live brand builder, Owner signup wizard (account, business name, link check, brand, delivery area, review), find-your-console page, console login + sign-out | ✅ |
| 1.3 Console — Owner Setup | Setup checklist, business & branding, service area, merchants, products & prices, delivery pricing (fixed / per km), rider pay (commission / daily / per delivery), admin users, roles & permissions, **coupons**, **loyalty program settings** | ✅ |
| 1.4 Console — Admin Operations | Customer verification queue, order approval, orders monitoring, manual rider assignment, riders CRUD, rider monitoring (live map, shifts), customer loyalty view & adjust | ✅ |
| 1.5 Customer App | Facebook login (mock), location gate, browse merchants/products, cart, checkout, first-order ID upload, pending approval state, order tracking, history, **coupon code**, **rewards** (points, free delivery, free gift) | ✅ |
| 1.6 Rider App | Login, time in / out, available orders + accept, delivery steps, proof of delivery, shift & earnings history | ✅ |
| 1.7 Platform Admin Console | Platform login, overview stats across tenants, tenants list, tenant detail (stats, riders, orders, customers, merchants, admins — read-only), per-tenant billing config + monthly statements, suspend / reactivate | ✅ |
| 1.8 Walkthrough & Sign-off | Last screens (S-120, S-123), shared clean-ups, phone preview, walkthrough (F-01…F-05 walked, rest skipped), sign-off, DATA-MODEL v1 frozen | ✅ |

**Exit:** user signs off all flows; DATA-MODEL.md frozen as v1.

---

## Phase 2 — Supabase Backend  🟨 (plan: docs/PHASE-2-PLAN.md)
| Milestone | Scope | Status |
|---|---|---|
| 2.1 Setup | Supabase CLI, local DB, `packages/db`, env, generated types, CI | ✅ 2026-11-17 |
| 2.2 Schema, RLS & seed | migrations, RLS + helper functions, seed from mocks, RLS tests | ✅ 2026-11-17 |
| 2.3 Auth | owner signup, staff invites, platform admin, rider login, customer Facebook | ⬜ |
| 2.4 Console on real data | settings, catalog, team, coupons, loyalty, customers, riders | ⬜ |
| 2.5 Ordering | catalog, checkout → `place_order`, ID upload & verification, tracking | ⬜ |
| 2.6 Dispatch & delivery | approve → offer → accept → deliver, expiry job, realtime, cash | ⬜ |
| 2.7 Platform & billing | platform admin, suspend, billing config, statement job | ⬜ |
| 2.8 Deploy & exit | Vercel HTTPS previews, PWA install (F-10), remove prototype helpers, e2e tests | ⬜ |

**Exit:** all flows work on Supabase with real logins and shared data across the 5 apps; RLS tested.

## Phase 3 — Live Operations  ⬜
- Realtime order status + rider live location (Supabase Realtime)
- **Google Maps Platform** for address search + road distance (per-km pricing)
- Rider pay calculation & payroll summaries (commission / daily / per delivery)
- Notifications — **Web Push through the PWAs** (new orders for riders/admins, approval results & status for customers), SMS/email fallback
- Cash remittance reports & reconciliation (BL-12). Online payments (GCash / Maya / card) are **post-MVP**

## Phase 4 — Polish  ⬜
- Custom domains / subdomains per tenant (PWA then installs from the tenant's own domain)
- Auto-generated PWA icons/splash screens from uploaded logo (if not done in Phase 2)
- Reports & analytics, promos, ratings

## Phase 5 — SaaS & Launch  ⬜
- Online collection of tenant billing (Phase 1–4: statements marked paid manually)
- Security hardening, audit logs, automated tests, monitoring, backups
- Production launch
