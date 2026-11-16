# ChowLane — Tech Stack

> Last updated: 2026-11-15

## Confirmed by user
- **Next.js** in a **Turborepo** monorepo
- **Supabase** for the backend (Phase 2+)
- **UI first**, **mobile-first web** design
- **Every tenant app installable as a PWA** (`console`, `rider`, `customer`)
- Maps: **Leaflet + OpenStreetMap** in Phase 1 (D-009); **Google Maps Platform** in Phase 3 for address search + road distance (Q-11)
- Service worker: **Serwist** (D-015)

## Installed versions (scaffolded 2026-11-15)

| Tool | Version | Note |
|---|---|---|
| Node.js | ≥ 20.9 (dev machine: 24.x) | Next.js requirement |
| pnpm | 12.5.1 | `packageManager` in root `package.json` |
| Turborepo | 2.11.11 | tasks: `dev`, `build`, `lint`, `typecheck`, `test` |
| Next.js | 16.4.6 (App Router, Turbopack) | `params` are Promises (`await params`) |
| React | 19.3.1 | |
| TypeScript | **5.9.3** | Not 7.x yet — D-031 |
| Tailwind CSS | 4.3.5 (`@tailwindcss/postcss`) | Theme tokens in `packages/ui/src/styles.css` (`@theme`) |
| ESLint | 10.15.0 (flat config) + `eslint-config-next` 16.4.6, `typescript-eslint` 8.72.2 | Shared in `packages/config/eslint` |
| Prettier | 3.10.1 | `pnpm format` / `pnpm format:check` |
| Vitest | 5.1.0 | `pnpm test` — `packages/lib` (business rules) + `packages/mocks` (data integrity) |
| Zustand | 5.1.0 | Mock store per app (`@chowlane/mocks/store`) |
| Radix UI | `radix-ui` 1.8.1 | Primitives behind `Sheet`, `Tabs`, `Switch` |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.7.0 | shadcn-style variants + `cn()` |
| lucide-react | 1.73.0 | Icons (stroke 1.75) |
| Font | **Geist** via `next/font/google` (`--font-geist`) in every app | D-041, docs/DESIGN.md |
| Serwist | `@serwist/turbopack` + `serwist` 9.5.13, `esbuild` 0.28.2 | PWA service worker (D-035) |
| Supabase CLI | `supabase` 3.1.0 (root dev dependency) | `pnpm db:start` / `db:stop` / `db:status` / `db:reset` / `db:env` / `db:types` / `db:seed:gen` / `db:test:gen` / `db:test` — D-056, D-058 |
| Supabase JS | `@supabase/supabase-js` 2.119.0, `@supabase/ssr` 0.12.7 | In `@chowlane/db` only |
| Docker Desktop | dev machine | Runs the local Supabase stack |
| tsx | 4.23.15 (`@chowlane/db` dev) | Runs the seed / RLS-test generators (`pnpm db:seed:gen`, `pnpm db:test:gen`) |
| pgTAP | bundled with Supabase | RLS tests: `pnpm db:test` (`supabase test db`) — D-058 |
| GitHub Actions | `.github/workflows/ci.yml` | job `check`: format → lint → typecheck → test → build; job `database`: Postgres + RLS tests + generated-files check |

pnpm 12 runs dependency install scripts only when allowed: see `allowBuilds` in `pnpm-workspace.yaml`.

Internal packages are **source-only** (`exports` → `./src/index.ts`, no build step); apps compile them via
`transpilePackages` in each `next.config.ts`.

## Monorepo layout (confirmed — D-007)

