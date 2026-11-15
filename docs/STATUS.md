# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Milestones **1.1–1.7 ✅** · **1.8 build done — waiting for your walkthrough & sign-off**

## Current state
- All 65 Phase 1 screens and 88 UI requirements are built (only FND-013 is backend-only).
- 1.8 so far:
  - Last two screens: **S-120 rider pay report** (Console → Riders → Pay) and **S-123 plan & billing** (Console →
    Settings → Plan & billing, owner only). New lib `riderPayReport` (+ test).
  - Shared clean-ups (D-051): one `ReasonSheet`, `useNow`/`useTicker`, `PhotoInput`, `newId`, `useStoreHydrated`,
    `couponRelease` + `promoRefunds` — duplicates removed from the apps.
  - **Phone preview** dev page `http://localhost:3000/preview` (D-050) — first real phone-width check of every app:
    layouts, bottom tabs and the console "More" tab look right. Next.js dev badge turned off.
  - **`docs/WALKTHROUGH.md`**: checklist of all 17 flows with demo logins, for sign-off.
- Checks: build ✅ lint ✅ typecheck ✅ tests ✅ (74) format ✅.
- Uncommitted: 1.8 work.

## Next up (in order)
1. Commit 1.8.
2. **You**: walk the flows in `docs/WALKTHROUGH.md` (start with DEV → Reset demo data in each app) and note changes.
3. F-10 on real phones: deploy a preview with HTTPS (Vercel) or use a tunnel, then install the tenant apps (D-052).
4. Apply requested changes → sign-off → freeze `DATA-MODEL.md` as v1.
5. Phase 2 kickoff: Supabase project, schema from DATA-MODEL v1, RLS, auth (email + Facebook), replace mocks.

## Blockers
- Sign-off needs your walkthrough.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 65 / 65 ✅ |
| Requirements — UI (REQUIREMENTS.md) | 88 / 88 ✅ |
| Flows signed off (USER-FLOWS.md) | 0 / 17 (16 clickable) |
| Decisions logged (DECISIONS.md) | 53 (D-000…D-052; D-011, D-039 superseded) |
| Open questions answered | 29 / 29 ✅ |
