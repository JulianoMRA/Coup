---
phase: 02-room-and-lobby
plan: "03"
subsystem: frontend
tags: [react, nextjs, websocket, lobby, ui]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [frontend-lobby-ui, use-lobby-hook, home-page]
  affects: [frontend-routing, socket-events]
tech_stack:
  added: [class-variance-authority@0.7.1, lucide-react@0.511.0]
  patterns: [custom-hook, nextjs-app-router, localStorage-ssr-guard, socket-event-subscription]
key_files:
  created:
    - apps/frontend/src/hooks/use-lobby.ts
    - apps/frontend/src/app/room/[roomId]/page.tsx
  modified:
    - apps/frontend/src/app/page.tsx
    - apps/frontend/src/__tests__/room-page.test.ts
    - apps/frontend/package.json
decisions:
  - useLobby hook exported getPlayerName and savePlayerName as pure utility functions for testability
  - Missing class-variance-authority and lucide-react added to package.json (shadcn components required them)
metrics:
  duration: 6min
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_changed: 5
---

# Phase 02 Plan 03: Frontend Lobby UI Summary

**One-liner:** Home page with Criar Sala CTA, lobby page with useLobby hook connecting JOIN_ROOM/LOBBY_UPDATE socket events, full UI copy per 02-UI-SPEC.md

## What Was Built

### Task 1: useLobby hook + frontend tests GREEN

Created `apps/frontend/src/hooks/use-lobby.ts` with:
- `getPlayerName()` — reads `coup_player_name` from localStorage with SSR guard
- `savePlayerName(name)` — writes `coup_player_name` to localStorage with SSR guard
- `useLobby(roomId, playerId, playerName)` — emits JOIN_ROOM when connected, subscribes to LOBBY_UPDATE and ERROR, cleans up on unmount

Replaced test stubs in `room-page.test.ts` with real assertions importing from the hook. All 7 frontend tests pass green.

### Task 2: Home page and lobby page

Rewrote `apps/frontend/src/app/page.tsx`:
- Username input pre-filled from `getPlayerName()` via useEffect
- Inline key validation (only `[a-zA-Z0-9 -]`)
- "Criar Sala" button POSTs to `/api/rooms`, saves name, redirects to `/room/[roomId]`

Created `apps/frontend/src/app/room/[roomId]/page.tsx`:
- Sub-state A (no playerName): "Entrar na Sala" form with roomId display
- Sub-state B (has playerName): active lobby with invite card, player list, ready toggle, host start button
- Room-not-found error state
- "Sala cheia" inline error from socket ERROR event
- All UI copy per 02-UI-SPEC.md: Entrar na Sala, Criar Sala, Iniciar Jogo, Estou Pronto!, Cancelar Prontidão, Copiar link, Copiado!, anfitrião

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing dependencies class-variance-authority and lucide-react**
- **Found during:** Task 2 (build)
- **Issue:** `npm run build` failed with "Module not found: Can't resolve 'class-variance-authority'" and "Can't resolve 'lucide-react'". The shadcn UI components installed in Plan 01 depend on `class-variance-authority`; the lobby page uses `lucide-react` for the Copy icon. Neither was in package.json.
- **Fix:** Added `"class-variance-authority": "^0.7.1"` and `"lucide-react": "^0.511.0"` to dependencies in `apps/frontend/package.json`, then ran `npm install`.
- **Files modified:** `apps/frontend/package.json`
- **Commit:** d568255

**2. [Rule 3 - Blocking] Missing node_modules in worktree**
- **Found during:** Task 2 (build attempt)
- **Issue:** Worktree had no `node_modules` — git worktrees have separate node_modules directories.
- **Fix:** Ran `npm install` at repo root to link workspace packages.
- **Files modified:** none (runtime only)

## Verification Results

- `npm test` (repo root): 28/28 tests pass across 5 test files
- `npm run build` (frontend): exits 0, Turbopack compiles successfully
- `grep "use(params)"` in room/[roomId]/page.tsx: 1 match (Next.js 15 params unwrap)
- All 8 UI-SPEC copy strings present in lobby page
- `useLobby` integrated in lobby page with correct signature

## Known Stubs

None. All data flows are wired: useLobby connects to real socket events, home page posts to real API endpoint, lobby page renders real LobbyState from LOBBY_UPDATE events.

## Self-Check: PASSED

Files exist:
- apps/frontend/src/hooks/use-lobby.ts — FOUND
- apps/frontend/src/app/page.tsx — FOUND
- apps/frontend/src/app/room/[roomId]/page.tsx — FOUND

Commits exist:
- 491f9c2 (Task 1) — FOUND
- d568255 (Task 2) — FOUND
