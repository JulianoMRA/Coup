# Architecture Patterns: Real-Time Multiplayer Card Game (Coup)

**Domain:** Turn-based card game with real-time async reactions, hidden information, server authority
**Researched:** 2026-04-01
**Confidence:** MEDIUM-HIGH (well-established patterns; WebSearch unavailable, based on training knowledge)

---

## Recommended Architecture

```
Browser (Player A)              Browser (Player B)              Browser (Player C)
      |                               |                               |
  React UI                       React UI                       React UI
  (partial state)                (partial state)                (partial state)
      |                               |                               |
      +---------------+---------------+
                      |
              WebSocket Connection
              (per player, persistent)
                      |
            +---------+---------+
            |                   |
      Room Manager        Game Engine
      (lobby/session)     (authoritative state)
            |                   |
            +-------------------+
                      |
              In-Memory Store
              (game state, keyed by roomId)
```

The server holds the **single source of truth**. Clients hold only the subset of state they are permitted to see. Every game action flows: Client → Server (validate + apply) → Server broadcasts filtered views to each player.

---

## Component Boundaries

### Frontend Components

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `LobbyPage` | Room creation, invite link display, waiting for players to join | `RoomManager` via WebSocket |
| `GamePage` | Renders game state, action buttons, card display, game log | `GameEngine` via WebSocket |
| `WebSocketClient` | Manages connection, reconnection, dispatches inbound events to UI state | Backend WebSocket server |
| `GameStateStore` | Client-side Redux/Zustand store holding the player's partial view | All UI components |
| `ActionPanel` | Renders available actions for the active player's turn | `GameStateStore` |
| `ReactionPanel` | Renders challenge/block options during other players' turns | `GameStateStore` |

### Backend Components

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `WebSocketServer` | Accepts connections, routes messages, maps `socketId` to `playerId` | All backend components |
| `RoomManager` | Creates rooms, generates invite codes, manages player join/leave, starts game | `WebSocketServer`, `GameEngine` |
| `GameEngine` | Owns and mutates game state, validates all actions, drives the state machine | `RoomManager`, `StateStore`, `MessageBroadcaster` |
| `StateMachine` | Encodes legal turn transitions (see below), determines what input is expected next | `GameEngine` |
| `MessageBroadcaster` | Filters full game state per player and pushes the appropriate partial view | `WebSocketServer`, `GameEngine` |
| `StateStore` | In-memory Map of `roomId → GameState` (no DB required for v1) | `GameEngine` |

### Boundary Rule

The `GameEngine` never sends WebSocket messages directly. It returns state mutations and a list of events; `MessageBroadcaster` handles all fan-out. This keeps game logic testable without a running server.

---

## Data Flow

### Action Flow (happy path — no challenges or blocks)

```
1. Player clicks "Tax" (Duke action)
   Client → WS → { type: "ACTION", action: "tax", playerId: "A" }

2. Server: GameEngine.handleAction(roomId, "A", "tax")
   - Validates: is it player A's turn? Does state allow "ACTION" input?
   - Transitions state machine: AWAITING_ACTION → AWAITING_REACTIONS
   - Sets reaction timer (e.g., 10s window for others to challenge/block)
   - Does NOT execute action yet

3. MessageBroadcaster fans out to all players:
   { type: "ACTION_ANNOUNCED", actor: "A", action: "tax" }
   (All players see this — no hidden info at announcement stage)

4. Other players can send:
   { type: "CHALLENGE", challengerId: "B" }
   or
   { type: "PASS" } (explicit pass — or auto-pass after timer)

5. When all non-actors have passed (or timer expires):
   StateMachine transitions: AWAITING_REACTIONS → RESOLVING_ACTION
   Action executes (player A gains 3 coins)
   Transitions to: AWAITING_ACTION (next player)

6. MessageBroadcaster sends updated state to all players
```

### Challenge Flow

