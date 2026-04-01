---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | Per-package `vitest.config.ts` (none exist yet — Wave 0 gap) |
| **Quick run command** | `npm run test --workspace=apps/backend` |
| **Full suite command** | `npm run test --workspaces --if-present` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=apps/backend`
- **After every plan wave:** Run `npm run test --workspaces --if-present`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| projectStateForPlayer strips opponent cards | 01 | 1 | INIT-03 | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 | ⬜ pending |
| projectStateForPlayer preserves own hand | 01 | 1 | INIT-03 | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 | ⬜ pending |
| projectStateForPlayer exposes revealed cards | 01 | 1 | INIT-03 | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 | ⬜ pending |
| getOrCreatePlayerId returns same UUID | 02 | 1 | ROOM-04 | unit | `vitest run apps/frontend/src/__tests__/session.test.ts` | ❌ Wave 0 | ⬜ pending |
| getOrCreatePlayerId generates new UUID | 02 | 1 | ROOM-04 | unit | `vitest run apps/frontend/src/__tests__/session.test.ts` | ❌ Wave 0 | ⬜ pending |
| WebSocket ping/pong round-trip | 03 | 2 | SYNC-01, SYNC-02 | manual smoke | n/a — verify in browser DevTools | ❌ manual only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/vitest.config.ts` — Vitest config for backend
- [ ] `apps/frontend/vitest.config.ts` — Vitest config for frontend
- [ ] `apps/backend/src/__tests__/project-state.test.ts` — test stubs for INIT-03
- [ ] `apps/frontend/src/__tests__/session.test.ts` — test stubs for ROOM-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WebSocket ping/pong round-trip | SYNC-01, SYNC-02 | Full Socket.IO integration requires a running server; adds significant infrastructure for Phase 1 scope | Start `npm run dev`, open browser, check DevTools Network tab for WebSocket frames, verify badge turns green |
| UUID survives page refresh | ROOM-04 | LocalStorage persistence is browser-environment-only | Open app, note UUID in localStorage (DevTools > Application), refresh page, confirm same UUID is present |
| Badge appears bottom-right corner | SYNC-01 | Visual placement verified by sight | Open app, confirm green/red dot appears fixed in bottom-right corner |

---

*Phase: 01-foundation*
*Validation strategy created: 2026-04-01*
