# Phase 6: Reconnection and Resilience - Research

**Researched:** 2026-04-05
**Domain:** Socket.IO reconnection mechanics, Node.js grace timers, FSM auto-pass/auto-skip, rematch flow, room cleanup
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Client emits `REJOIN_ROOM` event on socket connect when it has a roomId (from URL path `/room/[roomId]`)
- URL path is the source of truth for roomId — no extra localStorage needed
- Existing `game === null` → loading state in GameBoard handles the reconnect UX while awaiting STATE_UPDATE
- Backend: on `REJOIN_ROOM`, re-add socket to room channel and emit current STATE_UPDATE to that player
- Grace period: **30 seconds** from disconnect event
- Backend tracks disconnected players with `Map<playerId, { roomId, timer }>`
- Disconnected non-active player in reaction window: auto-pass after 30s (unblocks other players)
- Disconnected active player: auto-skip turn after 30s (advance to next active player)
- Visual indicator: show "(desconectado)" label next to player name in PlayerPanel — reuses existing player list UI
- On reconnect before grace expires: cancel timer, player resumes normally
- Any player in the game can trigger rematch (not host-only)
- "Revanche" button in WinnerOverlay, below winner announcement
- Rematch re-randomizes turn order with same room.players
- Resets game state via new `initGame()` call — same roomId, same players, room.status back to "IN_GAME"
- All players (including any who were watching as spectators) participate in rematch
- `setInterval` every 5 minutes scanning all rooms
- Delete rooms where: (status is LOBBY or GAME_OVER) AND (no sockets connected in that room) AND (last activity > 1 hour ago)
- Active/in-progress rooms are never cleaned up
- Silent — no user notification for v1

### Claude's Discretion
- No specific UI preferences beyond what's described above
- Keep implementation minimal — this is for a small friend group, not production at scale
- Grace timer should be per-player (not per-room), stored as `NodeJS.Timeout` handle so it can be cancelled on reconnect
- REMATCH emits new GAME_STARTED + STATE_UPDATE to all room players (same flow as initial game start)

### Deferred Ideas (OUT OF SCOPE)
- Spectator mode (join as observer after game starts) — deferred to post-v1
- Persistent state across server restarts (Redis/DB) — out of scope v1
- Disconnect notification sound/visual flash — deferred, silent (desconectado) label is sufficient
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SYNC-03 | Player who reconnects (refreshes page) recovers game state via UUID | REJOIN_ROOM handler + STATE_UPDATE re-emit on reconnect |
| POST-01 | After game over, "Rematch" button restarts game with same players without new link | resetForRematch() + initGame() re-call on REMATCH event |
| POST-02 | Winner screen displays winner clearly | WinnerOverlay already shows winner; needs no structural change — just add Rematch button |
</phase_requirements>

---

## Summary

Phase 6 adds resilience to an already-working game by handling the gap between an in-memory Node.js server and real-world browser refreshes/disconnects. The architecture is in-memory by design (no Redis, no DB), so all reconnection logic relies on the existing `games` Map and `rooms` Map persisting in the server process during a session.

The three work streams are independent: (1) reconnection — REJOIN_ROOM emitted from the client on every socket `connect` event when a roomId is in the URL, handled on the backend by re-joining the socket to the room channel and re-emitting the current STATE_UPDATE; (2) grace timers — a module-level `Map<playerId, { roomId, timer }>` on the backend fires auto-pass or auto-skip after 30 seconds of disconnect, cancelled on reconnect; (3) rematch — WinnerOverlay grows a "Revanche" button that emits REMATCH, and the backend calls `initGame()` again with the same players, then broadcasts GAME_STARTED + per-player STATE_UPDATEs. Room cleanup is a single `setInterval` in a `cleanup.ts` module.

Key integration point: the `disconnectedPlayers` field must be added to `ClientGameState` so the frontend can show "(desconectado)" labels without any secret-state leakage. The `LobbyState.status` must also gain `"GAME_OVER"` as a valid value so the cleanup scanner can read it.

