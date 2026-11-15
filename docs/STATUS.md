# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype ✅ signed off 2026-11-15** · Next: **Phase 2 — Supabase backend** (plan: `docs/PHASE-2-PLAN.md`)

## Current state
- Phase 1 complete: 5 apps, 65 screens, 88 UI requirements, 74 tests, minimalist design system, installable tenant PWAs.
- Walkthrough: F-01…F-05 walked by the user (no changes); F-06…F-15 skipped (D-053). F-10 phone install → Phase 2.8.
- `DATA-MODEL.md` **frozen as v1** — the Phase 2 schema is built from it.
- `docs/PHASE-2-PLAN.md` written: architecture, tables, RLS model, auth, storage, server functions, realtime,
  milestones 2.1…2.8, open questions Q-30…Q-35.

## Next up (in order)
1. **You** (see "Before we start" in PHASE-2-PLAN.md): create the Supabase project (Singapore) and put URL + anon key
   in `.env.local`; log in to the Supabase CLI; create the Meta (Facebook) app; connect Vercel (optional now).
2. **You**: answer or accept the proposed defaults for **Q-30…Q-35**.
3. Claude: **Milestone 2.1 Setup** (Supabase CLI + local DB, `packages/db`, env handling, generated types, CI).

## Blockers
- Phase 2 can't connect to Supabase until the project exists (step 1). 2.1 setup work that runs on a local Supabase
  (Docker) can start earlier if Docker Desktop is installed.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 65 / 65 ✅ |
| Requirements — UI (REQUIREMENTS.md) | 88 / 88 ✅ |
| Flows signed off (USER-FLOWS.md) | 7 / 17 walked ✅ · 10 skipped (Phase 1 signed off) |
| Decisions logged (DECISIONS.md) | 55 (D-000…D-054; D-011, D-039 superseded) |
| Open questions answered | 29 / 35 (Q-30…Q-35 new for Phase 2) |
