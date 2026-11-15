# ChowLane

Multi-tenant, white-label **food delivery** platform (Philippines, ₱, cash on delivery).

> Project docs live in [`docs/`](docs/). Start with [`docs/STATUS.md`](docs/STATUS.md).
> Working rules for Claude: [`CLAUDE.md`](CLAUDE.md).

## Monorepo

| Path | What | Dev port |
|---|---|---|
| `apps/landing` | Landing page + Owner signup | 3000 |
| `apps/console` | Owner & Admin console (PWA, `/[tenant]`) | 3001 |
| `apps/rider` | Rider app (PWA, `/[tenant]`) | 3002 |
| `apps/customer` | Customer app (PWA, `/[tenant]`) | 3003 |
| `apps/platform` | ChowLane Platform Admin | 3004 |
| `packages/ui` | Shared UI components + Tailwind theme | — |
| `packages/types` | Domain types (= `docs/DATA-MODEL.md`) | — |
| `packages/mocks` | Phase 1 mock data & scenarios | — |
| `packages/lib` | Business logic (fees, rider pay, status machine, permissions) | — |
| `packages/pwa` | Per-tenant manifest + service worker helpers | — |
| `packages/config` | Shared tsconfig & eslint config | — |

## Commands

```bash
pnpm install
pnpm dev                              # all apps
pnpm --filter @chowlane/customer dev  # one app
pnpm build | pnpm lint | pnpm typecheck
```

Tenant apps are opened per tenant, e.g. http://localhost:3003/fastbite