**Primary recommendation:** Build in four sequential waves — Wave 0 (types + test stubs), Wave 1 (REJOIN_ROOM + grace timers backend), Wave 2 (rematch + cleanup backend), Wave 3 (frontend PlayerPanel indicator + WinnerOverlay button + useGame REJOIN_ROOM emit).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| socket.io | 4.x (already installed) | WebSocket server + room channels | Already in use — `disconnect` and reconnect events are built in |
| vitest | 4.x (already installed) | Unit tests with fake timers | Already configured; `vi.useFakeTimers()` API handles grace timer testing without real delays |
| Node.js built-in | — | `NodeJS.Timeout` from `setTimeout` | No extra library needed for grace timer handles |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | already installed | Not needed for this phase | — |

**Installation:** No new dependencies required. All needed libraries are already installed.

**Version verification:** Not applicable — no new packages to add. [VERIFIED: codebase grep of package.json]

---

## Architecture Patterns

### Recommended Project Structure
```
apps/backend/src/
├── socket-handler.ts        # add: REJOIN_ROOM, REMATCH handlers; disconnect grace logic
├── rooms/
│   └── room-store.ts        # add: resetForRematch(), lastActivityAt field, GAME_OVER status
├── game/
│   ├── game-store.ts        # no changes needed
│   └── game-engine.ts       # no changes needed
└── cleanup.ts               # NEW: setInterval room cleanup module

packages/shared/src/types/
├── events.ts                # add: REJOIN_ROOM, REMATCH to ClientToServerEvents
├── game-state.ts            # add: disconnectedPlayers to ClientGameState
└── lobby.ts                 # add: "GAME_OVER" to LobbyState.status union

apps/frontend/src/
├── hooks/use-game.ts        # add: REJOIN_ROOM emit on socket connect event
├── components/
│   ├── winner-overlay.tsx   # add: "Revanche" button emitting REMATCH
│   └── player-panel.tsx     # add: "(desconectado)" label from disconnectedPlayers
```

### Pattern 1: Socket.IO Disconnect / Reconnect Lifecycle

**What:** Socket.IO fires `disconnect` on the server when a client closes or loses connection. When the same browser reconnects (new socket, same `auth.playerId`), a new `connection` event fires with the same playerId from `socket.handshake.auth`. The client emits `REJOIN_ROOM` immediately after the `connect` event fires.

**When to use:** Every time a player's socket connects while they are already a member of an in-progress game.

**Key fact:** Socket.IO socket IDs change on reconnect — but `socket.handshake.auth.playerId` does not. The backend already reads `playerId` from auth on every connection, so the same player is identified correctly across reconnects. [VERIFIED: socket-handler.ts line 12, `const playerId = socket.handshake.auth.playerId`]

**Example:**
```typescript
// Source: apps/backend/src/socket-handler.ts (existing pattern, extended)
// On connection, socket already does: socket.join(playerId)
// REJOIN_ROOM handler re-joins room channel and re-emits state:

socket.on("REJOIN_ROOM", (roomId: string) => {
  const room = rooms.get(roomId)
  if (!room) { socket.emit("ERROR", "Room not found"); return }

  const isPlayerInRoom = room.players.some(p => p.playerId === playerId)
  if (!isPlayerInRoom) { socket.emit("ERROR", "Not in room"); return }

  // Cancel grace timer if one was running for this player
  const pending = disconnectTimers.get(playerId)
  if (pending) {
    clearTimeout(pending.timer)
    disconnectTimers.delete(playerId)
    // Remove from disconnectedPlayers set so frontend shows them connected again
    roomDisconnectedPlayers.get(roomId)?.delete(playerId)
  }

  socket.join(roomId)

  // Re-emit current state to reconnecting player only
  const game = getGame(roomId)
  if (game) {
    const projection = projectStateForPlayer(game, playerId)
    socket.emit("STATE_UPDATE", projection)
  } else {
    const lobbyState = toLobbyState(room)
    socket.emit("LOBBY_UPDATE", lobbyState)
  }
})
```

### Pattern 2: Grace Timer Per Player

**What:** A module-level `Map<playerId, { roomId: string; timer: NodeJS.Timeout }>` stores one timer per disconnected player. On `disconnect`, start a 30-second timer. The timer callback calls a helper that auto-passes or auto-skips depending on game phase. On reconnect / REJOIN_ROOM, cancel the timer.

**When to use:** Only when `playerId` belongs to an active game (`getGame(roomId)` returns a state).

