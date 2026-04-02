---
phase: 01-foundation
plan: 03
subsystem: frontend
tags: [tdd, uuid, socket.io, react, vitest]

# Dependency graph
requires: [01-01, 01-02]
provides:
  - getOrCreatePlayerId() UUID persistence (ROOM-04)
  - Socket.IO client singleton with playerId auth (SYNC-01, SYNC-02)
  - useSocketStatus hook returning ConnectionStatus
  - ConnectionBadge component fixed bottom-right (D-05)
affects: [all-game-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD red-green cycle for getOrCreatePlayerId
    - Socket.IO typed via cast: io(...) as Socket<ServerToClientEvents, ClientToServerEvents>
    - useEffect cleanup: socket.off() on unmount
    - vitest.config.ts: path alias @/ resolution via resolve.alias

key-files:
  created:
    - apps/frontend/src/lib/session.ts (getOrCreatePlayerId)
    - apps/frontend/src/lib/socket.ts (typed Socket.IO singleton)
    - apps/frontend/src/hooks/use-socket.ts (useSocketStatus hook)
    - apps/frontend/src/components/connection-badge.tsx (ConnectionBadge)
  modified:
    - apps/frontend/src/__tests__/session.test.ts (4 real tests replacing .todo stubs)
    - apps/frontend/src/app/page.tsx (renders ConnectionBadge)
    - apps/frontend/vitest.config.ts (added @/ path alias)

key-decisions:
  - "socket.io-client v4.8.3 io() does not accept type arguments — use cast: io(...) as Socket<ServerToClientEvents, ClientToServerEvents>"
  - "vitest.config.ts needed path alias resolve.alias for @/ to match Next.js tsconfig paths"

# Metrics
duration: 6min
completed: 2026-04-02
---

# Phase 1 Plan 03: Frontend UUID Session and WebSocket Badge Summary

**TDD-implemented UUID session identity plus typed Socket.IO client, useSocketStatus hook, and ConnectionBadge component with PT-BR labels and state colors per UI-SPEC**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-02T04:26:14Z
- **Completed:** 2026-04-02T04:31:57Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Implemented `getOrCreatePlayerId()` following full TDD cycle: 4 failing tests committed first (`bf0f63d`), then implementation after all tests pass (`0b8fb9d`)
- `session.ts`: UUID v4 persisted to `coup_player_id` localStorage key with SSR guard returning empty string when `window` is undefined
- `socket.ts`: Typed Socket.IO singleton using cast pattern (`io() as Socket<ServerToClientEvents, ClientToServerEvents>`) — `autoConnect: false`, `auth.playerId` from `getOrCreatePlayerId()`
- `use-socket.ts`: `useSocketStatus()` hook with `useState` initialized to `"connecting"`, `useEffect` calling `socket.connect()` and registering `connect`/`disconnect`/`connect_error` listeners with cleanup via `socket.off()`
- `connection-badge.tsx`: Fixed `bottom-4 right-4 z-50` badge with PT-BR labels, `bg-emerald-500` connected, `bg-yellow-500 animate-pulse` connecting, `bg-red-500` disconnected/error
- `page.tsx`: Updated to `"use client"` + `<ConnectionBadge />` rendering

## Task Commits

Each task committed atomically:

1. **[RED] Task 1: Failing tests for getOrCreatePlayerId** — `bf0f63d` (test)
2. **[GREEN] Task 1: Implement getOrCreatePlayerId** — `0b8fb9d` (feat)
3. **Task 2: Socket client, hook, badge, page** — `f7352b7` (feat)

## Files Created/Modified

- `apps/frontend/src/__tests__/session.test.ts` — 4 unit tests (existing UUID, new UUID generation, SSR guard, repeated calls)
- `apps/frontend/src/lib/session.ts` — 12 lines, imports uuid, localStorage pattern with SSR guard
- `apps/frontend/src/lib/socket.ts` — 12 lines, typed Socket.IO singleton with playerId auth
- `apps/frontend/src/hooks/use-socket.ts` — 35 lines, ConnectionStatus type + useSocketStatus hook
- `apps/frontend/src/components/connection-badge.tsx` — 43 lines, UI-SPEC-compliant badge
- `apps/frontend/src/app/page.tsx` — minimal page rendering ConnectionBadge
- `apps/frontend/vitest.config.ts` — added path alias for @/ resolution

## Decisions Made

- `socket.io-client` v4.8.3 `io()` function does not accept type arguments — typed via cast to `Socket<ServerToClientEvents, ClientToServerEvents>`
- `vitest.config.ts` required `resolve.alias` for `@/` path to match Next.js tsconfig paths setting

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest.config.ts missing @/ path alias**
- **Found during:** Task 1 RED phase
- **Issue:** vitest.config.ts had no `resolve.alias` for `@/` — test import `@/lib/session` failed to resolve
- **Fix:** Added `resolve: { alias: { "@": path.resolve(__dirname, "./src") } }` to vitest.config.ts
- **Files modified:** `apps/frontend/vitest.config.ts`
- **Commit:** `bf0f63d` (included in RED commit)

**2. [Rule 1 - Bug] socket.io-client io() type arguments not supported**
- **Found during:** Task 2 TypeScript check
- **Issue:** `io<ServerToClientEvents, ClientToServerEvents>()` caused TS2558 — the `io` function has no type parameters in this version
- **Fix:** Used `io(...) as Socket<ServerToClientEvents, ClientToServerEvents>` cast pattern
- **Files modified:** `apps/frontend/src/lib/socket.ts`
- **Commit:** `f7352b7`

---

**Total deviations:** 2 auto-fixed (bugs)
**Impact on plan:** No scope change. Both were API-level fixes discovered during execution.

## Known Stubs

None — all functionality is fully implemented.

## Self-Check: PASSED

All expected files exist. All 3 commits verified in git log.