```
chowlane/
  apps/
    landing/      → Landing page + Owner signup          (port 3000)  not a PWA
    console/      → Owner & Admin dashboard   PWA         (port 3001)  route: /[tenant]/...
    rider/        → Rider app                 PWA         (port 3002)  route: /[tenant]/...
    customer/     → Customer app              PWA         (port 3003)  route: /[tenant]/...
    platform/     → Platform Admin console (ChowLane)     (port 3004)  route: /tenants/[id]/...  ChowLane-branded
  packages/
    ui/           → shared components (shadcn/ui + Tailwind), tenant theme provider,
                    PWA install prompt, offline page, update banner
    pwa/          → shared PWA helpers: per-tenant manifest builder, service worker config
    types/        → domain types (= docs/DATA-MODEL.md)
    mocks/        → Phase 1 mock data + seeded scenarios
    db/           → Supabase access (Phase 2): typed server/browser clients, env check, generated types
    lib/          → shared logic: delivery-fee calculator, rider-pay calculator,
                    order status machine, permission checks
    config/       → shared tsconfig, eslint, tailwind preset
  supabase/       → config.toml, migrations/, seed.sql (generated), tests/database/ (pgTAP, generated)
  scripts/        → db-env.mjs (writes apps/*/.env.local)
  turbo.json
  pnpm-workspace.yaml
```

Business rules (pricing, pay, status transitions, permissions) live in `packages/lib` as pure
functions so the same code runs in the UI now and in Supabase Edge Functions / server code later.

## Phase 1 — UI only

| Concern | Choice |
|---|---|
| Monorepo | **Turborepo + pnpm workspaces** |
| Framework | **Next.js (App Router), latest stable**, TypeScript |
| Styling | **Tailwind CSS**, mobile-first; tenant color via CSS variables |
| Components | **shadcn/ui** (in `packages/ui`) + **lucide-react** icons |
| State / mock "backend" | **Zustand** (persisted to localStorage, per app) |
| Forms & validation | **react-hook-form + zod** (schemas reused in Phase 2) |
| Maps (display) | **Leaflet + OpenStreetMap** via react-leaflet — free, no API key |
| Distance (per-km fee) | Straight-line (haversine) estimate in `packages/lib` |
| Browser location | `navigator.geolocation` (real permission prompt, used for the location gate) |
| Facebook login | **Mock button** (no real OAuth in Phase 1) |
| PWA | **Serwist** service worker + per-tenant dynamic manifest (fully working in Phase 1) |
| ID upload | Local file preview only (not stored) |
| Charts | Recharts |
| Money / phone formatting | `Intl.NumberFormat('en-PH', PHP)` helper + PH phone helper in `packages/lib` |
| Lint / format | ESLint + Prettier |

## PWA (all tenant apps, built in Phase 1)

| Piece | How |
|---|---|
| Manifest per tenant | Route handler `app/[tenant]/manifest.webmanifest/route.ts` returns `name`/`short_name` = tenant business name, `theme_color`/`background_color` = tenant color, `icons` = tenant icons, `start_url` & `scope` = `/[tenant]/`, `display: standalone`, unique `id` per tenant+app. Linked from `app/[tenant]/layout.tsx`. |
| Service worker | **Serwist** (`@serwist/turbopack`; route `app/serwist/[path]`, source `packages/pwa/src/worker.ts`; disabled in `next dev`) — precache app shell & static assets, offline fallback page, no caching of private API data |
| Icons | Phase 1: mock tenants ship pre-made 192 / 512 / maskable PNGs + Apple touch icon. Phase 2: generated from the uploaded logo (Supabase Storage + Edge Function / `sharp`). |
| iOS | `apple-touch-icon`, `apple-mobile-web-app-capable`, status-bar style meta tags; iOS has no install prompt → show "Share → Add to Home Screen" instructions |
| Android / desktop Chrome | Capture `beforeinstallprompt` → custom **Install app** button / sheet |
| Updates | New service worker waiting → "New version available — Reload" banner |
| Push notifications (Phase 3) | Web Push via service worker (iOS 16.4+ only when installed) |
| Requirements | HTTPS in production (localhost is fine for dev) |

**Known PWA limits (accepted):**
- No background location: the rider's location is only sent while the rider app is **open** (screen on / app in foreground). Rider app must ask riders to keep it open while on shift.
- iOS: push only works for installed PWAs; storage may be cleared if unused for weeks.
- App name/icon changes after branding update may need the user to re-install on some devices.

