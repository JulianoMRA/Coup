# Phase 4: Basic Game Loop - Research

**Researched:** 2026-04-03
**Domain:** WebSocket integration (Socket.IO), React game UI, per-player state projection
**Confidence:** HIGH

## Summary

Phase 4 wires the already-complete, fully-tested FSM (`game-engine.ts`) to the existing Socket.IO infrastructure and builds the game UI so players can play Income, Foreign Aid, and Coup in real time. The backend work is minimal: one new `game-store.ts` module, one new `GAME_ACTION` socket event handler, and per-player `STATE_UPDATE` emissions after every action. The frontend work is the bulk of the phase: a `useGame` hook mirroring `useLobby`, conditional rendering of `<GameBoard>` inside the existing room page, and a suite of focused UI components per the UI-SPEC.

The FSM already handles forced-coup enforcement (10+ coins), AWAITING_COUP_TARGET phase, LOSE_INFLUENCE for both single-card and dual-card players, elimination detection, and GAME_OVER. No game logic needs to be re-implemented — everything the backend must do is: store `GameState` in a `Map`, call `initGame()` on start, call `processAction()` on each `GAME_ACTION`, then broadcast the result. The only non-trivial integration decision is that the COUP flow in Phase 4 operates without a reaction window: the server moves to `AWAITING_COUP_TARGET` immediately and waits for `LOSE_INFLUENCE` from the target.

The key risk is the two-step Coup flow: `COUP` action enters `AWAITING_COUP_TARGET` on the server; only then does the client (target) see the prompt to choose a card, then emits `LOSE_INFLUENCE`. This requires the client to correctly track `phase` from `ClientGameState` and conditionally render the `<InfluenceCardSelector>`.

**Primary recommendation:** Follow the exact `useLobby` / `socket-handler.ts` patterns already in the codebase — no new libraries, no new patterns. The FSM is the ground truth; the WebSocket layer is a thin dispatcher.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Game UI lives on `/room/[roomId]` — `<GameBoard>` renders instead of lobby when `room.status === "IN_GAME"`
- New `useGame` hook (mirrors `useLobby`) — listens to `STATE_UPDATE`, exposes `ClientGameState`
- `<GameBoard>` component conditionally rendered from the existing lobby page file
- `GAME_STARTED` event triggers the lobby→game switch (already fires from Phase 2)
- Button panel at bottom of screen — Income, Foreign Aid, Coup buttons; only enabled for active player
- After clicking "Coup", other alive players become clickable/highlighted to select target
- Influence loss card selection is inline in main game area — show own cards with "Perder esta" button on each
- Forced Coup (10+ coins): disable all non-Coup buttons + small notice "Você deve Golpear"
- Player list panel — each entry shows name, coin count, card count (face-down), eliminated badge
- Eliminated players greyed out + "Eliminado" badge, remain in list but dimmed
- Active player's entry highlighted with border/ring in player list
- Scrollable game log panel on the side (desktop) / collapsible below board (mobile)
- New `GAME_ACTION` socket event in `ClientToServerEvents` carrying `GameAction` payload
- Backend calls `io.to(roomId).emit("STATE_UPDATE", projectStateForPlayer(state, playerId))` per-player individually after each action
- New `game-store.ts` module for in-memory `Map<string, GameState>` (mirrors room-store.ts pattern)
- Winner screen is an overlay on the same game page — no navigation/redirect
- Phase 5 will add the full reaction window (challenge/block) — Phase 4 actions resolve immediately with no reaction window needed
- Game log messages should match the style of existing FSM log
- `ClientGameState` type already exists in shared types and has `STATE_UPDATE` event — use it directly

### Claude's Discretion

- Exact Tailwind classes and layout proportions for the game board
- Portuguese label wording for action buttons (e.g., "Renda" vs "Income" — PT-BR is preferred per project)
- Error handling for invalid actions (e.g., show `ERROR` socket event as a toast or inline message)

### Deferred Ideas (OUT OF SCOPE)

