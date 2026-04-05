# Phase 6: Reconnection and Resilience - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning
**Mode:** Smart discuss (batch proposals, all areas accepted)

<domain>
## Phase Boundary

The game survives real-world network interruptions — a player who refreshes mid-game returns to their seat with full state restored; a disconnected player does not freeze the game; rematch works; rooms are cleaned up after inactivity.

Requirements: SYNC-03, POST-01, POST-02

</domain>

<decisions>
## Implementation Decisions

### Reconnection Mechanism
- Client emits `REJOIN_ROOM` event on socket connect when it has a roomId (from URL path `/room/[roomId]`)
- URL path is the source of truth for roomId — no extra localStorage needed
- Existing `game === null` → loading state in GameBoard handles the reconnect UX while awaiting STATE_UPDATE
- Backend: on `REJOIN_ROOM`, re-add socket to room channel and emit current STATE_UPDATE to that player

### Grace Timer Behavior
- Grace period: **30 seconds** from disconnect event
- Backend tracks disconnected players with `Map<playerId, { roomId, timer }>`
- Disconnected non-active player in reaction window: auto-pass after 30s (unblocks other players)
- Disconnected active player: auto-skip turn after 30s (advance to next active player)
- Visual indicator: show "(desconectado)" label next to player name in PlayerPanel — reuses existing player list UI
- On reconnect before grace expires: cancel timer, player resumes normally

### Rematch
- Any player in the game can trigger rematch (not host-only)
- "Revanche" button in WinnerOverlay, below winner announcement
- Rematch re-randomizes turn order with same room.players
- Resets game state via new `initGame()` call — same roomId, same players, room.status back to "IN_GAME"
- All players (including any who were watching as spectators) participate in rematch

### Room Cleanup
- `setInterval` every 5 minutes scanning all rooms
- Delete rooms where: (status is LOBBY or GAME_OVER) AND (no sockets connected in that room) AND (last activity > 1 hour ago)
- Active/in-progress rooms are never cleaned up
- Silent — no user notification for v1

</decisions>

<code_context>
## Existing Code Insights

**Reconnect-friendly already:**
- `joinRoom()` in room-store.ts is idempotent — returns `{ok:true}` if player already in room, no duplicate
- `socket.join(playerId)` in socket-handler.ts ensures private channel is always restored on connect
- GameBoard already handles `game === null` as loading state

**Needs changes:**
- `socket-handler.ts`: add `REJOIN_ROOM` handler, add `disconnect` grace timer logic, add `REMATCH` handler
- `room-store.ts`: add `resetForRematch()` function, add `lastActivityAt` timestamp for cleanup
- `game-store.ts`: no changes needed (games map already persists across reconnects)
- `game-engine.ts`: no changes needed (pure FSM)
- `use-game.ts`: add REJOIN_ROOM emit on socket connect
- `winner-overlay.tsx`: add "Revanche" button emitting REMATCH event
- `player-panel.tsx`: show "(desconectado)" label for disconnected players
- New backend: `cleanup.ts` with setInterval room cleanup

**Shared types needed:**
- `REJOIN_ROOM` client event
- `REMATCH` client event
- `disconnectedPlayers` field on projected game state (so frontend knows who's disconnected)

</code_context>

<specifics>
## Specific Ideas

- No specific UI preferences beyond what's described above
- Keep implementation minimal — this is for a small friend group, not production at scale
- Grace timer should be per-player (not per-room), stored as `NodeJS.Timeout` handle so it can be cancelled on reconnect
- REMATCH emits new GAME_STARTED + STATE_UPDATE to all room players (same flow as initial game start)

</specifics>

<deferred>
## Deferred Ideas

- Spectator mode (join as observer after game starts) — deferred to post-v1; success criterion 5 covers winner visible to existing spectators (players who were eliminated)
- Persistent state across server restarts (Redis/DB) — out of scope v1
- Disconnect notification sound/visual flash — deferred, silent (desconectado) label is sufficient
</deferred>
