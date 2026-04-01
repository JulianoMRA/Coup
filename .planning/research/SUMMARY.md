# Project Research Summary

**Project:** Coup Online
**Domain:** Real-time multiplayer turn-based card game (bluff/hidden information, 2-6 players)
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

Coup Online is a private web app that lets a fixed group of friends play the Coup card game in real time over a shared invite link. The product is simple to describe — create a room, share a link, play — but the implementation is non-trivial: it requires a server-authoritative real-time state machine with hidden information per player, a multi-phase turn flow with nested reaction windows, and a robust session/reconnection model. The right approach is a standalone Node.js server (Express + Socket.IO) running the full game engine, paired with a Next.js frontend that is a pure view layer — it renders what the server says, sends events, and never computes game logic.

The single most important architectural decision is building a formal finite state machine (FSM) for the turn flow before writing any WebSocket handlers. Coup's turn has approximately 10 distinct states with conditional branches (challenge vs. block vs. pass), and without an explicit FSM the logic becomes unmaintainable after the first few actions are implemented. The second most critical decision is that every server broadcast must be a player-specific projection — never a single full-state broadcast — because sending all players' hidden cards in a single payload breaks the core bluffing mechanic and cannot be safely retrofitted.

The main risks are scoped to the challenge/block flow (the most complex part of the rules), reconnection handling (a player refresh must not destroy their game seat), and race conditions during simultaneous reaction windows. All three are preventable with design-up-front discipline: define the FSM first, assign stable session tokens before any game logic, and keep state transitions synchronous. The stack (Next.js + TypeScript + Socket.IO + Express) is entirely aligned with the project's declared constraints and is a well-proven combination for this class of app.

---

## Key Findings

### Stack Recommendation

The stack is substantially determined by project constraints (Next.js, React, TypeScript). The key decision on top of those constraints is **Socket.IO 4.x on a standalone Express/Node.js server, not a Next.js API route**. Next.js API routes do not support persistent WebSocket connections on serverless platforms; a separate persistent Node.js process is the only correct approach. Socket.IO is recommended over raw `ws` because it provides built-in rooms (Coup rooms map directly), automatic reconnection with session recovery, and a stable, well-documented API since v4 (2020).

For server-side state, plain TypeScript objects in an in-memory `Map<roomId, GameState>` are sufficient for v1 — Redis or a database adds operational complexity with no v1 benefit. On the frontend, React Context + useReducer is sufficient; the entire game state arrives as a server snapshot on each event, which is a simple replace operation.

**Core technologies:**
- Next.js 14.x / 15.x: React framework and frontend host — project constraint, zero-config Vercel deployment
- Socket.IO 4.x: real-time bidirectional communication — rooms, reconnection, and fallbacks built in
- Express 4.x + Node.js 20 LTS: backend HTTP server and Socket.IO host — minimal, stable, proven Socket.IO integration
- TypeScript 5.x: language — critical for modeling discriminated union game states correctly
- Vitest 1.x / 2.x: unit testing — project preference; game engine pure functions are ideal unit test targets
- UUID v9.x (client): player identity stored in localStorage — frictionless no-auth join pattern

**Deployment:** Vercel for the Next.js frontend; Railway (or single server on Railway with `next start`) for the Express + Socket.IO backend. Verify Railway free tier limits at deploy time.

See `.planning/research/STACK.md` for full rationale and alternatives considered.

### Expected Features

The full table stakes list is derived directly from the Coup rulebook — these are not negotiable for the game to be playable. The challenge/block flow is the highest-complexity cluster and deserves a dedicated implementation phase. The Ambassador exchange is a special case within that flow (it involves a private temporary hand and deck mutation) and must be accounted for in the FSM design before coding simpler actions.

**Must have (table stakes):**
- Room creation with shareable invite link, and join via link without mandatory signup
- Full 15-card deck: Duke, Assassin, Captain, Ambassador, Contessa (3 copies each)
- Hidden hand — server never sends opponent card identities to clients
- Coin economy: Income (+1), Foreign Aid (+2), Coup (costs 7)
- Character actions: Tax, Assassinate, Steal, Exchange
- Blocking mechanism with challenge window on the block
- Challenging mechanism with card reveal and influence loss
- Reaction window — all non-acting players must respond (or be auto-passed) before action resolves
- Player elimination and win condition detection
- Turn enforcement (server authoritative; only active player can initiate actions)
- Game log (public actions only — no hidden information)
- Real-time sync via WebSocket for all state transitions
- Reconnection handling — browser refresh must restore player seat