```
1. Player B challenges "Tax" (claims A doesn't have Duke)
   Client → WS → { type: "CHALLENGE", challengerId: "B", targetId: "A" }

2. GameEngine transitions: AWAITING_REACTIONS → RESOLVING_CHALLENGE
   - Player A must reveal a card
   Client → WS → { type: "REVEAL_CARD", cardIndex: 0 }

3. GameEngine evaluates:
   - If card IS Duke: B loses an influence (discards a card), A shuffles Duke back and draws replacement
     → Transitions back to execute the action → RESOLVING_ACTION
   - If card is NOT Duke: A loses an influence
     → Transitions to AWAITING_ACTION (action failed)

4. Fan-out: revealed card is broadcast to ALL players (challenge resolution is public)
```

### Block Flow

```
1. Player B blocks "Tax" — not possible (Tax is unblockable, but Steal/ForeignAid are)
   Suppose A plays "Steal" from B, and B claims Captain to block:
   { type: "BLOCK", blockerId: "B", claimedCard: "captain" }

2. GameEngine transitions: AWAITING_REACTIONS → AWAITING_BLOCK_CHALLENGE
   - Now A (or others) can challenge the block, or everyone passes

3a. No challenge to block → Action is cancelled. Turn ends.
3b. Challenge to block → Reveal loop same as above but targeting the blocker.
```

---

## Game State Machine

The `StateMachine` is the heart of the server. Coup's turn has nested async phases that must be modeled explicitly.

### States

```
LOBBY                        — waiting for players, not started
AWAITING_ACTION              — active player must declare an action
AWAITING_REACTIONS           — announced action; waiting for challenges/blocks from others
  └─ sub: collecting passes (track who has responded)
AWAITING_BLOCK_CHALLENGE     — a block was declared; waiting for challenge or passes
  └─ sub: collecting passes
RESOLVING_CHALLENGE          — challenge declared; waiting for card reveal from challenged player
RESOLVING_BLOCK_CHALLENGE    — challenge to block; waiting for reveal from blocker
RESOLVING_ACTION             — all reactions resolved; executing the action effect
AWAITING_COUP_TARGET         — player chose Coup or Assassinate; waiting for target to pick card to lose
AWAITING_EXCHANGE            — Ambassador: waiting for player to return 2 cards
GAME_OVER                    — one player remains
```

### Transition Table (abbreviated)

| Current State | Input | Next State | Notes |
|---------------|-------|------------|-------|
| LOBBY | `START_GAME` (host) | AWAITING_ACTION | All players joined |
| AWAITING_ACTION | `ACTION` (active player) | AWAITING_REACTIONS | If action is unblockable+unchallengeable → RESOLVING_ACTION directly |
| AWAITING_REACTIONS | `CHALLENGE` | RESOLVING_CHALLENGE | |
| AWAITING_REACTIONS | `BLOCK` | AWAITING_BLOCK_CHALLENGE | |
| AWAITING_REACTIONS | all players PASS (or timer) | RESOLVING_ACTION | |
| AWAITING_BLOCK_CHALLENGE | `CHALLENGE` | RESOLVING_BLOCK_CHALLENGE | |
| AWAITING_BLOCK_CHALLENGE | all PASS (or timer) | AWAITING_ACTION (next) | Block succeeded, action cancelled |
| RESOLVING_CHALLENGE | `REVEAL_CARD` (challenged player) | RESOLVING_ACTION or AWAITING_ACTION | Depends on reveal result |
| RESOLVING_BLOCK_CHALLENGE | `REVEAL_CARD` (blocker) | AWAITING_ACTION (next) or RESOLVING_ACTION | Depends on result |
| RESOLVING_ACTION | (auto, no input) | AWAITING_COUP_TARGET / AWAITING_EXCHANGE / AWAITING_ACTION | Action-dependent |
| AWAITING_COUP_TARGET | `SELECT_CARD` (victim) | AWAITING_ACTION (next) | |
| AWAITING_EXCHANGE | `RETURN_CARDS` (ambassador) | AWAITING_ACTION (next) | |

### Pending Responses Tracking

During `AWAITING_REACTIONS` and `AWAITING_BLOCK_CHALLENGE`, the state must track:

```typescript
interface PendingResponses {
  waitingFor: Set<PlayerId>;   // players who haven't responded yet
  responses: Map<PlayerId, "pass" | "challenge" | "block">;
  timer: NodeJS.Timeout | null;
}
```

