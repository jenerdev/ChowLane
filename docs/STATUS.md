# ChowLane — Current Status

> **Read this first every session.** Last updated: 2026-11-15

## Current phase
**Phase 1 — UI Prototype** 🟨 · Next milestone: **1.1 Foundation**
(Phase 0 ✅ done 2026-11-15)

## Current state
- All docs agreed; all 25 open questions answered; 31 decisions logged.
- **Turborepo scaffolded** (git initialised, nothing committed yet):
  - Apps: `landing` :3000, `console` :3001, `rider` :3002, `customer` :3003, `platform` :3004
  - Tenant apps (`console`, `rider`, `customer`) have a working `/[tenant]` route: unknown slug → 404,
    tenant brand color applied via `--brand` CSS variable (mock tenants `fastbite`, `kainexpress`).
  - Packages: `ui` (theme tokens + `AppPlaceholder`), `types` (Centavos, LatLng), `lib` (`formatPeso`),
    `mocks` (2 mock tenants), `pwa` (`buildTenantManifest` — not wired yet), `config` (tsconfig + eslint).
  - `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check` all pass.

## Next up (in order) — Milestone 1.1 Foundation
1. `packages/types`: all entities from DATA-MODEL.md.
2. `packages/mocks`: full mock data + seeded scenarios (order in every status, pending verification, shifts, remittances).
3. `packages/lib`: delivery fee calc (PER_KM / FIXED / PER_BARANGAY), rider pay calc, order status machine,
   permission check, phone helper — with unit tests.
4. `packages/ui`: design system (shadcn/ui on Tailwind v4), mobile-first app shells, placeholder ChowLane brand.
5. Tenant theming (name, logo, color) + PWA wiring: per-tenant `manifest.webmanifest` route, Serwist service worker,
   install sheet, offline page, update banner.
6. Dev role/scenario switcher.
7. Then Milestone **1.2 Landing & Owner Signup**.

## Blockers
- None.

## Progress snapshot
| Area | Done / Total |
|---|---|
| Phase 1 screens (SCREENS.md) | 0 / 59 |
| Requirements — UI (REQUIREMENTS.md) | 1 / 80 |
| Flows signed off (USER-FLOWS.md) | 0 / 13 |
| Decisions logged (DECISIONS.md) | 31 (D-011 superseded) |
| Open questions answered | 25 / 25 ✅ |
