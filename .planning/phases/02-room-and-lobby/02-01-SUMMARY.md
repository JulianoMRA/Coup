---
phase: 02-room-and-lobby
plan: "01"
subsystem: shared-types
tags: [types, tdd, shadcn, dependencies]
dependency_graph:
  requires: []
  provides: [lobby-types, socket-events, shadcn-components, backend-deps, tdd-stubs]
  affects: [02-02, 02-03]
tech_stack:
  added: [nanoid, cors, @types/cors, clsx, tailwind-merge, shadcn/ui]
  patterns: [TDD RED stubs, shared type contracts]
key_files:
  created:
    - packages/shared/src/types/lobby.ts
    - apps/backend/src/__tests__/room-store.test.ts
    - apps/backend/src/__tests__/room-handler.test.ts
    - apps/frontend/src/__tests__/room-page.test.ts
    - apps/frontend/src/lib/utils.ts
    - apps/frontend/src/components/ui/button.tsx
    - apps/frontend/src/components/ui/input.tsx
    - apps/frontend/src/components/ui/card.tsx
    - apps/frontend/src/components/ui/badge.tsx
  modified:
    - packages/shared/src/index.ts
    - packages/shared/src/types/events.ts
    - apps/backend/package.json
    - apps/frontend/package.json
decisions:
  - utils.ts not auto-created by shadcn — created manually with clsx + tailwind-merge
metrics:
  duration: 15min
  completed: "2026-04-02"
  tasks_completed: 3
  files_changed: 14
---

# Phase 2 Plan 1: Foundation for Room and Lobby Summary

Shared lobby type contracts declared, backend deps installed (nanoid, cors), shadcn components scaffolded, and 3 TDD test files created in RED state — prerequisite setup for Plans 02 and 03.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Declare shared lobby types and extend socket events | 044c901 | lobby.ts, events.ts, index.ts |
| 2 | Install backend dependencies and scaffold failing test stubs | 67e941e | package.json, room-store.test.ts, room-handler.test.ts |
| 3 | Install shadcn components and scaffold frontend test stub | 810130d | utils.ts, ui/*.tsx, room-page.test.ts |

## Verification Results

- `packages/shared` compiles with `tsc --noEmit` — no errors
- `apps/backend npm test` — exits non-zero (16 failing tests, RED state correct)
- `apps/frontend npm test` — exits non-zero (3 failing tests, RED state correct)
- `LOBBY_UPDATE`, `GAME_STARTED`, `JOIN_ROOM`, `LEAVE_ROOM`, `SET_READY` all in events.ts
- `LobbyPlayer` and `LobbyState` exported from `@coup/shared`
- shadcn button.tsx, input.tsx, card.tsx, badge.tsx created in `src/components/ui/`
- `nanoid` and `cors` in backend dependencies; `@types/cors` in devDependencies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] utils.ts not auto-created by shadcn**
- **Found during:** Task 3
- **Issue:** `npx shadcn add` created 4 component files but did not auto-generate `src/lib/utils.ts`
- **Fix:** Created utils.ts manually with clsx + tailwind-merge; installed both deps via npm
- **Files modified:** apps/frontend/src/lib/utils.ts, apps/frontend/package.json
- **Commit:** 810130d

## Known Stubs

All test stubs are intentional RED state per TDD plan:
- `apps/backend/src/__tests__/room-store.test.ts` — 7 stubs, implemented in Plan 02
- `apps/backend/src/__tests__/room-handler.test.ts` — 9 stubs, implemented in Plan 02
- `apps/frontend/src/__tests__/room-page.test.ts` — 3 stubs, implemented in Plan 03

## Self-Check: PASSED
