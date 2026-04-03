---
phase: 03-game-engine-fsm
plan: 03
subsystem: game
tags: [typescript, fsm, game-engine, transition-map, vitest, tdd]

requires:
  - phase: 03-02
    provides: initGame factory, buildDeck, shuffleInPlace, GameState type, processAction stub

provides:
  - processAction dispatcher with typed transition map keyed by GamePhase:ActionType
  - nextActivePlayer helper that skips eliminated players and wraps around
  - INCOME, FOREIGN_AID, COUP, LOSE_INFLUENCE (coup target) handlers — fully tested GREEN
  - Guard: wrong player, wrong phase, forced coup at 10+ coins
  - notImplemented stubs for wave-4 reaction/challenge/block/exchange handlers

affects:
  - 03-04 (reaction handlers — PASS, CHALLENGE, BLOCK will replace notImplemented stubs)
  - 04-websocket (imports processAction via game-engine.ts exports)

tech-stack:
  added: []
  patterns:
    - "Transition map pattern: typed TransitionKey = `${GamePhase}:${string}` for dispatching"
    - "Handler type: (state: GameState, action: GameAction) => ActionResult"
    - "Immutable state updates via spread operators throughout all handlers"
    - "notImplemented stub pattern for wave-deferred handlers"

key-files:
  created: []
  modified:
    - apps/backend/src/game/game-engine.ts

key-decisions:
  - "notImplemented stub returns { ok: false, error: 'not implemented' } — keeps transitionMap entries so handler lookup passes but returns a predictable error for wave-4 tests"
  - "Forced coup guard placed in processAction before handler lookup — applies only when phase is AWAITING_ACTION and coins >= 10"
  - "nextActivePlayer computes next turn from the pre-mutation state to correctly skip eliminated players"

patterns-established:
  - "TransitionKey template literal type for exhaustive transition map keys"
  - "Extract<GameAction, { type: T }> narrowing inside typed handlers"

requirements-completed:
  - INIT-01
  - INIT-02
  - INIT-04

duration: 5min
completed: 2026-04-03
---

# Phase 03 Plan 03: Game Engine FSM — processAction Dispatcher Summary

**processAction dispatcher with typed transition map, guards (wrong player, wrong phase, forced coup), and GREEN handlers for INCOME, FOREIGN_AID, COUP, and LOSE_INFLUENCE (coup target)**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-03T21:12:00Z
- **Completed:** 2026-04-03T21:15:25Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Implemented processAction dispatcher with a typed `transitionMap` keyed by `${GamePhase}:${ActionType}`
- Added nextActivePlayer helper that filters eliminated players and wraps around correctly
- Implemented INCOME, FOREIGN_AID, COUP, and LOSE_INFLUENCE (coup target) handlers — all 15 target tests GREEN
- All guard tests pass: wrong player, wrong phase (transition map lookup), forced coup at 10+ coins
- Stubbed wave-4 handlers (PASS, CHALLENGE, BLOCK, EXCHANGE_CHOOSE, RESOLVING_CHALLENGE, RESOLVING_BLOCK_CHALLENGE) as `notImplemented`
- TypeScript compiles with zero errors

## Task Commits

1. **Task 1: Implement processAction dispatcher, guards, and INCOME/FOREIGN_AID/COUP/LOSE_INFLUENCE handlers** - `50960fc` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified

- `apps/backend/src/game/game-engine.ts` — Extended from stub to full dispatcher with transition map, helpers, and 4 action handlers

## Decisions Made

- `notImplemented` stub returns `{ ok: false, error: "not implemented" }` and is registered in the transition map — this ensures the lookup succeeds (correct phase key exists) but the handler returns a predictable error, letting wave-4 tests accurately assert RED without confusion about "missing from map"
- Forced coup guard is placed before the handler lookup in `processAction`, scoped only to `AWAITING_ACTION` phase — prevents non-COUP actions when coins >= 10
- `nextActivePlayer` computes from the original `state` (pre-mutation), not the updated state, to correctly identify the current player's position before advancing

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

These are intentional stubs per plan design, targeting Plan 04 (reaction handlers):

| Handler | File | Lines | Reason |
|---------|------|-------|--------|
| `AWAITING_REACTIONS:PASS` | game-engine.ts | ~185 | Wave 4 — handlePass |
| `AWAITING_REACTIONS:CHALLENGE` | game-engine.ts | ~186 | Wave 4 — handleChallenge |
| `AWAITING_REACTIONS:BLOCK` | game-engine.ts | ~187 | Wave 4 — handleBlock |
| `AWAITING_BLOCK_CHALLENGE:PASS` | game-engine.ts | ~188 | Wave 4 |
| `AWAITING_BLOCK_CHALLENGE:CHALLENGE` | game-engine.ts | ~189 | Wave 4 |
| `RESOLVING_CHALLENGE:LOSE_INFLUENCE` | game-engine.ts | ~191 | Wave 4 |
| `RESOLVING_BLOCK_CHALLENGE:LOSE_INFLUENCE` | game-engine.ts | ~192 | Wave 4 |
| `AWAITING_EXCHANGE:EXCHANGE_CHOOSE` | game-engine.ts | ~193 | Wave 4 |
| `AWAITING_ACTION:TAX` | game-engine.ts | ~180 | Wave 4 |
| `AWAITING_ACTION:STEAL` | game-engine.ts | ~181 | Wave 4 |
| `AWAITING_ACTION:ASSASSINATE` | game-engine.ts | ~182 | Wave 4 |
| `AWAITING_ACTION:EXCHANGE` | game-engine.ts | ~183 | Wave 4 |

These stubs are intentional and do not prevent plan 03's goal — all required handlers are implemented and all target tests are GREEN.

## Issues Encountered

None.

## Next Phase Readiness

- Plan 04 (reaction handlers) can directly replace `notImplemented` stubs in the transition map
- `handleForeignAid` already builds `pendingReactions` — PASS/CHALLENGE/BLOCK handlers just need to read and mutate this map
- `revealCard` and `checkGameOver` helpers are reusable by RESOLVING_CHALLENGE and RESOLVING_BLOCK_CHALLENGE handlers
- TypeScript types are complete — no shared type changes needed for Plan 04

---
*Phase: 03-game-engine-fsm*
*Completed: 2026-04-03*
