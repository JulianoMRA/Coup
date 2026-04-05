# Roadmap: Coup Online

## Overview

Coup Online goes from zero to a fully playable private card game for friends in seven phases. The foundation
establishes the monorepo and session model, then the lobby makes joining frictionless, then the game
engine is built and tested in isolation before it ever touches a WebSocket. A basic turn loop is wired up
first, the full challenge/block ruleset is layered on top, reconnection resilience is hardened, and finally
UX polish and production deployment close the project. Every phase delivers something coherent and
independently verifiable before the next one begins.

## Phases

- [x] **Phase 1: Foundation** - Monorepo setup, two-service architecture, UUID session model, and the per-player state projection function (gap closure in progress) (completed 2026-04-02)
- [x] **Phase 2: Room and Lobby** - Room creation, invite link, join by link, lobby ready check, and game start trigger (completed 2026-04-03)
- [x] **Phase 3: Game Engine (FSM)** - Pure TypeScript state machine with all Coup states, fully unit-tested before any WebSocket wiring (completed 2026-04-03)
- [x] **Phase 4: Basic Game Loop** - Wire FSM to WebSocket: turn loop, coin economy, influence loss, elimination, win detection, game log (completed 2026-04-04)
- [x] **Phase 5: Character Actions and Reactions** - Full character action set, reaction window, challenge flow, block flow, Ambassador exchange (completed 2026-04-05)
- [ ] **Phase 6: Reconnection and Resilience** - Mid-game reconnect, disconnect grace timers, rematch, spectator mode, room cleanup
- [ ] **Phase 7: UX Polish and Deployment** - Visual indicators, responsive layout, Railway/Vercel deployment, production config

## Phase Details

### Phase 1: Foundation
**Goal**: A stable monorepo runs both services locally; every player who opens the app receives a persistent UUID session token; a WebSocket connection is established; the per-player state projection function exists and is tested before a single game state is ever broadcast
**Depends on**: Nothing (first phase)
**Requirements**: ROOM-04, INIT-03, SYNC-01, SYNC-02
**Success Criteria** (what must be TRUE):
  1. Running `npm run dev` from the repo root starts both the Next.js frontend and the Express/Socket.IO backend
  2. A player who opens the app receives a UUID stored in localStorage that survives page refresh
  3. A WebSocket connection from the browser to the backend is established and confirmed (e.g., a ping/pong or connection event visible in the UI)
  4. The `projectStateForPlayer(gameState, playerId)` function exists, strips hidden cards for other players, and passes unit tests before any broadcast logic is written
  5. CI runs and all tests pass on every push
**Plans**: 5 plans
Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold, shared types, test infrastructure (Wave 0)
- [x] 01-02-PLAN.md — Backend: Express + Socket.IO server, projectStateForPlayer TDD
- [x] 01-03-PLAN.md — Frontend: UUID session, WebSocket client, connection badge
- [x] 01-04-PLAN.md — CI GitHub Actions workflow + end-to-end verification
- [x] 01-05-PLAN.md — Gap closure: vitest workspace config so `npm run test` passes at repo root (CI unblock)
**UI hint**: yes

### Phase 2: Room and Lobby
**Goal**: A host can create a room, share the invite link, other players can join by visiting that link (username only, no signup), a ready check shows who is present, and the host can start the game
**Depends on**: Phase 1
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-05, ROOM-06
**Success Criteria** (what must be TRUE):
  1. Host creates a room and sees a shareable invite URL in the lobby
  2. A second player opens the invite URL, types a name, and appears in the lobby player list without any signup
  3. The lobby correctly rejects a 7th join attempt (max 6 players)
  4. Each player can click "Pronto" and the host sees all ready states update in real time
  5. When all players are ready, the host can click "Iniciar" and the game transitions out of lobby state