**Should have (v1 differentiators for friend group UX):**
- "Who still needs to act" indicator during reaction windows
- Eliminated player stays in room as spectator
- Room lobby with ready check before game starts
- Rematch button (reset game state, keep player roster)
- Action confirmation dialog for irreversible costly actions (Coup, Assassinate)
- Per-player coin and card count always visible (public info by rule)
- Visual distinction between active and eliminated players

**Defer to v2+:**
- Configurable reaction timeout
- Reveal animations
- Quick-reference rules panel in UI
- Expansion cards (Reformation, Inquisitor, Anarchy)
- Ranking / ELO / leaderboards
- Public matchmaking

See `.planning/research/FEATURES.md` for full feature dependency graph and MVP sequence.

### Architecture Approach

The architecture is server-authoritative with per-player state projection. The server holds the single source of truth (`ServerGameState`); clients hold only the subset of state they are permitted to see (`ClientGameState`). Every game action flows: Client sends event → Server validates + applies transition → Server broadcasts a filtered per-player projection to each client. The client never computes game legality — the server includes `availableActions` in each broadcast so the UI only needs to render what is declared legal.

The `GameEngine` and `StateMachine` are the core backend components and must be built as pure TypeScript modules with no WebSocket dependency, making them fully unit-testable. `MessageBroadcaster` is a pure function `(fullState, playerId) => ClientGameState` that strips hidden information — this separation is essential for correctness and testability. The `WebSocketServer` is the glue layer only; it routes messages to game logic, it does not contain game logic.

**Build order (dependencies flow top to bottom):**
1. `StateMachine` — pure FSM, no I/O, unit-testable in isolation
2. `GameEngine` — wraps StateMachine, owns state store, validators, and effect executors
3. `MessageBroadcaster` — pure projection function, testable without sockets
4. `RoomManager` — session lifecycle, create/join/leave rooms
5. `WebSocketServer` — glue: routes messages, handles reconnection, calls broadcaster after every state change
6. `GameStateStore` (frontend) — React Context holding `ClientGameState`, fed by WebSocket client
7. UI components — read from store only: `LobbyPage`, `GamePage`, `ActionPanel`, `ReactionPanel`

See `.planning/research/ARCHITECTURE.md` for full state machine transition table, message protocol types, and hidden information model.

### Critical Pitfalls

1. **Sending full game state to all clients** — The server must call `projectStateForPlayer(gameState, playerId)` before every send. A single `io.emit('gameState', state)` broadcast exposes all hidden cards via DevTools. Build the projection function on day one, before the first broadcast.

2. **Ad-hoc conditionals instead of a finite state machine** — Coup has ~10 distinct turn states. Boolean flags (`isWaitingForChallenge`, `blockResolved`) compound into unmaintainable logic. Define all states as an enum and all transitions as a data structure before writing any handler code.

3. **Race conditions in simultaneous reaction windows** — Two players can send "Challenge" within the same event loop batch. State check and state mutation must be synchronous with no `await` between them. "First valid response wins" is the correct policy: once a challenge is received, immediately transition state — subsequent challenge messages fail the state check.

4. **Disconnection blocking a reaction window** — A disconnected player in the challenge window freezes the game for everyone. Track `player.connected` in game state. On disconnect, start a grace timer; auto-pass the player if they don't reconnect. This logic must be designed alongside the initial connection logic, not added later.

5. **Using `socket.id` as player identity** — `socket.id` changes on every connection. Session identity must be a stable UUID stored in `localStorage` and sent on every join/rejoin. The server maps this token to a player slot. Never store `players[socket.id]` in game state.

See `.planning/research/PITFALLS.md` for the full list including moderate pitfalls (server-side timers, Ambassador special case, logging leaks, room garbage collection).

---

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation — Project Setup and Session Model

**Rationale:** Session identity (stable UUID in localStorage) and the two-service architecture (Next.js frontend + Express/Socket.IO backend) must exist before any game logic is built. Getting this wrong (using `socket.id` as identity) requires a rewrite of all room logic later.

**Delivers:** Working monorepo structure, both services running locally, a player can open the app and receive a stable UUID, WebSocket connection established.

**Addresses:** Pitfall 6 (broken reconnection), Pitfall 5 (client-side trust groundwork), room creation + join via link (table stakes).

**Avoids:** Building game logic on an unstable session model.

### Phase 2: Room and Lobby