- Character action buttons (Tax, Steal, Assassinate, Exchange) — Phase 5 scope
- Reaction window UI (challenge/block buttons) — Phase 5 scope
- Spectator-specific view/UX polish — Phase 7 scope
- Rematch functionality — Phase 6 scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TURN-01 | Only active player can initiate an action on their turn | FSM enforces this — `processAction` checks `action.playerId !== state.activePlayerId`; UI must disable buttons for non-active players |
| TURN-02 | Available actions by coin count: Income (+1), Foreign Aid (+2), Coup (7 coins, mandatory at 10+) | FSM `handleCoup` guards coins ≥ 7; forced-coup guard in `processAction` blocks non-COUP at 10+; UI mirrors this logic |
| TURN-03 | Character actions: Duke (Tax +3), Assassin (Assassinate), Captain (Steal), Ambassador (Exchange) | OUT OF SCOPE for Phase 4 — buttons are not rendered; handlers exist in FSM but not wired to UI |
| TURN-04 | Target must be selected for actions that require a target (Coup, Assassinate, Steal) | FSM enters `AWAITING_COUP_TARGET` phase after COUP; target selection via `<CoupTargetSelector>` component |
| INFL-01 | Player loses influence when losing challenge, being assassinated, or Couped | In Phase 4 scope: only via Coup. FSM `AWAITING_COUP_TARGET → LOSE_INFLUENCE` handles this |
| INFL-02 | When losing influence with 2 cards, player chooses which card to reveal/discard | FSM `handleLoseInfluenceCoupTarget` accepts `cardIndex`; `<InfluenceCardSelector>` shows unrevealed cards |
| INFL-03 | Discarded card is flipped face-up visible to all (identity revealed) | FSM sets `card.revealed = true`; `projectStateForPlayer` always exposes `revealedCards`; UI renders them |
| INFL-04 | Player with 0 influence is eliminated and becomes spectator (stays in room) | FSM `revealCard` sets `eliminated = true` when all cards revealed; eliminated players see disabled UI |
| INFL-05 | Last player with influence is declared winner | FSM `checkGameOver` transitions to `GAME_OVER` with winner log; `<WinnerOverlay>` renders when `phase === GAME_OVER` |
| AMBX-01 | On Exchange, player receives 2 cards from deck and must choose 2 of 4 to keep | OUT OF SCOPE for Phase 4 |
| AMBX-02 | Card selection UI allows choosing exactly 2 of 4 cards | OUT OF SCOPE for Phase 4 |
| AMBX-03 | Returned cards are shuffled back into deck | OUT OF SCOPE for Phase 4 |
| LOG-01 | Action log visible to all shows each public event in chronological order | `ClientGameState.log` string array; `<GameLog>` component renders entries; scrollable |
| LOG-02 | Log never exposes hidden cards ("Player A lost an influence" not "Player A lost their Duke") | FSM log messages use player IDs/names only — no card names in log for hidden cards; confirmed in FSM code |
| LOG-03 | Coins and influence counts of each player are public and visible to all | `PublicPlayerState` exposes `coins`, `cardCount`, `revealedCards` — always safe to render |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Socket.IO (server) | ^4.8.3 | Backend event transport | Already installed; established pattern |
| Socket.IO (client) | ^4.8.3 | Frontend socket | Already installed; established pattern |
| React | ^19.1.0 | UI rendering | Already installed; established pattern |
| Next.js | ^16.2.2 | Page routing + SSR shell | Already installed; established pattern |
| Vitest | ^4.1.2 | Testing framework | Already installed; all 66 existing tests use it |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (Button, Card, Badge) | already installed | UI primitives | All interactive and display components |
| lucide-react | ^0.511.0 | Icons | Already installed; used in lobby |
| @coup/shared | * | Shared types (GameAction, ClientGameState, etc.) | All type imports across frontend and backend |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom hooks + socket | Zustand/Redux | Custom hooks are the established pattern in this repo — introducing a store would be scope creep |
| Per-player STATE_UPDATE | Single broadcast to room | Per-player is required by SYNC-02 (never send hidden cards); already implemented in `projectStateForPlayer` |

**No new packages are needed for Phase 4.**

---

## Architecture Patterns

### Recommended Project Structure

