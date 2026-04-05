---
phase: 06-reconnection-and-resilience
plan: "02"
subsystem: frontend-reconnection
tags: [reconnection, rematch, disconnected-indicator, socket, react, tdd]
dependency_graph:
  requires: [06-01-backend-resilience]
  provides: [REJOIN_ROOM-emit-on-connect, disconnected-player-indicator, rematch-button]
  affects: [use-game, winner-overlay, player-panel, game-board]
tech_stack:
  added: ["@vitejs/plugin-react (devDep — enables JSX transform in vitest)"]
  patterns: [socket-connect-handler, conditional-ui-indicator, client-event-emit]
key_files:
  created:
    - apps/frontend/src/__tests__/frontend-reconnect.test.ts
  modified:
    - apps/frontend/src/hooks/use-game.ts
    - apps/frontend/src/components/winner-overlay.tsx
    - apps/frontend/src/components/player-panel.tsx
    - apps/frontend/src/components/game-board.tsx
    - apps/frontend/vitest.config.ts
decisions:
  - "@vitejs/plugin-react added to vitest.config.ts to enable JSX transform for component tests — tsconfig sets jsx:preserve for Next.js but vitest needs automatic JSX runtime"
  - "disconnectedPlayers prop defaults to [] in PlayerPanel to avoid breaking existing callers before game-board.tsx update"
  - "WinnerOverlay gains 'use client' directive because it now uses socket.emit inside onClick (browser-only call)"
metrics:
  duration: "15min"
  completed_date: "2026-04-05"
  tasks_completed: 1
  files_created: 1
  files_modified: 6
---

# Phase 06 Plan 02: Frontend Reconnection and Resilience Summary

Frontend reconnection surface: useGame emits REJOIN_ROOM on socket connect, PlayerPanel shows "(desconectado)" labels for disconnected players, and WinnerOverlay adds a "Revanche" button that emits REMATCH — completing the client-side contract for Phase 6.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Frontend reconnect + disconnect UI + rematch button | 8c238d6 | frontend-reconnect.test.ts, use-game.ts, winner-overlay.tsx, player-panel.tsx, game-board.tsx, vitest.config.ts |

## What Was Built

### useGame — REJOIN_ROOM on connect
Added a `handleConnect` function inside the existing `useEffect` that calls `socket.emit("REJOIN_ROOM", roomId)`. Registered via `socket.on("connect", handleConnect)` and cleaned up in the return function alongside the existing STATE_UPDATE and ERROR handlers. This ensures that on any socket reconnect (page refresh, network drop), the backend restores the player's game state.

### PlayerPanel — Disconnected indicator
Added `disconnectedPlayers?: string[]` prop (defaults to `[]`) to `PlayerPanelProps`. After the existing `(voce)` span, renders `<span className="ml-1 text-xs text-muted-foreground">(desconectado)</span>` conditionally when `disconnectedPlayers.includes(player.id)`. Matches the exact CSS pattern of the existing `(voce)` label.

### WinnerOverlay — Revanche button
Added `roomId: string` to `WinnerOverlayProps`. Added `"use client"` directive, imported `Button` from `@/components/ui/button` and `socket` from `@/lib/socket`. Below the winner name, renders a full-width `Button` (variant="default", className="w-full mt-6") with text "Revanche" that calls `socket.emit("REMATCH", roomId)` on click.

### GameBoard — Props wiring
Updated `<PlayerPanel>` to pass `disconnectedPlayers={game.disconnectedPlayers ?? []}` and `<WinnerOverlay>` to pass `roomId={roomId}`.

### vitest.config.ts — JSX transform fix
Added `@vitejs/plugin-react` to vitest plugins to enable JSX automatic runtime for component tests. The tsconfig uses `jsx: preserve` for Next.js compatibility, which blocked vite:import-analysis from processing `.tsx` component files in tests. This is a necessary dev-dependency for component-level test coverage.

## Test Coverage

| File | Tests | Description |
|------|-------|-------------|
| frontend-reconnect.test.ts | 5 | REJOIN_ROOM emit on connect, (desconectado) indicator present/absent, Revanche button renders, REMATCH emit on click |

Full suite: 106 tests, 0 failures (up from 101 in plan 01).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed @vitejs/plugin-react for JSX transform in vitest**
- **Found during:** Task 1 (RED phase)
- **Issue:** vitest.config.ts had no JSX transform; tsconfig `jsx: preserve` caused `vite:import-analysis` to reject `.tsx` imports inside tests with "invalid JS syntax"
- **Fix:** Added `@vitejs/plugin-react` as devDependency and added `plugins: [react()]` to vitest.config.ts; also added `src/**/*.test.tsx` to include pattern
- **Files modified:** apps/frontend/vitest.config.ts, apps/frontend/package.json, package-lock.json
- **Commit:** 8c238d6

## Known Stubs

None — all data is wired from real socket state (`game.disconnectedPlayers` from `ClientGameState`, `roomId` from props).

## Threat Flags

No new security surface beyond what is documented in the plan's threat model:
- REJOIN_ROOM roomId sourced from URL path (same trust level as JOIN_ROOM)
- REMATCH roomId sourced from WinnerOverlay prop (already trusted game state)

## Self-Check: PASSED

Files exist:
- apps/frontend/src/__tests__/frontend-reconnect.test.ts: FOUND
- apps/frontend/src/hooks/use-game.ts: FOUND (contains REJOIN_ROOM)
- apps/frontend/src/components/winner-overlay.tsx: FOUND (contains Revanche)
- apps/frontend/src/components/player-panel.tsx: FOUND (contains desconectado)
- apps/frontend/src/components/game-board.tsx: FOUND (contains disconnectedPlayers)

Commits exist:
- 8c238d6: FOUND
- e13e28e: FOUND
