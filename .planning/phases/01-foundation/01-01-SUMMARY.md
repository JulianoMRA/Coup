---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [monorepo, npm-workspaces, typescript, nextjs, express, socket.io, vitest, tailwindcss, shadcn]

# Dependency graph
requires: []
provides:
  - npm workspaces monorepo with apps/frontend, apps/backend, packages/shared layout
  - TypeScript strict mode via tsconfig.base.json shared across all packages
  - CardType, Card, GameState, PlayerState, ClientGameState, PublicPlayerState, GamePhase, PendingAction shared types
  - ServerToClientEvents, ClientToServerEvents Socket.IO event type contracts
  - Express + Socket.IO backend skeleton with PING/PONG handler
  - Next.js 16 App Router frontend skeleton with dark theme and Tailwind CSS v4
  - Vitest configs for both apps (node env for backend, jsdom for frontend)
  - Wave 0 test stubs for projectStateForPlayer and getOrCreatePlayerId
affects: [01-02, 01-03, 01-04, all-future-plans]

# Tech tracking
tech-stack:
  added:
    - npm workspaces (monorepo management)
    - TypeScript 6.0.2 (strict mode)
    - Next.js 16.2.2 (App Router, frontend)
    - Express 5.2.1 (HTTP server)
    - Socket.IO 4.8.3 (WebSocket server + client)
    - vitest 4.1.2 (test runner, both apps)
    - tailwindcss 4.2.2 (CSS framework, Tailwind v4 CSS-first)
    - concurrently 9.2.1 (parallel dev runner)
    - tsx 4.21.0 (backend dev runner)
    - uuid 13.0.0 (player session tokens)
  patterns:
    - Workspace dependencies via npm "*" version resolution
    - Tailwind v4 CSS-first configuration via @theme directives (no config file)
    - Vitest globals mode with explicit tsconfig types entries
    - Barrel exports from packages/shared/src/index.ts

key-files:
  created:
    - package.json (root — workspaces, concurrently, dev script)
    - tsconfig.base.json (strict mode baseline)
    - packages/shared/src/types/card.ts (CardType enum, Card interface)
    - packages/shared/src/types/game-state.ts (GameState, ClientGameState, PlayerState, PublicPlayerState, GamePhase)
    - packages/shared/src/types/events.ts (ServerToClientEvents, ClientToServerEvents)
    - packages/shared/src/index.ts (barrel export)
    - apps/backend/src/index.ts (Express + Socket.IO skeleton)
    - apps/frontend/src/app/layout.tsx (root layout, dark theme)
    - apps/frontend/src/app/page.tsx (placeholder home page)
    - apps/frontend/src/app/globals.css (shadcn CSS variables, Tailwind v4)
    - apps/backend/vitest.config.ts (node environment)
    - apps/frontend/vitest.config.ts (jsdom environment)
    - apps/backend/src/__tests__/project-state.test.ts (INIT-03 stubs)
    - apps/frontend/src/__tests__/session.test.ts (ROOM-04 stubs)
  modified:
    - apps/backend/tsconfig.json (added vitest/globals, node types)
    - apps/frontend/tsconfig.json (added vitest/globals type, @/ alias)

key-decisions:
  - "npm workspace:* protocol not supported by npm — changed to '*' for workspace resolution"
  - "Tailwind CSS v4 uses CSS-first @theme directives, not tailwind.config.ts — tailwind.config.ts kept as comment-only marker"
  - "Vitest globals require explicit types entry in tsconfig — added vitest/globals to both app tsconfigs"
  - "@types/react and @types/react-dom added to frontend devDeps (not bundled with Next.js 16)"

patterns-established:
  - "Workspace dependencies use '*' version in npm workspaces"
  - "All packages extend tsconfig.base.json for strict mode"
  - "Vitest configs use globals:true + types in tsconfig"
  - "Tailwind v4: configure via CSS @theme, not config file"

requirements-completed: [SYNC-01, SYNC-02, INIT-03]

# Metrics
duration: 18min
completed: 2026-04-02
---

# Phase 1 Plan 01: Monorepo Foundation Summary

**npm workspaces monorepo with Express/Socket.IO backend, Next.js 16 frontend, shared TypeScript game types, and Vitest test infrastructure across both apps**

## Performance

- **Duration:** 18 min
- **Started:** 2026-04-02T03:38:51Z
- **Completed:** 2026-04-02T03:57:04Z
- **Tasks:** 2
- **Files modified:** 25

## Accomplishments

- Scaffolded complete npm workspaces monorepo (apps/frontend, apps/backend, packages/shared) with `npm run dev` starting both services via concurrently
- Created all shared TypeScript game types that all downstream plans depend on: CardType, Card, GameState, ClientGameState, PlayerState, PublicPlayerState, GamePhase, ServerToClientEvents, ClientToServerEvents
- Established Vitest test infrastructure with Wave 0 test stubs for INIT-03 (projectStateForPlayer) and ROOM-04 (getOrCreatePlayerId) that Plans 02 and 03 will fill in
- TypeScript strict mode passes across all 3 packages via `npm run typecheck`

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold monorepo root, packages/shared types, and app skeletons** - `593dd69` (feat)
2. **Task 2: Create Vitest configs and test stubs** - `690e46d` (chore)
3. **Fix: vitest/globals types in tsconfigs** - `f422ef0` (fix — Rule 1 auto-fix)