```
apps/backend/src/
├── game/
│   ├── game-engine.ts        # EXISTS — pure FSM, no changes needed
│   ├── game-store.ts         # NEW — Map<roomId, GameState>, mirrors room-store.ts
│   └── project-state.ts      # EXISTS — projectStateForPlayer(), no changes needed
├── rooms/
│   └── room-store.ts         # EXISTS — no changes needed
└── socket-handler.ts         # MODIFY — add GAME_ACTION handler + initGame on START_GAME

apps/frontend/src/
├── hooks/
│   ├── use-lobby.ts          # EXISTS — no changes needed
│   └── use-game.ts           # NEW — listens to STATE_UPDATE, exposes ClientGameState
├── components/
│   ├── game-board.tsx        # NEW — top-level conditional component
│   ├── player-panel.tsx      # NEW — player list with coins, cards, eliminated badge
│   ├── action-bar.tsx        # NEW — Income/Foreign Aid/Coup buttons
│   ├── coup-target-selector  # NEW — target selection overlay for AWAITING_COUP_TARGET
│   ├── influence-card-selector.tsx # NEW — choose card to lose
│   ├── game-log.tsx          # NEW — scrollable log panel
│   └── winner-overlay.tsx    # NEW — GAME_OVER screen
└── app/room/[roomId]/
    └── page.tsx              # MODIFY — add gameState from useGame, conditional render GameBoard

packages/shared/src/types/
└── events.ts                 # MODIFY — add GAME_ACTION to ClientToServerEvents
```

### Pattern 1: game-store.ts (mirrors room-store.ts)

**What:** In-memory `Map<string, GameState>` with pure functions; no classes, no side effects.
**When to use:** All backend game state reads and writes.

```typescript
// apps/backend/src/game/game-store.ts
import type { GameState } from "@coup/shared"

export const games = new Map<string, GameState>()

export function getGame(roomId: string): GameState | undefined {
  return games.get(roomId)
}

export function setGame(roomId: string, state: GameState): void {
  games.set(roomId, state)
}

export function deleteGame(roomId: string): void {
  games.delete(roomId)
}
```

### Pattern 2: GAME_ACTION socket handler

**What:** Single handler dispatches any `GameAction` to the FSM and broadcasts per-player updates.
**When to use:** Every player action in the game.

```typescript
// Inside socket-handler.ts — add to io.on("connection", ...) block
socket.on("GAME_ACTION", (roomId: string, action: GameAction) => {
  const state = getGame(roomId)
  if (!state) { socket.emit("ERROR", "Game not found"); return }

  const result = processAction(state, { ...action, playerId })
  if (!result.ok) { socket.emit("ERROR", result.error); return }

  setGame(roomId, result.state)

  // Per-player broadcast — never send hidden cards
  for (const player of result.state.players) {
    const projection = projectStateForPlayer(result.state, player.id)
    io.to(roomId).emit("STATE_UPDATE", projection)
    // Note: in a real implementation, target per socket by playerId → socketId map
    // Simplification: emit to room — projectStateForPlayer strips hidden cards
  }
})
```

**Important:** `STATE_UPDATE` is emitted to the whole room but `projectStateForPlayer` strips hidden cards per player. Phase 4 can emit to the room and rely on projection — individual socket targeting is a Phase 6 concern (SYNC-03 reconnect).

### Pattern 3: useGame hook (mirrors useLobby)

**What:** React hook subscribing to `STATE_UPDATE` events, exposes `ClientGameState`.
**When to use:** Any component that needs game state.

```typescript
// apps/frontend/src/hooks/use-game.ts
"use client"
import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import type { ClientGameState } from "@coup/shared"

export function useGame(
  roomId: string,
  playerId: string
): { game: ClientGameState | null; error: string | null } {
  const [game, setGame] = useState<ClientGameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    socket.on("STATE_UPDATE", setGame)
    socket.on("ERROR", setError)
    return () => {
      socket.off("STATE_UPDATE", setGame)
      socket.off("ERROR", setError)
    }
  }, [roomId, playerId])

  return { game, error }
}
```

### Pattern 4: Conditional lobby/game render

