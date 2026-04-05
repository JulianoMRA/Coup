---
phase: 05-character-actions-and-reactions
plan: 03
subsystem: frontend-ui
tags: [exchange-selector, game-board, phase-routing, ambassador-exchange]
dependency_graph:
  requires: [05-01, 05-02]
  provides: [ExchangeSelector, GameBoard-full-routing]
  affects: [game-board.tsx, exchange-selector.tsx, fsm-transitions.test.ts]
tech_stack:
  added: []
  patterns: [fixed-bottom-bar-shell, priority-based-conditional-render, socket-emit-pattern]
key_files:
  created:
    - apps/frontend/src/components/exchange-selector.tsx
  modified:
    - apps/frontend/src/components/game-board.tsx
    - apps/backend/src/__tests__/fsm-transitions.test.ts
decisions:
  - needsReaction uses !== undefined (not === "WAITING") so already-passed players still see ReactionBar with "passed" message
  - needsBlockChallenge uses !== undefined for same reason — BlockChallengeBar handles role-based visibility internally
  - CHAL-05 test assertions changed from position-index checks to card-conservation invariant to eliminate shuffle-dependent flakiness
metrics:
  duration: 8min
  completed_date: "2026-04-04"
  tasks: 2
  files: 3
---

# Phase 05 Plan 03: ExchangeSelector + GameBoard Full Routing Summary

**One-liner:** ExchangeSelector component for Ambassador exchange with exactly-2 card selection, plus full priority-based bottom-bar routing in GameBoard covering all 6 Phase 5 phases.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ExchangeSelector component | 690066e | exchange-selector.tsx |
| 2 | GameBoard full phase routing + fix flaky CHAL-05 tests | fbb1112 | game-board.tsx, fsm-transitions.test.ts |

## What Was Built

### Task 1: ExchangeSelector

**ExchangeSelector (`exchange-selector.tsx`):**
- Fixed bottom-bar shell matching established pattern (`fixed bottom-0 left-0 right-0 ... bg-background border-t border-border`)
- Builds `allCards = [...myHand, ...exchangeCards]` preserving server-side index alignment with `handleExchangeChoose`
- Skips revealed cards in render (`if (card.revealed) return null`)
- `toggleCard`: prevents selecting revealed cards; max 2 selections enforced
- Selected cards: `ring-2 ring-primary opacity-100`; unselected: `opacity-50`; min-h-[44px] touch targets
- Counter display: `({selectedIndices.length}/2 selecionadas)`
- "Confirmar Troca ({n}/2)" button disabled until exactly 2 selected
- Emits `GAME_ACTION` with `{ type: "EXCHANGE_CHOOSE", playerId, keptIndices: [number, number] }`

### Task 2: GameBoard Full Phase Routing

**Updated `needsInfluenceChoice`** to cover RESOLVING_CHALLENGE and RESOLVING_BLOCK_CHALLENGE (not just AWAITING_COUP_TARGET), showing InfluenceCardSelector to any player with unrevealed cards during those phases. T-05-06 mitigated: server validates playerId on LOSE_INFLUENCE submission.

**New derived booleans:**
- `needsExchange`: AWAITING_EXCHANGE + pendingAction.playerId === playerId
- `needsReaction`: AWAITING_REACTIONS + pendingReactions[playerId] !== undefined
- `needsBlockChallenge`: AWAITING_BLOCK_CHALLENGE + pendingReactions[playerId] !== undefined

**Priority render chain (highest to lowest):**
1. `needsInfluenceChoice` → InfluenceCardSelector
2. `needsExchange` → ExchangeSelector
3. `selectingTarget && AWAITING_ACTION` → CoupTargetSelector
4. `needsReaction && pendingAction` → ReactionBar
5. `needsBlockChallenge && pendingAction` → BlockChallengeBar
6. default → ActionBar

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed flaky CHAL-05 backend tests**
- **Found during:** Task 2 verification (backend tests required by acceptance criteria)
- **Issue:** Tests 1 and 2 in CHAL-05 asserted `hand[0].type !== DUKE` after `replaceProvenCard`, but since the function shuffles [AMBASSADOR, DUKE] and pops, DUKE can be re-drawn, making the test non-deterministic
- **Fix:** Replaced index-based assertions with card-conservation invariant: verify `p1.hand.length === 2`, `deck.length === 1`, and `allCards.filter(c => c.type === DUKE).length === 1` — these hold regardless of shuffle outcome
- **Files modified:** `apps/backend/src/__tests__/fsm-transitions.test.ts`
- **Commit:** fbb1112

## Known Stubs

None — all components wire directly to socket emissions.

## Threat Flags

None — T-05-05 and T-05-06 addressed as planned:
- T-05-05: Frontend prevents out-of-range keptIndices by only allowing clicks on rendered card indices
- T-05-06: InfluenceCardSelector shown to all players with unrevealed cards in RESOLVING phases; server validates playerId

## Self-Check: PASSED

- `apps/frontend/src/components/exchange-selector.tsx` — FOUND
- `apps/frontend/src/components/game-board.tsx` — FOUND (needsExchange, needsReaction, needsBlockChallenge, RESOLVING_CHALLENGE, AWAITING_EXCHANGE)
- Commit 690066e — FOUND
- Commit fbb1112 — FOUND
- TypeScript frontend compiles cleanly (0 errors)
- All 71 backend tests pass
