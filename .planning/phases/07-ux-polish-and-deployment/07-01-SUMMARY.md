---
phase: 07-ux-polish-and-deployment
plan: 01
subsystem: frontend + backend + deployment
tags: [deployment, ux, action-bar, responsive, tdd, railway]
dependency_graph:
  requires: []
  provides: [backend-build-scripts, railway-config, env-example, action-bar-pending-indicator, responsive-game-log]
  affects: [apps/backend/package.json, apps/backend/railway.json, .env.example, apps/frontend/src/components/action-bar.tsx, apps/frontend/src/components/game-board.tsx]
tech_stack:
  added: []
  patterns: [TDD red-green, Railway config-as-code, responsive Tailwind breakpoints]
key_files:
  created:
    - apps/backend/railway.json
    - .env.example
    - apps/frontend/src/__tests__/action-bar.test.tsx
  modified:
    - apps/backend/package.json
    - apps/frontend/src/components/action-bar.tsx
    - apps/frontend/src/components/game-board.tsx
decisions:
  - Backend build uses tsc with outDir=dist; start command is node dist/index.js
  - railway.json uses config-as-code pattern with buildCommand and startCommand
  - ActionBar pending indicator follows exact ReactionBar pattern for consistency
  - Responsive log uses md:hidden/hidden md:block Tailwind pattern (no JS state on desktop)
metrics:
  duration: 15min
  completed: 2026-04-05
  tasks_completed: 2
  files_changed: 6
---

# Phase 07 Plan 01: Production Prep and UI Polish Summary

Backend deployment scripts added (tsc build + node start), Railway config-as-code created, ActionBar now shows "Aguardando: {names}" for WAITING reactions, and GameLog is always visible on desktop with mobile toggle.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Backend deployment prep | ff42bd2 | apps/backend/package.json, apps/backend/railway.json, .env.example |
| 2 (RED) | Failing ActionBar tests | fc8f163 | apps/frontend/src/__tests__/action-bar.test.tsx |
| 2 (GREEN) | ActionBar indicator + responsive log | 6a9f5fe | apps/frontend/src/components/action-bar.tsx, apps/frontend/src/components/game-board.tsx |

## What Was Built

### Task 1 — Backend Deployment Prep

- Added `"build": "tsc"` and `"start": "node dist/index.js"` to `apps/backend/package.json`
- Created `apps/backend/railway.json` with Railway config-as-code (buildCommand + startCommand)
- Created `.env.example` at repo root documenting `FRONTEND_URL` and `NEXT_PUBLIC_BACKEND_URL`
- Verified `npm run build --workspace=apps/backend` compiles without errors; `dist/index.js` generated
- `dist/` was already covered by root `.gitignore` — no additional ignore needed

### Task 2 — ActionBar Pending Indicator + Responsive GameLog (TDD)

- **RED:** Created `action-bar.test.tsx` with 5 test cases covering all 4 specified behaviors; tests failed as expected
- **GREEN:** Added `players: PublicPlayerState[]` prop to `ActionBarProps`, computed `waitingNames` using the same pattern as ReactionBar, rendered `Aguardando: {waitingNames}` conditional element
- Updated `game-board.tsx` to pass `players={game.players}` to ActionBar
- Replaced single-state log section with `md:hidden` mobile toggle div and `hidden md:block` desktop always-visible div
- All 17 frontend tests pass

## Verification Results

1. `npm run build --workspace=apps/backend` — passes (tsc exits 0)
2. `npm run test --workspace=apps/frontend` — 17/17 tests pass
3. `grep "Aguardando" apps/frontend/src/components/action-bar.tsx` — match found (line 83)
4. `grep "md:hidden" apps/frontend/src/components/game-board.tsx` — match found (line 108)
5. `grep "hidden md:block" apps/frontend/src/components/game-board.tsx` — match found (line 115)

## Deviations from Plan

None — plan executed exactly as written. The root `.gitignore` already contained `dist/` so no backend-specific `.gitignore` was needed (plan step 5 was satisfied by existing config).

## Known Stubs

None — all functionality is fully wired.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced.

## Self-Check: PASSED

- `apps/backend/railway.json` — FOUND
- `.env.example` — FOUND
- `apps/frontend/src/__tests__/action-bar.test.tsx` — FOUND
- Commit ff42bd2 — FOUND
- Commit fc8f163 — FOUND
- Commit 6a9f5fe — FOUND
