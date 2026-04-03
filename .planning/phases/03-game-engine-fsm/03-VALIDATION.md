---
phase: 3
slug: game-engine-fsm
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.2 |
| **Config file** | `apps/backend/vitest.config.ts` |
| **Quick run command** | `cd apps/backend && npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` (from repo root — runs all workspaces) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/backend && npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test` from repo root
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 0 | INIT-01, INIT-02 | unit stubs | `cd apps/backend && npm test` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 0 | INIT-04 | unit stubs | `cd apps/backend && npm test` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | INIT-01, INIT-02 | unit | `cd apps/backend && npm test -- --reporter=verbose` | ✅ | ⬜ pending |
| 03-02-02 | 02 | 1 | INIT-04 | unit | `cd apps/backend && npm test -- --reporter=verbose` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 2 | INIT-01 | unit | `cd apps/backend && npm test -- --reporter=verbose` | ✅ | ⬜ pending |
| 03-03-02 | 03 | 2 | INIT-01 | unit | `cd apps/backend && npm test -- --reporter=verbose` | ✅ | ⬜ pending |
| 03-04-01 | 04 | 3 | INIT-02 | unit | `cd apps/backend && npm test -- --reporter=verbose` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/src/__tests__/fsm-game-init.test.ts` — stubs for INIT-01, INIT-02, INIT-04 (deck, deal, turn order)
- [ ] `apps/backend/src/__tests__/fsm-transitions.test.ts` — stubs for all state transitions
- [ ] `apps/backend/src/__tests__/fsm-full-game.test.ts` — stub for 2-player simulated game

*Existing framework (vitest 4.1.2) covers all phase requirements — no new installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| None | - | - | All behaviors have automated unit test coverage |

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