**Phase 1 limitation:** each app runs on its own port (= separate browser storage), so actions in one
app don't appear live in another. Instead, `packages/mocks` provides **seeded scenarios** (e.g. an
order in each status) so every screen can be reviewed. Live cross-app sync comes with Supabase in Phase 2.
*(DECISIONS D-008)*

## Phase 2+ — Supabase backend

| Concern | Supabase feature |
|---|---|
| Database | **Postgres**; every tenant table has `tenant_id` |
| Tenant isolation | **Row Level Security (RLS)** policies by `tenant_id` + role; Platform Admin role gets **read-all** policies (+ write on billing & tenant status only) |
| Auth — Owner / Admin / Rider | Supabase Auth (email + password; phone OTP optional) |
| Auth — Customer | Supabase Auth **Facebook OAuth provider** (needs a Meta developer app) |
| Customer ID images | Supabase **Storage**, private bucket, signed URLs, admin-only access |
| Live order status & rider location | Supabase **Realtime** |
| Server logic (approvals, pay calc, notifications) | Postgres functions / **Edge Functions** |
| Geo queries (service area, nearest rider) | **PostGIS** extension |
| Hosting | Vercel (5 Next.js apps) + Supabase cloud |
| Payments | **None for MVP — Cash on Delivery only** (D-019). Post-MVP: PayMongo or Xendit for GCash / Maya / card |

## Local Supabase (Phase 2 — D-056)

1. Start Docker Desktop, then `pnpm db:start` (first run pulls the images). ChowLane uses ports **553xx**
   (API `http://127.0.0.1:55321`, DB `55322`, Studio `http://127.0.0.1:55323`, Mailpit `55324`) so it can run beside
   other local Supabase projects on the default 543xx ports.
2. `pnpm db:env` writes `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `apps/{console,rider,customer,platform}/.env.local`
   (git-ignored). For the hosted project: set both variables in the shell and run `pnpm db:env -- --from-env`, or copy
   `.env.example`. Never put the service-role key in an app.
3. `pnpm dev` → `GET /api/health` on ports 3001–3004 returns `{ ok: true }` when the app reaches Supabase.
4. After a migration: `pnpm db:reset` (re-applies migrations + seed) and `pnpm db:types` (regenerates
   `packages/db/src/database.types.ts`; commit it).
5. Demo data: `pnpm db:seed:gen` rebuilds `supabase/seed.sql` from `@chowlane/mocks`. Local demo logins (password
   `demo1234`): staff / platform admin by email (e.g. `marco@fastbite.ph`, `owner@chowlane.app`), riders by phone,
   customers as `<facebookId>@demo.chowlane.local`. Studio: http://127.0.0.1:55323.
6. RLS tests: `pnpm db:test:gen` (after changing policies or the matrix in `packages/db/scripts/gen-rls-tests.ts`),
   then `pnpm db:test`.
7. New tables: enable RLS in the same migration — Supabase grants new tables to `anon` / `authenticated` by default.

Apps import `createServerSupabase()` from `@chowlane/db/server` (Server Components / Actions / Route Handlers, user
session → RLS) and `createBrowserSupabase()` from `@chowlane/db/browser` (Client Components). Env values are read
lazily, so `pnpm build` works without a database.

## Map provider — options (decided: Google Maps for Phase 3)

| Option | Good for | Cost |
|---|---|---|
| **Leaflet + OSM** | Display maps, markers | Free (Phase 1 default) |
| **Google Maps Platform** | Best address search & road distance (Distance Matrix / Routes) for per-km pricing, navigation links | Pay-as-you-go after free credit |
| **Mapbox** | Nice styling, directions API | Free tier then paid |

**Recommendation:** Leaflet + OSM in Phase 1. In Phase 3 add Google Maps (or Mapbox) only for
**address search + road distance**, since per-km pricing needs real road distance.
