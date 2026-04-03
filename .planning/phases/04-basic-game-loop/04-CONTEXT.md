# Phase 4: Basic Game Loop - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the existing pure TypeScript FSM (game-engine.ts) to WebSocket/Socket.IO and build the game UI so players can play a complete game using only Income, Foreign Aid, and Coup. Coins are tracked, turn order is enforced, players are eliminated and may spectate, and a winner is declared in real time. No character-specific actions (Tax, Steal, Assassinate, Exchange) yet — those come in Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Frontend Game Page Structure
- Game UI lives on the same route `/room/[roomId]` — `<GameBoard>` renders instead of lobby when `room.status === "IN_GAME"`
- New `useGame` hook (mirrors `useLobby`) — listens to `STATE_UPDATE`, exposes `ClientGameState`
- `<GameBoard>` component conditionally rendered from the existing lobby page file
- `GAME_STARTED` event triggers the lobby→game switch (already fires from Phase 2)

### Action Submission UX
- Button panel at bottom of screen — Income, Foreign Aid, Coup buttons; only enabled for active player
- After clicking "Coup", other alive players become clickable/highlighted to select target
- Influence loss card selection is inline in main game area — show own cards with "Perder esta" button on each
- Forced Coup (10+ coins): disable all non-Coup buttons + small notice "Você deve Golpear"

### Player State Display
- Player list panel — each entry shows name, coin count, card count (face-down), eliminated badge
- Eliminated players greyed out + "Eliminado" badge, remain in list but dimmed
- Active player's entry highlighted with border/ring in player list
- Scrollable game log panel on the side (desktop) / collapsible below board (mobile)

### WebSocket Game Events
- New `GAME_ACTION` socket event in `ClientToServerEvents` carrying `GameAction` payload — backend dispatches to FSM
- Backend calls `io.to(roomId).emit("STATE_UPDATE", projectStateForPlayer(state, playerId))` per-player individually after each action
- New `game-store.ts` module for in-memory `Map<string, GameState>` (mirrors room-store.ts pattern)
- Winner screen is an overlay on the same game page — no navigation/redirect

### Claude's Discretion
- Exact Tailwind classes and layout proportions for the game board
- Portuguese label wording for action buttons (e.g., "Renda" vs "Income" — PT-BR is preferred per project)
- Error handling for invalid actions (e.g., show `ERROR` socket event as a toast or inline message)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `game-engine.ts` — fully tested FSM with `initGame()`, `processAction()`, all game phases
- `project-state.ts` — `projectStateForPlayer()` pure function, strips hidden cards per player
- `socket-handler.ts` — WebSocket handler pattern, `START_GAME` socket event already wires to room
- `use-lobby.ts` — hook pattern to follow for `useGame` hook
- `use-socket.ts` — socket instance management
- shadcn/ui: `Button`, `Card`, `Badge`, `Input` already installed
- `ClientToServerEvents` / `ServerToClientEvents` in `packages/shared/src/types/events.ts` — extend here

### Established Patterns
- Socket events: SCREAMING_SNAKE_CASE (`LOBBY_UPDATE`, `GAME_STARTED`, etc.)
- State management: custom hooks with socket listeners (not Zustand/context)
- UI language: PT-BR ("Pronto", "Iniciar", "Sala não encontrada")
- Session identity: `getOrCreatePlayerId()` from `@/lib/session`
- Error handling: `socket.emit("ERROR", message)` on backend, displayed to user on frontend
- File structure: hooks in `src/hooks/`, components in `src/components/`, pages in `src/app/`

### Integration Points
- `room/[roomId]/page.tsx` — add conditional rendering for `<GameBoard>` when game is active
- `packages/shared/src/types/events.ts` — add `GAME_ACTION` to `ClientToServerEvents`
- `apps/backend/src/socket-handler.ts` — add `GAME_ACTION` handler that dispatches to FSM
- `apps/backend/src/game/` — new `game-store.ts` alongside `game-engine.ts`

</code_context>

<specifics>
## Specific Ideas

- Phase 5 will add the full reaction window (challenge/block) — Phase 4 actions (Income, Foreign Aid, Coup) resolve immediately with no reaction window needed
- Game log messages should match the style of existing FSM log (already populated in `initGame`)
- The `ClientGameState` type already exists in shared types and has `STATE_UPDATE` event — use it directly

</specifics>

<deferred>
## Deferred Ideas

- Character action buttons (Tax, Steal, Assassinate, Exchange) — Phase 5 scope
- Reaction window UI (challenge/block buttons) — Phase 5 scope
- Spectator-specific view/UX polish — Phase 7 scope
- Rematch functionality — Phase 6 scope

</deferred>