## Files Created/Modified

- `package.json` — Root monorepo with workspaces, concurrently dev runner
- `tsconfig.base.json` — Shared TypeScript strict mode configuration
- `packages/shared/src/types/card.ts` — CardType enum and Card interface
- `packages/shared/src/types/game-state.ts` — GameState, ClientGameState, PlayerState, PublicPlayerState, GamePhase
- `packages/shared/src/types/events.ts` — ServerToClientEvents, ClientToServerEvents
- `packages/shared/src/index.ts` — Barrel exports for all shared types
- `apps/backend/src/index.ts` — Express + Socket.IO backend skeleton with PING/PONG
- `apps/frontend/src/app/layout.tsx` — Root layout with dark class and Inter font
- `apps/frontend/src/app/page.tsx` — Placeholder home page
- `apps/frontend/src/app/globals.css` — Tailwind v4 @theme with shadcn dark CSS variables
- `apps/backend/vitest.config.ts` — Vitest config (node environment)
- `apps/frontend/vitest.config.ts` — Vitest config (jsdom environment)
- `apps/backend/src/__tests__/project-state.test.ts` — INIT-03 test stubs
- `apps/frontend/src/__tests__/session.test.ts` — ROOM-04 test stubs

## Decisions Made

- Used `"*"` for workspace dependency version (npm workspaces doesn't support `workspace:*` pnpm protocol)
- Tailwind v4 requires CSS-first configuration via `@theme` directives; `tailwind.config.ts` kept as empty marker file
- Added `@types/react` and `@types/react-dom` to frontend devDeps (needed for JSX typecheck, not bundled by Next.js 16)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed workspace:* protocol incompatibility with npm**
- **Found during:** Task 1 (npm install)
- **Issue:** Plan specified `"workspace:*"` in package.json devDependencies — this is pnpm syntax, not npm. npm install threw `EUNSUPPORTEDPROTOCOL`.
- **Fix:** Changed `"workspace:*"` to `"*"` in both apps/backend/package.json and apps/frontend/package.json
- **Files modified:** apps/backend/package.json, apps/frontend/package.json
- **Verification:** npm install succeeds with no errors
- **Committed in:** 593dd69 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed Tailwind v4 config type incompatibility**
- **Found during:** Task 1 (npm run typecheck)
- **Issue:** Plan specified creating `tailwind.config.ts` with `Config` type from tailwindcss — but tailwindcss 4.2.2 uses CSS-first configuration and the `Config` type is no longer available in the same form; `DarkModeStrategy` type mismatch.
- **Fix:** Replaced tailwind.config.ts with comment-only export. Moved shadcn theme vars to globals.css using Tailwind v4 `@theme` directive.
- **Files modified:** apps/frontend/tailwind.config.ts, apps/frontend/src/app/globals.css
- **Verification:** npm run typecheck passes, Tailwind v4 CSS-first configuration is correct
- **Committed in:** 593dd69 (Task 1 commit)

**3. [Rule 1 - Bug] Added @types/react to frontend devDependencies**
- **Found during:** Task 1 (npm run typecheck)
- **Issue:** Next.js 16 does not bundle `@types/react`; JSX type errors without it
- **Fix:** Added `@types/react` and `@types/react-dom` to frontend devDependencies
- **Files modified:** apps/frontend/package.json, package-lock.json
- **Verification:** No JSX type errors after install
- **Committed in:** 593dd69 (Task 1 commit)

**4. [Rule 1 - Bug] Added vitest/globals to tsconfig types entries**
- **Found during:** Task 2 verification (npm run typecheck)
- **Issue:** With vitest `globals: true`, `describe` and `it` are globally available during test runs but TypeScript doesn't know about them during typecheck without explicit `types` entry
- **Fix:** Added `"types": ["vitest/globals"]` to frontend tsconfig and `"types": ["vitest/globals", "node"]` to backend tsconfig
- **Files modified:** apps/frontend/tsconfig.json, apps/backend/tsconfig.json
- **Verification:** npm run typecheck passes across all packages
- **Committed in:** f422ef0

---

**Total deviations:** 4 auto-fixed (1 blocking, 3 bugs)
**Impact on plan:** All fixes required for npm install and typecheck to pass. No scope creep.

## Issues Encountered

- shadcn init CLI is interactive and cannot be fully automated; manually created globals.css with shadcn CSS variables and tailwind.config.ts as a marker file (Tailwind v4 doesn't use config file anyway)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 (projectStateForPlayer) can now fill in the test stubs at `apps/backend/src/__tests__/project-state.test.ts`
- Plan 03 (UUID session) can now fill in the test stubs at `apps/frontend/src/__tests__/session.test.ts`
- Plan 04 (GitHub Actions CI) can now reference `npm run typecheck` and `vitest run` commands
- All shared types are available via `import type { GameState } from "@coup/shared"` in both apps

## Self-Check: PASSED

All 15 expected files found on disk. All 3 task commits verified in git log.

---
*Phase: 01-foundation*
*Completed: 2026-04-02*
