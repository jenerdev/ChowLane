# ChowLane — Design System

> Last updated: 2026-11-15 · Applies to **every app and all future screens** (D-041).
> Style: **simple, minimalist, modern.** Tokens live in `packages/ui/src/styles.css`; components in `packages/ui`.

## Principles

1. **Neutral first.** White backgrounds, zinc greys for text, borders and surfaces. Color is the exception, not the default.
2. **Brand color is for meaning only:** the one primary action per view, the active nav item's icon, focus rings, and
   key highlights. Never for backgrounds of whole sections, headings or decoration. (Tenant apps use the tenant's color
   via `--brand`; landing/platform use ChowLane teal `#0E7C66`.)
3. **Flat.** Borders separate things; shadows only on things that float (sheets, toasts, install card).
4. **One typeface, few weights.** Geist, weights 400 / 500 / 600 only. No bold (700+), no italics for emphasis,
   no all-caps labels.
5. **Whitespace over dividers.** Prefer spacing; when a line is needed use a 1px `border` (zinc-200).
6. **Fewer, clearer words.** Sentence case, plain verbs, buttons say what happens ("Log in", "Create my business").
7. **Calm motion.** 150 ms color/opacity transitions; no entrance animations; respect `prefers-reduced-motion`.
8. **Mobile-first.** Design at 375 px, then scale up. Touch targets ≥ 44 px (`Button` md = 44 px).

## Tokens

| Token (Tailwind) | Value | Use |
|---|---|---|
| `background` | `#FFFFFF` | Page |
| `foreground` | `#18181B` (zinc-900) | Text, primary icons |
| `muted-foreground` | `#71717A` (zinc-500) | Secondary text, hints |
| `muted` | `#F4F4F5` (zinc-100) | Secondary buttons, hover, neutral badge |
| `subtle` | `#FAFAFA` (zinc-50) | Sidebar, quiet section background |
| `border` / `input` | `#E4E4E7` (zinc-200) | All borders and field outlines |
| `brand` / `brand-foreground` | tenant color / auto white-or-ink | Primary button, active icon |
| `brand-soft` | brand at 8% | Rare: brand badge |
| `ring` | brand at 35% | Focus ring |
| `success` `warning` `danger` `info` (+ `-soft`) | green / amber / red / blue | Status text on a very light tint |
| radius `control` | 10 px | Buttons, inputs, list rows |
| radius `card` | 16 px | Cards, sheets, tiles |
| font `sans` | Geist | Everything |

### Type scale
| Role | Size / weight |
|---|---|
| Page title (`PageHeader`) | 22 px / 600, tracking-tight |
| Landing display (`.display`) | 32–60 px / 600, letter-spacing −0.035em |
| Card title | 15 px / 600 |
| Body | 16 px (inputs) / 14–15 px (UI) / 400 |
| Secondary, hints | 13–14 px / 400, `muted-foreground` |
| Badges, nav labels | 11–12 px / 500 |

## Components (use these — don't restyle per screen)

| Component | Notes |
|---|---|
| `Button` | `default` (brand) — **one per view**; `secondary` (zinc-100); `outline`; `ghost`; `destructive`; `link`. Sizes sm 36 / md 44 / lg 48 px. |
| `Input`, `Select`, `Textarea`, `Field` | 44 px, zinc-200 border, zinc-400 border + soft ring on focus, 16 px text. |
| `Card` | Border only, 16 px radius, 20 px padding. |
| `Badge` | Soft tint + colored text, 6 px radius, no border. `OrderStatusBadge`, `VerificationBadge`, `RemitBadge`. |
| `Stat` | Border tile, 13 px label, 24 px semibold number. |
| `Tabs` | Underline style. |
| `Sheet` | Bottom sheet on phones, dialog on desktop. |
| `EmptyState` | Grey icon, one line title, one line description, optional action. |
| `AppShell` | Phone: top bar + bottom tabs (active = ink label, brand icon). Desktop: zinc-50 sidebar, active item = white with hairline border, brand icon. |
| `Avatar`, `TenantLogo` | Neutral initials; tenant logo tile uses brand color. |

## Don'ts
- No gradients, glows, heavy shadows, or colored full-width bands.
- No `font-bold` / `font-extrabold`, no expanded/condensed display fonts.
- No accent color on a single word in a heading; no `→` in buttons; no `A · B · C` meta strings in UI copy.
- No new colors outside the tokens above — add a token here first.

## Changelog
| Date | Change |
|---|---|
| 2026-11-15 | Created. Minimalist system replaces earlier styling (Archivo display type, tinted cards, teal bands). |
