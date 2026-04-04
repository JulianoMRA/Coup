---
phase: 04-basic-game-loop
plan: "02"
subsystem: ui
tags: [react, typescript, socket.io, tailwind, shadcn]

requires:
  - phase: 04-01
    provides: backend GAME_ACTION dispatcher and STATE_UPDATE emission via socket

provides:
  - useGame hook subscribing to STATE_UPDATE socket events and exposing ClientGameState
  - PlayerPanel component showing players with coins, card count, eliminated badge, active turn ring
  - ActionBar component with Renda/Ajuda Externa/Golpe buttons and forced coup logic
  - GameLog component with scrollable, accessible log entries
  - GameBoard top-level layout composing all sub-components for desktop and mobile

affects: [04-03, 04-04, phase-05-reactions]

tech-stack:
  added: []
  patterns:
    - "useGame mirrors useLobby pattern — socket events set state, cleanup in useEffect return"
    - "ActionBar emits GAME_ACTION directly via socket for Income and Foreign Aid; Coup defers to onSelectCoupTarget callback (wired in Plan 03)"
    - "GameBoard composes all game display components — single entry point for game UI"

key-files:
  created:
    - apps/frontend/src/hooks/use-game.ts
    - apps/frontend/src/components/player-panel.tsx
    - apps/frontend/src/components/game-log.tsx
    - apps/frontend/src/components/action-bar.tsx
    - apps/frontend/src/components/game-board.tsx
  modified: []

key-decisions:
  - "ActionBar Coup button calls onSelectCoupTarget() callback instead of emitting GAME_ACTION directly — target selection wired in Plan 03"
  - "selectingCoupTarget state lives in GameBoard (not ActionBar) — Plan 03 will render CoupTargetSelector based on that state"
  - "GameLog uses role=log + aria-live=polite for screen reader accessibility"

patterns-established:
  - "Game UI components receive ClientGameState as prop from parent which calls useGame — avoids prop drilling socket"
  - "Forced coup guard (myCoins >= 10) disables non-Coup buttons at ActionBar level"

requirements-completed: [TURN-01, TURN-02, TURN-03, LOG-01, LOG-02, LOG-03]

duration: 8min
completed: 2026-04-04
---

# Phase 4 Plan 02: Basic Game Loop UI Summary

**React game UI — useGame hook, PlayerPanel, ActionBar, GameLog, and GameBoard composing the full game display with socket-driven state updates and PT-BR copywriting**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-04T15:21:00Z
- **Completed:** 2026-04-04T15:29:37Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- useGame hook subscribes to STATE_UPDATE and ERROR socket events, exposing ClientGameState
- PlayerPanel renders all players with coins, card count badges, eliminated badge, active turn ring with aria-current
- ActionBar renders Income/Foreign Aid/Coup buttons with correct disable logic (not my turn, forced coup at 10+ coins, insufficient coins for Coup)
- GameLog renders scrollable entries with role="log" aria-live="polite" and auto-scroll to bottom
- GameBoard composes all sub-components into responsive layout (two-column desktop, single-column mobile with toggleable log)

## Task Commits

1. **Task 1: useGame hook, PlayerPanel, GameLog** - `1d0fc29` (feat)
2. **Task 2: ActionBar and GameBoard layout** - `4db5863` (feat)

## Files Created/Modified

- `apps/frontend/src/hooks/use-game.ts` - Socket-driven hook exposing ClientGameState via STATE_UPDATE listener
- `apps/frontend/src/components/player-panel.tsx` - Player list with coins, cards, eliminated badge, active turn ring
- `apps/frontend/src/components/game-log.tsx` - Scrollable accessible game log with auto-scroll to bottom
- `apps/frontend/src/components/action-bar.tsx` - Fixed bottom bar with Income/Foreign Aid/Coup buttons and forced coup notice
- `apps/frontend/src/components/game-board.tsx` - Top-level layout composing all sub-components with desktop/mobile responsiveness

## Decisions Made

- ActionBar Coup button calls `onSelectCoupTarget()` callback rather than emitting GAME_ACTION directly — target selection is Plan 03 scope
- `selectingCoupTarget` state lives in GameBoard so Plan 03 can render CoupTargetSelector conditionally
- ConnectionBadge reused from existing component (fixed position bottom-right) — header shows room name only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

- `selectingCoupTarget` state in GameBoard is set to `true` when Coup button is clicked, but no CoupTargetSelector component is rendered yet — Plan 03 will wire this. The Coup action cannot complete end-to-end until Plan 03 is executed. Income and Foreign Aid are fully functional.

## Next Phase Readiness

- All game display components ready for Plan 03 integration (Coup target selection, reaction buttons)
- GameBoard accepts `game: ClientGameState` prop — Plan 04 will wire the room page to call useGame and pass the result

---
*Phase: 04-basic-game-loop*
*Completed: 2026-04-04*
