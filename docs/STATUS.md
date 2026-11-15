# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestones **1.1 ✅ 1.2 ✅ 1.3 ✅ 1.4 ✅** · Next: **1.5 Customer App**

## Current state
- 1.1 Foundation ✅ · 1.2 Landing & Signup ✅ · Minimalist restyle ✅ · 1.3 Owner Setup ✅.
- **1.4 Console — Admin Operations ✅**
  - **Orders**: tabs (to approve / active / delivered / rejected & cancelled), search, badges (ID to verify, needs
    rider, offered, offer expired). **Order detail**: next-action card (verify ID first · approve / reject · waiting for
    rider with prototype simulate buttons · expired offer → mark no response · needs rider → assign), items incl. free
    gift / unavailable, full price breakdown (coupon, free delivery, points, cash to collect, store cash), timeline,
    rider offers history, customer & rider cards, reassign, cancel with reason.
  - **Customer verification** queue (oldest first, re-submissions) and review (ID + selfie, earlier submissions,
    approve → jumps to the waiting order; reject with reason → waiting order auto-rejected).
  - **Customers** list + detail (rewards, loyalty history, manual points adjust with reason, orders, contact, ID).
  - **Riders** (on shift / off / inactive) · add/edit (vehicle, plate, pay override) · detail (stats, 7-day earnings,
    current order, shifts with cash status) · **live map** (riders + stores with active orders).
  - **Dispatch**: AUTO / MANUAL switch, needs-rider list with assign, waiting-for-rider list.
  - **Cash**: to record / recorded / on shift; record sheet with breakdown, short/over detection, note required.
  - New lib `order-actions` (approve, reject, cancel, offer, respond, verify customer, open offers, expiry, timeAgo)
    tested against mock data; console `useOrderActions` side effects (D-044).
- Browser-checked: approve → auto offer → decline → needs rider → assign sheet; ID verification → order approval;
  dispatch; cash short detection; expired offer. Fixed during testing: rider with an open offer could get a second
  offer; hard-coded 60 s text; mock coupon order below the coupon minimum.
- **Tip:** the console keeps demo data in the browser — use **DEV → Reset demo data** to load the fixed mock data.
- Not yet: phone-width pass; S-120 rider pay report; S-123 billing.
- Uncommitted: all 1.4 work.

## Next up (in order)
1. Commit 1.4.
2. **Milestone 1.5 Customer App** (S-300…S-310): Facebook login (mock), location gate, home & merchant menu, cart,
   checkout (barangay/pin, coupon, rewards, points, COD + change), first-order ID + selfie, waiting/rejected states,
   order tracking, order history, profile, rewards.
3. Then 1.6 Rider App, 1.7 Platform Admin, 1.8 walkthrough & sign-off.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 33 / 65 |
| Requirements — UI (REQUIREMENTS.md) | 46 / 88 |
| Flows signed off (USER-FLOWS.md) | 0 / 17 (9 clickable) |
| Decisions logged (DECISIONS.md) | 46 (D-000…D-045; D-011, D-039 superseded) |
| Open questions answered | 29 / 29 ✅ |
