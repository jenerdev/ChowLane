# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-17

## Current phase
**Phase 2 — Supabase backend** 🟨 (plan: `docs/PHASE-2-PLAN.md`) · Phase 1 UI prototype ✅ signed off 2026-11-15

## Current state
- **Milestone 2.1 Setup ✅ (local, 2026-11-17)** — D-056:
  - Supabase CLI 3.1.0 as a root dev dependency; `pnpm db:start | db:stop | db:status | db:reset | db:env | db:types`.
  - `supabase/config.toml` (project id `chowlane`), local stack in Docker on ports **553xx** (API `127.0.0.1:55321`,
    Studio `55323`) — the default 543xx ports are used by another local project (`chatbot-poc`).
  - `packages/db` (`@chowlane/db`): env check, `createServerSupabase` / `createBrowserSupabase` (`@supabase/ssr`),
    generated `Database` types, health check + 5 tests.
  - `/api/health` in console, rider, customer, platform → `{ ok: true }` against local Supabase under `pnpm dev`.
  - `pnpm db:env` writes each app's `.env.local`; `.env.example` at the root.
  - GitHub Actions CI (`.github/workflows/ci.yml`): format, lint, typecheck, test, build. No git remote yet, so it
    hasn't run on GitHub.
- **Hosted project linked** (2026-11-17): Supabase project `ChowLane`, ref `ouoahwedxslvhnsegqqh`, Singapore
  (`ap-southeast-1`); CLI logged in. Meta app created; **Facebook provider enabled** (verified: authorize → facebook.com dialog).
- Q-30…Q-35 answered — Phase 2 defaults accepted (D-055). All open questions answered.
- Screens still use `packages/mocks`; no tables yet (schema is 2.2).

## Next up (in order)
1. Claude: **Milestone 2.2 Schema, RLS & seed** — migrations for all DATA-MODEL v1 tables, RLS helper functions +
   policies, `seed.sql` generated from `@chowlane/mocks`, RLS tests (one per role × table) on the local stack.
2. **You** (by 2.8): connect Vercel to the repo (needs a GitHub remote).

## Blockers
- None for 2.2 (runs on the local Docker stack). Hosted Supabase + Facebook provider are ready for 2.3.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 65 / 65 ✅ |
| Requirements — UI (REQUIREMENTS.md) | 88 / 88 ✅ |
| Phase 2 milestones (ROADMAP.md) | 1 / 8 (2.1 ✅) |
| Tests | 79 (lib 58 · mocks 16 · db 5) |
| Flows signed off (USER-FLOWS.md) | 7 / 17 walked ✅ · 10 skipped (Phase 1 signed off) |
| Decisions logged (DECISIONS.md) | 57 (D-000…D-056; D-011, D-039 superseded) |
| Open questions answered | 35 / 35 |
