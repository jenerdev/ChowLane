# ChowLane — Progress Log

> Newest entry at the TOP. One entry per working session.
> Template:
> ```
> ## YYYY-MM-DD — <short title>
> **Done:** …
> **Changed docs:** …
> **Decisions:** …
> **Stopped at / Next:** …
> ```

---

## 2026-11-15 — Minimalist restyle (all apps)

**Done:** User asked for a simple, minimalist, modern UI for all apps and future work → new `docs/DESIGN.md` + rule in
CLAUDE.md (D-041). `packages/ui` tokens (zinc neutrals, brand only for primary/active/focus), Geist font in all 5 apps,
flat Card/Stat/Badge, underline Tabs, slimmer Switch, quieter sidebar & bottom nav, lighter icons; landing/signup/login
simplified (no teal bands, no display font, neutral links); `font-bold` removed everywhere; DEV pill moved bottom-right.
Checked in browser: landing, console home, customer home. Build/lint/typecheck/tests pass.

**Stopped at / Next:** Uncommitted (1.2 + restyle). Next: commit, phone-width pass, Milestone 1.3.

---

## 2026-11-15 — Milestone 1.2 Landing & Owner Signup ✅

**Done:**
- Landing page (S-001) with live brand-builder hero + phone preview, how it works, local features (COD, pabili,
  verified customers, fees, rider pay, promos), three apps, FAQ. Archivo variable font (D-039).
- Signup wizard (S-002): 6 steps + done screen; validation via new `@chowlane/lib` signup helpers (slugify, slug
  rules/reserved/taken + suggestions, email, password, color) — 4 new tests (32 lib tests).
- Find-your-console page (S-003) and console login (S-100) with mock session (`useSession` in `@chowlane/mocks/react`),
  login guard + log out (D-040).
- Refactor: tenant apps split into `[tenant]/layout` (branding, PWA, DEV) and `[tenant]/(app)/layout` (shell, nav).
- Browser-tested; fixed 4 bugs (unstable Zustand selectors → React #185, install prompt re-showing, `Button block`
  overflow, squashed phone-layout nav). New rule in CLAUDE.md about Zustand selectors.

**Changed docs:** REQUIREMENTS (LND-001…004 ✅), SCREENS (S-001, S-002, S-003 new, S-100 ✅), USER-FLOWS (F-01 rewritten,
F-01b new), BUSINESS-LOGIC (BL-15 new), DECISIONS (D-038…D-040), ROADMAP (1.2 ✅), STATUS, CLAUDE.md.

**Stopped at / Next:** Uncommitted. Next: commit, phone-width pass, then Milestone 1.3.

---

## 2026-11-15 — Q-26…Q-29 answered

**Done:** User accepted Claude's recommendations (D-037): rider pay uses the original delivery fee (BL-13.6); one promo per
order — coupon OR free-delivery reward, points & free gift combine (BL-14.6); free gift optionally tied to a menu item and
then only on that merchant's orders (BL-14.3b); points don't expire in MVP (BL-14.9). All 29 questions answered.

**Stopped at / Next:** Milestone 1.2 Landing & Owner Signup. Nothing committed yet.

---

## 2026-11-15 — Milestone 1.1 Foundation ✅ + coupons & loyalty added

**Done:**
- `packages/types`: all DATA-MODEL entities. `packages/lib`: all business rules as pure functions + Vitest (28 tests).
  `packages/mocks`: 3 tenants with contrasting settings, orders in every status, every verification/remittance state,
  coupons & loyalty data; Zustand mock store per app; DEV switcher (apps, tenants, "acting as", reset) — 6 integrity tests.
- `packages/ui`: shadcn-style design system on Tailwind v4 + Radix, mobile-first `AppShell`, placeholder ChowLane brand, `TenantTheme`.
- `packages/pwa` + app wiring: per-tenant manifest & generated icons, Serwist (`@serwist/turbopack`) service worker,
  install sheet (Android/iOS), offline page/banner, update banner. Verified on `next start`.
- User asked for **coupons** (% off or free delivery, max uses, validity) and a **loyalty program** (on/off; free delivery
  after N orders, free gift after X orders, points to pay for food; tenant picks rules) → BL-13, BL-14, DATA-MODEL v0.4,
  OWN-017…019, ADM-013, RID-015, CUS-013…015, screens S-125…127 & S-310, flows F-13…F-15, D-033/D-034, Q-26…Q-29.
- Tooling: pnpm `allowBuilds`, ESLint `_`-prefixed unused vars allowed, `test` task in Turbo.

