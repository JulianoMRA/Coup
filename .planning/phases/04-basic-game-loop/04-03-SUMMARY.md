---
phase: 04-basic-game-loop
plan: 03
subsystem: ui
tags: [react, typescript, socket.io, next.js, game-ui]

# Dependency graph
requires:
  - phase: 04-basic-game-loop/04-02
    provides: GameBoard, ActionBar, PlayerPanel, useGame hook, GameLog
  - phase: 03-game-engine-fsm
    provides: FSM with AWAITING_COUP_TARGET phase, LOSE_INFLUENCE action, GAME_OVER phase
provides:
  - CoupTargetSelector: target selection UI emitting COUP action via socket
  - InfluenceCardSelector: card choice UI using originalIndex for LOSE_INFLUENCE
  - WinnerOverlay: full-screen GAME_OVER overlay with winner name
  - GameBoard: fully wired with all interaction components and phase-driven logic
  - Room page: lobby-to-game transition via GAME_STARTED socket event
affects: [05-reactions-and-challenges, 06-reconnect-rejoin]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "originalIndex from myHand.map (not filtered index) prevents wrong-card reveal"
    - "Phase-driven conditional rendering: selectingCoupTarget reset useEffect on phase change"
    - "GAME_STARTED event as lobby-to-game transition signal"

key-files:
  created:
    - apps/frontend/src/components/coup-target-selector.tsx
    - apps/frontend/src/components/influence-card-selector.tsx
    - apps/frontend/src/components/winner-overlay.tsx
  modified:
    - apps/frontend/src/components/game-board.tsx
    - apps/frontend/src/app/room/[roomId]/page.tsx

key-decisions:
  - "WinnerOverlay does not need 'use client' directive since it has no state or events"
  - "Room page calls useGame unconditionally to ensure socket listeners are always registered before GAME_STARTED"

patterns-established:
  - "InfluenceCardSelector: always use originalIndex from myHand.map — never filter then index"
  - "GameBoard conditionally renders selector OR ActionBar (not both) based on selectingCoupTarget state"

requirements-completed: [TURN-04, INFL-02, INFL-03, INFL-05]

# Metrics
duration: 12min
completed: 2026-04-04
---

# Phase 04 Plan 03: Interaction Components and Room-to-Game Transition Summary

**Coup target selector, influence card selector, winner overlay integrated into GameBoard with GAME_STARTED-driven lobby-to-game transition in room page**

## Performance

- **Duration:** 12 min
- **Started:** 2026-04-04T12:40:00Z
- **Completed:** 2026-04-04T12:52:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- CoupTargetSelector: shows alive non-self players as clickable targets, emits COUP GAME_ACTION on click with `onCancel` cleanup
- InfluenceCardSelector: renders unrevealed cards using `originalIndex` from `myHand.map` to prevent wrong-card reveal bug
- WinnerOverlay: full-screen `backdrop-blur` overlay displaying winner name on GAME_OVER phase
- GameBoard wired: phase-driven useEffect resets `selectingCoupTarget`, `needsInfluenceChoice` derived from AWAITING_COUP_TARGET + pendingAction.targetId
- Room page transitions seamlessly from lobby to GameBoard on GAME_STARTED socket event

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CoupTargetSelector, InfluenceCardSelector, WinnerOverlay** - `1e39699` (feat)
2. **Task 2: Wire GameBoard with interaction components + integrate into room page** - `21c2e5e` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `apps/frontend/src/components/coup-target-selector.tsx` - Target selection UI for Coup action with GAME_ACTION emit
- `apps/frontend/src/components/influence-card-selector.tsx` - Card choice UI for influence loss using originalIndex
- `apps/frontend/src/components/winner-overlay.tsx` - Full-screen GAME_OVER overlay with winner name
- `apps/frontend/src/components/game-board.tsx` - Wired all interaction components, phase-driven logic, error prop
- `apps/frontend/src/app/room/[roomId]/page.tsx` - Added gameActive state, GAME_STARTED listener, conditional GameBoard render

## Decisions Made
- `WinnerOverlay` has no client-side state so no `"use client"` directive needed — renders as Server Component
- `useGame` hook called unconditionally in room page to ensure socket listeners are registered before GAME_STARTED arrives (prevents race condition if event fires before hook activates)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete game UI is functional: players can take turns, select Coup targets, choose cards to lose, and see the winner
- Room page handles lobby-to-game transition seamlessly
- Ready for Phase 05: reactions, challenges, and block mechanics
- Known: ActionBar still shows Pass/Block/Challenge buttons — they are wired in Plan 04 (reactions phase)

---
*Phase: 04-basic-game-loop*
*Completed: 2026-04-04*
