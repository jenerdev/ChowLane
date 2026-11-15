# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestone **1.1 Foundation ✅ done** · Next: **1.2 Landing & Owner Signup**

## Current state
- Turborepo with 5 apps + 7 packages. `pnpm build`, `lint`, `typecheck`, `test` (34 tests), `format:check` all pass.
- **Foundation built (1.1):**
  - `packages/types` — every entity in DATA-MODEL.md (incl. coupons & loyalty).
  - `packages/lib` — delivery fee, order totals, status machine, permissions, rider pay, remittance, billing,
    dispatch (auto-assign), phone/peso/time helpers, color contrast, **coupons, loyalty, order pricing** — unit-tested.
  - `packages/mocks` — 3 tenants (FastBite: PER_KM/COMMISSION/AUTO; Kain Express: PER_BARANGAY/DAILY/MANUAL;
    Pasabuy QC: suspended), staff/roles, merchants & products, riders & shifts (every remittance state),
    customers (every verification state), orders in **every status**, coupons in every state, loyalty balances.
    `@chowlane/mocks/store` = Zustand mock backend per app; `@chowlane/mocks/react` = DEV switcher + hydrator.
  - `packages/ui` — design system (Button, Card, Badge, Input/Select/Textarea/Field, Switch, Sheet, Tabs, Avatar,
    Stat, EmptyState, Money, status badges), `AppShell` (bottom nav on phone, sidebar on desktop), placeholder
    **ChowLane brand** (logo + teal/amber), `TenantTheme`.
  - `packages/pwa` — per-tenant manifest, generated PNG icons, Serwist service worker, install sheet (Android + iOS),
    offline page + banner, update banner. Verified on production build (manifest, icons, `/serwist/sw.js`, `/~offline`).
  - Apps: tenant apps under `/[tenant]` with branding, PWA, shell + nav, foundation preview home, "coming soon"
    for unbuilt screens; suspended tenant → "temporarily unavailable" (customer, rider). Platform + landing placeholders.
- **New features added to the plan (2026-11-15): coupons and loyalty program** (docs, types, logic, mocks done; screens in 1.3 / 1.4 / 1.5).
- Not yet: real-device PWA install test (planned in 1.8); git commit.

## Next up (in order)
1. **Milestone 1.2 Landing & Owner Signup**: S-001 landing page, S-002 signup wizard (account → business name →
   slug check → logo & color with live preview → service area), S-100 login.
2. Then 1.3 Console — Owner Setup.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 3 / 63 |
| Requirements — UI (REQUIREMENTS.md) | 12 / 88 |
| Flows signed off (USER-FLOWS.md) | 0 / 16 |
| Decisions logged (DECISIONS.md) | 38 (D-000…D-037; D-011 superseded) |
| Open questions answered | 29 / 29 ✅ |