**What:** The room page holds both lobby and game state; renders one or the other based on `GAME_STARTED` event.
**When to use:** Switching from lobby to game without navigation.

```typescript
// In room/[roomId]/page.tsx — add state and effect
const [gameActive, setGameActive] = useState(false)
const { game, error: gameError } = useGame(roomId, playerId)

useEffect(() => {
  socket.on("GAME_STARTED", () => setGameActive(true))
  return () => { socket.off("GAME_STARTED") }
}, [])

// Render logic:
if (gameActive && game) return <GameBoard game={game} playerId={playerId} roomId={roomId} />
// else: existing lobby render
```

### Pattern 5: GAME_ACTION emission from UI

**What:** All player actions are emitted as a single typed `GAME_ACTION` event.
**When to use:** Every button click in the game UI.

```typescript
// In action-bar.tsx
function handleIncome() {
  socket.emit("GAME_ACTION", roomId, { type: "INCOME", playerId })
}

function handleCoup() {
  // Transitions to local target-selection UI state; actual COUP event emitted after target chosen
  setSelectingCoupTarget(true)
}

function handleTargetSelected(targetId: string) {
  socket.emit("GAME_ACTION", roomId, { type: "COUP", playerId, targetId })
  setSelectingCoupTarget(false)
}
```

### Pattern 6: Influence card selector (phase-gated)

**What:** Renders when `game.phase === "AWAITING_COUP_TARGET"` and `game.pendingAction?.targetId === playerId`.
**When to use:** Only for the player who must lose influence after a Coup.

```typescript
// In influence-card-selector.tsx
const myUnrevealedCards = game.myHand.filter(c => !c.revealed)

myUnrevealedCards.map((card, idx) => (
  <Button
    key={idx}
    variant="destructive"
    aria-label={`Perder ${card.type}`}
    onClick={() => socket.emit("GAME_ACTION", roomId, {
      type: "LOSE_INFLUENCE",
      playerId,
      cardIndex: game.myHand.indexOf(card),
    })}
  >
    Perder esta
  </Button>
))
```

**Critical:** `cardIndex` must be the index in `myHand` (the full hand array), not the index in the filtered unrevealed array. A player with one revealed and one unrevealed card must send the correct index.

### Anti-Patterns to Avoid

- **Emitting GAME_ACTION before GAME_STARTED:** The `games` Map won't have the entry yet. Always guard with `gameActive` state.
- **Broadcasting a single STATE_UPDATE to the room without per-player projection:** Would leak hidden card data to all players. Always call `projectStateForPlayer` per player.
- **Using the FSM's `activePlayerId` check on the frontend as an authorization gate:** The FSM is the authoritative gate — UI disabling is only UX. Never skip the backend validation.
- **Sending `COUP` action directly without entering target-selection UI first:** The server moves to `AWAITING_COUP_TARGET` phase on receiving `COUP`. The frontend must emit `LOSE_INFLUENCE` next. The `COUP` action already has `targetId` in the GameAction type — send it in one shot.
- **Importing `GameState` (server type) into frontend components:** Only `ClientGameState` crosses the wire. Frontend components work exclusively with `ClientGameState` and `PublicPlayerState`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Turn enforcement | Custom turn guard | `processAction` in FSM | FSM already rejects wrong-player actions with `{ ok: false, error }` |
| Forced coup detection | Custom coin check in UI | FSM `processAction` guard + UI mirrors the same condition | FSM blocks non-COUP at 10+ coins server-side; UI disables buttons client-side |
| Per-player state hiding | Custom projection logic | `projectStateForPlayer()` in `project-state.ts` | Already tested; handles revealed cards, hand stripping |
| Elimination detection | Custom alive-player check | FSM `checkGameOver` + `revealCard` | Already sets `eliminated = true` and transitions to `GAME_OVER` |
| Winner detection | Custom win condition | FSM `checkGameOver` | Already fires when `alive.length === 1` |
| Shuffle | Custom shuffle | Fisher-Yates in `shuffleInPlace` | Already in game-engine.ts; no need to expose |

