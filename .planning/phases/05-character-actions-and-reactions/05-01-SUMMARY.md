---
phase: 05-character-actions-and-reactions
plan: 01
subsystem: backend-fsm, frontend-ui
tags: [game-engine, action-bar, challenge-resolution, card-replacement]
dependency_graph:
  requires: []
  provides: [replaceProvenCard, ActionBar-row2, steal-target-selection, assassinate-target-selection]
  affects: [game-engine.ts, action-bar.tsx, game-board.tsx, coup-target-selector.tsx]
tech_stack:
  added: []
  patterns: [TDD red-green, proven-card-swap, shared-target-selector]
key_files:
  created: []
  modified:
    - apps/backend/src/game/game-engine.ts
    - apps/backend/src/__tests__/fsm-transitions.test.ts
    - apps/frontend/src/components/action-bar.tsx
    - apps/frontend/src/components/game-board.tsx
    - apps/frontend/src/components/coup-target-selector.tsx
decisions:
  - replaceProvenCard returns state unchanged when deck is empty (no crash on edge case)
  - claimedCardMap maps action type to CardType for TAX/STEAL/ASSASSINATE/EXCHANGE
  - CoupTargetSelector extended with actionType/label props to serve Coup, Steal, and Assassinate
  - needsReaction block removed from ActionBar — delegated to ReactionBar (Plan 02)
  - selectingTarget derived boolean used as unified condition for CoupTargetSelector rendering
metrics:
  duration: 8min
  completed_date: "2026-04-04"
  tasks: 2
  files: 5
---

# Phase 05 Plan 01: Backend CHAL-05 + ActionBar Row 2 Summary

**One-liner:** replaceProvenCard swap for proven challenge cards (FSM CHAL-05) plus 7-button two-row ActionBar with Steal/Assassinate target selection reusing CoupTargetSelector.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backend CHAL-05 replaceProvenCard (TDD) | d46d665 | game-engine.ts, fsm-transitions.test.ts |
| 2 | ActionBar row 2 + steal/assassinate target selection | 3120e75 | action-bar.tsx, game-board.tsx, coup-target-selector.tsx |

## What Was Built

### Task 1: Backend CHAL-05 Card Replacement

Added `replaceProvenCard(state, playerId, claimedCard)` to `game-engine.ts`:
- Finds the proven (unrevealed) card in the player's hand by type
- Returns proven card to deck, shuffles, draws replacement card
- No-op when deck is empty or card not found (edge case safety — T-05-01 mitigated)

Called in two branches:
1. `handleLoseInfluenceResolvingChallenge` — challenger-loses branch: maps pending action type to `claimedCardMap` and calls `replaceProvenCard` on challenged player before resolving action
2. `handleLoseInfluenceResolvingBlockChallenge` — challenger-loses branch: calls `replaceProvenCard` on blocker using `pending.blockerClaimedCard`

4 CHAL-05 tests added (TDD RED then GREEN):
- Test 1: TAX challenge, challenger loses → DUKE replaced, deck length unchanged
- Test 2: Block challenge, challenger loses → blocker's DUKE replaced, deck length unchanged
- Test 3: Bluffing player loses → no swap (claimedCard not in hand)
- Test 4: Empty deck → no crash, hand unchanged

### Task 2: ActionBar Row 2 + Target Selection

**ActionBar (`action-bar.tsx`):**
- Removed `needsReaction` block entirely (delegated to ReactionBar in Plan 02)
- Added `onSelectStealTarget` and `onSelectAssassinateTarget` props
- Height changed from `h-16` to `h-auto py-3` for two-row layout
- Row 2: Imposto (Duque), Roubar (Capitao), Assassinar (Assassino), Embaixador
- Assassinar disabled when `myCoins < 3`; all row 2 buttons disabled on `forcedCoup`

**GameBoard (`game-board.tsx`):**
- Added `selectingStealTarget` and `selectingAssassinateTarget` state
- `selectingTarget` derived boolean unifies all three target-selection states
- `useEffect` resets all three states when phase leaves `AWAITING_ACTION`
- `targetActionType` and `targetLabel` computed for CoupTargetSelector
- Single `CoupTargetSelector` handles Coup, Steal, and Assassinate via props

**CoupTargetSelector (`coup-target-selector.tsx`):**
- Added `actionType?: string` (default `"COUP"`) and `label?: string` props
- `handleSelectTarget` emits `{ type: actionType, playerId, targetId }` — T-05-02 accepted (server validates)
- Prompt text uses `label` prop

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all buttons wire to socket emissions or target selectors that emit real actions.

## Threat Flags

None — T-05-01 and T-05-02 addressed as planned (see threat model in plan).

## Self-Check: PASSED

- `apps/backend/src/game/game-engine.ts` — FOUND (replaceProvenCard at line 84)
- `apps/backend/src/__tests__/fsm-transitions.test.ts` — FOUND (CHAL-05 describe block)
- `apps/frontend/src/components/action-bar.tsx` — FOUND (Imposto, Roubar, Assassinar, Embaixador)
- `apps/frontend/src/components/game-board.tsx` — FOUND (selectingStealTarget, selectingAssassinateTarget)
- `apps/frontend/src/components/coup-target-selector.tsx` — FOUND (actionType, label props)
- Commit d46d665 — FOUND
- Commit 3120e75 — FOUND
- All 71 backend tests pass
- TypeScript frontend compiles cleanly
