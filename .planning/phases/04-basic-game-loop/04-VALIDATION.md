---
phase: 4
slug: basic-game-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-03
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `apps/backend/vitest.config.ts`, `apps/frontend/vitest.config.ts`, root `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd:verify-work`:** Full suite must be green + human game flow verification
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-W0-01 | W0 | 0 | TURN-01, TURN-04, INFL-04, INFL-05 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 4-W0-02 | W0 | 0 | LOG-01 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 4-01-01 | 01 | 1 | TURN-01,TURN-02,TURN-03,TURN-04 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | INFL-01,INFL-02,INFL-03,INFL-04,INFL-05 | unit | `npm run test` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 3 | LOG-01,LOG-02,LOG-03 | unit | `npm run test` | ✅ partial | ⬜ pending |
| 4-04-01 | 04 | 4 | AMBX-01,AMBX-02,AMBX-03 | manual | n/a | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/backend/src/__tests__/game-socket-handler.test.ts` — stubs for TURN-01, TURN-04, INFL-04, INFL-05 socket dispatch
- [ ] `apps/frontend/src/__tests__/use-game.test.ts` — stubs for LOG-01 (STATE_UPDATE propagation)

*Existing infrastructure covers: FSM logic (59 tests), projectStateForPlayer (LOG-02/LOG-03), project setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two-card player selects which card to lose | INFL-02 | DOM interaction with card selector UI | Open 2-player game, trigger Coup, verify each card is independently selectable |
| Revealed card shown face-up to all | INFL-03 | Visual state across multiple browser windows | Open 2 browsers, trigger influence loss, verify both see the revealed card name |
| Winner screen shown to all players | INFL-05 | Multi-browser visual | Eliminate all but one player, verify winner overlay appears on all screens |
| Active player buttons enabled, others disabled | TURN-01 | DOM visual state | Observe that non-active player sees disabled/hidden action buttons |
| 10+ coins forces Coup only | TURN-02 | DOM + game flow | Accumulate 10 coins via Income, verify only Coup button is available |
| Game log in correct order, no hidden cards | LOG-01, LOG-02 | Visual inspection | Play through actions, verify log entries appear in order and contain no card type names for unrevealed cards |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
