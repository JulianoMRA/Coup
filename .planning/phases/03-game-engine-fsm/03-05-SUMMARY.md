---
phase: 03-game-engine-fsm
plan: 05
subsystem: game
tags: [typescript, fsm, game-engine, exchange, vitest, tdd, integration]

requires:
  - phase: 03-04
    provides: all reaction handlers (PASS, CHALLENGE, BLOCK, block-challenge), EXCHANGE declaration entering AWAITING_REACTIONS, EXCHANGE_CHOOSE handler, resolveAction helper

provides:
  - EXCHANGE_CHOOSE tests: hand keeps 2 chosen cards, deck grows by returned 2, advances to AWAITING_ACTION
  - shuffleInPlace applied to deck after EXCHANGE_CHOOSE returns cards — prevents deck order leak
  - Full 2-player game integration test GREEN: INCOME loop + COUP until GAME_OVER
  - 59 fsm tests GREEN (56 from prior plans + 3 new EXCHANGE_CHOOSE)

affects:
  - 04-websocket (processAction fully exercised — all paths covered)

tech-stack:
  added: []
  patterns:
    - "shuffleInPlace called after returned cards merged into deck — correct Coup rule: returned cards are opaque to all players"
    - "EXCHANGE_CHOOSE test pattern: build allCards from hand + exchangeCards, keep by index, assert hand types and deck size"

key-files:
  created: []
  modified:
    - apps/backend/src/__tests__/fsm-transitions.test.ts
    - apps/backend/src/game/game-engine.ts

key-decisions:
  - "Shuffle deck after EXCHANGE_CHOOSE returns cards — prevents deck position from leaking information about which cards were returned"
  - "EXCHANGE_CHOOSE tests assert by card type containment (not strict order) since keptIndices select from allCards array"

patterns-established:
  - "EXCHANGE_CHOOSE: allCards = hand + exchangeCards; kept = allCards[keptIndices]; returned = rest; deck += returned; shuffleInPlace(deck)"

requirements-completed: []

duration: 10min
completed: 2026-04-02
---

# Phase 03 Plan 05: EXCHANGE Integration — EXCHANGE_CHOOSE Tests and Deck Shuffle Summary

**EXCHANGE_CHOOSE tests added and returned cards shuffled into deck, closing out the Ambassador path; full 2-player game simulation GREEN — all 59 FSM tests passing**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-02T18:20:00Z
- **Completed:** 2026-04-02T18:30:00Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments

- Added 3 EXCHANGE_CHOOSE tests to `fsm-transitions.test.ts`: hand keeps 2 chosen cards, deck size grows by 2 returned cards, phase advances to AWAITING_ACTION with next active player
- Added `shuffleInPlace(newDeck)` call in `handleExchangeChoose` after merging returned cards — correct Coup rule: deck order must be opaque after exchange
- Confirmed full 2-player game simulation GREEN: INCOME loop building coins → COUP at 7 → LOSE_INFLUENCE → elimination → GAME_OVER with 1 survivor
- Full backend suite: 59/59 tests passing across 6 files

## Task Commits

Each task was committed atomically:

1. **Task 1: EXCHANGE_CHOOSE tests + shuffle returned cards** - `e22d0d1` (feat)

## Files Created/Modified

- `apps/backend/src/__tests__/fsm-transitions.test.ts` — Added 3 EXCHANGE_CHOOSE tests covering hand kept cards, deck growth, and turn advance
- `apps/backend/src/game/game-engine.ts` — Added `shuffleInPlace(newDeck)` in `handleExchangeChoose` before returning new state

## Decisions Made

- Shuffle applied to the full deck (existing deck + returned cards merged) to avoid leaking position of returned cards. This matches official Coup rules.
- EXCHANGE_CHOOSE tests assert `toContain` on card types rather than strict index equality — allows for correct behavior regardless of hand ordering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Shuffle returned cards back into deck in EXCHANGE_CHOOSE**
- **Found during:** Task 1 analysis
- **Issue:** `handleExchangeChoose` appended returned cards to deck end without shuffling — deck order would leak which cards were returned (information advantage)
- **Fix:** Added `shuffleInPlace(newDeck)` after merging returned cards with existing deck
- **Files modified:** apps/backend/src/game/game-engine.ts
- **Verification:** All 59 tests still pass; deck size assertions correct
- **Committed in:** e22d0d1

---

**Total deviations:** 1 auto-fixed (1 missing critical — game rule correctness)
**Impact on plan:** Essential correctness fix. No scope creep.

## Issues Encountered

None — the plan file 03-05-PLAN.md did not exist on disk (execution derived scope from STATE.md objective, test files, and success criteria). All tests were already passing for the full-game simulation; work focused on formalizing EXCHANGE_CHOOSE tests and adding the missing shuffle.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 03 (game-engine-fsm) complete: all 59 FSM tests GREEN across 6 test files
- `processAction` handles all action types: INCOME, FOREIGN_AID, TAX, STEAL, ASSASSINATE, EXCHANGE, COUP, PASS, CHALLENGE, BLOCK, LOSE_INFLUENCE, EXCHANGE_CHOOSE
- Phase 04 (websocket) can import `processAction` and wire all actions to socket events with full FSM coverage

---
*Phase: 03-game-engine-fsm*
*Completed: 2026-04-02*
