# ChowLane — Claude Working Instructions

ChowLane is a **multi-tenant, white-label delivery platform**. A business owner signs up and runs their
own delivery business under their own brand and business name: they set up merchants and products,
configure delivery pricing and rider pay, add admins and riders, and customers order through the
owner's branded customer app.

## Every session — START

1. Read `docs/STATUS.md` → current phase, what was done last, and **what to do next**.
2. Read the latest entries in `docs/PROGRESS-LOG.md`.
3. Skim `docs/BUSINESS-LOGIC.md` before touching anything involving orders, pricing, rider pay,
   customer verification, permissions, or tenants.
4. Check `docs/DECISIONS.md` → "Open Questions" before assuming anything the user hasn't confirmed.

## Every session — END (or after every finished task)

Docs are the source of truth. Update them **in the same session** as the code change:

| What happened | Update |
|---|---|
| Finished / started a requirement | `docs/REQUIREMENTS.md` status column |
| Built or changed a screen | `docs/SCREENS.md` status column + progress count |
| Any work done | `docs/PROGRESS-LOG.md` — new dated entry at the TOP |
| Phase / next step changed | `docs/STATUS.md` — "Current State" + "Next Up" + progress snapshot |
| New or changed rule (pricing, statuses, permissions, verification…) | `docs/BUSINESS-LOGIC.md` + its change log |
| Flow changed | `docs/USER-FLOWS.md` |
| A decision was made or a question answered | `docs/DECISIONS.md` (move the question into the decision log) |
| Entity / field added or changed | `docs/DATA-MODEL.md` |
| Package / tool added or removed | `docs/TECH-STACK.md` |

## Rules

- **Phase 1 is UI ONLY.** No Supabase, no real API, no real auth. Use typed mock data from
  `packages/mocks` and client-side state. Every mock must match `docs/DATA-MODEL.md` so Phase 2 can
  swap mocks for Supabase queries without rewriting screens.
- **Mobile-first web design** for every app (including the Owner/Admin console). Design at ~375px
  first, then scale up.
- **Every tenant app (`console`, `rider`, `customer`) must stay installable as a PWA**, branded per
  tenant: routes live under `/[tenant]/…`, each tenant gets its own manifest (name, icon, theme color).
  Don't break the manifest, service worker or install prompt (see TECH-STACK "PWA").
- `apps/platform` is the **ChowLane Platform Admin** console (the product owner): it sees **all** tenants and is
  ChowLane-branded. It is read-only on tenant data except billing config and tenant status.
- Every tenant-level entity carries a `tenantId`. Never write UI that assumes a single tenant.
- Tenant branding (business name, logo, primary color) comes from tenant config — never hardcode
  "ChowLane" in the customer or rider apps.
- Admin features must be gated by **permissions** (see BUSINESS-LOGIC BL-2). The Owner always has all
  permissions.
- Don't invent business rules. If something is unclear, add it to "Open Questions" in
  `docs/DECISIONS.md` and ask the user.
- Status legend used across all docs: ⬜ Not started · 🟨 In progress · ✅ Done · ⏸️ Blocked · ❌ Dropped

## Doc map

| File | Purpose |
|---|---|
| `docs/STATUS.md` | Where we are + what's next (read first) |
| `docs/PROGRESS-LOG.md` | Dated session journal |
| `docs/PRODUCT-OVERVIEW.md` | Vision, users, apps, glossary |
| `docs/ROADMAP.md` | Phases & milestones |
| `docs/REQUIREMENTS.md` | Numbered functional requirements + status |
| `docs/SCREENS.md` | Phase 1 screen inventory + status |
| `docs/USER-FLOWS.md` | Step-by-step flows per user |
| `docs/BUSINESS-LOGIC.md` | Rules: permissions, verification, order lifecycle, pricing, rider pay, shifts |
| `docs/DATA-MODEL.md` | Entities & fields (mock shapes now, Supabase schema later) |
| `docs/TECH-STACK.md` | Tech choices + monorepo layout |
| `docs/DECISIONS.md` | Decision log + open questions |
