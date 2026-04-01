# Domain Pitfalls

**Domain:** Online multiplayer card game (Coup) — WebSocket, turn-based state machine, hidden information
**Researched:** 2026-04-01
**Confidence:** HIGH (core patterns from well-established real-time game development principles)

---

## Critical Pitfalls

Mistakes that cause rewrites, game-breaking bugs, or security issues.

---

### Pitfall 1: Sending Full Game State to All Clients

**What goes wrong:** The server serializes the entire game state (including all players' hidden cards) and broadcasts it to every connected client. Any player who opens DevTools or intercepts WebSocket frames sees all opponents' cards.

**Why it happens:** It's the easiest thing to implement — one state object, one broadcast. The "hidden" information feels hidden because the UI doesn't render it, but it's all in the payload.

**Consequences:** The entire bluffing mechanic of Coup is broken. Players who check the network tab gain a decisive unfair advantage. This is the most fundamental security mistake for this game.

**Prevention:**
- Build a `projectStateForPlayer(gameState, playerId)` function from day one. It strips opponents' card identities (replace with `{ revealed: false }`) before sending.
- Server sends player-specific payloads: each player receives only what they are allowed to know.
- Never broadcast a single unified state object to all clients.
- Revealed cards (after a lost challenge, or after elimination) become public — the projection function handles this too.

**Detection (warning signs):**
- A single `io.emit('gameState', state)` or `ws.broadcast(state)` call in the server.
- The client-side state object contains `card.role` for all players, not just the current player.

**Phase:** Address in the first game state transmission implementation — cannot be retrofitted safely.

---

### Pitfall 2: Modeling Game Flow as Ad-Hoc Conditionals Instead of a Finite State Machine

**What goes wrong:** Turn logic grows as a chain of `if/else` and flags (`isWaitingForChallenge`, `isWaitingForBlock`, `challengeResolved`). Each new interaction adds more flags. Edge cases multiply: what if a player challenges during the block window? What if both a challenge and a block arrive? The code becomes untestable.

**Why it happens:** The first happy-path implementation works fine. Complexity only appears when handling all the legal transitions.

**Consequences:**
- Impossible game states become reachable (e.g., action resolves before challenge window closes).
- Adding features (e.g., Ambassador exchange) requires touching fragile conditional chains.
- Race conditions produce non-deterministic outcomes depending on WebSocket message order.

**Coup's actual state machine (non-trivial):**
```
TURN_START
  → ACTION_DECLARED
    → [if blockable] BLOCK_WINDOW
      → [if blocked] BLOCK_DECLARED
        → CHALLENGE_BLOCK_WINDOW
          → [if challenged] BLOCK_CHALLENGE_RESOLUTION → TURN_END
          → [if not challenged] ACTION_CANCELLED → TURN_END
      → [if not blocked] ACTION_CHALLENGE_WINDOW (or goes straight to resolution)
    → [if challengeable] ACTION_CHALLENGE_WINDOW
      → [if challenged] ACTION_CHALLENGE_RESOLUTION → TURN_END
      → [if not challenged] ACTION_RESOLUTION → TURN_END
    → [if neither] ACTION_RESOLUTION → TURN_END
  → CARD_LOSS (triggered by challenge loss or Assassin/Coup)
    → [if player has 1 card left] PLAYER_ELIMINATED
      → [if last player] GAME_OVER
      → [else] TURN_END
```

**Prevention:**
- Define all states as an explicit enum before writing any handler code.
- Define all valid transitions as a data structure (a map of `state → valid next states`).
- Reject any event that does not match a valid transition for the current state — return an error, don't silently ignore it.
- Use a single authoritative `transition(event, payload)` function on the server. Never mutate state from multiple code paths.

**Detection (warning signs):**
- More than 3 boolean flags on the game state object that encode "what phase are we in."
- Action handlers that check multiple flags before deciding what to do.
- Tests that need complex setup to reach a specific game phase.

**Phase:** Design the state machine before writing any WebSocket handlers. The enum/transitions map is the foundation everything else builds on.

---

### Pitfall 3: Race Conditions in Simultaneous Response Windows

**What goes wrong:** During the challenge/block window, multiple players can respond within milliseconds of each other. Two players hit "Challenge" simultaneously. Both messages arrive at the server. Both pass a `if (state === 'ACTION_CHALLENGE_WINDOW')` check before either has mutated state. Both are processed, causing double-challenge or double-resolution.

**Why it happens:** Node.js is single-threaded but async I/O means two `socket.on('challenge')` handlers can fire in the same event loop tick if they arrive in the same batch, and especially if there is any `await` between the state check and the state mutation.

**Consequences:** Duplicate challenges applied. Players forced to discard two cards. Game enters invalid state. Very hard to reproduce in testing.

**Prevention:**
- State check and state mutation must be synchronous and atomic — no `await` between them.
- Pattern: read state, compute next state, assign next state — all in one synchronous block. Only then `await` persistence or I/O.
- "First valid response wins" is a simple and correct policy for challenge/block windows: once a challenge is received, immediately transition state to `ACTION_CHALLENGE_RESOLUTION`. Subsequent challenge messages fail the state check and are ignored.
- Use a per-game event queue if you ever introduce async between check and mutation.

**Detection (warning signs):**
- `await` calls between `if (game.state === X)` and `game.state = Y`.
- Two parallel paths that both write to `game.state`.

**Phase:** State machine implementation phase. Include a concurrent-input test case (two challenge events fired in the same tick).

---

### Pitfall 4: Disconnection During an Active Turn Window

**What goes wrong:** It's Player A's turn. Player B disconnects while the challenge window is open. The game is now blocked — everyone else waits for B to either challenge or pass, but B is gone.

**Why it happens:** Reconnection and timeout logic are typically deferred ("we'll add that later"). But the game cannot complete without it.

**Consequences:**
- Every session is fragile; one friend losing WiFi kills the game.
- Naive fix (immediately skip disconnected players) causes valid blocking opportunities to be lost.

**Prevention:**
- Disconnection is not the same as forfeiting. A disconnected player should be auto-passed (challenge/block treated as "pass") after a short grace period (e.g., 15 seconds).
- Track `player.connected: boolean` in game state.
- On disconnect: start a grace timer. If reconnect happens before timeout, resume normally. If not, auto-pass that player for the current window.
- On reconnect: send the current projected game state immediately so the player is caught up.
- If the active player (whose turn it is) disconnects, the timer may need to auto-select a safe default action or pass the turn.

**Detection (warning signs):**
- No `socket.on('disconnect')` handler that affects game state.
- No timeout mechanism in challenge/block windows.
- Manual testing never tries closing a browser tab mid-turn.

**Phase:** WebSocket infrastructure phase. Reconnection logic must be designed alongside the initial connection logic, not added after.

---

### Pitfall 5: Client-Side Trust for Game Actions

**What goes wrong:** The client sends `{ action: 'steal', target: 'player2', amount: 2 }`. The server applies this without checking whether it's the client's turn, whether they have enough coins, whether the action is legal in the current state, whether the target is a valid alive player.

**Why it happens:** During development, you trust yourself. "I won't send illegal actions." But the WebSocket interface is open — any message can be crafted from DevTools.

**Consequences:**
- Players can take actions out of turn.
- Players can perform actions they don't have the coins for.
- Coup specifically: players can claim they lost a card they didn't (e.g., discarding a card they want to keep after losing a challenge).

**Prevention:**
- All validation on the server. The client is just a view and an input device.
- For card loss (challenge resolution, Coup/Assassin): the server tells the player "you must lose one of your influence cards." The player sends back which card to discard. The server validates that the specified card is actually in the player's hand (not already revealed) before accepting.
- Validate turn ownership, state legality, action legality, and target validity on every incoming event.
- Return explicit error events to the client for illegal actions (don't silently ignore — the client needs to show feedback).

**Detection (warning signs):**
- Server handlers that do not check `game.currentPlayerId === socket.playerId`.
- No validation that a targeted player is alive and connected.
- Card discard logic that trusts the card index sent by the client without verifying ownership.

**Phase:** Every game action handler. Build a `validateAction(gameState, playerId, action)` function and call it at the top of every handler.

---

### Pitfall 6: Broken Reconnection — State Lost on Refresh

**What goes wrong:** A player refreshes the browser. They return to an empty screen. The game continues without them but they cannot see it. Or worse, the server treats the new connection as a new player and adds a duplicate.

**Why it happens:** Session identity is not persisted. The server associates game state with a `socket.id`, which changes on every connection.

**Consequences:**
- Refreshing during a game = losing your seat. Extremely frustrating for a social game.
- Ghost players (disconnected socket.id still in game state).

**Prevention:**
- Assign each player a stable session token (e.g., UUID stored in `localStorage` or a cookie) when they join a room. This is their identity across connections.
- On reconnect, the client sends this token. The server maps token → player slot and resumes.
- Never use `socket.id` as the authoritative player identity in game state.
- On reconnect, send the full current projected state to the reconnecting player so they immediately see what's happening.

**Detection (warning signs):**
- `players[socket.id]` pattern anywhere in game state.
- No `localStorage` or cookie-based identity on the client.
- Refreshing the page during a game causes a new player entry in the room.

**Phase:** Room/lobby phase. Session identity must be established before game logic is built.

---

## Moderate Pitfalls

---

### Pitfall 7: No Canonical Source of Truth for Turn Timing

**What goes wrong:** The challenge/block window timer runs on the client. Different clients show different countdowns. When one client's timer expires, it sends "timeout" to the server, but the server has no way to verify this is legitimate. A malicious (or lagging) client can send "timeout" early to skip an opponent's chance to challenge.

**Prevention:**
- Timers run on the server only. The server broadcasts countdown ticks (or just the deadline timestamp). Clients display it; they don't control it.
- When a window timer fires on the server, the server transitions the state — not the client.

**Phase:** State machine implementation.

---

### Pitfall 8: Revealing Action Targets Before Challenge Resolution

**What goes wrong:** The server broadcasts "Player A is stealing from Player B" immediately. Player B has not yet had a chance to block. This is correct for Coup, but the broadcast must include the pending state so clients know the action is not yet resolved — it must not show "Player A stole 2 coins from Player B" until resolution confirms it.

**Prevention:**
- Distinguish between `ACTION_DECLARED` events ("A claims to steal from B — challenge/block window open") and `ACTION_RESOLVED` events ("steal resolved, coins transferred").
- UI must reflect the pending vs. resolved distinction clearly: action log should show "pending" until the state machine reaches resolution.

**Phase:** Frontend rendering phase.

---

### Pitfall 9: The Ambassador Exchange Is a Special Case

**What goes wrong:** The Ambassador action requires a player to draw 2 cards from the deck, look at them privately, and return 2 cards (any combination of hand + drawn). This is the most complex state in the base game. It involves: a private information reveal to one player, a player decision with multiple card options, and a deck mutation.

**Why it happens:** Teams implement all simple actions first and defer Ambassador. By then, the state machine and card-projection architecture have assumptions baked in that don't accommodate a "draw and return" flow.

**Prevention:**
- Design the card projection function and the card draw/return flow to support Ambassador from the start.
- The server must handle a temporary "ambassador hand" (the 2 drawn cards visible only to that player) as a distinct state.
- Do not send the Ambassador's drawn cards to other players even during the exchange window.

**Phase:** State machine design. Account for Ambassador's state before finalizing the machine.

---

### Pitfall 10: Logging Leaks Game Information

**What goes wrong:** Server-side logs include full game state. Console logs on the client include card roles. In a same-device or same-network session, anyone watching the terminal or console can see hidden cards.

**Prevention:**
- Log sanitized state (no `card.role` for unrevealed cards) even on the server.
- In client code, never log the full received state object without stripping hidden opponent info first (though the server should never send it to begin with — defense in depth).

**Phase:** Throughout development. Establish logging conventions early.

---

## Minor Pitfalls

---

### Pitfall 11: Room Persistence After All Players Disconnect

**What goes wrong:** All players leave. The room stays in memory forever. After hours of play sessions, the server runs out of memory.

**Prevention:**
- When a room has been empty (all players disconnected) for more than N minutes, garbage collect it.
- A simple TTL check on a periodic interval (e.g., every 5 minutes, clean rooms empty for 10+ minutes) is sufficient for a small private server.

**Phase:** Room management phase.

---

### Pitfall 12: No Rejoin Path After Game Start

**What goes wrong:** A player disconnects mid-game. The room's URL still works but the server removed them from the game. They cannot return to their seat.

**Prevention:** Covered by Pitfall 6 (stable session tokens). Explicit note: the "join room" endpoint must distinguish between "new player joining lobby" and "existing player reconnecting mid-game" based on whether their session token is already in the game's player list.

**Phase:** Room/lobby phase.

---

### Pitfall 13: Single-Action Undo Temptation

**What goes wrong:** Friends ask for an "undo last action" feature during testing. Implementing undo for a turn-based game with hidden information is genuinely hard — you cannot undo a bluff reveal that others saw. Implementing it wrong undermines game integrity.

**Prevention:** Explicitly out of scope for v1. Document this decision. The correct answer is "restart the game if a mistake is made."

**Phase:** Scope guard — keep it in out-of-scope list.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| First WebSocket message handler | Client-trust (Pitfall 5) | Build `validateAction()` before any handlers |
| First state broadcast | Information leakage (Pitfall 1) | `projectStateForPlayer()` must exist before first broadcast |
| State machine design | Ad-hoc conditionals (Pitfall 2) | Define enum + transitions map before coding handlers |
| Challenge/block window | Race conditions (Pitfall 3) | Synchronous check-then-mutate; write concurrent test |
| Player join/rejoin | Broken reconnection (Pitfall 6) | Session token in localStorage from day one |
| Timer implementation | Client-side timers (Pitfall 7) | Server owns all timers; client displays only |
| Ambassador action | Special-case complexity (Pitfall 9) | Account for it in state machine before coding simpler actions |
| UI action log | Premature resolution display (Pitfall 8) | Pending vs resolved event distinction in protocol |
| Server-side cleanup | Memory leak (Pitfall 11) | TTL garbage collection for empty rooms |

---

## Sources

- Confidence: HIGH — based on established patterns in WebSocket multiplayer game development, finite state machine design for turn-based games, and the specific rules of Coup (bluff/hidden information card game). No external sources consulted due to search tool unavailability; all findings are from well-documented domain knowledge.
- Key reference domain: Socket.io multiplayer game architecture, XState FSM patterns, game server security (server-authoritative architecture), and Coup rulebook edge cases (Ambassador exchange, challenge/block timing windows).
