---
phase: 1
slug: foundation
status: draft
shadcn_initialized: true
preset: default-dark
created: 2026-04-01
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Phase 1: Foundation.
> This phase establishes the design system baseline for all future phases.
> The only rendered UI element in Phase 1 is the WebSocket connection status badge.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui |
| Preset | Default dark (standard `npx shadcn init` — no custom preset string) |
| Component library | Radix UI (via shadcn) |
| Icon library | lucide-react (bundled with shadcn default) |
| Font | Inter (Tailwind CSS default via `font-sans`) |

**Init command:** `npx shadcn init` — select Dark theme, CSS variables, Tailwind CSS. Accept all defaults.

**Source:** User confirmed (2026-04-01).

---

## Spacing Scale

Declared values (multiples of 4 only):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge dot-to-label gap |
| sm | 8px | Badge internal padding |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: Badge touch-target minimum 44px height on mobile (accessibility). The visual badge can be smaller; wrap in a 44px tap region.

---

## Typography

Phase 1 has no significant text content. These values are the project baseline for all future phases.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 (regular) | 1.5 |
| Label | 14px | 400 (regular) | 1.4 |
| Heading | 20px | 600 (semibold) | 1.2 |
| Display | 28px | 600 (semibold) | 1.2 |

**Source:** shadcn dark theme defaults. No override required for Phase 1.

---

## Color

shadcn dark theme CSS variables — Tailwind class names listed for executor reference.

| Role | Hex (approx) | Tailwind / shadcn token | Usage |
|------|-------------|------------------------|-------|
| Dominant (60%) | `#09090b` | `bg-background` | Page background, full-screen canvas |
| Secondary (30%) | `#18181b` | `bg-card` | Cards, panels, nav surfaces |
| Accent (10%) | See below | See below | Reserved — see list |
| Destructive | `#ef4444` | `bg-destructive` | Destructive actions only (no Phase 1 usage) |

### Accent color — connection status (Phase 1 specific)

The badge is the only accent consumer in this phase. Two semantic accent values replace the single accent role:

| State | Hex | Tailwind class | Reserved for |
|-------|-----|----------------|-------------|
| Connected | `#10b981` | `bg-emerald-500` | Badge dot when WebSocket is connected |
| Disconnected | `#ef4444` | `bg-red-500` | Badge dot when WebSocket is disconnected or errored |

Accent reserved for: WebSocket status badge dot only. No other element uses color-as-signal in Phase 1.

**Rationale:** Emerald `#10b981` and red `#ef4444` provide >4.5:1 contrast against the `#09090b` dark background, meeting WCAG AA for UI components. Color is never the sole indicator — the badge also shows a text label (see Copywriting). **Source:** Claude's discretion, confirmed by user (2026-04-01).

---

## Component: WebSocket Connection Status Badge

This is the only UI component implemented in Phase 1.

### Anatomy

```
[ dot ] [ label ]
```

- Dot: 8px circle (`w-2 h-2 rounded-full`), colored by connection state
- Label: 14px / weight 400 / `text-muted-foreground` when connected, `text-destructive` when disconnected
- Container: `flex items-center gap-1` with `px-2 py-1 rounded-md bg-card`

### Position

Fixed to bottom-right corner of the viewport.

```
position: fixed
bottom: 16px   (spacing md)
right: 16px    (spacing md)
z-index: 50    (above game content, below modals)
```

**Source:** User confirmed bottom-right position (2026-04-01).

### States

| State | Dot color | Label text |
|-------|-----------|------------|
| Connected | `bg-emerald-500` | "Conectado" |
| Connecting | `bg-yellow-500` (pulse animation) | "Conectando..." |
| Disconnected | `bg-red-500` | "Desconectado" |
| Error | `bg-red-500` | "Erro de conexão" |

**Connecting animation:** Tailwind `animate-pulse` on the dot only. No animation when connected or disconnected.

### Interaction

- Badge is display-only. No click handler.
- No tooltip required in Phase 1.
- Visible at all times during development. Removal or refinement deferred to Phase 7 (D-05 in CONTEXT.md).

### shadcn components used

None. The badge is built from raw Tailwind classes — no shadcn `<Badge>` component needed at this scale. This avoids running `npx shadcn add badge` for a single dev-only indicator.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Badge — connected | "Conectado" |
| Badge — connecting | "Conectando..." |
| Badge — disconnected | "Desconectado" |
| Badge — error | "Erro de conexão" |
| Empty state heading | n/a — Phase 1 has no empty states |
| Empty state body | n/a |
| Error state | n/a — connection error is shown in badge only; no modal or toast in Phase 1 |
| Destructive confirmation | n/a — no destructive actions in Phase 1 |

**Language:** Portuguese (pt-BR). All copy follows this convention for the entire project.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none (init only) | not required |

No third-party registries. No `npx shadcn add` calls in Phase 1 — the design system is initialized but no components are installed. Components will be added in Phase 2+ as needed.

---

## Tailwind Configuration Notes

The executor must verify `tailwind.config.ts` after `npx shadcn init` includes:

- `darkMode: ["class"]` — shadcn dark mode strategy
- `content` glob covers `apps/frontend/src/**/*.{ts,tsx}`
- `theme.extend.colors` contains shadcn CSS variable mappings (auto-generated by init)

No custom tokens need to be added in Phase 1. The emerald and red values for the badge use Tailwind's built-in `emerald-500` and `red-500` — no custom color registration required.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
