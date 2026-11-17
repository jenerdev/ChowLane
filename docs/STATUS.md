# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-18

## Current phase
**Phase 2 — Supabase backend** 🟨 (plan: `docs/PHASE-2-PLAN.md`) · Phase 1 UI prototype ✅ signed off 2026-11-15

## Current state
- **Milestone 2.4 Console on real data ✅ (2026-11-18)** — D-065, D-066 · committed on `phase-2` (`5846fb1`):
  - On Supabase now: console home (setup checklist + counters), every settings screen (business + logo upload to
    the `tenant-logos` bucket, area, delivery fee, barangays, rider income, loyalty, billing view), dispatch-mode
    switch, merchants + menus, coupons (+ uses), customers + points adjustment (`adjust_points`), verification queue
    and detail (view only — approve/reject comes with ordering in 2.5).
  - Still mock: orders, dispatch lists, live map, cash, rider pay report (2.5–2.6). For demo businesses, settings
    saves are mirrored into the mock store so those screens agree; order links open the mock order by number.
  - Tests: 91 unit + **314 RLS**. Browser-tested as the FastBite owner (see PROGRESS-LOG).
- **Milestone 2.3 Auth ✅ (2026-11-17)** — D-059…D-064 · branch `phase-2` (2.1, 2.2 committed):
  - Real Supabase logins in all apps; mock sessions and the DEV "acting as" switcher are gone.
    - Console: email + password; invited admins set a password from the email link (`/[tenant]/invite`).
    - Rider: mobile number + password set by the admin (Q-30, no SMS — D-062).
    - Customer: Facebook on the hosted project; local demo customers + "Someone new" locally (D-060). One customer
      row per business, created on first visit (`ensure_customer`).
    - Platform admin: email + password.
  - Owner signup (landing) creates the login + business (`create_tenant`): owner, default Admin role, settings with
    delivery fee / rider pay **not set** (D-061 → checkout closed until set), FREE plan.
  - Live on Supabase: console **Admins**, **Roles**, **Riders** (list, detail, add/edit + password) (D-059); tenant
    branding, manifests and icons. Other screens still use mock data (mapped to the real login by email / mobile /
    Facebook id); a business without demo data sees a "moves to live data soon" notice on them.
  - Tests: 88 unit + **305 RLS** (pgTAP). Browser-tested end to end: owner login, invite → set password → console,
    add rider with password → rider app login, demo rider, demo + new customer, platform login, owner signup → new
    console.
  - Local dev: all apps share `localhost` cookies → `dev`/`start` raise Node's header limit (D-063). Invite emails:
    Mailpit http://127.0.0.1:55324.
- **Hosted project**: Supabase `ChowLane` (Singapore) linked; Facebook provider enabled. Migrations **not pushed** yet.
- Q-36 answered (D-065): email confirmation for new owners is added before launch.

## Resume here (next session)
State on 2026-11-18: branch `phase-2`; 2.1–2.4 committed (`3e2132a`, `0c51996`, `73a8f30`, `5846fb1`);
nothing pushed, migrations not applied to the hosted project.

1. Start Docker Desktop, then `pnpm db:start` (local Supabase on 553xx; `pnpm db:reset` reloads demo data and the
   2.4 migration).
2. If ports 3000–3004 are busy, stop leftover Node dev servers first (Next allows one dev server per app).
3. `pnpm dev` → console http://localhost:3001/fastbite (`marco@fastbite.ph` / `demo1234`), rider :3002, customer
   :3003, platform :3004 (`owner@chowlane.app`), landing :3000. Invite emails: http://127.0.0.1:55324.
4. Say "go" for **Milestone 2.5**.

## Next up (in order)
1. **You**: say "go" for Milestone 2.5.
2. Claude: **Milestone 2.5 Ordering** — customer catalog, cart, checkout → `place_order`, ID upload (`id-documents`
   bucket) + verify / reject (incl. the console approve/reject buttons), tracking, cancel, rewards.
3. **You** (by 2.8): connect Vercel to the repo (needs a GitHub remote); email sender for owner confirmation (D-065).

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 65 / 65 ✅ (+ S-125 invite page in 2.3) |
| Requirements — UI (REQUIREMENTS.md) | 88 / 88 ✅ |
| Requirements — backend (REQUIREMENTS.md) | 31 ✅ · 2 🟨 |
| Phase 2 milestones (ROADMAP.md) | 4 / 8 (2.1 ✅ 2.2 ✅ 2.3 ✅ 2.4 ✅) |
| Tests | 91 unit (lib 62 · mocks 16 · db 13) + 314 RLS (pgTAP) |
| Flows signed off (USER-FLOWS.md) | 7 / 17 walked ✅ · 10 skipped (Phase 1 signed off) |
| Decisions logged (DECISIONS.md) | 67 (D-000…D-066; D-011, D-039 superseded) |
| Open questions answered | 36 / 36 |