**Plans**: 4 plans
Plans:
- [x] 02-01-PLAN.md — Shared types, install deps, test stubs (Wave 1 — foundation)
- [x] 02-02-PLAN.md — Backend: room-store, POST /api/rooms, socket handlers (Wave 2)
- [x] 02-03-PLAN.md — Frontend: home page, lobby page, useLobby hook (Wave 3)
- [ ] 02-04-PLAN.md — Human verification: end-to-end lobby flow (Wave 4 — checkpoint)
**UI hint**: yes

### Phase 3: Game Engine (FSM)
**Goal**: A fully tested pure TypeScript state machine processes a complete Coup game from start to finish via unit tests — no running server, no UI, no WebSocket
**Depends on**: Phase 2
**Requirements**: INIT-01, INIT-02, INIT-04
**Success Criteria** (what must be TRUE):
  1. The FSM defines all game states as a TypeScript enum (LOBBY, AWAITING_ACTION, AWAITING_REACTIONS, AWAITING_BLOCK_CHALLENGE, RESOLVING_CHALLENGE, RESOLVING_BLOCK_CHALLENGE, RESOLVING_ACTION, AWAITING_COUP_TARGET, AWAITING_EXCHANGE, GAME_OVER) with no boolean flag substitutes
  2. Unit tests cover every valid state transition including Ambassador exchange and nested block-challenge
  3. Unit tests cover illegal transition rejection (wrong player acting, wrong state input)
  4. A simulated 2-player game driven entirely by unit test inputs reaches GAME_OVER with correct winner detection
  5. The 15-card deck is shuffled server-side and per-player card assignments are never co-mingled in state
**Plans**: 5 plans
Plans:
- [x] 03-01-PLAN.md — Extend shared types (PendingAction + GameAction) + write all test stubs RED (Wave 0)
- [x] 03-02-PLAN.md — Implement initGame: deck build, Fisher-Yates shuffle, deal, turn order (Wave 1)
- [x] 03-03-PLAN.md — Implement processAction dispatcher + INCOME, FOREIGN_AID, COUP, LOSE_INFLUENCE handlers (Wave 2)
- [x] 03-04-PLAN.md — Implement reaction window: PASS, CHALLENGE, BLOCK, block-challenge resolution (Wave 3)
- [x] 03-05-PLAN.md — Implement Ambassador exchange + full 2-player game simulation to GAME_OVER (Wave 4)

### Phase 4: Basic Game Loop
**Goal**: The FSM is wired to WebSocket and players can play a complete game using only Income, Foreign Aid, and Coup — coins are tracked, turn order is enforced, players are eliminated and may spectate, and a winner is declared in real time
**Depends on**: Phase 3
**Requirements**: TURN-01, TURN-02, TURN-03, TURN-04, INFL-01, INFL-02, INFL-03, INFL-04, INFL-05, LOG-01, LOG-02, LOG-03
**Success Criteria** (what must be TRUE):
  1. Only the active player sees enabled action buttons; all other players' action buttons are disabled or hidden
  2. A player with 10+ coins is forced to Coup (no other action buttons are available)
  3. Spending 7 coins on Coup causes the target to lose one influence; if they had 2 cards they choose which to discard, and that card is revealed face-up to all players
  4. A player whose influence reaches 0 is marked eliminated and may remain in the room to watch; the game continues without them
  5. The game log shows every public action in order and never displays a hidden card identity
  6. The last surviving player sees a winner screen and all other players also see the result
**Plans**: 4 plans
Plans:
- [x] 04-01-PLAN.md — Shared events + game-store + socket handler GAME_ACTION wiring (Wave 1)
- [x] 04-02-PLAN.md — useGame hook + PlayerPanel + ActionBar + GameLog + GameBoard components (Wave 2)
- [x] 04-03-PLAN.md — CoupTargetSelector + InfluenceCardSelector + WinnerOverlay + room page integration (Wave 3)
- [x] 04-04-PLAN.md — Human verification: complete 2-player game flow (Wave 4 — checkpoint)
**UI hint**: yes