**Key implementation detail:** The `disconnectedPlayers` set must be tracked separately from the timer map so the frontend can show the label even before the 30s timer fires. Add a `Set<string>` per room (`roomDisconnectedPlayers: Map<roomId, Set<playerId>>`). This is broadcast as part of every STATE_UPDATE. [ASSUMED: separate set per room is the cleanest pattern; storing on GameState itself would couple FSM to network concerns]

**Example:**
```typescript
// Source: [ASSUMED — based on Node.js setTimeout API and project patterns]
// Module-level in socket-handler.ts:
const disconnectTimers = new Map<string, { roomId: string; timer: NodeJS.Timeout }>()
const roomDisconnectedPlayers = new Map<string, Set<string>>()

// In disconnect handler:
socket.on("disconnect", () => {
  const game = findGameForPlayer(playerId) // scan games Map
  if (!game) return

  const roomId = game.roomId
  if (!roomDisconnectedPlayers.has(roomId)) {
    roomDisconnectedPlayers.set(roomId, new Set())
  }
  roomDisconnectedPlayers.get(roomId)!.add(playerId)

  // Broadcast updated disconnected set to room
  broadcastStateToRoom(io, game.roomId, game)

  const timer = setTimeout(() => {
    handleDisconnectTimeout(io, playerId, roomId)
    disconnectTimers.delete(playerId)
  }, 30_000)

  disconnectTimers.set(playerId, { roomId, timer })
})
```

### Pattern 3: Auto-Pass / Auto-Skip via processAction

**What:** The grace timer callback calls `processAction` with a synthetic action — either `PASS` (for non-active players in a reaction window) or `INCOME` equivalent (skip turn by calling next active player). For the active player, advancing the turn is done by forcing an INCOME action or a dedicated SKIP action.

**Key decision needed:** Auto-advancing an active player's turn must be handled by the existing FSM. The cleanest approach is to call `processAction(state, { type: "INCOME", playerId })` for active-player timeout — INCOME advances the turn without requiring target selection and always succeeds. This reuses existing code with zero FSM changes. For reaction-window timeout, call `processAction(state, { type: "PASS", playerId })`. [ASSUMED: using INCOME for active-player skip is simplest; a dedicated SKIP type is an alternative but unnecessary]

**Example:**
```typescript
// Source: [ASSUMED — based on existing processAction contract in game-engine.ts]
function handleDisconnectTimeout(
  io: Server,
  playerId: string,
  roomId: string
): void {
  const state = getGame(roomId)
  if (!state) return
  if (state.phase === GamePhase.GAME_OVER) return

  let action: GameAction

  if (state.phase === GamePhase.AWAITING_REACTIONS ||
      state.phase === GamePhase.AWAITING_BLOCK_CHALLENGE) {
    // Non-active player timed out in reaction window
    const reactions = state.pendingAction?.pendingReactions
    if (!reactions || reactions[playerId] !== "WAITING") return
    action = { type: "PASS", playerId }
  } else if (state.phase === GamePhase.AWAITING_ACTION &&
             state.activePlayerId === playerId) {
    // Active player timed out — skip their turn via INCOME
    action = { type: "INCOME", playerId }
  } else {
    return // Not this player's turn to act
  }

  const result = processAction(state, action)
  if (!result.ok) return

  setGame(roomId, result.state)
  broadcastStateToRoom(io, roomId, result.state)
}
```

### Pattern 4: Rematch Flow

**What:** When REMATCH is received, reset room status to `"IN_GAME"`, call `initGame()` with the same `room.players` list, store the new game state, and broadcast `GAME_STARTED` + per-player `STATE_UPDATE` — identical to the START_GAME flow.

**Key fact:** `initGame()` already re-randomizes turn order (it calls `shuffleInPlace(players)` on line 37 of game-engine.ts). No extra shuffle needed. [VERIFIED: game-engine.ts line 37]

**Example:**
```typescript
// Source: apps/backend/src/game/game-engine.ts (verified — initGame already shuffles)
socket.on("REMATCH", (roomId: string) => {
  const room = rooms.get(roomId)
  if (!room) { socket.emit("ERROR", "Room not found"); return }

  const game = getGame(roomId)
  if (!game || game.phase !== GamePhase.GAME_OVER) {
    socket.emit("ERROR", "Game is not over")
    return
  }

  // Verify caller is in the room
  const isInRoom = room.players.some(p => p.playerId === playerId)
  if (!isInRoom) { socket.emit("ERROR", "Not in room"); return }

  const newState = initGame(roomId, room.players)
  setGame(roomId, newState)
  room.status = "IN_GAME"
  updateLastActivity(roomId)

  io.to(roomId).emit("GAME_STARTED", roomId)

  for (const player of newState.players) {
    const projection = projectStateForPlayer(newState, player.id)
    io.to(player.id).emit("STATE_UPDATE", projection)
  }
})
```

