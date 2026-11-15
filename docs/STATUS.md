# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestones **1.1 ✅ 1.2 ✅ 1.3 ✅** · Next: **1.4 Console — Admin Operations**

## Current state
- 1.1 Foundation ✅ · 1.2 Landing & Owner Signup ✅ · Minimalist restyle ✅ (`docs/DESIGN.md`, D-041).
- **1.3 Console — Owner Setup ✅** (all in `apps/console/src/app/[tenant]/(app)/`):
  - Home with **setup checklist** (progress, links) + permission-aware stats.
  - **Merchants** list (active/inactive, search, open/closed switch) · add/edit with **map pin** · **menu** per merchant
    (categories, price + store price, sold-out switch, add/edit/delete in a sheet).
  - **Settings** index (filtered by permission): business & branding (name, short name, logo, color, accepted IDs) ·
    delivery area (map + radius) · delivery fee (per km / fixed / per barangay + calculator) & order rules (max order,
    auto-approve) · barangay prices · rider income (with example) · loyalty program (master switch + 3 rules) ·
    admins (invite, role, turn off, remove) · roles & permissions (grouped checkboxes).
  - **Coupons** list (active & scheduled / ended & off) · create/edit (code rules, % off or free delivery, limits,
    Manila dates, usage history, delete only if unused).
  - Shared: `useConsole()` (tenant, settings, me, `can()`), `RequirePermission`, nav filtered by permission, mobile
    **More** tab, live tenant theme from the store, toasts, confirm sheets, MoneyInput/NumberInput/RadioCards/Checkbox,
    Leaflet `MapPicker`.
- Browser-checked (desktop width): home, merchants, merchant edit + map, menu, delivery fee calculator, coupons,
  role editor, **permission gating as Dispatcher** (limited nav, "no access" page). Fixed: empty Settings for roles
  without settings permissions.
- Not yet: phone-width visual pass (browser window can't be resized here); S-120 rider pay report and S-123 billing.
- Uncommitted: all 1.3 work.

## Next up (in order)
1. Commit 1.3.
2. **Milestone 1.4 Console — Admin Operations**: S-102/S-103 orders list & detail (approve/reject, assign, cancel,
   timeline, assignment history), S-104/S-105 customer verification (ID + selfie), S-106 customers (+ loyalty adjust),
   S-107…S-110 riders (list, add/edit, detail, live map), S-121 dispatch (mode + needs rider), S-124 cash remittances.
3. Phone-width pass when a phone or resizable browser is available.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 22 / 65 |
| Requirements — UI (REQUIREMENTS.md) | 33 / 88 |
| Flows signed off (USER-FLOWS.md) | 0 / 17 (7 clickable) |
| Decisions logged (DECISIONS.md) | 44 (D-000…D-043; D-011, D-039 superseded) |
| Open questions answered | 29 / 29 ✅ |
