---
phase: 5
slug: character-actions-and-reactions
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-04
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | packages/server/vitest.config.ts (backend unit tests) |
| **Quick run command** | `npm run test --workspace=packages/server -- --run` |
| **Full suite command** | `npm run test --workspace=packages/server -- --run && npm run test --workspace=packages/frontend -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=packages/server -- --run`
- **After every plan wave:** Run full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | REAC-01 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | REAC-02 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | CHAL-01 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | CHAL-02 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-05 | 01 | 1 | CHAL-03 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-06 | 01 | 1 | CHAL-04 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-01-07 | 01 | 1 | CHAL-05 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | REAC-03 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | REAC-04 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 3 | AMBX-01 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 3 | AMBX-02 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 3 | AMBX-03 | — | N/A | unit | `npm run test --workspace=packages/server -- --run --reporter=verbose` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/server/src/__tests__/game-engine-phase5.test.ts` — stubs for REAC-01..04, CHAL-01..05, AMBX-01..03
- [ ] Existing vitest infrastructure covers framework requirement

*Existing infrastructure covers the framework — only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| ReactionBar pending-indicator shows correct non-responders in real time | REAC-02 | Requires multi-player browser session | Open 3 browser tabs, announce a character action, verify all non-acting players see pending indicators that disappear as each clicks Passar |
| Revealed card visible to all after challenge | CHAL-03 | Requires multi-player browser session | Challenge a player, verify the revealed card appears in all clients' game log |
| Ambassador Exchange shows exactly 4 cards (hand + 2 drawn) | AMBX-01 | Requires live game state with deck | Trigger Exchange, verify card picker shows exactly 4 cards with 2 pre-selected |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