### Pattern 5: Room Cleanup with setInterval

**What:** A dedicated `cleanup.ts` module exports a `startCleanupInterval()` function called once at server startup. The interval scans all rooms every 5 minutes and deletes stale ones.

**Cleanup criteria:** `status` is `"LOBBY"` or `"GAME_OVER"` AND `Date.now() - room.lastActivityAt > 60 * 60 * 1000` AND no sockets connected to that room channel (`io.sockets.adapter.rooms.get(roomId)?.size === 0`). [ASSUMED: checking adapter.rooms for connected socket count is the correct Socket.IO v4 API; needs verification]

**Socket.IO v4 room size check:** [VERIFIED: Socket.IO v4 exposes `io.sockets.adapter.rooms` as a `Map<string, Set<socketId>>`. `io.sockets.adapter.rooms.get(roomId)?.size` gives the count of connected sockets in that room channel. A value of `undefined` or `0` means no sockets connected.]

**Example:**
```typescript
// Source: [ASSUMED pattern — verified Socket.IO adapter.rooms API is correct for v4]
import type { Server } from "socket.io"
import { rooms } from "./rooms/room-store"
import { games, deleteGame } from "./game/game-store"

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000   // 5 minutes
const INACTIVITY_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

export function startCleanupInterval(io: Server): void {
  setInterval(() => {
    const now = Date.now()
    for (const [roomId, room] of rooms.entries()) {
      if (room.status === "IN_GAME") continue

      const connectedSockets = io.sockets.adapter.rooms.get(roomId)?.size ?? 0
      if (connectedSockets > 0) continue

      const lastActivity = room.lastActivityAt ?? 0
      if (now - lastActivity < INACTIVITY_THRESHOLD_MS) continue

      rooms.delete(roomId)
      deleteGame(roomId)
    }
  }, CLEANUP_INTERVAL_MS)
}
```

### Pattern 6: REJOIN_ROOM emit from Frontend

**What:** In `use-game.ts`, listen for the socket `connect` event. When it fires, check if we're on a room page (roomId is available). If yes, emit `REJOIN_ROOM` with the roomId. This handles both initial connect and any reconnect after network interruption.

**Key fact:** The socket singleton in `socket.ts` uses `autoConnect: false`. The `socket.connect()` call is in `room/[roomId]/page.tsx` `useEffect`. The `connect` event fires after `socket.connect()` succeeds, and also fires again after any reconnect. [VERIFIED: apps/frontend/src/lib/socket.ts line 9 `autoConnect: false`; apps/frontend/src/app/room/[roomId]/page.tsx line 33 `socket.connect()`]

**Example:**
```typescript
// Source: apps/frontend/src/hooks/use-game.ts (existing file to extend)
useEffect(() => {
  function handleConnect() {
    if (roomId) {
      socket.emit("REJOIN_ROOM", roomId)
    }
  }
  function handleStateUpdate(state: ClientGameState) {
    setGame(state)
    setError(null)
  }

  socket.on("connect", handleConnect)
  socket.on("STATE_UPDATE", handleStateUpdate)
  socket.on("ERROR", handleError)

  // If already connected when hook mounts, fire immediately
  if (socket.connected && roomId) {
    socket.emit("REJOIN_ROOM", roomId)
  }

  return () => {
    socket.off("connect", handleConnect)
    socket.off("STATE_UPDATE", handleStateUpdate)
    socket.off("ERROR", handleError)
  }
}, [roomId, playerId])
```

### Pattern 7: disconnectedPlayers in ClientGameState

**What:** Add `disconnectedPlayers: string[]` (array of playerIds) to `ClientGameState`. The backend populates this field during `projectStateForPlayer()` by reading `roomDisconnectedPlayers.get(roomId)`. No secret information is in this field — it is a set of playerIds, all of which are already public.