**Rationale:** The room lifecycle (create, join, ready check, start) is the entry point for every game session and must be solid before the game engine is built. It also establishes the WebSocket message protocol contract.

**Delivers:** A host can create a room, share the invite link, other players can join, a ready check confirms everyone is present, and the host can start the game. No game logic yet — just lobby state.

**Addresses:** Room creation, join via link, lobby ready check (table stakes). Establishes `RoomManager` and `WebSocketServer` components.

**Avoids:** Building game state before session/room lifecycle is proven.

### Phase 3: Game Engine — State Machine Core

**Rationale:** The FSM is the highest-risk component and must be built and tested in isolation before any UI touches it. This phase is pure backend TypeScript: define all states, all transitions, all validators. Ambassador's special state must be accounted for here.

**Delivers:** A fully tested `StateMachine` + `GameEngine` + `MessageBroadcaster` that can process a complete game from start to finish via unit tests, with no running server or UI.

**Addresses:** Pitfall 2 (ad-hoc conditionals), Pitfall 9 (Ambassador special case), Pitfall 3 (race conditions — concurrent-input tests written here).

**Avoids:** Writing WebSocket handlers before the logic they route to is solid.

**Research flag:** This phase may benefit from a deeper planning session on the FSM transition table — particularly Ambassador exchange and the nested block-challenge window.

### Phase 4: Basic Game Loop — Actions and Real-Time Sync

**Rationale:** Wire the game engine to WebSocket and build the first playable loop (Income, Foreign Aid, Coup — no blocking/challenging yet). Establishes `projectStateForPlayer()` on first broadcast.

**Delivers:** A complete turn loop where players can take unchallenged/unblocked actions, coins are tracked, Coup eliminates players, and win condition is detected. Game log operational.

**Addresses:** Coin economy, player elimination, win condition, real-time sync, hidden information model, `MessageBroadcaster` first production use.

**Avoids:** Pitfall 1 (state leakage) — projection function is mandatory before this phase ships.

### Phase 5: Character Actions and Reaction Windows

**Rationale:** This is the hardest phase. Challenge and block flows add 6+ new states to the FSM and contain the race condition risk. Implement character actions (Tax, Steal, Assassinate, Exchange) alongside the full reaction window, challenge resolution, and block/block-challenge flow.

**Delivers:** Full Coup ruleset playable end-to-end including bluffing, challenges, blocks, Ambassador exchange, and influence loss selection.

**Addresses:** Blocking mechanism, challenging mechanism, reaction window, all character actions, influence loss (all table stakes).

**Avoids:** Pitfall 3 (synchronous state mutations in reaction window), Pitfall 7 (server-side timers only), Pitfall 8 (pending vs. resolved event distinction in protocol).

**Research flag:** Highest complexity phase — plan explicit unit tests for every FSM transition including edge cases (challenge a block, lose a challenge with 2 cards, Ambassador exchange after surviving a challenge).

### Phase 6: Reconnection and Resilience

**Rationale:** Session token is established in Phase 1 but full reconnection handling (mid-game reconnect, grace timers on disconnect, active player disconnect) must be implemented and tested before the app is usable by real friends.

**Delivers:** A player can refresh mid-game and return to their seat. A disconnected player is auto-passed after a grace period. Room garbage collection prevents memory leaks.

**Addresses:** Reconnection handling (table stakes), Pitfall 4 (disconnection blocking reaction window), Pitfall 6 (state lost on refresh), Pitfall 11 (room memory leak), Pitfall 12 (rejoin after game start).

### Phase 7: UX Polish and Deployment

**Rationale:** After the core game loop is solid, add the differentiating UX features and deploy to production.

**Delivers:** "Who still needs to act" indicator, eliminated player spectating, rematch button, action confirmation dialogs, responsive layout, deployment on Vercel (frontend) + Railway (backend).

**Addresses:** All "should have" differentiator features, deployment.

### Phase Ordering Rationale

- **Session model first (Phase 1):** Session identity cannot be retrofitted. Every subsequent component depends on it.
- **Lobby before engine (Phase 2 before Phase 3):** The room lifecycle establishes the WebSocket protocol contract; game engine tests can use the same message types.
- **Engine in isolation (Phase 3):** Building and testing the FSM without WebSocket or UI allows fast iteration and catches logic bugs before they become hard to debug.
- **Basic loop before complex reactions (Phase 4 before Phase 5):** Validates the wire-up (server ↔ WebSocket ↔ frontend) before adding the hardest game logic.
- **Reconnection before polish (Phase 6 before Phase 7):** A game that breaks on browser refresh is not usable; resilience is a correctness concern, not a polish concern.