**Verified:** build ✅ lint ✅ typecheck ✅ test ✅ (34) format ✅.

**Decisions:** D-032 light theme only, D-033 coupons, D-034 loyalty, D-035 Serwist Turbopack, D-036 Zustand mock store.

**Stopped at / Next:** Nothing committed yet. Next: Milestone 1.2 Landing & Owner Signup (after Q-26…Q-29 or with the proposed defaults).

---

## 2026-11-15 — Turborepo scaffold (Phase 0 complete)

**Done:**
- `git init`; pnpm 12.5 workspace + Turborepo 2.11 (`dev`, `build`, `lint`, `typecheck`), Prettier, EditorConfig, README.
- 5 Next.js 16.4 apps (React 19.3, Tailwind 4.3, TS 5.9): landing :3000, console :3001, rider :3002, customer :3003, platform :3004.
- Tenant apps have `/[tenant]` layout (404 for unknown slug, `--brand` color from mock tenant) + dev tenant picker at `/`.
- Packages: `config` (shared tsconfig + ESLint flat configs), `ui`, `types`, `lib` (`formatPeso`), `mocks` (fastbite, kainexpress), `pwa` (`buildTenantManifest`).
- Verified: build ✅, lint ✅, typecheck ✅, format ✅; `customer` started → `/fastbite` 200 with brand color, `/nope` 404.

**Changed docs:** TECH-STACK (installed versions), DECISIONS (D-031 TypeScript 5.9), ROADMAP (Phase 0 ✅, Phase 1 🟨), REQUIREMENTS (FND-001 ✅), STATUS.

**Stopped at / Next:** Nothing committed yet. Next: Milestone 1.1 Foundation (types → mocks → lib → ui → theming/PWA → role switcher).

---

## 2026-11-15 — Answering open questions