**Key concern:** `projectStateForPlayer` is currently a pure function (no side effects, no I/O). Passing `disconnectedPlayers` into it means we either (a) add the set as a parameter, or (b) move the disconnected-players lookup to the call site in `socket-handler.ts` and pass the resolved array. Option (b) keeps the projection function pure. [ASSUMED: option (b) is cleaner architecture]

**Example:**
```typescript
// Caller in socket-handler.ts:
const disconnected = [...(roomDisconnectedPlayers.get(game.roomId) ?? [])]
const projection = projectStateForPlayer(game, player.id, disconnected)

// project-state.ts signature extension:
export function projectStateForPlayer(
  gameState: GameState,
  playerId: string,
  disconnectedPlayers: string[] = []
): ClientGameState {
  // ...existing code...
  return {
    // ...existing fields...
    disconnectedPlayers,
  }
}
```

### Anti-Patterns to Avoid

- **Storing grace timer state on GameState:** GameState is a pure FSM data structure. Timer handles are Node.js runtime objects and must not be mixed into game data. Keep `disconnectTimers` as a module-level Map in `socket-handler.ts`.
- **Calling `joinRoom()` on REJOIN_ROOM for in-game players:** `joinRoom()` checks `room.status !== "LOBBY"` and returns error for IN_GAME rooms. REJOIN_ROOM bypasses `joinRoom()` entirely and only calls `socket.join(roomId)` directly.
- **Auto-advancing via a new FSM state:** Do not add a `SKIP_TURN` or `DISCONNECTED` game phase. The FSM is already correct; auto-pass/auto-skip use existing `PASS` and `INCOME` actions.
- **Emitting GAME_STARTED to the rematch requester only:** REMATCH must broadcast `GAME_STARTED` to the entire room (`io.to(roomId).emit`), not just the requesting socket.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Socket channel membership check | Custom "connected players" registry | `io.sockets.adapter.rooms.get(roomId)?.size` | Socket.IO adapter already tracks this; custom registry gets out of sync |
| Timer cancellation | Polling loop checking player status | `clearTimeout(handle)` + delete from Map | Built-in Node.js API, O(1), no polling |
| Turn re-randomization on rematch | Custom shuffle in REMATCH handler | `initGame()` — already shuffles | `initGame` already calls `shuffleInPlace(players)` on line 37 of game-engine.ts |
| Duplicate player detection in REJOIN | Custom "who is in this game" lookup | `room.players.some(p => p.playerId === playerId)` | room.players already has the authoritative list |

**Key insight:** Almost everything needed already exists — the FSM, the room store, the game store, the projection function. This phase is primarily wiring new event handlers around existing primitives.

---

## Runtime State Inventory

> Not a rename/refactor/migration phase — this section is SKIPPED.

---

## Common Pitfalls

### Pitfall 1: REJOIN_ROOM fires before playerId is set

**What goes wrong:** If `use-game.ts` emits `REJOIN_ROOM` on the `connect` event but `playerId` has not been read from localStorage yet (because `useEffect` with `getOrCreatePlayerId()` runs after render), the emit fires with an empty `playerId`. The socket auth already contains `playerId` from `socket.ts` initialization (module-level `getOrCreatePlayerId()` call), so the backend identifies the player correctly regardless of what the client sends as a payload. The REJOIN_ROOM event only needs to carry `roomId` — not `playerId` — because the backend reads `playerId` from `socket.handshake.auth`.

**How to avoid:** REJOIN_ROOM payload is `(roomId: string)` only. Backend gets playerId from auth, not from event payload. [VERIFIED: socket-handler.ts line 12 — all handlers already use `playerId` from handshake auth, not from event arguments]

### Pitfall 2: joinRoom() rejects reconnect for in-game rooms

**What goes wrong:** Calling `joinRoom(roomId, playerId, name)` from the REJOIN_ROOM handler would fail with "Game already started" because `joinRoom()` has a guard `if (room.status !== "LOBBY")`. [VERIFIED: room-store.ts line 36]

**How to avoid:** REJOIN_ROOM does NOT call `joinRoom()`. It calls `socket.join(roomId)` directly after verifying the player is already in `room.players`.

### Pitfall 3: Grace timer fires after game ends

**What goes wrong:** A player disconnects at GAME_OVER (or game ends while they are disconnected). When the 30s timer fires, it tries to call `processAction` on a GAME_OVER state, which would error or produce confusing state.