### Research Flags

Phases needing deeper planning/research during roadmap build:
- **Phase 3 (Game Engine / FSM):** The FSM transition table has nuanced edge cases — Ambassador exchange, nested challenge-on-block, losing a challenge with 1 vs. 2 cards remaining. Recommend a planning session that maps all transitions explicitly before coding starts.
- **Phase 5 (Reaction Windows):** Concurrent input handling and the exact semantics of the block-challenge window are the highest-risk implementation areas. Recommend writing test scenarios (not just happy paths) during planning.

Phases with standard, well-documented patterns (lower planning risk):
- **Phase 1 (Foundation):** UUID in localStorage, monorepo setup, and Socket.IO connection setup are all well-documented standard patterns.
- **Phase 2 (Lobby):** Room CRUD over WebSocket is a textbook Socket.IO rooms pattern.
- **Phase 7 (UX/Deployment):** Vercel + Railway deployment is documented and straightforward.

---

## Key Decisions to Make Before Implementation

These decisions need explicit answers before the first line of game logic is written. Leaving them implicit causes expensive rework.

| Decision | Options | Recommendation |
|----------|---------|---------------|
| Reaction window time model | Explicit "Pass" per player vs. server-side timeout vs. hybrid | **Explicit Pass + "who hasn't decided" indicator** — friend groups expect deliberation, not clock pressure. Implement timeout as a safety net only. |
| Monorepo vs. separate repos | Single repo with `/frontend` and `/backend` vs. two separate repos | **Monorepo** — shared TypeScript types between frontend and backend are a major benefit (ClientGameState, message protocol types). |
| Frontend deployment | Vercel (separate from backend) vs. single server on Railway (`next start` + Express) | **Single server on Railway** is simpler for a private hobby app. Vercel split only needed if CDN performance matters. |
| FSM library vs. hand-rolled | XState vs. plain TypeScript enum + transition map | **Plain TypeScript enum + transition map** — XState adds a learning curve and indirection that is not justified at this scale. |
| Ambassador draw timing | Draw cards at action announcement vs. after challenge window passes | **After challenge window passes** — if the Ambassador claim is unchallenged, then deal the 2 draw cards. Prevents leaking deck information during a challenge. |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core technologies are project constraints. Socket.IO and Express patterns are stable and well-documented since 2020. Deployment options are MEDIUM (verify Railway free tier at deploy time). |
| Features | HIGH | Table stakes derived directly from Coup rulebook — fully deterministic. Differentiators are well-reasoned UX patterns. |
| Architecture | HIGH | Server-authoritative hidden-information architecture is a well-established pattern. FSM for turn-based games is canonical. Message protocol types are domain-derived. |
| Pitfalls | HIGH | Pitfalls are based on well-documented patterns in WebSocket multiplayer game development. Information leakage and FSM anti-patterns are consistently cited across the domain. |

**Overall confidence:** HIGH

### Gaps to Address

- **Exact Socket.IO and React versions:** Training data cutoff is August 2025; verify current stable patch versions on npm before `npm install`.
- **Railway free tier limits:** Tier structures change. Verify current limits (hours/month, memory, sleep behavior) before committing to it as the deployment target.
- **React 19 stability:** Was in RC near training cutoff. Verify whether 19 is the current stable release or if 18.x is still the LTS recommendation.
- **Timer UX decision:** "Explicit Pass" vs. timeout is a product decision that affects the reaction window implementation significantly. Confirm with the friend group before building Phase 5.

---

## Sources

### Primary (HIGH confidence)
- Coup rulebook (Indie Boards & Cards) — game rules, action definitions, challenge/block semantics, card counts
- Socket.IO v4 documentation (training data) — rooms, reconnection, namespace patterns
- Express + Socket.IO canonical integration pattern (training data) — `http.Server` attachment, event routing

### Secondary (MEDIUM confidence)
- Board Game Arena, Tabletopia UX patterns (training data) — differentiator feature ideas for online board games
- boardgame.io architecture (training data) — FSM and hidden information patterns for browser-based games
- Railway/Vercel deployment documentation (training data, August 2025 cutoff) — verify current tier limits

### Tertiary (needs validation before implementation)
- Specific npm package versions (Socket.IO 4.7.x, Vitest 2.x, React 19) — verify on npm at project start
- Railway free tier availability and limits — verify at deploy time

---

*Research completed: 2026-04-01*
*Ready for roadmap: yes*
