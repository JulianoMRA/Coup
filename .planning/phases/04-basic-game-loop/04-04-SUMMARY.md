---
plan: 04-04
phase: 04-basic-game-loop
status: complete
completed: 2026-04-04
---

# Plan 04-04: Human Verification — Complete

## What was verified

Human tested a complete 2-player game in two browser windows (regular + incognito).

## Issues found and fixed during verification

Three bugs were identified and corrected before sign-off:

1. **STATE_UPDATE broadcast bug** — `io.to(roomId).emit("STATE_UPDATE", projection)` was sending every player's private projection to all players in the room. Fixed by having each socket join a private room (`socket.join(playerId)`) and emitting per-player via `io.to(player.id).emit(...)`.

2. **myHand not displayed** — Players could not see their own cards. Fixed by adding a "Minhas Cartas" section in `GameBoard` rendering `game.myHand` as badges.

3. **InfluenceCardSelector not prominent** — After Coup, the target player's card selection UI was buried in the sidebar. Fixed by moving `InfluenceCardSelector` to the fixed bottom bar (same pattern as `CoupTargetSelector`), taking priority over `ActionBar`.

## Verification results

| Requirement | Result |
|-------------|--------|
| Each player sees their own private cards | ✅ Pass |
| Only active player's buttons are enabled | ✅ Pass |
| Income (+1 coin), turn advances | ✅ Pass |
| Foreign Aid: other player sees Passar button, +2 coins on pass | ✅ Pass |
| Coup: target selector opens, target sees card selector at bottom | ✅ Pass |
| Eliminated player gets badge, UI disabled | ✅ Pass |
| Winner overlay appears for both players on GAME_OVER | ✅ Pass |

## Self-Check: PASSED
