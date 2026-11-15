# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestones **1.1 ✅ 1.2 ✅** · Next: **1.3 Console — Owner Setup**

## Current state
- 1.1 Foundation ✅ (types, tested business logic, mock data + store, design system, PWA, DEV switcher).
- **1.2 Landing & Owner Signup ✅**
  - `apps/landing` `/`: ChowLane landing page (Archivo type, teal/amber) with a **live brand builder** hero — type a
    business name + pick a color, the phone preview of your customer app re-brands; carried into signup.
  - `/signup`: 6-step wizard (account · business name · link with live availability check & suggestions · brand with
    logo upload + live preview · delivery area · review) → done screen → opens console login (demo console, D-038).
  - `/login`: find your console by business link.
  - `apps/console` `/[tenant]/login` (S-100): tenant-branded login, demo accounts, errors for invited/inactive staff;
    console pages now **require login** (redirect) and have **Log out**.
  - Tenant apps restructured: `[tenant]/layout` (branding + PWA + DEV) and `[tenant]/(app)/layout` (shell + nav).
- Checked in the browser (desktop width): landing, brand builder, full signup flow incl. validation and taken-link
  suggestions, console login → home, customer & rider homes. **Not checked at phone width** (browser window could
  not be resized) — do a phone-width pass at the start of 1.3.
- Bugs found & fixed while testing: Zustand selectors returning new arrays → infinite render loop (React #185);
  install prompt reappearing after "Not now"; `Button block` overflowing in flex rows; squashed bottom nav in phone
  layout on desktop.
- **UI restyled to simple / minimalist / modern** (D-041, `docs/DESIGN.md`): neutral zinc tokens, Geist font, flat
  cards & tiles, quiet sidebar/bottom nav, landing simplified. Applies to all future screens.
- Uncommitted: all 1.2 work + the restyle.

## Next up (in order)
1. Commit 1.2 + restyle.
2. Phone-width visual pass (landing, signup, console login, customer/rider homes).
3. **Milestone 1.3 Console — Owner Setup**: S-101 home + setup checklist, S-111…S-113 merchants & products,
   S-114…S-117 settings (business/branding, service area map, delivery fee incl. barangay list S-122, rider income),
   S-118/S-119 admins & roles, S-125…S-127 coupons & loyalty settings.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 7 / 64 |
| Requirements — UI (REQUIREMENTS.md) | 16 / 88 |
| Flows signed off (USER-FLOWS.md) | 0 / 17 (F-01, F-01b clickable) |
| Decisions logged (DECISIONS.md) | 42 (D-000…D-041; D-011, D-039 superseded) |
| Open questions answered | 29 / 29 ✅ |