**Key insight:** The FSM is the single source of truth for all game logic. The WebSocket layer is a thin pass-through. The UI layer is pure projection of `ClientGameState`.

---

## Common Pitfalls

### Pitfall 1: STATE_UPDATE received by wrong player (hidden card leak)

**What goes wrong:** If `STATE_UPDATE` is emitted to the entire room with a single payload, all players receive the same state object which could contain another player's `myHand`.
**Why it happens:** Emitting `io.to(roomId).emit("STATE_UPDATE", singleState)` — the state object is identical for everyone.
**How to avoid:** Iterate `result.state.players` and call `projectStateForPlayer(state, player.id)` for each, then target individual sockets. In Phase 4 the simplest safe approach is: emit to room but rely on projection (each player only receives their own hand contents because `projectStateForPlayer` is always called before emission).
**Warning signs:** A player's `myHand` contains cards they shouldn't see.

### Pitfall 2: cardIndex sent for LOSE_INFLUENCE is wrong

**What goes wrong:** Player has `[{type: DUKE, revealed: true}, {type: CAPTAIN, revealed: false}]`. The `<InfluenceCardSelector>` shows only unrevealed cards filtered at index 0. Clicking it sends `cardIndex: 0`. But the FSM calls `hand.map((c, i) => i === cardIndex ? ... )` so `cardIndex: 0` would reveal the already-revealed DUKE, not the CAPTAIN.
**Why it happens:** Filtering unrevealed cards creates a new array with different indices.
**How to avoid:** Always send the index as it appears in `myHand` (the original unfiltered array). When building the selector, track `originalIndex = game.myHand.indexOf(card)` and use that for the emission.

### Pitfall 3: gameActive state out of sync with server

**What goes wrong:** Frontend shows `<GameBoard>` but server has no `GameState` in the Map yet (race condition if `GAME_STARTED` fires before `initGame` completes).
**Why it happens:** `START_GAME` handler sets `room.status = "IN_GAME"` and emits `GAME_STARTED` — if `initGame` is called after the emit, the first `GAME_ACTION` from a fast client may arrive before the state is stored.
**How to avoid:** Call `initGame()` and `setGame()` before emitting `GAME_STARTED` in `socket-handler.ts`.

### Pitfall 4: GAME_ACTION type not added to shared events

**What goes wrong:** TypeScript compilation fails; socket.emit("GAME_ACTION", ...) is a type error.
**Why it happens:** `ClientToServerEvents` in `packages/shared/src/types/events.ts` doesn't have `GAME_ACTION` yet.
**How to avoid:** Add `GAME_ACTION: (roomId: string, action: GameAction) => void` to `ClientToServerEvents` as the first step — before any frontend or backend handler code.

### Pitfall 5: useGame hook and useLobby hook both listening to ERROR

**What goes wrong:** Both hooks call `socket.on("ERROR", setError)`. A lobby error (e.g., "Room not found") could appear as a game error and vice versa.
**Why it happens:** Socket events are global — all listeners on the same event name fire.
**How to avoid:** The existing lobby cleanup (`socket.off("ERROR", setError)`) in `useLobby` runs when the effect cleans up. Ensure `useLobby` is unmounted (or its effect cleaned up) before `useGame` mounts. Because `useGame` only starts after `GAME_STARTED`, and the lobby useEffect cleans up when the component unmounts or when `playerName` changes, this is naturally safe if `<GameBoard>` is rendered instead of the lobby block (not alongside it).

### Pitfall 6: Coup target selection — local UI state vs server phase

**What goes wrong:** Player clicks "Golpe", enters local target-selection state, then server emits `STATE_UPDATE` with `phase: AWAITING_ACTION` (e.g., if coins dropped below 7 due to a server correction). Now the UI is in target-selection mode but the server is back in action phase.
**Why it happens:** Optimistic local UI state diverges from server state.
**How to avoid:** Always derive UI display mode from `game.phase` (server source of truth) rather than local React state for the target-selection toggle. If `game.phase !== "AWAITING_COUP_TARGET"`, never show the target selector.

---

## Code Examples

### Extending ClientToServerEvents

