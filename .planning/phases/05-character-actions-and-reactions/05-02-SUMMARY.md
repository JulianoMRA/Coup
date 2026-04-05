---
phase: 05-character-actions-and-reactions
plan: 02
subsystem: frontend-ui
tags: [reaction-window, block-challenge, ui-components, socket-emit]
dependency_graph:
  requires: [05-01]
  provides: [ReactionBar, BlockClaimSelector, BlockChallengeBar]
  affects: [game-board.tsx]
tech_stack:
  added: []
  patterns: [fixed-bottom-bar-shell, inline-conditional-render, socket-emit-pattern]
key_files:
  created:
    - apps/frontend/src/components/reaction-bar.tsx
    - apps/frontend/src/components/block-claim-selector.tsx
    - apps/frontend/src/components/block-challenge-bar.tsx
  modified: []
decisions:
  - BLOCKER_RULES and CHALLENGEABLE_ACTIONS constants defined in ReactionBar govern which buttons appear per action type
  - BlockClaimSelector renders inline within ReactionBar (not as a bottom-bar shell) to avoid stacked fixed bars
  - isActivePlayer guard in BlockChallengeBar hides action buttons from non-active players (T-05-04 mitigated)
  - myReactionStatus check hides button row and shows "Voce passou" message after player has reacted
metrics:
  duration: 5min
  completed_date: "2026-04-04"
  tasks: 2
  files: 3
---

# Phase 05 Plan 02: Reaction Components Summary

**One-liner:** Three reaction window components — ReactionBar with inline BlockClaimSelector, and BlockChallengeBar — implementing Coup's challenge/block/pass UI with socket emission and strict role-based button visibility.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ReactionBar + BlockClaimSelector components | 1193c03 | reaction-bar.tsx, block-claim-selector.tsx |
| 2 | BlockChallengeBar component | b13d137 | block-challenge-bar.tsx |

## What Was Built

### Task 1: ReactionBar + BlockClaimSelector

**ReactionBar (`reaction-bar.tsx`):**
- Fixed bottom-bar shell showing action banner: "[ActorName] declarou [ActionLabel]"
- Pending players list: "Aguardando: [names]" derived from `pendingReactions` entries with status `"WAITING"`
- Button row shown only when `myReactionStatus === "WAITING"`:
  - `Contestar` (`variant="destructive"`) — only for CHALLENGEABLE_ACTIONS (TAX, STEAL, ASSASSINATE, EXCHANGE)
  - `Bloquear` (`variant="outline"`) — only when BLOCKER_RULES grants current player blocking rights
  - `Passar` (`variant="secondary"`) — always shown
- After reacting: hides button row, shows "Voce passou — aguardando os demais"
- Clicking Bloquear toggles `showBlockClaim` state, rendering BlockClaimSelector inline

**BlockClaimSelector (`block-claim-selector.tsx`):**
- Inline flex-col container (NOT a separate bottom-bar shell)
- "Bloquear como:" prompt
- One `variant="outline"` button per valid card from `validCards` prop
- On click: `socket.emit("GAME_ACTION", roomId, { type: "BLOCK", playerId, claimedCard: card })`
- CARD_LABELS map for Portuguese display names
- "Voltar" ghost button calls `onCancel` to restore the Contestar/Bloquear/Passar row

### Task 2: BlockChallengeBar

**BlockChallengeBar (`block-challenge-bar.tsx`):**
- Fixed bottom-bar shell showing "[blockerName] bloqueou com [cardLabel] — Contestar?"
- `isActivePlayer` guard restricts action buttons to active player only (T-05-04 mitigated)
- Active player with `myReactionStatus === "WAITING"` sees:
  - `Contestar bloco` (`variant="destructive"`) — emits CHALLENGE
  - `Aceitar bloco` (`variant="secondary"`) — emits PASS
- All other players see: "Aguardando [activePlayerName] decidir"

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all buttons wire directly to socket emissions. Components are ready to be integrated into GameBoard in Plan 03.

## Threat Flags

None — T-05-03 and T-05-04 addressed as planned:
- T-05-03: BLOCKER_RULES prevents confusing UX; server remains authoritative validator
- T-05-04: `isActivePlayer` guard hides Contestar bloco / Aceitar bloco from non-active players

## Self-Check: PASSED

- `apps/frontend/src/components/reaction-bar.tsx` — FOUND (Contestar, Bloquear, Passar, BLOCKER_RULES, CHALLENGEABLE_ACTIONS)
- `apps/frontend/src/components/block-claim-selector.tsx` — FOUND ("Bloquear como:", "Voltar", BLOCK emit)
- `apps/frontend/src/components/block-challenge-bar.tsx` — FOUND ("Contestar bloco", "Aceitar bloco", isActivePlayer)
- Commit 1193c03 — FOUND (feat(05-02): add ReactionBar and BlockClaimSelector components)
- Commit b13d137 — FOUND (feat(05-02): add BlockChallengeBar component)
- TypeScript compiles cleanly (0 errors)
