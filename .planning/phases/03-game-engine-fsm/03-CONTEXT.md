# Phase 3: Game Engine (FSM) - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — no discuss needed)

<domain>
## Phase Boundary

Pure TypeScript state machine that processes a complete Coup game from start to finish via unit tests — no running server, no UI, no WebSocket. Delivers: deck initialization, player setup, all state transitions, action validation, and winner detection. All verified by unit tests only.

</domain>

<decisions>
## Implementation Decisions

### FSM Architecture
- Plain TypeScript enum + transition map (no XState, no external FSM libraries) — locked in ROADMAP
- `GamePhase` enum already exists in `packages/shared/src/types/game-state.ts` — reuse directly
- FSM lives in `apps/backend/src/game/` alongside existing `project-state.ts`
- Single `processAction(state, action)` pure function returns new `GameState` — no mutation
- Transition map validates current phase + actor before applying action

### Action Representation
- Actions typed as discriminated union: `{ type: "INCOME" | "FOREIGN_AID" | "COUP" | "ASSASSINATE" | "STEAL" | "TAX" | "EXCHANGE", playerId: string, targetId?: string }`
- Reactions typed similarly: `{ type: "CHALLENGE" | "BLOCK" | "PASS", playerId: string }`
- `PendingAction` in shared types already has `type` + `playerId` + `targetId` — extend as needed

### Game Initialization
- `initGame(roomId, players)` — takes player list from lobby, shuffles 15-card deck server-side, deals 2 cards + 2 coins per player, randomizes turn order (INIT-04)
- Deck: 3× each of DUKE, ASSASSIN, CAPTAIN, AMBASSADOR, CONTESSA = 15 cards (INIT-01)
- Cards dealt from shuffled deck; never co-mingled between players in state (INIT-02)
- Ambassador exchange: player draws 2 extra cards from deck AFTER challenge window passes (existing ROADMAP decision)

### Test Organization
- Single test file per major concern: `fsm-transitions.test.ts`, `fsm-game-init.test.ts`, `fsm-full-game.test.ts`
- Full 2-player simulated game in `fsm-full-game.test.ts` must reach GAME_OVER
- Illegal transition tests: wrong player acting, wrong phase input, insufficient coins

### Claude's Discretion
- Internal Room type structure for FSM (how to store deck, pending reactions, etc.)
- Error return strategy (throw vs return error object) — prefer return `{ ok: false, error }` consistent with room-store pattern
- How to handle nested block-challenge state tracking

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared/src/types/game-state.ts` — `GamePhase`, `GameState`, `PlayerState`, `ClientGameState` already defined
- `packages/shared/src/types/card.ts` — `CardType` enum (DUKE, ASSASSIN, CAPTAIN, AMBASSADOR, CONTESSA) + `Card` interface
- `apps/backend/src/game/project-state.ts` — `projectStateForPlayer()` exists and is tested
- `apps/backend/src/rooms/room-store.ts` — room-store pattern (pure functions, Map state) to follow

### Established Patterns
- Pure functions returning new state (room-store pattern): `createRoom`, `joinRoom`, `setReady` all return new values
- TDD: tests written before implementation (RED→GREEN→REFACTOR)
- `{ ok: true } | { ok: false, error: string }` result type used in room-store
- `nanoid` already installed for ID generation if needed

### Integration Points
- `apps/backend/src/socket-handler.ts` will import FSM in Phase 4 — keep FSM exports clean
- `packages/shared/src/types/events.ts` — `ClientToServerEvents` will need action events added in Phase 4
- `GameState.pendingAction` field is the join point between FSM and socket layer

</code_context>

<specifics>
## Specific Ideas

- STATE.md notes: "Ambassador exchange and nested block-challenge transitions are the highest-risk edge cases — plan explicit unit tests for all paths before coding" — address these explicitly in the plan
- Concurrent challenge inputs: synchronous state mutation with no await (noted for Phase 5, but architect FSM to support this from the start)

</specifics>

<deferred>
## Deferred Ideas

- WebSocket wiring — Phase 4
- Reconnect/spectator state — Phase 6
- Ambassador exchange timing detail (draw after challenge window) already decided in ROADMAP

</deferred>