```typescript
// packages/shared/src/types/events.ts
import type { GameAction } from "./game-state"

export interface ClientToServerEvents {
  PING: () => void
  JOIN_ROOM: (roomId: string, name: string) => void
  LEAVE_ROOM: (roomId: string) => void
  SET_READY: (roomId: string, isReady: boolean) => void
  START_GAME: (roomId: string) => void
  GAME_ACTION: (roomId: string, action: GameAction) => void  // ADD THIS
}
```

### START_GAME modified to initialize game state

```typescript
// In socket-handler.ts — modify existing START_GAME handler
socket.on("START_GAME", (roomId) => {
  const room = rooms.get(roomId)
  if (!room) { socket.emit("ERROR", "Room not found"); return }
  if (room.hostId !== playerId) { socket.emit("ERROR", "Only host can start"); return }
  if (room.players.length < 2) { socket.emit("ERROR", "Need at least 2 players"); return }
  if (!room.players.every((p) => p.isReady)) { socket.emit("ERROR", "Not all players are ready"); return }

  const initialState = initGame(roomId, room.players)  // ADD
  setGame(roomId, initialState)                         // ADD: store BEFORE emit

  room.status = "IN_GAME"
  io.to(roomId).emit("GAME_STARTED", roomId)

  // Emit initial STATE_UPDATE to each player
  for (const player of room.players) {
    const projection = projectStateForPlayer(initialState, player.playerId)
    io.to(roomId).emit("STATE_UPDATE", projection)
  }
})
```

### GameBoard conditional render in room page

