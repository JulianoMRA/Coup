---
phase: 06-reconnection-and-resilience
plan: "01"
subsystem: backend-resilience
tags: [reconnection, grace-timer, rematch, cleanup, websocket, socket-handler]
dependency_graph:
  requires: [05-reactions-and-challenges]
  provides: [REJOIN_ROOM-handler, disconnect-grace-timers, rematch-flow, room-cleanup]
  affects: [socket-handler, shared-types, room-store, project-state]
tech_stack:
  added: []
  patterns: [grace-timer-pattern, module-level-export-for-testability, broadcast-helper]
key_files:
  created:
    - apps/backend/src/cleanup.ts
    - apps/backend/src/__tests__/reconnect.test.ts
    - apps/backend/src/__tests__/grace-timer.test.ts
    - apps/backend/src/__tests__/rematch.test.ts
    - apps/backend/src/__tests__/cleanup.test.ts
  modified:
    - packages/shared/src/types/events.ts
    - packages/shared/src/types/game-state.ts
    - packages/shared/src/types/lobby.ts
    - apps/backend/src/game/project-state.ts
    - apps/backend/src/socket-handler.ts
    - apps/backend/src/rooms/room-store.ts
    - apps/backend/src/index.ts
decisions:
  - "disconnectTimers and roomDisconnectedPlayers exported as module-level Maps for direct test access without socket mock overhead"
  - "auto-INCOME chosen for disconnected active player: simplest valid action to advance turn in v1 (intentional +1 coin side-effect documented)"
  - "broadcastStateToRoom helper centralises disconnectedPlayers injection into all projections"
  - "resetForRematch resets player isReady flags so lobby flow is valid after rematch if needed"
metrics:
  duration: "25min"
  completed_date: "2026-04-05"
  tasks_completed: 2
  files_created: 5
  files_modified: 7
---

# Phase 06 Plan 01: Backend Reconnection and Resilience Summary

Backend reconnection layer with REJOIN_ROOM handler, 30s grace timers for auto-PASS/auto-INCOME, REMATCH flow via initGame reset, and stale room cleanup — 21 new tests across 4 test files, all 101 tests passing.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend shared types + REJOIN_ROOM handler | 21916f9 | events.ts, game-state.ts, lobby.ts, project-state.ts, socket-handler.ts, reconnect.test.ts |
| 2 | Grace timers, rematch, cleanup | 63ea62b | room-store.ts, cleanup.ts, index.ts, grace-timer.test.ts, rematch.test.ts, cleanup.test.ts |

## What Was Built

### Shared Types Extensions
- `REJOIN_ROOM: (roomId: string) => void` and `REMATCH: (roomId: string) => void` added to `ClientToServerEvents`
- `disconnectedPlayers: string[]` added to `ClientGameState`
- `"GAME_OVER"` added to `LobbyState.status` union

### REJOIN_ROOM Handler
Validates room exists and player is in `room.players` (security: never trusts client-provided identity, uses `socket.handshake.auth.playerId`). Cancels grace timer on reconnect, re-joins socket to room channel, emits `STATE_UPDATE` with current `disconnectedPlayers` context or `LOBBY_UPDATE` if no game active.

### Disconnect Grace Timer
On disconnect: player added to `roomDisconnectedPlayers` immediately, 30s timer starts. On expiry:
- `AWAITING_REACTIONS`/`AWAITING_BLOCK_CHALLENGE` with `WAITING` reaction → auto-PASS
- `AWAITING_ACTION` with disconnected active player → auto-INCOME (advances turn; +1 coin is intentional v1 simplification)
- `GAME_OVER` → no-op

### REMATCH Handler
Validates `game.phase === GAME_OVER` and player is in room. Clears `roomDisconnectedPlayers`, cancels all active timers for room players, calls `resetForRematch(roomId)` (sets status back to `IN_GAME`, resets `isReady` flags, updates `lastActivityAt`), then `initGame` + `setGame` + broadcast `GAME_STARTED` + `STATE_UPDATE`.

### Room Cleanup
`cleanup.ts` exports `startCleanupInterval(io)` — runs every 5 minutes, deletes rooms where: status is not `IN_GAME`, no connected sockets (`io.sockets.adapter.rooms`), and `lastActivityAt > 1h` ago. Wired into `index.ts` after `registerSocketHandlers`.

### broadcastStateToRoom Helper
Centralises the per-player projection loop, injecting current `roomDisconnectedPlayers` set into every `projectStateForPlayer` call. Used by `START_GAME`, `GAME_ACTION`, `REJOIN_ROOM`, and the disconnect timeout handler.

## Test Coverage

| File | Tests | Description |
|------|-------|-------------|
| reconnect.test.ts | 6 | REJOIN_ROOM validation, timer cancellation, lobby/game branching, disconnectedPlayers in projection |
| grace-timer.test.ts | 5 | Auto-PASS on AWAITING_REACTIONS, auto-INCOME on AWAITING_ACTION, GAME_OVER no-op, immediate marking, reconnect cancels timer |
| rematch.test.ts | 5 | initGame reset, disconnectedPlayers cleared, non-GAME_OVER error, not-in-room error, status reset |
| cleanup.test.ts | 5 | GAME_OVER stale deleted, LOBBY stale deleted, IN_GAME never deleted, connected sockets protected, recent rooms protected |

Total: 21 new tests. Full suite: 101 tests, 0 failures.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

All mitigations from the plan's threat register were applied:

| Threat | Mitigation Applied |
|--------|--------------------|
| T-06-01 (Spoofing) | REJOIN_ROOM uses `socket.handshake.auth.playerId`, verifies against `room.players` before joining channel |
| T-06-02 (Tampering) | REMATCH checks `game.phase === GAME_OVER` and player membership before proceeding |
| T-06-05 (Tampering) | Cleanup skips `IN_GAME` rooms unconditionally; checks socket adapter before deletion |
| T-06-06 (EoP) | REJOIN_ROOM only calls `socket.join()` for players already in `room.players`; does not call `joinRoom()` |

## Self-Check: PASSED

Files exist:
- apps/backend/src/cleanup.ts: FOUND
- apps/backend/src/__tests__/reconnect.test.ts: FOUND
- apps/backend/src/__tests__/grace-timer.test.ts: FOUND
- apps/backend/src/__tests__/rematch.test.ts: FOUND
- apps/backend/src/__tests__/cleanup.test.ts: FOUND

Commits exist:
- 21916f9: FOUND
- 63ea62b: FOUND
