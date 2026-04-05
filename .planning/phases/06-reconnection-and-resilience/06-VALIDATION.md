---
phase: 6
slug: reconnection-and-resilience
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | vitest.config.ts (workspace projects) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After Wave 1 (types + backend):** Run `npm run test` — all grace timer and reconnect unit tests pass
- **After Wave 2 (frontend):** Run `npm run test` — all tests pass; manual smoke: refresh browser tab mid-game
- **Wave 4 (human verification):** Full end-to-end test per plan checklist

---

## Validation Architecture

### Dimension 1: Unit Tests
- `reconnect.test.ts` — REJOIN_ROOM handler logic (re-join room channel, re-emit state)
- `grace-timer.test.ts` — disconnect timer fires after 30s (vi.useFakeTimers), cancels on reconnect
- `rematch.test.ts` — REMATCH handler resets game, emits GAME_STARTED + STATE_UPDATE
- `cleanup.test.ts` — room cleanup deletes stale rooms, preserves active rooms

### Dimension 2: Integration
- Socket connect → REJOIN_ROOM → STATE_UPDATE flow
- Disconnect → 30s grace → auto-pass/auto-skip → next STATE_UPDATE

### Dimension 3: FSM Invariants
- After auto-skip (INCOME action): game advances to next player
- After auto-pass (PASS action): pending reactions updated, action resolves if all passed

### Dimension 4: Shared Types
- All new events (REJOIN_ROOM, REMATCH) in ClientToServerEvents
- disconnectedPlayers: string[] in ClientGameState

### Dimension 5: Human Verification (Wave 4)
- Refresh browser mid-game → reconnects with full state
- Disconnect during reaction → game auto-continues after 30s
- Rematch button works → new game starts with same players