### Phase 5: Character Actions and Reactions
**Goal**: The full Coup ruleset is playable end-to-end — all character actions work, any player can challenge or block in the reaction window, block-challenges resolve correctly, influence loss selection works, and Ambassador exchange completes
**Depends on**: Phase 4
**Requirements**: REAC-01, REAC-02, REAC-03, REAC-04, CHAL-01, CHAL-02, CHAL-03, CHAL-04, CHAL-05, AMBX-01, AMBX-02, AMBX-03
**Success Criteria** (what must be TRUE):
  1. After any character action is announced, all non-acting players see challenge and/or block buttons (where applicable by rule) and must click "Passar" or react before the action resolves
  2. The reaction window UI shows a clear indicator of which players have not yet responded
  3. A successful challenge (bluff called correctly) causes the challenged player to lose influence; a failed challenge causes the challenger to lose influence; in both cases the revealed card is visible to all
  4. A block can itself be challenged: if the block-challenge succeeds the original action resolves; if it fails the action is cancelled and the blocker survives
  5. A player successfully challenging another player's character claim draws a replacement card from the deck after shuffling the proven card back in
  6. When using Ambassador Exchange, a player sees 4 cards (their 2 plus 2 drawn), selects exactly 2 to keep, and the remaining 2 are shuffled back into the deck
**Plans**: 4 plans
Plans:
- [x] 05-01-PLAN.md — Backend CHAL-05 card swap + ActionBar row 2 character actions (Wave 1)
- [x] 05-02-PLAN.md — ReactionBar + BlockClaimSelector + BlockChallengeBar components (Wave 2)
- [x] 05-03-PLAN.md — ExchangeSelector + GameBoard full phase routing wiring (Wave 3)
- [x] 05-04-PLAN.md — Human verification: full Coup ruleset end-to-end (Wave 4 — checkpoint)
**UI hint**: yes

### Phase 6: Reconnection and Resilience
**Goal**: The game survives real-world network interruptions — a player who refreshes mid-game returns to their seat with full state restored; a disconnected player does not freeze the game; rematch works; rooms are cleaned up after inactivity
**Depends on**: Phase 5
**Requirements**: SYNC-03, POST-01, POST-02
**Success Criteria** (what must be TRUE):
  1. A player who refreshes the page mid-game reconnects to the same seat and sees their current hand, coin count, and the game log without needing to rejoin
  2. If a player disconnects during a reaction window, the game does not freeze — they are auto-passed after a grace period and play continues
  3. If the active player disconnects, a grace period elapses and their turn advances automatically so the game does not stall
  4. After game over, clicking "Rematch" resets game state and starts a new game with the same players without generating a new invite link
  5. The winner is displayed clearly on the game over screen to all players including spectators
**Plans**: TBD
**UI hint**: yes

### Phase 7: UX Polish and Deployment
**Goal**: The app is deployed to production and accessible via a public URL; the UI is responsive on mobile browsers; visual indicators make the game state unambiguous; the app is ready for the friend group to use
**Depends on**: Phase 6
**Requirements**: (no unassigned v1 requirements — this phase delivers the project constraints: responsive web, public deployment, and polish of all previously built features)
**Success Criteria** (what must be TRUE):
  1. The application is accessible at a public URL (Railway backend + Vercel or Railway frontend) without running localhost
  2. The game is playable on a mobile browser without horizontal scrolling or overlapping elements
  3. Active and eliminated players are visually distinct at a glance (e.g., greyed out, crossed name)
  4. The reaction window "who hasn't decided" indicator correctly reflects pending players in real time with no extra latency visible to users
  5. Per-player coin counts and influence card counts are always visible to all players on the main game screen
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 5/5 | Complete   | 2026-04-02 |
| 2. Room and Lobby | 4/4 | Complete   | 2026-04-03 |
| 3. Game Engine (FSM) | 5/5 | Complete   | 2026-04-03 |
| 4. Basic Game Loop | 4/4 | Complete   | 2026-04-04 |
| 5. Character Actions and Reactions | 4/4 | Complete   | 2026-04-05 |
| 6. Reconnection and Resilience | 0/TBD | Not started | - |
| 7. UX Polish and Deployment | 0/TBD | Not started | - |
