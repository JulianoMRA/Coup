---
phase: 01-foundation
plan: 02
subsystem: backend
tags: [tdd, socket.io, express, game-logic, security]

# Dependency graph
requires: [01-01]
provides:
  - projectStateForPlayer pure function (INIT-03 card-stripping security core)
  - Express + Socket.IO server on port 3001 with typed events
  - registerSocketHandlers with playerId auth validation and PING/PONG
  - 6 unit tests covering all projectStateForPlayer behaviors
affects: [01-03, 01-04, all-game-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD red-green cycle — tests committed before implementation
    - Pure function for per-player state projection (no I/O, no side effects)
    - Socket.IO typed events via ServerToClientEvents / ClientToServerEvents generics
    - Auth gate: disconnect socket if playerId missing in handshake.auth

key-files:
  created:
    - apps/backend/src/game/project-state.ts (projectStateForPlayer implementation)
    - apps/backend/src/socket-handler.ts (registerSocketHandlers with PING/PONG)
  modified:
    - apps/backend/src/__tests__/project-state.test.ts (replaced .todo stubs with 6 real tests)
    - apps/backend/src/index.ts (exports httpServer/io, FRONTEND_URL CORS, registerSocketHandlers)

key-decisions:
  - "TDD sequencing enforced — tests committed (c8c0fc3) before implementation (09b3e53) as required by INIT-03 security constraint"
  - "npm install needed in worktree to resolve @coup/shared workspace dependency for test runner"

# Metrics
duration: 6min
completed: 2026-04-02
---

# Phase 1 Plan 02: Backend Server and projectStateForPlayer Summary

**TDD-implemented projectStateForPlayer pure function (strips hidden cards for INIT-03) plus typed Express + Socket.IO server with playerId auth validation and PING/PONG connection health check**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-02T04:04:28Z
- **Completed:** 2026-04-02T04:10:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Implemented `projectStateForPlayer(gameState, playerId): ClientGameState` following full TDD cycle: 6 failing tests committed first, then implementation committed after all tests pass
- Security core verified: opponents only receive `cardCount` (unrevealed) and `revealedCards` — the `hand` field is never included in `PublicPlayerState`
- Upgraded `index.ts` to export `httpServer` and `io`, use `FRONTEND_URL` env var for CORS, and call `registerSocketHandlers`
- Created `socket-handler.ts` that validates `playerId` from `socket.handshake.auth`, disconnects unauthorized connections, registers PING→PONG handler, and logs connect/disconnect events

## Task Commits

Each task committed atomically:

1. **[RED] Task 1: Failing tests for projectStateForPlayer** — `c8c0fc3` (test)
2. **[GREEN] Task 1: Implement projectStateForPlayer** — `09b3e53` (feat)
3. **Task 2: Express + Socket.IO server with PING/PONG** — `81137a2` (feat)

## Files Created/Modified

- `apps/backend/src/__tests__/project-state.test.ts` — 6 unit tests with `makeTestGameState` fixture (3 players, mixed revealed/hidden cards)
- `apps/backend/src/game/project-state.ts` — Pure function, 26 lines, imports from `@coup/shared`
- `apps/backend/src/socket-handler.ts` — `registerSocketHandlers`, playerId auth gate, PING/PONG, connect/disconnect logging
- `apps/backend/src/index.ts` — Exports `httpServer` and `io`, `FRONTEND_URL` CORS, `registerSocketHandlers` call

## Decisions Made

- TDD sequencing: tests committed before implementation as required by RESEARCH.md and INIT-03 security constraint
- npm install was required in the worktree to link `@coup/shared` workspace package (worktrees have separate node_modules)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] npm install needed in worktree for @coup/shared resolution**
- **Found during:** Task 1 GREEN phase (test run)
- **Issue:** The git worktree has its own `node_modules` directory that was empty — vitest couldn't resolve `@coup/shared` workspace package
- **Fix:** Ran `npm install` from the worktree root to link workspace packages
- **Files modified:** `node_modules/` (not committed — in .gitignore), `package-lock.json`
- **Commit:** Not a separate commit — prerequisite fix before GREEN commit

---

**Total deviations:** 1 auto-fixed (blocking)
**Impact on plan:** No scope change. Fix was a worktree-specific setup step with no design impact.

## Known Stubs

None — all functionality is fully implemented and tested.

## Self-Check: PASSED

All expected files exist. All 3 commits verified in git log.