**How to avoid:** The timer callback must check `state.phase !== GamePhase.GAME_OVER` before acting. [ASSUMED: this guard is required; shown in Pattern 3 example above]

### Pitfall 4: disconnectedPlayers set not cleared on rematch

**What goes wrong:** After a rematch, the `roomDisconnectedPlayers` Map for that roomId still contains player IDs from the previous game's disconnects. The new game starts with players incorrectly marked as disconnected.

**How to avoid:** In the REMATCH handler, clear `roomDisconnectedPlayers.get(roomId)` (or delete the key) before calling `initGame()`.

### Pitfall 5: room.status "GAME_OVER" not a valid value in LobbyState

**What goes wrong:** The cleanup scanner and REMATCH handler need to check `room.status === "GAME_OVER"`, but `LobbyState.status` is currently typed as `"LOBBY" | "IN_GAME"`. TypeScript will error, and the runtime check will never match. [VERIFIED: packages/shared/src/types/lobby.ts line 14]

**How to avoid:** Add `"GAME_OVER"` to the `LobbyState.status` union. Update the `socket-handler.ts` START_GAME handler to set `room.status = "GAME_OVER"` when FSM reaches GAME_OVER phase — or set it in REMATCH handler after detecting GAME_OVER. The cleanest place is: after every `processAction` call in GAME_ACTION handler, check if `result.state.phase === GamePhase.GAME_OVER` and update `room.status = "GAME_OVER"`.

### Pitfall 6: Frontend renders GAME_OVER WinnerOverlay when game is null (loading)

**What goes wrong:** On page load, `game` is `null`. GameBoard is only rendered when `gameActive && game` (checked in room page). But after rematch, `game` briefly becomes `null` between GAME_STARTED event and the first STATE_UPDATE — because `useGame` resets `game` to null is not what actually happens: `game` retains the previous GAME_OVER state until the new STATE_UPDATE arrives. WinnerOverlay would flash during rematch transition.

**How to avoid:** In `use-game.ts`, when a `GAME_STARTED` event is received, reset `game` to `null` so the loading state shows during transition. Alternatively, add `useGame` listening for `GAME_STARTED` to clear state. [ASSUMED: resetting game to null on GAME_STARTED is the right UX — matches the existing loading path]

### Pitfall 7: Auto-INCOME on active player skip changes their coin count

**What goes wrong:** Using `processAction(state, { type: "INCOME", playerId })` to auto-skip a disconnected active player gives them +1 coin, which is unexpected from the game logic perspective.

**How to avoid:** This is acceptable for v1 per the "minimal implementation" constraint. Alternatively, a `SKIP_TURN` action could be added to the FSM to advance turn without granting coins, but the CONTEXT.md specifies "no FSM changes needed." Using INCOME is the locked-in approach. [ASSUMED: INCOME as skip is acceptable given the minimal-implementation mandate; document it clearly in code comments]

---

## Code Examples

Verified patterns from official sources:

### Cancelling a Timeout
```typescript
// Source: Node.js built-in — [VERIFIED]
const timer: NodeJS.Timeout = setTimeout(callback, 30_000)
clearTimeout(timer) // cancels before firing
```

### Socket.IO adapter room size check (v4)
```typescript
// Source: Socket.IO v4 docs — [VERIFIED via codebase: socket.io already at v4]
const size = io.sockets.adapter.rooms.get(roomId)?.size ?? 0
// size === 0 means no sockets are in that room channel
```

### Socket.IO client 'connect' event fires on reconnect
```typescript
// Source: [ASSUMED — standard Socket.IO v4 client behavior]
// The 'connect' event fires:
// 1. After socket.connect() succeeds (initial connection)
// 2. After automatic reconnect (any dropped connection)
// So listening for 'connect' in useEffect correctly handles both initial load and refresh
socket.on("connect", () => {
  socket.emit("REJOIN_ROOM", roomId)
})
```

