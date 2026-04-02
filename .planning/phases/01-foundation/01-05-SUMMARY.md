---
phase: 01-foundation
plan: "05"
subsystem: testing
tags: [vitest, workspace, ci, path-alias, esm]
dependency_graph:
  requires: []
  provides: [root-vitest-config, ci-test-pass]
  affects: [.github/workflows/ci.yml]
tech_stack:
  added: []
  patterns: [vitest-v4-projects-api, esm-dirname-compat]
key_files:
  created:
    - vitest.config.ts
  modified:
    - apps/frontend/vitest.config.ts
decisions:
  - vitest-v4-projects-api-not-workspace-array
  - esm-safe-dirname-via-fileURLToPath
metrics:
  duration: 24m
  completed: "2026-04-02"
requirements:
  - ROOM-04
  - INIT-03
  - SYNC-01
  - SYNC-02
---

# Phase 1 Plan 05: Vitest Root Workspace Config Summary

Root vitest.config.ts using vitest v4 `projects` API delegates to per-app configs, fixing `@/` alias resolution so CI passes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add root vitest config and fix frontend ESM alias | 4c36113 | vitest.config.ts, apps/frontend/vitest.config.ts |

## Verification Results

- `npm run test` at repo root: **10 passed** (6 backend + 4 frontend)
- `cd apps/backend && npx vitest run`: **6 passed**
- `cd apps/frontend && npx vitest run`: **4 passed**
- No `ERR_MODULE_NOT_FOUND` errors
- `@/lib/session` resolves correctly in all contexts

## Decisions Made

### vitest-v4-projects-api-not-workspace-array
The `vitest.workspace.ts` array export format (as documented in older vitest docs) does NOT work in vitest v4.1.2 when per-app configs use `resolve.alias` with `__dirname`. The v4 `defineConfig({ test: { projects: [...] } })` API in `vitest.config.ts` properly loads each project config with its correct directory context, making `__dirname` resolve correctly.

### esm-safe-dirname-via-fileURLToPath
Updated `apps/frontend/vitest.config.ts` to use `fileURLToPath(import.meta.url)` to derive `__dirname` instead of relying on the CJS `__dirname` global. This ensures reliable alias resolution regardless of whether vitest processes the config in CJS or ESM module context.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] vitest.workspace.ts array format broken in v4.1.2**
- **Found during:** Task 1 verification
- **Issue:** The plan specified creating `vitest.workspace.ts` with an array export. This format failed in vitest v4.1.2 — the `@/lib/session` alias was not applied when running via workspace, resulting in `ERR_MODULE_NOT_FOUND`.
- **Investigation:** The `projects` API in `vitest.config.ts` (`defineConfig({ test: { projects: [...] } })`) correctly loaded each sub-config with proper `__dirname` context, resolving the alias.
- **Fix:** Created `vitest.config.ts` at root using the `projects` array instead of `vitest.workspace.ts`. The plan explicitly stated to use the workspace file format — this deviation was required because the workspace array format does not work in the installed vitest version.
- **Files modified:** `vitest.config.ts` (created), not `vitest.workspace.ts` (plan artifact)
- **Commit:** 4c36113

**2. [Rule 2 - Missing critical functionality] Frontend vitest.config.ts not ESM-safe**
- **Found during:** Task 1 debugging
- **Issue:** `apps/frontend/vitest.config.ts` used bare `__dirname` which is unreliable in ESM context. Adding `fileURLToPath(import.meta.url)` makes the alias resolution deterministic.
- **Fix:** Added `import { fileURLToPath } from "url"` and derived `__dirname` from `import.meta.url`.
- **Files modified:** `apps/frontend/vitest.config.ts`
- **Commit:** 4c36113

## Known Stubs

None — all tests passing with real implementations.

## Self-Check: PASSED