**Done:**
- Q-01 answered → **food delivery only** (D-017, BL-1.6). Updated PRODUCT-OVERVIEW, DATA-MODEL comments.
- Q-02 answered → **Philippines, Philippine Peso (₱)** (D-018, BL-7.8): centavos storage, `Asia/Manila`, +63 phones. Updated DATA-MODEL, PRODUCT-OVERVIEW, TECH-STACK.
- Q-03 answered → **Cash on Delivery only for MVP** (D-019, BL-7.7). Added "change for" at checkout, rider "cash collected" step (RID-010), Order `paymentStatus`/`changeFor`. New question **Q-20** (rider cash remittance).
- Q-04 answered → **rider buys & pays at the store ("pabili")** (D-020, BL-4.4, new BL-11). No merchant commission/payouts. Added RID-011…013, OWN-013, CUS-011; Order receipt/amount-paid fields; Product `storePrice`. New questions **Q-21** (price differences), **Q-22** (max order amount).
- Q-05 answered → **Dispatch mode AUTO / MANUAL** (Owner or Admin), **rider can reject**, rejected orders auto- or manually reassigned to online riders (D-021, BL-5 rewritten). Open "first come" pool removed. Added ADM-010/011, S-121 Dispatch screen, permission `settings.dispatch`, Order `pendingOffer` + `assignmentAttempts`. New question **Q-23** (response timeout / no rider available).
- Q-06 answered → rider income set by Owner: **fixed daily / % of delivery fee / fixed per delivery** (D-022, BL-8.1).
- Delivery fee set by Owner **or Admin**: **per km (store → customer) / fixed / per barangay price list** (D-023, BL-7.2). Added OWN-014 + S-122 Barangay price list, `BarangayFee` entity, barangay on Address/Order, default Admin role gets `settings.pricing`. New questions **Q-24** (barangay fee by customer barangay only?), **Q-25** (pick vs auto-detect barangay).
- Q-08 answered → **rejected customers can re-submit a new ID** (D-024, BL-3.6). Added CUS-012, `Verification` history in DATA-MODEL, ADM-001 shows previous submissions.
- Q-09 answered → **valid Philippine IDs** (incl. school ID, driver's license, passport, UMID) + **selfie holding the ID** required (D-025, BL-3.3a–d). Added `IdType` list, `idFrontUrl`/`selfieWithIdUrl`, OWN-015 accepted ID types setting.
- Q-10 answered → **ChowLane billing configurable per tenant** (D-026). User also wants a **Platform Admin console** to monitor all tenants (stats, riders, all records) → now in Phase 1 (D-027, replaces D-011). New app `apps/platform`, new role U0 Platform Admin, PLT-001…010 + OWN-016, screens S-500…510 + S-123, milestone 1.7, BL-10 rewritten (billing models FREE / MONTHLY / PER_ORDER / MONTHLY_PLUS_PER_ORDER, statements, suspend), DATA-MODEL `PlatformAdmin`, `TenantBilling`, `BillingStatement`, flows F-11/F-12. D-028 proposed: platform view is read-only.
- User said **"ok to all the rest"** → all remaining questions resolved with Claude's suggestions (D-029) and D-028 confirmed: daily pay no minimum hours; Google Maps in Phase 3; every order needs approval (+ optional auto-approve); one active order per rider; Facebook-only login; one Owner; pin adjust ≤200 m; placeholder ChowLane brand; **cash remitted at end of every shift, admin records it** (D-030, new BL-12, ADM-012, RID-014, S-124, S-207, `cash.manage`); business absorbs store price differences; max order ₱2,000; 60s rider response; barangay fee by customer barangay, customer picks it.

**Stopped at / Next:** All questions answered → Phase 0 done except scaffold. Next: git init + Turborepo scaffold, then Milestone 1.1 Foundation.

---

## 2026-11-15 — All proposed decisions confirmed

**Done:** User approved every proposed decision. D-007…D-011 and D-014…D-016 → ✅ Confirmed (all 17 decisions confirmed).
Synced related docs: BL-2.3, BL-9.3, BL-9.5, BL-9.6, BL-10.1 → [CONFIRMED]; TECH-STACK monorepo layout, Leaflet/OSM and
Serwist marked confirmed; Q-19 answered (rider location only while app open); Q-11 narrowed to the Phase 3 map provider.

**Not changed:** other [PROPOSED] business rules and open questions Q-01…Q-18 still need answers.

**Stopped at / Next:** Answer remaining open questions (esp. Q-04) → scaffold Turborepo → Milestone 1.1.

---

## 2026-11-15 — PWA + no merchant portal

**Done:**
- User confirmed **every tenant app (console, rider, customer) is installable as a PWA**. Added per-tenant
  manifest, Serwist service worker, install sheet (Android + iOS), offline page, update banner. All tenant-app
  routes moved under `/[tenant]/`. PWA work moved from Phase 4 into Phase 1 Foundation; Web Push in Phase 3.
- User confirmed **no merchant portal** — Owner **or Admin** sets up merchants & products. Default Admin role
  now includes `merchants.manage` + `products.manage`.

**Changed docs:** CLAUDE.md, PRODUCT-OVERVIEW, TECH-STACK (PWA section), ROADMAP, REQUIREMENTS (FND-008…013 → 57),
SCREENS (S-010…012, `/[tenant]` routes → 43), USER-FLOWS (F-03b, F-10), BUSINESS-LOGIC (BL-9 PWA, BL-1.4),
DATA-MODEL v0.3 (Tenant PWA fields), DECISIONS (D-006 & D-013 confirmed, D-014…016, Q-12 answered, Q-19 new).

**Stopped at / Next:** Same as before — waiting on open questions (esp. Q-04, Q-19), then scaffold Turborepo.

---

## 2026-11-15 — Docs v1 from user requirements

**Done:**
- Rewrote all docs based on the user's requirements:
  - Users: **Owner** (does everything, sets up merchants/products/prices, delivery pricing FIXED/PER_KM,
    rider pay COMMISSION/DAILY/PER_DELIVERY, manages admins & their permissions), **Admin** (verify first-time
    customers, approve orders, monitor orders, manual assign, monitor riders, riders CRUD), **Rider** (time in/out,
    accept orders), **Customer** (Facebook signup, location required, ID on first order, track order).
  - Landing page + owner signup.
  - Tech: Next.js Turborepo, Supabase, mobile-first web, UI first. Map provider still open.
- Merchant portal and Platform Admin removed from Phase 1 (merchants = owner-managed records).

**Changed docs:** all (CLAUDE.md, PRODUCT-OVERVIEW, TECH-STACK, ROADMAP, REQUIREMENTS → 51 reqs, SCREENS → 40 screens,
USER-FLOWS → 9 flows, BUSINESS-LOGIC, DATA-MODEL v0.2, DECISIONS → 18 open questions, STATUS).

**Decisions:** D-001…D-005 confirmed; D-006…D-011 proposed.

**Stopped at / Next:** Waiting for answers to open questions (esp. Q-04). Then scaffold Turborepo and start Milestone 1.1.

---

## 2026-11-15 — Project kickoff & documentation

**Done:** Created first documentation set (v0, Claude's draft before user requirements).

**Stopped at / Next:** Superseded by v1 above.