The state machine resolves when `waitingFor` is empty OR the timer fires (all non-responders auto-pass).

---

## Hidden Information Model

### Server holds full state

```typescript
interface ServerGameState {
  players: Map<PlayerId, PlayerState>;
  deck: Card[];          // shuffled, private
  phase: GamePhase;
  activePlayerId: PlayerId;
  pendingAction: PendingAction | null;
  pendingResponses: PendingResponses | null;
  log: GameEvent[];      // full history
}

interface PlayerState {
  id: PlayerId;
  name: string;
  coins: number;
  hand: Card[];          // PRIVATE — never sent to other players
  eliminated: boolean;
}
```

### Client receives a filtered projection

`MessageBroadcaster` creates a per-player view before sending:

```typescript
interface ClientGameState {
  myHand: Card[];                          // only this player's cards
  players: PublicPlayerState[];            // opponents: coins, eliminated, card count (not card identity)
  phase: GamePhase;
  activePlayerId: PlayerId;
  pendingAction: PendingAction | null;
  availableActions: ActionType[];          // computed server-side: what CAN I do right now?
  log: GameEvent[];                        // sanitized log (no hidden reveals)
}

interface PublicPlayerState {
  id: PlayerId;
  name: string;
  coins: number;
  eliminated: boolean;
  cardCount: number;                       // number of remaining influence cards (not their identity)
  revealedCards: Card[];                   // cards that have been revealed/lost (public knowledge)
}
```

### Why server computes `availableActions`

The server tells each client what actions are legal for them right now. The client never computes legality — it just renders what the server says is available. This prevents manipulation: a hacked client cannot unlock illegal actions because the server rejects anything not in the current valid input set for that player.

---

## WebSocket Message Protocol

### Client → Server (commands)

```typescript
type ClientMessage =
  | { type: "JOIN_ROOM"; roomCode: string; playerName: string }
  | { type: "CREATE_ROOM"; playerName: string }
  | { type: "START_GAME" }
  | { type: "ACTION"; action: ActionType; targetId?: PlayerId }
  | { type: "CHALLENGE" }
  | { type: "BLOCK"; claimedCard: CardType }
  | { type: "PASS" }
  | { type: "REVEAL_CARD"; cardIndex: 0 | 1 }
  | { type: "SELECT_CARDS"; cardIndices: number[] }  // Ambassador exchange
```

### Server → Client (events)

```typescript
type ServerMessage =
  | { type: "ROOM_JOINED"; roomCode: string; playerId: PlayerId }
  | { type: "PLAYER_JOINED"; player: PublicPlayerState }
  | { type: "GAME_STARTED"; state: ClientGameState }
  | { type: "STATE_UPDATE"; state: ClientGameState }   // primary update — full re-sync
  | { type: "ACTION_ANNOUNCED"; actor: PlayerId; action: ActionType; target?: PlayerId }
  | { type: "CARD_REVEALED"; player: PlayerId; card: Card }
  | { type: "PLAYER_ELIMINATED"; player: PlayerId }
  | { type: "GAME_OVER"; winner: PlayerId }
  | { type: "ERROR"; code: string; message: string }
```

Prefer sending full `STATE_UPDATE` over delta patches for this scale (2-6 players). Delta complexity is not justified. Full state snapshots are small and eliminate sync bugs.

---

## Build Order (Component Dependencies)

Build in this order to avoid circular dependencies and enable incremental testing:

```
1. StateMachine (pure logic, no I/O)
   └─ Can be unit-tested in isolation
   └─ Input: current state + event → Output: new state

2. GameEngine (wraps StateMachine, owns state store)
   └─ Add action validators here
   └─ Add effect executors (coin changes, card draws, etc.)
   └─ Testable without WebSockets

3. MessageBroadcaster (state → per-player view)
   └─ Pure function: (fullState, playerId) → ClientGameState
   └─ Testable without WebSockets

4. RoomManager (session lifecycle)
   └─ Create/join/leave rooms
   └─ Calls GameEngine.start() when host starts game

5. WebSocketServer (glue layer)
   └─ Maps socket connections to playerIds
   └─ Routes incoming messages to GameEngine/RoomManager
   └─ Calls MessageBroadcaster after every state change
   └─ Handles reconnection (rehydrate state on reconnect)

6. React Frontend — GameStateStore
   └─ Zustand or React Context holding ClientGameState
   └─ WebSocketClient feeding into it

7. React Frontend — UI Components
   └─ LobbyPage, GamePage, ActionPanel, ReactionPanel
   └─ Read from GameStateStore only
```