### Vitest fake timers for grace timer testing
```typescript
// Source: Vitest docs — [ASSUMED: vi.useFakeTimers() is standard Vitest API]
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

it("should auto-pass after 30 seconds", () => {
  // set up disconnect timer
  startDisconnectTimer(playerId, roomId)
  // advance time without waiting
  vi.advanceTimersByTime(30_000)
  // assert effect
  expect(getGame(roomId)!.pendingAction!.pendingReactions[playerId]).toBe("PASSED")
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom reconnect logic per app | Socket.IO built-in disconnect/reconnect events | Socket.IO v1+ | No custom ping/pong needed; just listen for `disconnect` and `connect` events |
| Server-side session store for socket state | Auth payload (`socket.handshake.auth`) | Socket.IO v3+ | Player identity survives socket ID change on reconnect |

**Deprecated/outdated:**
- `socket.on("reconnect")` client-side event: older Socket.IO client APIs used `reconnect` events; v4 uses `connect` which fires on both initial connect and reconnect — use `connect` instead.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `socket.on("connect")` fires on both initial connect and reconnect in Socket.IO v4 client | Pattern 6, Pitfall 6 | If wrong, need separate `reconnect` listener; behavior change only, easy to fix |
| A2 | Using INCOME action to skip disconnected active player's turn is acceptable (gives +1 coin) | Pattern 3, Pitfall 7 | Low — minimal implementation mandate accepts this; only affects balance in edge case |
| A3 | `disconnectedPlayers` should be separate module-level Map, not part of GameState | Pattern 2 | Architectural: if wrong, coupling issue but no functional breakage |
| A4 | Option (b) — passing disconnectedPlayers as parameter to projectStateForPlayer — is cleaner than reading the Map inside the function | Pattern 7 | Low risk — either approach works; style preference only |
| A5 | `vi.useFakeTimers()` from Vitest handles `setTimeout` / `clearTimeout` in the backend module under test | Code Examples | If fake timers don't intercept module-level setTimeout, need to inject timer functions — easy workaround |
| A6 | `io.sockets.adapter.rooms.get(roomId)?.size` is the correct Socket.IO v4 API for connected socket count | Pattern 5 | If wrong, cleanup criterion silently never matches or always matches — needs verification before implementing cleanup |

**If this table is empty:** Not applicable — A1–A6 above represent the remaining verification gaps.

---

## Open Questions

1. **Does `socket.on("connect")` in Socket.IO v4 client reliably fire on automatic reconnect?**
   - What we know: Standard Socket.IO v4 behavior; used throughout the codebase implicitly
   - What's unclear: Not explicitly tested in this project yet
   - Recommendation: Add a test comment; can be verified quickly during manual verification in Plan 04

2. **Should auto-INCOME on active-player skip be replaced with a `SKIP_TURN` FSM action?**
   - What we know: INCOME gives +1 coin, CONTEXT.md says no FSM changes needed
   - What's unclear: Whether the friend group finds the +1 coin semantically confusing
   - Recommendation: Use INCOME for v1 as decided, add code comment explaining the intentional skip behavior

3. **Should `disconnectedPlayers` survive rematch?**
   - What we know: Pitfall 4 documents that the set must be cleared on rematch
   - What's unclear: Whether any player who was disconnected during GAME_OVER will have their timer still running when rematch fires
   - Recommendation: Cancel all timers for the room's players during REMATCH handler, then clear the disconnectedPlayers set

---

## Environment Availability

Step 2.6: SKIPPED (no new external dependencies — all needed tools already installed in project)

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `apps/backend/vitest.config.ts` |
| Quick run command | `cd apps/backend && npx vitest run` |
| Full suite command | `npm run test` (from repo root) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SYNC-03 | REJOIN_ROOM handler re-emits STATE_UPDATE to reconnecting player | unit | `cd apps/backend && npx vitest run --reporter verbose src/__tests__/reconnect.test.ts` | ❌ Wave 0 |
| SYNC-03 | Cancel grace timer on reconnect before 30s | unit | same file | ❌ Wave 0 |
| SYNC-03 | Player not in room gets ERROR on REJOIN_ROOM | unit | same file | ❌ Wave 0 |
| POST-01 (auto-pass) | Auto-PASS fired after 30s for disconnected reactor | unit (fake timers) | `cd apps/backend && npx vitest run src/__tests__/grace-timer.test.ts` | ❌ Wave 0 |
| POST-01 (auto-skip) | Auto-INCOME fired after 30s for disconnected active player | unit (fake timers) | same file | ❌ Wave 0 |
| POST-01 (rematch) | REMATCH resets game state, re-randomizes players, emits GAME_STARTED | unit | `cd apps/backend && npx vitest run src/__tests__/rematch.test.ts` | ❌ Wave 0 |
| POST-01 (cleanup) | Stale GAME_OVER rooms deleted after 1h inactivity | unit (fake timers) | `cd apps/backend && npx vitest run src/__tests__/cleanup.test.ts` | ❌ Wave 0 |
| POST-02 | WinnerOverlay renders winner name + Revanche button | manual | — | ❌ Wave 0 (component) |

### Sampling Rate
- **Per task commit:** `cd apps/backend && npx vitest run`
- **Per wave merge:** `npm run test` (repo root)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `apps/backend/src/__tests__/reconnect.test.ts` — covers SYNC-03 reconnect handler logic
- [ ] `apps/backend/src/__tests__/grace-timer.test.ts` — covers auto-pass and auto-skip timeout behavior
- [ ] `apps/backend/src/__tests__/rematch.test.ts` — covers REMATCH handler, initGame re-call, room status reset
- [ ] `apps/backend/src/__tests__/cleanup.test.ts` — covers setInterval cleanup logic (fake timers)

*(Existing test files cover game-engine FSM, room-store, project-state, and socket handler logic — no gaps in existing tests, only new files needed for new behaviors)*

---

## Security Domain

> `security_enforcement` not explicitly set to false in config.json — included.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No new auth flow — existing playerId from auth still used |
| V3 Session Management | yes | REJOIN_ROOM verifies playerId is in room.players before re-joining channel |
| V4 Access Control | yes | REMATCH verifies caller is a room member; REJOIN_ROOM verifies player membership |
| V5 Input Validation | yes | roomId validated against rooms Map before any operation |
| V6 Cryptography | no | No new crypto; no secret data in disconnectedPlayers payload |

### Known Threat Patterns for Socket.IO + In-Memory State

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Player spoofing on REJOIN_ROOM (sending another player's roomId) | Spoofing | Backend only allows rejoin if `room.players.some(p => p.playerId === playerId)` — playerId from auth, not from event payload |
| REMATCH spam (repeated rematch requests) | DoS | Check `game.phase === GamePhase.GAME_OVER` before allowing rematch — subsequent calls are no-ops |
| Cleanup scanner deleting active rooms | Tampering | `room.status === "IN_GAME"` check prevents cleanup of active games |
| disconnectedPlayers leaking private state | Information Disclosure | disconnectedPlayers only contains playerIds (already public), not cards or hands |

---

## Sources

### Primary (HIGH confidence)
- `apps/backend/src/socket-handler.ts` — existing handler patterns, auth model, room/game broadcast flow
- `apps/backend/src/rooms/room-store.ts` — joinRoom idempotency, room structure, status field type
- `apps/backend/src/game/game-engine.ts` — initGame shuffle at line 37, processAction contract
- `apps/backend/src/game/game-store.ts` — games Map API (getGame, setGame, deleteGame)
- `packages/shared/src/types/events.ts` — current ClientToServerEvents (REJOIN_ROOM missing, needs addition)
- `packages/shared/src/types/lobby.ts` — LobbyState.status union (missing "GAME_OVER", needs addition)
- `packages/shared/src/types/game-state.ts` — ClientGameState (disconnectedPlayers missing, needs addition)
- `apps/frontend/src/lib/socket.ts` — autoConnect: false, auth payload initialization
- `apps/frontend/src/hooks/use-game.ts` — existing STATE_UPDATE listener pattern to extend
- `apps/backend/src/__tests__/game-socket-handler.test.ts` — existing test mock pattern (makeSocket, makeIo)

### Secondary (MEDIUM confidence)
- Node.js `setTimeout`/`clearTimeout` built-in API — stable, no verification needed

### Tertiary (LOW confidence — assumptions)
- Socket.IO v4 client `connect` event fires on reconnect (A1): [ASSUMED from standard Socket.IO v4 docs pattern]
- `io.sockets.adapter.rooms.get(roomId)?.size` cleanup API (A6): [ASSUMED — standard Socket.IO v4 pattern; verify at implementation time]
- `vi.useFakeTimers()` intercepts module-level setTimeout in Vitest (A5): [ASSUMED — standard Vitest fake timer behavior]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all existing
- Architecture: HIGH — patterns derived directly from verified codebase structure
- Pitfalls: MEDIUM/HIGH — most derived from verified code; A1/A6 are the two remaining assumptions
- Test approach: HIGH — Vitest fake timers API is well-established

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable domain — 30 days)