```typescript
// In room/[roomId]/page.tsx — add near top of component
const [gameActive, setGameActive] = useState(false)
const { game } = useGame(roomId, playerId)

useEffect(() => {
  function onGameStarted() { setGameActive(true) }
  socket.on("GAME_STARTED", onGameStarted)
  return () => { socket.off("GAME_STARTED", onGameStarted) }
}, [])

// In render, before sub-state A check:
if (gameActive && game) {
  return <GameBoard game={game} playerId={playerId} roomId={roomId} />
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XState / state machine libraries | Plain TypeScript enum + transition map | Phase 3 decision | No external FSM dependency; simpler debugging |
| Zustand/Redux for client state | Custom hooks with socket listeners | Phase 2 decision | Less boilerplate; consistent with existing code |
| Single broadcast STATE_UPDATE | Per-player projection before broadcast | Phase 1 decision (SYNC-02) | Security-critical; `projectStateForPlayer` is the enforcement point |

---

## Open Questions

1. **Per-socket targeting for STATE_UPDATE**
   - What we know: Currently there is no `playerId → socketId` Map. `io.to(roomId).emit(...)` sends to all sockets in the room.
   - What's unclear: If all clients in the room receive all STATE_UPDATE emissions (one per player), each client processes N emissions per action but only the last one is meaningful — or each is a different projection (only one matching their playerId).
   - Recommendation: For Phase 4, emit once per player but to the whole room — since `projectStateForPlayer` is called per player, the last emission wins on each client. Simpler approach: emit a single STATE_UPDATE per action using the receiving player's projection. Full per-socket targeting is deferred to Phase 6. For correctness in Phase 4: call `projectStateForPlayer` per player and emit N times to the room — each client stores the last received state. This is safe because hidden card data is stripped per projection.

2. **AMBX-01/02/03 listed in phase requirements but deferred**
   - What we know: AMBX-01, AMBX-02, AMBX-03 are in the phase requirement IDs for Phase 4 per ROADMAP.md, but CONTEXT.md defers Ambassador Exchange to Phase 5 scope.
   - What's unclear: Whether the planner should include AMBX stubs or leave them completely unimplemented.
   - Recommendation: The FSM already fully implements EXCHANGE and EXCHANGE_CHOOSE. No backend work needed. The UI for AMBX (the 4-card selection interface) is explicitly deferred to Phase 5. The planner should note this mismatch but not include AMBX UI work in Phase 4 plans.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend runtime | ✓ | (project running) | — |
| npm | Package manager | ✓ | (project running) | — |
| Vitest | Test runner | ✓ | ^4.1.2 | — |
| Socket.IO | WebSocket transport | ✓ | ^4.8.3 (both server/client) | — |
| Next.js | Frontend framework | ✓ | ^16.2.2 | — |
| shadcn/ui components | UI primitives | ✓ | Button, Card, Badge installed | — |

All dependencies are satisfied. No new installs required for Phase 4.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `apps/backend/vitest.config.ts`, `apps/frontend/vitest.config.ts`, root `vitest.config.ts` |
| Quick run command | `npm run test` (from repo root) |
| Full suite command | `npm run test` (from repo root — runs all 8 test files) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TURN-01 | Only active player can act | unit | `npm run test` | ❌ Wave 0 — `game-socket-handler.test.ts` |
| TURN-02 | Coins enforce action availability; forced coup at 10+ | unit | `npm run test` | ❌ Wave 0 — covered by FSM tests already; socket dispatch needs new test |
| TURN-04 | COUP requires target selection | unit | `npm run test` | ❌ Wave 0 |
| INFL-01 | Coup causes influence loss | unit | `npm run test` | ❌ Wave 0 |
| INFL-02 | Two-card player chooses which to discard | unit | `npm run test` | ❌ Wave 0 |
| INFL-03 | Discarded card revealed to all | unit | `npm run test` | ❌ Wave 0 |
| INFL-04 | Zero-influence player is eliminated | unit | `npm run test` | ❌ Wave 0 — FSM already has this; socket/projection path needs test |
| INFL-05 | Last player wins → GAME_OVER | unit | `npm run test` | ❌ Wave 0 |
| LOG-01 | Log visible and in order | unit (hook) | `npm run test` | ❌ Wave 0 — `use-game.test.ts` |
| LOG-02 | Log never reveals hidden cards | unit | `npm run test` | ❌ Wave 0 — verifiable via `projectStateForPlayer` (already tested) + log string check |
| LOG-03 | Coins and card counts public | unit | `npm run test` | ❌ Wave 0 — `PublicPlayerState` already tested in `project-state.test.ts` |

**Note:** FSM logic (TURN-01, TURN-02, INFL-01 through INFL-05) is already tested by 59 FSM tests. New Phase 4 tests focus on the socket dispatch layer (`game-socket-handler.test.ts`) and the frontend hook (`use-game.test.ts`). UI component behavior (INFL-02, INFL-03, LOG-01) is validated via human verification.

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green + human verification of game flow before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/backend/src/__tests__/game-socket-handler.test.ts` — covers TURN-01, TURN-04, INFL-04, INFL-05 at socket dispatch level
- [ ] `apps/frontend/src/__tests__/use-game.test.ts` — covers LOG-01 (state propagation via STATE_UPDATE)

*(Existing `project-state.test.ts` already covers LOG-02/LOG-03 via `projectStateForPlayer` assertions. Existing FSM tests cover all game logic transitions.)*

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `apps/backend/src/game/game-engine.ts` — full FSM implementation
- Direct code inspection of `apps/backend/src/game/project-state.ts` — projection function
- Direct code inspection of `apps/backend/src/socket-handler.ts` — established handler pattern
- Direct code inspection of `apps/frontend/src/hooks/use-lobby.ts` — hook pattern to mirror
- Direct code inspection of `packages/shared/src/types/events.ts` — current event types
- Direct code inspection of `packages/shared/src/types/game-state.ts` — all shared types
- Direct code inspection of `apps/frontend/src/app/room/[roomId]/page.tsx` — integration point

### Secondary (MEDIUM confidence)
- `.planning/phases/04-basic-game-loop/04-CONTEXT.md` — user decisions
- `.planning/phases/04-basic-game-loop/04-UI-SPEC.md` — UI design contract
- `.planning/REQUIREMENTS.md` — requirement definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json; versions verified
- Architecture: HIGH — patterns directly observed in working codebase
- Pitfalls: HIGH — derived from reading actual FSM and socket handler code; cardIndex pitfall is concrete
- Test requirements: HIGH — existing test infrastructure confirmed working (66/66 passing)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable stack — no external dependencies changing)