---

## Reconnection Handling

Players on a bad connection must be able to rejoin without losing game state.

Strategy:
- On `JOIN_ROOM` with an existing `playerId` (stored in `localStorage`): server recognizes the reconnect and sends a full `STATE_UPDATE` with the current game state.
- The game continues regardless of a player being temporarily disconnected (the timer mechanism means their silence = auto-pass).
- If a player disconnects as the active player: a short grace period (30s) before auto-passing or auto-conceding.

---

## In-Memory vs. Persistent State

For v1 (small group, no history requirements):

- **In-memory only.** A `Map<roomId, GameState>` in the Node.js process is sufficient.
- Rooms expire after the game ends or after an inactivity timeout (e.g., 2 hours).
- No database needed in v1. This dramatically simplifies the build.

Upgrade path if needed later: serialize `GameState` to Redis with TTL. The `GameEngine` interface does not need to change — only the store backing it.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Game Logic on the Client
**What:** Client computes who wins a challenge, what actions are legal, or resolves action effects.
**Why bad:** Any player can manipulate JS in DevTools and cheat. Also causes state divergence between clients.
**Instead:** Server is the only place game rules execute. Client only renders server-provided state.

### Anti-Pattern 2: Sending Full Hand to All Players
**What:** Broadcasting the complete `GameState` (including all hands) to all clients.
**Why bad:** Trivially exposes hidden cards via browser DevTools network tab.
**Instead:** `MessageBroadcaster` filters per player before every send.

### Anti-Pattern 3: Event Sourcing Without a Projector
**What:** Storing every event and rebuilding state from event log on every query.
**Why bad:** Correct pattern for audit systems, but massively overcomplicated for a 6-person game room.
**Instead:** Mutable in-memory state is the right fit at this scale.

### Anti-Pattern 4: Optimistic Client Actions
**What:** Client applies game actions locally before server confirmation (common in non-hidden-info games).
**Why bad:** Coup has hidden information and complex conditional resolution — client can't know the outcome.
**Instead:** Client sends action, waits for `STATE_UPDATE` from server, then renders. Latency is imperceptible at LAN-like scales.

### Anti-Pattern 5: Ad-hoc If/Else Turn Flow
**What:** `if (phase === "reactions") { if (challenged) { ... } else if (blocked) { ... } }` spread across handlers.
**Why bad:** Coup's turn flow has 10+ states. Without a formal state machine this becomes unmaintainable.
**Instead:** Explicit `StateMachine` with a transition table. Illegal transitions are rejected at the machine level.

---

## Scalability Considerations

This is a private game for friends; scalability is not a concern for v1. Documented here for completeness.

| Concern | At 6 players (v1 target) | At 100 concurrent rooms | Notes |
|---------|--------------------------|-------------------------|-------|
| WebSocket connections | 6 sockets per room, trivial | 600 sockets, trivial for Node.js | Node.js handles thousands |
| Memory | ~10KB state per room | ~1MB | No concern |
| Message fan-out | 1 server → 6 clients per event | Same pattern | O(players per room), not O(total players) |
| Single-process | Fine | Fine | Horizontal scaling would require Redis pub/sub for room state |

---

## Sources

- Architecture patterns drawn from training knowledge of established multiplayer game server design (e.g., socket.io-based game servers, boardgame.io architecture, lichess.org open-source structure)
- Hidden information model: standard in competitive card game implementations (Hearthstone, tabletop simulators, boardgame.io)
- State machine pattern for turn-based games: well-documented in game dev community; XState library as reference for explicit state modeling
- Confidence: MEDIUM-HIGH. WebSearch was unavailable. Patterns described are widely established and directly applicable. No cutting-edge 2025-specific library recommendations made.
