# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-17

## Current phase
**Phase 2 — Supabase backend** 🟨 (plan: `docs/PHASE-2-PLAN.md`) · Phase 1 UI prototype ✅ signed off 2026-11-15

## Current state
- **Milestone 2.2 Schema, RLS & seed ✅ (2026-11-17)** — D-057, D-058 · branch `phase-2`:
  - 3 migrations in `supabase/migrations/`: schema (22 tables from DATA-MODEL v1, enums, JSONB rule validators,
    composite tenant foreign keys), RLS (helpers in `private`, policies on every table, column grants), public views
    (`tenants_public`, `tenant_settings_public`, `products_public`) + guards (settings permission per group, rider pay
    override, coupon code immutability).
  - Orders, shifts, ID reviews, coupon uses and loyalty have **no direct write access** — they wait for the server
    functions in 2.3–2.7.
  - `supabase/seed.sql` generated from `@chowlane/mocks` (`pnpm db:seed:gen`): 3 tenants, 13 orders, 22 local demo
    logins (password `demo1234`).
  - RLS tests (pgTAP, `pnpm db:test`): **269 pass** — 10 personas × 22 tables, views, 34 write checks. Proven to fail
    when a policy leaks.
  - `database.types.ts` regenerated (22 tables + 3 views); `schema-sync.test.ts` keeps DB enums = `packages/types`.
  - CI job `database` (Postgres + RLS tests + generated-files check) — not run on GitHub yet (no remote).
  - New rules from the build (confirmed by the user): BL-2.7 (settings permission groups), BL-2.8 (rider ↔ customer visibility only
    while the order is live), BL-6.6 (rider phone unique per business), BL-7.11 (barangay once per price list).
- **Milestone 2.1 Setup ✅** — D-056: Supabase CLI (`pnpm db:*`), local stack on ports **553xx** (API
  `127.0.0.1:55321`, Studio `55323`; 543xx is used by another local project), `@chowlane/db` clients + env check,
  `/api/health` in console/rider/customer/platform, `pnpm db:env`, CI.
- **Hosted project**: Supabase `ChowLane` (ref `ouoahwedxslvhnsegqqh`, Singapore) linked; Facebook provider enabled.
  Migrations are **not pushed** to the hosted project yet.
- All open questions answered (Q-30…Q-35 → D-055).
- Screens still use `packages/mocks`.

## Next up (in order)
1. Claude: **Milestone 2.3 Auth** (in progress) — `create_tenant` (owner signup), staff login + invites, platform admin login,
   rider phone + password login (Q-30), customer Facebook login + per-tenant customer row; replace mock sessions.
2. **You** (by 2.8): connect Vercel to the repo (needs a GitHub remote).

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 65 / 65 ✅ |
| Requirements — UI (REQUIREMENTS.md) | 88 / 88 ✅ |
| Phase 2 milestones (ROADMAP.md) | 2 / 8 (2.1 ✅ 2.2 ✅) |
| Tests | 81 unit (lib 58 · mocks 16 · db 7) + 269 RLS (pgTAP) |
| Flows signed off (USER-FLOWS.md) | 7 / 17 walked ✅ · 10 skipped (Phase 1 signed off) |
| Decisions logged (DECISIONS.md) | 59 (D-000…D-058; D-011, D-039 superseded) |
| Open questions answered | 35 / 35 |
