# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestones **1.1–1.7 ✅** · Next: **1.8 Walkthrough & Sign-off**

## Current state
- 1.1 Foundation ✅ · 1.2 Landing & Signup ✅ · restyle ✅ · 1.3 Owner Setup ✅ · 1.4 Admin Operations ✅.
- **1.5 Customer App ✅** (`apps/customer`, S-300…S-310): mock Facebook login, location gate, home, menu + add sheet,
  cart (one store), checkout (pin within 200 m, barangay picker, fee, coupon, free delivery / free gift / points,
  COD + change, blocking problems), first-order ID + selfie / re-submit, tracking with cancel, my orders + reorder,
  profile, rewards. Logic in `packages/lib/src/customer-app.ts` (10 tests).
- **1.6 Rider App ✅** (`apps/rider`, S-200…S-207): phone + code login, time in/out, live offer card with countdown
  (auto time-out), accept / decline with reason, delivery steps (store → order & pay with unavailable items, amount
  paid + receipt → deliver), proof of delivery with cash collected, earnings, history, profile, time-out cash
  summary. Logic in `packages/lib/src/rider-app.ts` (11 tests).
- **1.7 Platform Admin ✅** (`apps/platform`, S-500…S-510): login, overview KPIs + needs attention, tenants list,
  tenant detail with read-only tabs (riders, orders, customers, merchants, admins & settings), suspend / reactivate,
  billing config + this-month preview + statements (create, paid, waive), billing overview. Logic in
  `packages/lib/src/platform-admin.ts` (5 tests).
- Integration QA (browser, desktop width): customer login → menu → cart → checkout with WELCOME20 → order placed;
  rider login → time in → simulated offer → accept → store step → unavailable item recalculation; platform login →
  overview → tenant billing. Fixed: sheets/dialogs used ChowLane teal instead of the tenant color (D-048); install
  card covered the login button; rider "amount paid" didn't follow unavailable items; "Available" label when off.
- Checks: build ✅ lint ✅ typecheck ✅ tests ✅ (72) format ✅.
- Uncommitted: all 1.5–1.7 work.

## Next up (in order)
1. Commit 1.5–1.7.
2. **Milestone 1.8 Walkthrough & Sign-off**:
   - Phone-width pass of every app (real phone or resizable browser) + install each tenant PWA on Android & iPhone.
   - Build the 2 remaining screens: S-120 rider pay report, S-123 tenant's ChowLane billing (read-only).
   - Shared clean-ups suggested by the forks: one `ReasonSheet` in `packages/ui`; shared `useNow` / `newId` /
     `useStoreHydrated`; `PhotoInput` in `packages/ui`; move "give back coupon / points / rewards" into lib (console
     and rider each have a copy).
   - Walk every flow in USER-FLOWS.md with the user → sign-off → freeze DATA-MODEL as v1.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 63 / 65 |
| Requirements — UI (REQUIREMENTS.md) | 86 / 88 |
| Flows signed off (USER-FLOWS.md) | 0 / 17 (16 clickable) |
| Decisions logged (DECISIONS.md) | 50 (D-000…D-049; D-011, D-039 superseded) |
| Open questions answered | 29 / 29 ✅ |
